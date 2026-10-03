"""
Cinema Catalog Sync Engine
Syncs active movies inside cinema halls across ALL Indian cities and cinema halls.
Stores venue mappings (v_movies:<venueCode>) and city mappings (movies:<cityCode>) in Cloudflare KV.
Runs twice daily via GitHub Actions (.github/workflows/daily-cinema-sync.yml).
"""

import datetime
import html
import json
import os
import random
import re
import sys
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from curl_cffi import requests as cffi_requests

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

CF_WORKER_URL = "https://movie-track-bot.mustardshrek.workers.dev"
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
CITIES_FILE = os.path.join(DATA_DIR, "cities.json")
VENUES_FILE = os.path.join(DATA_DIR, "venues.json")

# Concurrency & Batch Settings
MAX_WORKERS = 8
BATCH_SIZE = 30
REQUEST_TIMEOUT = 10


def slugify(text: str) -> str:
    """Create a URL-safe slug from venue name matching BookMyShow format."""
    return re.sub(r"[^a-zA-Z0-9]+", "-", text.lower()).strip("-")


def load_directory():
    """Load all 87 cities and 1,397 venues from data/ or fallback to worker.js."""
    cities = {}
    venues_by_city = {}

    if os.path.exists(CITIES_FILE) and os.path.exists(VENUES_FILE):
        try:
            with open(CITIES_FILE, "r", encoding="utf-8") as f:
                cities = json.load(f)
            with open(VENUES_FILE, "r", encoding="utf-8") as f:
                venues_by_city = json.load(f)
            return cities, venues_by_city
        except Exception as e:
            print(f"[CATALOG SYNC] Notice: Failed loading from data/ files ({e}), falling back to worker.js")

    # Fallback to parsing worker.js directly
    worker_path = os.path.join(os.path.dirname(__file__), "worker.js")
    if os.path.exists(worker_path):
        try:
            with open(worker_path, "r", encoding="utf-8") as f:
                text = f.read()

            # Parse TOP_CITIES
            m_cities = re.search(r"const TOP_CITIES = ({.*?});\s*const", text, re.DOTALL)
            if m_cities:
                raw_c = m_cities.group(1)
                # Convert JS object keys to valid JSON format
                raw_c_fixed = re.sub(r"([{,])\s*([a-zA-Z0-9_]+):", r'\1 "\2":', raw_c)
                cities = json.loads(raw_c_fixed)

            # Parse ALL_VENUES
            m_venues = re.search(r"const ALL_VENUES = ({.*?});\s*const", text, re.DOTALL)
            if m_venues:
                venues_by_city = json.loads(m_venues.group(1))
        except Exception as e:
            print(f"[CATALOG SYNC] Error parsing worker.js: {e}")

    return cities, venues_by_city


def get_user_tracked_venues(token: str):
    """Fetch all venues actively being tracked by bot users."""
    url = f"{CF_WORKER_URL}/api/trackers?token={token}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    tracked = {}
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            trackers = json.loads(resp.read().decode("utf-8"))
            for t in trackers:
                v_code = t.get("venueCode")
                v_name = t.get("venueName")
                c_code = t.get("cityCode", "KANP")
                c_slug = t.get("citySlug", "kanpur")
                if v_code and v_code != "ALL":
                    tracked[v_code] = {
                        "code": v_code,
                        "name": v_name or v_code,
                        "cityCode": c_code,
                        "citySlug": c_slug,
                    }
    except Exception as e:
        print(f"[CATALOG SYNC] Notice: Could not fetch active user trackers ({e})")
    return tracked


LAST_FAILURE_DIAG = {}

def scrape_venue_movies(item):
    """Scrape movies playing at a specific cinema hall using curl_cffi."""
    ccode, cslug, vcode, vname = item
    vslug = slugify(vname)
    url = f"https://in.bookmyshow.com/cinemas/{cslug}/{vslug}/{vcode}"

    # Do not manually set User-Agent, sec-ch-ua, or Accept-Encoding!
    # Overriding them causes fingerprint mismatch with curl_cffi TLS on Linux and triggers Cloudflare 403.
    headers = {
        "Referer": "https://in.bookmyshow.com/",
        "x-region-code": ccode,
        "Cookie": f"Rgn=|Code={ccode}|; bms_region={ccode.lower()}; bms_location={cslug}",
    }

    movies = []
    seen = set()
    parse_error = None

    # Polite jitter to avoid Cloudflare rate limit burst detection
    time.sleep(random.uniform(0.04, 0.10))

    try:
        # Primary attempt with chrome131
        res = cffi_requests.get(url, headers=headers, impersonate="chrome131", timeout=REQUEST_TIMEOUT)

        # Fallback attempt with backoff if chrome131 gets rate-limited or non-200
        if res.status_code != 200:
            if "Attention Required" in res.text or res.status_code in (403, 429):
                time.sleep(random.uniform(1.5, 2.5))
            try:
                res_fallback = cffi_requests.get(url, headers=headers, impersonate="safari18_0", timeout=REQUEST_TIMEOUT)
                if res_fallback.status_code == 200:
                    res = res_fallback
            except Exception:
                pass

        if res.status_code != 200:
            if ccode not in LAST_FAILURE_DIAG:
                title_match = re.search(r"<title>(.*?)</title>", res.text, re.IGNORECASE)
                title_text = title_match.group(1).strip() if title_match else "No title"
                server_hdr = res.headers.get("server", "unknown")
                cf_ray = res.headers.get("cf-ray", "none")
                LAST_FAILURE_DIAG[ccode] = {
                    "status": res.status_code,
                    "title": title_text[:60],
                    "server": server_hdr,
                    "cf_ray": cf_ray
                }
            return vcode, ccode, [], res.status_code

        # Method 1: Extract from React window.__INITIAL_STATE__ (highest quality clean titles with format & language)
        active_dates = []
        def parse_initial_state_events(html_text):
            nonlocal active_dates, parse_error
            if "window.__INITIAL_STATE__" not in html_text:
                return
            idx = html_text.find("window.__INITIAL_STATE__ = ")
            if idx == -1:
                return
            raw = html_text[idx + 27:]
            try:
                data, _ = json.JSONDecoder().raw_decode(raw)
                queries = data.get("venueShowtimesFunctionalApi", {}).get("queries", {})
                for qk in queries:
                    if "getShowtimesByVenue" in qk:
                        qdata = queries[qk].get("data", {})
                        if not active_dates:
                            dates_array = qdata.get("ShowDatesArray", [])
                            active_dates = [d.get("DateCode") for d in dates_array if not d.get("isDisabled") and d.get("DateCode")]
                        events = qdata.get("showDetailsTransformed", {}).get("Event", [])
                        for e in events:
                            base_title = (e.get("EventTitle") or "").strip()
                            if not base_title:
                                continue
                            children = e.get("ChildEvents", [])
                            if children:
                                for ce in children:
                                    code = ce.get("EventCode")
                                    if code and code not in seen:
                                        seen.add(code)
                                        dim = (ce.get("EventDimension") or "").strip()
                                        lang = (ce.get("EventLanguage") or "").strip()
                                        parts = [p for p in [lang, dim] if p]
                                        full_title = "{} ({})".format(base_title, " ".join(parts)) if parts else base_title
                                        movies.append({"code": code, "title": full_title})
                            else:
                                code = e.get("EventCode")
                                if code and code not in seen:
                                    seen.add(code)
                                    movies.append({"code": code, "title": base_title})
            except Exception as ex:
                parse_error = str(ex)

        parse_initial_state_events(res.text)

        # Multi-Date Lookahead: If upcoming active dates exist (e.g. tomorrow), inspect next active date
        # so weekend/daytime shows (like Sunday 3D) are never missed when today's daytime shows have rolled off.
        res_next_text = ""
        if len(active_dates) > 1:
            try:
                canonical_base = res.url.rstrip("/")
                if re.search(r"/\d{8}$", canonical_base):
                    canonical_base = canonical_base.rsplit("/", 1)[0]
                next_date_url = f"{canonical_base}/{active_dates[1]}"
                res_next = cffi_requests.get(
                    next_date_url,
                    headers=headers,
                    impersonate="chrome131",
                    timeout=REQUEST_TIMEOUT,
                    allow_redirects=True,
                )
                if res_next.status_code == 200:
                    res_next_text = res_next.text
                    parse_initial_state_events(res_next.text)
                elif res_next.status_code in (403, 429):
                    time.sleep(random.uniform(0.5, 1.2))
                    res_next_fb = cffi_requests.get(
                        next_date_url,
                        headers=headers,
                        impersonate="safari18_0",
                        timeout=REQUEST_TIMEOUT,
                        allow_redirects=True,
                    )
                    if res_next_fb.status_code == 200:
                        res_next_text = res_next_fb.text
                        parse_initial_state_events(res_next_fb.text)
            except Exception:
                pass

        # Method 2: Extract from HTML links as fallback/supplement
        # Filters out bottom SEO/footer links by enforcing /movies/{city_slug}/ in path
        pattern = rf'<a\s+href="[^"]*?/movies/{cslug}/([^"]+)/(ET\d{{8}})"[^>]*>([^<]+)</a>'
        for page_html in [res.text, res_next_text]:
            if not page_html:
                continue
            matches = re.findall(pattern, page_html)
            for _, code, raw_title in matches:
                if code not in seen:
                    seen.add(code)
                    clean_title = html.unescape(raw_title).strip()
                    clean_title = re.sub(r"\s*\((?:UA|U/A|A|U|16\+|18\+|12\+|13\+|15\+|7\+|R)[^)]*\)", "", clean_title).strip()
                    clean_title = re.sub(r"\s*[\(\)]+$", "", clean_title).strip()
                    movies.append({"code": code, "title": clean_title})

        # Return status 901 if we got 200 but no __INITIAL_STATE__ (JS challenge page)
        if not movies and "window.__INITIAL_STATE__" not in res.text:
            return vcode, ccode, [], 901
        # Return status 902 if __INITIAL_STATE__ was present but JSON parse failed
        if not movies and parse_error:
            return vcode, ccode, [], 902

        return vcode, ccode, movies, 200

    except Exception as ex:
        return vcode, ccode, [], -1




def push_city_bundle_to_cloudflare(token: str, city_code: str, venues_map: dict, city_movies: list) -> bool:
    """Push an entire city's scraped venues and aggregated movies in a single atomic HTTP POST."""
    url = f"{CF_WORKER_URL}/api/movies/sync?token={token}"
    payload = {
        "cityCode": city_code,
        "venues": venues_map,
        "movies": city_movies
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"},
        method="POST"
    )

    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                return resp.status == 200
        except urllib.error.HTTPError as e:
            err_msg = ""
            try:
                err_msg = e.read().decode("utf-8", errors="replace").strip()
            except Exception:
                pass
            if "KV put() limit exceeded" in err_msg:
                print(f"[CATALOG SYNC] ⚠️ Cloudflare KV daily write limit (1,000 writes/day) reached for today. Will reset automatically at 00:00 UTC (05:30 AM IST).")
                return False
            if attempt == 2:
                detail = f" ({err_msg})" if err_msg else ""
                print(f"[CATALOG SYNC] Failed to push city {city_code} bundle after 3 attempts: {e}{detail}")
                return False
            time.sleep(1)
        except Exception as e:
            if attempt == 2:
                print(f"[CATALOG SYNC] Failed to push city {city_code} bundle after 3 attempts: {e}")
                return False
            time.sleep(1)
    return False


def scrape_explore_city_movies(city_slug: str) -> list:
    """Scrape featured/upcoming movies from city's BookMyShow explore page."""
    url = f"https://in.bookmyshow.com/explore/movies-{city_slug}"
    headers = {
        "Referer": "https://in.bookmyshow.com/",
    }
    try:
        res = cffi_requests.get(url, headers=headers, impersonate="chrome131", timeout=8)
        if res.status_code == 200:
            matches = re.findall(rf"/movies/{city_slug}/([^/]+)/(ET\d{{8}})", res.text)
            seen = set()
            movies = []
            for slug, code in matches:
                if code not in seen:
                    seen.add(code)
                    title = slug.replace("-", " ").title()
                    movies.append({"code": code, "title": title})
            return movies
    except Exception:
        pass
    return []


def main():
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        print("Error: TELEGRAM_BOT_TOKEN environment variable is not set.")
        sys.exit(1)

    start_time = time.time()
    print(f"[{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] === Starting All-India Cinema Catalog Sync ===")

    # 1. Load Directory
    cities, venues_by_city = load_directory()
    total_venues = sum(len(v) for v in venues_by_city.values())
    print(f"[CATALOG SYNC] Loaded {len(cities)} cities and {total_venues} cinema halls.")

    # 2. Identify Priority User-Tracked Venues & Cities
    tracked_venues = get_user_tracked_venues(token)
    ordered_cities = []
    if tracked_venues:
        print(f"[CATALOG SYNC] Found {len(tracked_venues)} active user-tracked cinema hall(s).")
        for vcode, info in tracked_venues.items():
            cc = info.get("cityCode")
            if cc and cc in venues_by_city and cc not in ordered_cities:
                ordered_cities.append(cc)

    # Core high-traffic cities (strictly 6 core cities)
    # In deterministic priority order
    core_cities = ["HYD", "NCR", "KANP", "MUMBAI", "BANG", "LUCK"]
    for c in core_cities:
        if c in venues_by_city and c not in ordered_cities:
            ordered_cities.append(c)

    # Only append remaining long-tail cities if explicitly enabled via SYNC_ALL_CITIES=true
    sync_all = os.getenv("SYNC_ALL_CITIES", "false").lower() == "true"
    if sync_all:
        for ccode in venues_by_city.keys():
            if ccode not in ordered_cities:
                ordered_cities.append(ccode)

    target_city = os.getenv("TARGET_CITY")
    if target_city:
        ordered_cities = [c for c in ordered_cities if c.upper() == target_city.upper()]
        print(f"[CATALOG SYNC] Filtered to single target city: {target_city}")

    limit_cities = os.getenv("MAX_CITIES_LIMIT")
    if limit_cities:
        try:
            lim_val = int(limit_cities)
            ordered_cities = ordered_cities[:lim_val]
            print(f"[CATALOG SYNC] Limited run to first {lim_val} cities.")
        except ValueError:
            pass

    print(f"[CATALOG SYNC] Total cities queued for sync: {len(ordered_cities)}")
    print(f"[CATALOG SYNC] Running city-batched sync (max 4 workers per city)...\n")

    synced_cities = 0
    total_active_venues = 0
    total_movie_instances = 0

    for idx, ccode in enumerate(ordered_cities, 1):
        venues = venues_by_city.get(ccode, [])
        cinfo = cities.get(ccode, {})
        cslug = cinfo.get("slug", ccode.lower())
        cname = cinfo.get("name", ccode)

        city_start = time.time()
        venue_items = [(ccode, cslug, v["code"], v["name"]) for v in venues]

        city_venues_map = {}
        city_movies_dict = {}
        active_in_city = 0
        status_counts = {}

        # Scrape all venues in this city concurrently (4 workers for smooth pacing)
        with ThreadPoolExecutor(max_workers=min(4, len(venue_items) or 1)) as executor:
            futures = {executor.submit(scrape_venue_movies, it): it for it in venue_items}
            for fut in as_completed(futures):
                vcode, _, movies, status = fut.result()
                city_venues_map[vcode] = movies
                status_counts[status] = status_counts.get(status, 0) + 1
                if movies:
                    active_in_city += 1
                    total_movie_instances += len(movies)
                    for m in movies:
                        city_movies_dict[m["code"]] = m["title"]

        # Log diagnostics so we can see exactly what's failing (especially on CI)
        non_ok = {s: n for s, n in status_counts.items() if s != 200}
        if non_ok:
            labels = {901: "no-JS-state(bot-block?)", 902: "parse-err", -1: "conn-err"}
            detail = ", ".join(
                "{0}x {1}".format(n, labels.get(s, "HTTP-{}".format(s)))
                for s, n in sorted(non_ok.items())
            )
            diag_sample = LAST_FAILURE_DIAG.get(ccode)
            extra = ""
            if diag_sample:
                extra = " | Sample: Title='{0}', Server={1}, CF-Ray={2}".format(
                    diag_sample.get("title", ""),
                    diag_sample.get("server", ""),
                    diag_sample.get("cf_ray", "")
                )
            print("  [DIAG] {0}: failures -> {1}{2}".format(cname, detail, extra))

        # Skip pushing if the entire city returned 0 movies — this almost certainly means
        # the scraper was bot-blocked, not that the cinemas closed. Preserves existing KV data.
        if active_in_city == 0 and len(venue_items) > 0:
            city_elapsed = time.time() - city_start
            print(
                "[{0}/{1}] {2} ({3}): {4} venues scraped -> 0 active "
                "— skipping KV push to preserve existing data ({5:.2f}s)".format(
                    idx, len(ordered_cities), cname, ccode, len(venues), city_elapsed
                )
            )
            time.sleep(0.05)
            continue

        # Merge with city explore page if needed
        try:
            explore_movies = scrape_explore_city_movies(cslug)
            for em in explore_movies:
                if em["code"] not in city_movies_dict:
                    city_movies_dict[em["code"]] = em["title"]
        except Exception:
            pass

        final_city_movies = [{"code": k, "title": v} for k, v in city_movies_dict.items()]

        # Push entire city bundle in 1 single HTTP request
        ok = push_city_bundle_to_cloudflare(token, ccode, city_venues_map, final_city_movies)
        city_elapsed = time.time() - city_start

        if ok:
            synced_cities += 1
            total_active_venues += active_in_city
            print(
                "[{0}/{1}] {2} ({3}): {4} venues scraped -> {5} active ({6} unique movies) synced in {7:.2f}s [OK]".format(
                    idx, len(ordered_cities), cname, ccode, len(venues), active_in_city, len(final_city_movies), city_elapsed
                )
            )
        else:
            print(
                "[{0}/{1}] {2} ({3}): {4} venues scraped but push to Cloudflare failed [ERR]".format(
                    idx, len(ordered_cities), cname, ccode, len(venues)
                )
            )

        time.sleep(0.8)


    elapsed = time.time() - start_time
    print(f"\n[{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] === All-India Cinema Catalog Sync Completed ===")
    print(f"Summary:")
    print(f"  * Total Cities Synced: {synced_cities}/{len(ordered_cities)}")
    print(f"  * Total Active Cinema Halls: {total_active_venues}")
    print(f"  * Total Movie Screenings Mapped: {total_movie_instances}")
    print(f"  * Total Time Elapsed: {elapsed:.2f} seconds ({elapsed/60:.1f} minutes)")


if __name__ == "__main__":
    main()
