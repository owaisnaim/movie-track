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


def push_venue_movies_to_cloudflare(token: str, venue_code: str, movies: list) -> bool:
    """Push a single venue's movie list directly to Cloudflare Worker KV."""
    if not movies:
        return True

    url = f"{CF_WORKER_URL}/api/movies/sync?token={token}"
    data = json.dumps({"venueCode": venue_code, "movies": movies}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            return resp.status == 200
    except Exception as e:
        print(f"[CATALOG SYNC] Failed to push {venue_code}: {e}")
        return False


def push_city_movies_to_cloudflare(token: str, city_code: str, movies: list) -> bool:
    """Push aggregated city-wide movie list to Cloudflare KV."""
    if not movies:
        return False

    url = f"{CF_WORKER_URL}/api/movies/sync?token={token}"
    data = json.dumps({"cityCode": city_code, "movies": movies}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.status == 200
    except Exception as e:
        print(f"[CATALOG SYNC] Failed to push city movies for {city_code}: {e}")
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

    # 2. Identify Priority User-Tracked Venues
    tracked_venues = get_user_tracked_venues(token)
    if tracked_venues:
        print(f"[CATALOG SYNC] Found {len(tracked_venues)} active user-tracked cinema hall(s) (Priority 1).")

    # 3. Build Queue (Priority user venues first, then all remaining venues)
    queue = []
    seen_venues = set()

    # Priority 1: User-tracked venues
    for vcode, info in tracked_venues.items():
        queue.append((info["cityCode"], info["citySlug"], vcode, info["name"]))
        seen_venues.add(vcode)

    # Priority 2: All remaining venues from all 87 cities
    for ccode, venues in venues_by_city.items():
        cinfo = cities.get(ccode, {})
        cslug = cinfo.get("slug", ccode.lower())
        for v in venues:
            vcode = v["code"]
            if vcode not in seen_venues:
                queue.append((ccode, cslug, vcode, v["name"]))
                seen_venues.add(vcode)

    limit = os.getenv("MAX_VENUES_LIMIT")
    if limit:
        try:
            lim_val = int(limit)
            queue = queue[:lim_val]
            print(f"[CATALOG SYNC] (Testing mode) Limited queue to first {lim_val} venues.")
        except ValueError:
            pass

    print(f"[CATALOG SYNC] Total venues queued for scraping: {len(queue)}")
    print(f"[CATALOG SYNC] Running concurrent sync with {MAX_WORKERS} workers...\n")

    # 4. Concurrently Scrape Venues and Push Directly to Cloudflare KV
    synced_venues = 0
    total_movie_instances = 0
    city_movies_map = {}  # ccode -> dict of code: title
    completed_count = 0

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_venue = {executor.submit(scrape_venue_movies, item): item for item in queue}

        for future in as_completed(future_to_venue):
            completed_count += 1
            vcode, ccode, movies, status = future.result()

            if movies:
                ok = push_venue_movies_to_cloudflare(token, vcode, movies)
                if ok:
                    synced_venues += 1
                    total_movie_instances += len(movies)

                    # Accumulate for city-wide catalog
                    if ccode not in city_movies_map:
                        city_movies_map[ccode] = {}
                    for m in movies:
                        city_movies_map[ccode][m["code"]] = m["title"]

            # Progress log every 50 venues
            if completed_count % 50 == 0 or completed_count == len(queue):
                pct = (completed_count / len(queue)) * 100
                print(
                    f"[PROGRESS] {completed_count}/{len(queue)} venues processed ({pct:.1f}%) | "
                    f"{synced_venues} active cinemas synced"
                )

    # 5. Push Aggregated City-Wide Catalogs
    print(f"\n[CATALOG SYNC] Syncing city-wide movie catalogs for {len(city_movies_map)} cities...")
    cities_synced = 0
    for ccode, movies_dict in city_movies_map.items():
        cinfo = cities.get(ccode, {})
        cslug = cinfo.get("slug", ccode.lower())

        # Merge with city explore page if available
        explore_movies = scrape_explore_city_movies(cslug)
        for em in explore_movies:
            if em["code"] not in movies_dict:
                movies_dict[em["code"]] = em["title"]

        final_movies = [{"code": k, "title": v} for k, v in movies_dict.items()]
        if final_movies:
            ok = push_city_movies_to_cloudflare(token, ccode, final_movies)
            if ok:
                cities_synced += 1

    elapsed = time.time() - start_time
    print(f"\n[{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] === All-India Cinema Catalog Sync Completed ===")
    print(f"Summary:")
    print(f"  • Total Venues Scraped: {len(queue)}")
    print(f"  • Cinema Halls with Active Shows: {synced_venues}")
    print(f"  • Total Cinema-Movie Listings Mapped: {total_movie_instances}")
    print(f"  • Cities Updated with Full Catalogs: {cities_synced}/{len(cities)}")
    print(f"  • Total Time Elapsed: {elapsed:.2f} seconds ({elapsed/60:.1f} minutes)")


if __name__ == "__main__":
    main()
