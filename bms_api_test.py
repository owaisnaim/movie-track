import datetime
import json
from curl_cffi import requests

VENUE = "PRHN"
REGION_CODE = "HYD"
REGION_NAME = "Hyderabad"
MOVIE_NAME = "Avengers Endgame: Encore"
CINEMA_SLUG = "prasads-multiplex-hyderabad"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/131.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-IN,en;q=0.9",
    "Cookie": f"Rgn=%7CCode%3D{REGION_CODE}%7Ctext%3D{REGION_NAME}%7C",
    "Referer": "https://in.bookmyshow.com/",
}

def main():
    today = datetime.date.today().strftime("%Y%m%d")
    session = requests.Session(impersonate="chrome124")

    # 1. Test QUICKBOOK API
    print("1. Testing QUICKBOOK API...")
    qb_url = f"https://in.bookmyshow.com/serv/getData?cmd=QUICKBOOK&type=MT"
    res = session.get(qb_url, headers=HEADERS, timeout=15)
    print(f"   Status: {res.status_code}")
    if res.status_code == 200:
        events = res.json().get("moviesData", {}).get("BookMyShow", {}).get("arrEvents", [])
        movie = next((e for e in events if MOVIE_NAME.lower() in e.get("EventTitle", "").lower()), None)
        if movie:
            print(f"   Found movie in QUICKBOOK: {movie.get('EventTitle')}")
            for c in movie.get("ChildEvents", []):
                print(f"     Format: {c.get('EventName')} | Dimension: {c.get('EventDimension')} | Code: {c.get('EventCode')}")
        else:
            print(f"   Movie '{MOVIE_NAME}' not found in QUICKBOOK.")

    # 2. Test Cinema Showtimes Page
    print("\n2. Testing Cinema Showtimes Page...")
    cinema_url = f"https://in.bookmyshow.com/cinemas/hyderabad/{CINEMA_SLUG}/buytickets/{VENUE}/{today}"
    page_res = session.get(cinema_url, headers=HEADERS, timeout=15)
    print(f"   Status: {page_res.status_code}")
    idx = page_res.text.find("window.__INITIAL_STATE__ = ")
    if idx != -1:
        state, _ = json.JSONDecoder().raw_decode(page_res.text[idx + len("window.__INITIAL_STATE__ = "):])
        dates = [d.get("DateCode") for d in state.get("venueShowtimesNew", {}).get("showDates", [])]
        print(f"   Extracted showDates from page: {dates}")
        q_key = f"getShowtimesByVenue-{VENUE}-{today}"
        shows_transformed = state.get("venueShowtimesFunctionalApi", {}).get("queries", {}).get(q_key, {}).get("data", {}).get("showDetailsTransformed", {})
        events = shows_transformed.get("Event", [])
        print(f"   Total events playing today at PRHN: {len(events)}")
    else:
        print("   Could not find __INITIAL_STATE__ in page.")

if __name__ == "__main__":
    main()
