import datetime
import html
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from curl_cffi import requests as cffi_requests

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

CF_WORKER_URL = "https://movie-track-bot.mustardshrek.workers.dev"

# Popular flagship cinemas per city to keep pre-warmed
DEFAULT_VENUES = [
    # Kanpur
    {"code": "INZS", "name": "INOX: Z Square, Bada Chauraha", "citySlug": "kanpur", "cityCode": "KANP"},
    {"code": "PDDK", "name": "PVR: Deep, Kanpur", "citySlug": "kanpur", "cityCode": "KANP"},
    {"code": "RAVE", "name": "Rave 3 AV Cinemas: Kanpur", "citySlug": "kanpur", "cityCode": "KANP"},
    {"code": "MCGP", "name": "Miraj Cinemas: Gurudev Pammi", "citySlug": "kanpur", "cityCode": "KANP"},
    # Lucknow
    {"code": "PVPP", "name": "PVR: Phoenix Palassio, Lucknow", "citySlug": "lucknow", "cityCode": "LUCK"},
    {"code": "PVPB", "name": "PVR: Wave Mall, Lucknow", "citySlug": "lucknow", "cityCode": "LUCK"},
    {"code": "LKIN", "name": "INOX: Riverside Mall, Gomti Nagar", "citySlug": "lucknow", "cityCode": "LUCK"},
    {"code": "LPCM", "name": "Cinepolis: One Awadh Center", "citySlug": "lucknow", "cityCode": "LUCK"},
    # Hyderabad
    {"code": "PRHN", "name": "Prasads Multiplex: Hyderabad", "citySlug": "hyderabad", "cityCode": "HYD"},
    {"code": "AMBP", "name": "AMB Cinemas: Gachibowli", "citySlug": "hyderabad", "cityCode": "HYD"},
    {"code": "PVIN", "name": "PVR: Next Galleria Mall, Panjagutta", "citySlug": "hyderabad", "cityCode": "HYD"},
    {"code": "INMH", "name": "INOX: GSM Mall, Miyapur", "citySlug": "hyderabad", "cityCode": "HYD"},
    # NCR / Delhi
    {"code": "PVVC", "name": "PVR: Vegas Mall, Dwarka", "citySlug": "national-capital-region-ncr", "cityCode": "NCR"},
    {"code": "PVIW", "name": "PVR: Select CITYWALK, Saket", "citySlug": "national-capital-region-ncr", "cityCode": "NCR"},
    {"code": "INPO", "name": "INOX: Nehru Place", "citySlug": "national-capital-region-ncr", "cityCode": "NCR"},
    # Mumbai
    {"code": "PVMC", "name": "PVR: Phoenix Palladium, Lower Parel", "citySlug": "mumbai", "cityCode": "MUMBAI"},
    {"code": "INNB", "name": "INOX: Nariman Point", "citySlug": "mumbai", "cityCode": "MUMBAI"},
    # Bengaluru
    {"code": "PVBG", "name": "PVR: Forum Mall, Koramangala", "citySlug": "bengaluru", "cityCode": "BANG"},
    {"code": "INBG", "name": "INOX: Garuda Mall, Magrath Road", "citySlug": "bengaluru", "cityCode": "BANG"},
]

def slugify(text: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "-", text.lower()).strip("-")
    return cleaned

def get_active_venues_and_cities(token: str):
    venues = {}
    cities = set()

    for v in DEFAULT_VENUES:
        venues[v["code"]] = v
        cities.add((v["cityCode"], v["citySlug"]))

    # Dynamically pull user trackers from Cloudflare KV
    url = f"{CF_WORKER_URL}/api/trackers?token={token}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            trackers = json.loads(resp.read().decode("utf-8"))
            for t in trackers:
                v_code = t.get("venueCode")
                v_name = t.get("venueName")
                c_code = t.get("cityCode", "KANP")
                c_slug = t.get("citySlug", "kanpur")
                if v_code and v_code != "ALL":
                    venues[v_code] = {
                        "code": v_code,
                        "name": v_name or v_code,
                        "citySlug": c_slug,
                        "cityCode": c_code,
                    }
                cities.add((c_code, c_slug))
    except Exception as e:
        print(f"[CATALOG SYNC] Notice: Could not fetch dynamic trackers ({e})")

    return list(venues.values()), list(cities)

def scrape_cinema_movies(city_slug: str, venue_slug: str, venue_code: str) -> list:
    url = f"https://in.bookmyshow.com/cinemas/{city_slug}/{venue_slug}/{venue_code}"
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Referer": "https://in.bookmyshow.com/",
    }

    try:
        res = cffi_requests.get(url, headers=headers, timeout=20, impersonate="chrome124")
        if res.status_code != 200:
            print(f"[CATALOG SYNC] HTTP {res.status_code} for {venue_code} ({url})")
            return []

        # Real movies playing at this cinema have the city in their URL: /movies/{city_slug}/.../{eventCode}
        # Bottom SEO and trending links do not have the city slug in the URL path.
        pattern = rf'<a\s+href="[^"]*?/movies/{city_slug}/([^"]+)/(ET\d{{8}})"[^>]*>([^<]+)</a>'
        matches = re.findall(pattern, res.text)
        seen = set()
        movies = []

        for slug, code, raw_title in matches:
            if code not in seen:
                seen.add(code)
                clean_title = html.unescape(raw_title).strip()
                movies.append({"code": code, "title": clean_title})

        return movies
    except Exception as e:
        print(f"[CATALOG SYNC] Error scraping {venue_code}: {e}")
        return []

def push_venue_movies_to_cloudflare(token: str, venue_code: str, movies: list) -> bool:
    if not movies:
        return False

    url = f"{CF_WORKER_URL}/api/movies/sync?token={token}"
    data = json.dumps({"venueCode": venue_code, "movies": movies}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return True
    except Exception as e:
        print(f"[CATALOG SYNC] Failed to push movies for {venue_code}: {e}")
        return False

def sync_city_wide_movies(token: str, city_code: str) -> int:
    url = f"{CF_WORKER_URL}/api/movies/sync?token={token}"
    headers = {
        "x-region-code": city_code,
        "Cookie": f"Rgn=|Code={city_code}|",
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
    }

    try:
        res = cffi_requests.get(
            "https://in.bookmyshow.com/serv/getData?cmd=QUICKBOOK&type=MT",
            headers=headers,
            timeout=15,
            impersonate="chrome124"
        )
        if res.status_code == 200:
            events = res.json().get("moviesData", {}).get("BookMyShow", {}).get("arrEvents", [])
            movies = [{"code": e["EventCode"], "title": e["EventTitle"]} for e in events if e.get("EventCode") and e.get("EventTitle")]
            if movies:
                data = json.dumps({"cityCode": city_code, "movies": movies}).encode("utf-8")
                req = urllib.request.Request(
                    url,
                    data=data,
                    headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"},
                    method="POST"
                )
                with urllib.request.urlopen(req, timeout=15) as resp:
                    return len(movies)
    except Exception as e:
        print(f"[CATALOG SYNC] City sync notice for {city_code}: {e}")
    return 0

def main():
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        print("Error: TELEGRAM_BOT_TOKEN environment variable is not set.")
        sys.exit(1)

    print(f"[{datetime.datetime.now()}] === Starting Daily Cinema Catalog Sync ===")

    venues, cities = get_active_venues_and_cities(token)
    print(f"[CATALOG SYNC] Found {len(venues)} target cinema hall(s) across {len(cities)} cities.\n")

    synced_venues = 0
    total_movie_entries = 0

    # 1. Sync specific cinema hall catalogs
    for idx, v in enumerate(venues, 1):
        v_code = v["code"]
        v_name = v["name"]
        c_slug = v["citySlug"]
        v_slug = slugify(v_name)

        print(f"[{idx}/{len(venues)}] Scraping movies for {v_name} ({v_code})...")
        movies = scrape_cinema_movies(c_slug, v_slug, v_code)

        if movies:
            ok = push_venue_movies_to_cloudflare(token, v_code, movies)
            if ok:
                synced_venues += 1
                total_movie_entries += len(movies)
                print(f"  -> Synced {len(movies)} movies to Cloudflare KV for {v_code}.")
            else:
                print(f"  -> Failed to push {len(movies)} movies for {v_code}.")
        else:
            print(f"  -> No movies found or 404 for {v_code}.")

        time.sleep(1.5)  # Polite pacing between requests

    # 2. Sync city-wide catalogs
    print(f"\n[CATALOG SYNC] Syncing city-wide movie catalogs for {len(cities)} cities...")
    for c_code, c_slug in cities:
        count = sync_city_wide_movies(token, c_code)
        if count > 0:
            print(f"  -> Synced {count} city-wide movies for {c_code} ({c_slug}).")
        time.sleep(1.0)

    print(f"\n[{datetime.datetime.now()}] === Cinema Catalog Sync Completed ===")
    print(f"Summary: Successfully updated {synced_venues}/{len(venues)} cinema halls with {total_movie_entries} movie listings.")

if __name__ == "__main__":
    main()
