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


def scrape_venue_movies(item):
    """Scrape movies playing at a specific cinema hall using curl_cffi."""
    ccode, cslug, vcode, vname = item
    vslug = slugify(vname)
    url = f"https://in.bookmyshow.com/cinemas/{cslug}/{vslug}/{vcode}"

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Referer": "https://in.bookmyshow.com/",
        "x-region-code": ccode,
        "Cookie": f"Rgn=|Code={ccode}|",
    }

    movies = []
    seen = set()

    try:
        res = cffi_requests.get(url, headers=headers, impersonate="chrome124", timeout=REQUEST_TIMEOUT)
        if res.status_code != 200:
            return vcode, ccode, [], res.status_code

        # Method 1: Extract from React window.__INITIAL_STATE__ (highest quality clean titles with format & language)
        if "window.__INITIAL_STATE__" in res.text:
            idx = res.text.find("window.__INITIAL_STATE__ = ")
            if idx != -1:
                raw = res.text[idx + 27:]
                try:
                    data, _ = json.JSONDecoder().raw_decode(raw)
                    queries = data.get("venueShowtimesFunctionalApi", {}).get("queries", {})
                    for qk in queries:
                        if "getShowtimesByVenue" in qk:
                            events = queries[qk].get("data", {}).get("showDetailsTransformed", {}).get("Event", [])
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
                                            full_title = f"{base_title} ({' '.join(parts)})" if parts else base_title
                                            movies.append({"code": code, "title": full_title})
                                else:
                                    code = e.get("EventCode")
                                    if code and code not in seen:
                                        seen.add(code)
                                        movies.append({"code": code, "title": base_title})
                except Exception:
                    pass

        # Method 2: Extract from HTML links as fallback/supplement
        # Filters out bottom SEO/footer links by enforcing /movies/{city_slug}/ in path
        pattern = rf'<a\s+href="[^"]*?/movies/{cslug}/([^"]+)/(ET\d{{8}})"[^>]*>([^<]+)</a>'
        matches = re.findall(pattern, res.text)
        for _, code, raw_title in matches:
            if code not in seen:
                seen.add(code)
                clean_title = html.unescape(raw_title).strip()
                clean_title = re.sub(r"\s*\((?:UA|U/A|A|U|16\+|18\+|12\+|13\+|15\+|7\+|R)[^)]*\)", "", clean_title).strip()
                clean_title = re.sub(r"\s*[\(\)]+$", "", clean_title).strip()
                movies.append({"code": code, "title": clean_title})

        return vcode, ccode, movies, 200

    except Exception:
        return vcode, ccode, [], 0


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
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Referer": "https://in.bookmyshow.com/",
    }
    try:
        res = cffi_requests.get(url, headers=headers, impersonate="chrome124", timeout=8)
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
    priority_cities = set()
    if tracked_venues:
        print(f"[CATALOG SYNC] Found {len(tracked_venues)} active user-tracked cinema hall(s).")
        for vcode, info in tracked_venues.items():
            if info.get("cityCode"):
                priority_cities.add(info["cityCode"])

    # Core high-traffic cities (Kanpur, Hyderabad, Mumbai, NCR, Bangalore, etc.)
    core_cities = ["HYD", "KANP", "MUMBAI", "NCR", "BANG", "CHD", "PUNE", "KOLK", "CHEN", "AHD", "KOCH", "JAIP"]
    for c in core_cities:
        priority_cities.add(c)

    # 3. Order Cities: Priority cities first (active user-tracked + top metros)
    ordered_cities = []
    for ccode in priority_cities:
        if ccode in venues_by_city and ccode not in ordered_cities:
            ordered_cities.append(ccode)

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
    print(f"[CATALOG SYNC] Running city-batched sync (max 6 workers per city)...\n")

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

        # Scrape all venues in this city concurrently
        with ThreadPoolExecutor(max_workers=min(6, len(venue_items) or 1)) as executor:
            futures = {executor.submit(scrape_venue_movies, it): it for it in venue_items}
            for fut in as_completed(futures):
                vcode, _, movies, status = fut.result()
                city_venues_map[vcode] = movies
                if movies:
                    active_in_city += 1
                    total_movie_instances += len(movies)
                    for m in movies:
                        city_movies_dict[m["code"]] = m["title"]

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
                f"[{idx}/{len(ordered_cities)}] {cname} ({ccode}): "
                f"{len(venues)} venues scraped -> {active_in_city} active ({len(final_city_movies)} unique movies) "
                f"synced in {city_elapsed:.2f}s [OK]"
            )
        else:
            print(
                f"[{idx}/{len(ordered_cities)}] {cname} ({ccode}): "
                f"{len(venues)} venues scraped but push to Cloudflare failed [ERR]"
            )

        time.sleep(0.05)

    elapsed = time.time() - start_time
    print(f"\n[{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] === All-India Cinema Catalog Sync Completed ===")
    print(f"Summary:")
    print(f"  * Total Cities Synced: {synced_cities}/{len(ordered_cities)}")
    print(f"  * Total Active Cinema Halls: {total_active_venues}")
    print(f"  * Total Movie Screenings Mapped: {total_movie_instances}")
    print(f"  * Total Time Elapsed: {elapsed:.2f} seconds ({elapsed/60:.1f} minutes)")


if __name__ == "__main__":
    main()
