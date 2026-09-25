import datetime
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from curl_cffi import requests as cffi_requests

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

VENUE = "PRHN"
REGION_CODE = "HYD"
REGION_NAME = "hyderabad"
MOVIE_NAME = "Avengers: Endgame - Encore"
CINEMA_SLUG = "prasads-multiplex-hyderabad"

# Target child event codes for Avengers Endgame: Encore 3D & PCX
EVENT_CODES = [
    "ET00516731",  # Avengers Endgame: Encore (3D) - English
    "ET00516728",  # Avengers Endgame: Encore (MS-Infinity Vsn 3D)
]

API_URL = "https://in.bookmyshow.com/api/movies-data/v4/showtimes-by-event/primary-dynamic"
STATE_FILE = ".github/bms-pcx-state.json"

API_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/131.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-IN,en;q=0.9",
    "Referer": "https://in.bookmyshow.com/",
    "x-app-code": "WEB",
    "x-region-code": REGION_CODE,
    "x-region-slug": REGION_NAME,
    "x-geohash": "tep",
    "x-latitude": "17.385",
    "x-longitude": "78.487",
    "x-location-selection": "manual",
}

def set_output(key: str, value: str):
    output_file = os.getenv("GITHUB_OUTPUT")
    if output_file:
        with open(output_file, "a", encoding="utf-8") as out:
            out.write(f"{key}={value}\n")
    print(f"[GITHUB_OUTPUT] {key}={value}")

def load_state() -> dict:
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Warning: Could not read state file ({e}). Starting fresh.")
    return {"known_sessions": {}}

def save_state(state: dict):
    os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)

def prune_old_sessions(known_sessions: dict):
    today = datetime.date.today()
    cutoff_date = (today - datetime.timedelta(days=2)).strftime("%Y-%m-%d")
    to_delete = []
    for sid, info in known_sessions.items():
        show_date = info.get("date", "")
        if show_date and show_date < cutoff_date:
            to_delete.append(sid)
    for sid in to_delete:
        del known_sessions[sid]
    if to_delete:
        print(f"Pruned {len(to_delete)} expired session(s) older than {cutoff_date}.")

def fetch_api(event_code: str, date_code: str = "") -> dict:
    params = urllib.parse.urlencode({
        "eventCode": event_code,
        "dateCode": date_code,
        "isDesktop": "true",
        "regionCode": REGION_CODE,
        "xLocationShared": "false",
        "lat": "17.385",
        "lon": "78.487",
    })
    url = f"{API_URL}?{params}"
    
    req = urllib.request.Request(url, headers=API_HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as urllib_err:
        print(f"Notice: urllib fetch failed ({urllib_err}), trying curl_cffi fallback...")
        res = cffi_requests.get(url, headers=API_HEADERS, timeout=20, impersonate="chrome124")
        if res.status_code != 200:
            raise RuntimeError(f"HTTP {res.status_code} for {url}")
        return res.json()

def extract_dates(data: dict) -> list[str]:
    dates = []
    for w in data.get("data", {}).get("topStickyWidgets", []):
        if w.get("type") == "horizontal-block-list":
            for item in w.get("data", []):
                date_id = str(item.get("id", "")).strip()
                style_id = str(item.get("styleId", "")).strip()
                if date_id and style_id != "date-disabled":
                    dates.append(date_id)
    return dates

def is_target_show(screen_attr: str, screen_name: str) -> bool:
    combined = f"{screen_attr} {screen_name}".lower()
    is_pcx = (
        "pcx" in combined
        or "infinity" in combined
        or "screen 1" in screen_name.lower()
    )
    return is_pcx

def check_shows_once(known_sessions: dict):
    all_active_shows = []
    new_shows = []
    checked_sessions = set()
    total_dates_checked = set()

    for event_code in EVENT_CODES:
        try:
            initial_data = fetch_api(event_code, "")
        except Exception as exc:
            print(f"Failed to fetch initial showtimes for {event_code}: {exc}")
            continue

        active_dates = extract_dates(initial_data)
        if not active_dates:
            continue

        total_dates_checked.update(active_dates)

        for date_code in active_dates:
            try:
                date_data = initial_data if date_code == active_dates[0] else fetch_api(event_code, date_code)
            except Exception as exc:
                print(f"Warning: Failed to fetch showtimes for {date_code}: {exc}")
                continue

            showtime_widgets = date_data.get("data", {}).get("showtimeWidgets", [])
            for widget in showtime_widgets:
                if widget.get("type") != "groupList":
                    continue

                for group in widget.get("data", []):
                    for item in group.get("data", []):
                        venue_code = item.get("additionalData", {}).get("venueCode")
                        if venue_code != VENUE:
                            continue

                        shows = item.get("showtimes", [])
                        for show in shows:
                            show_add = show.get("additionalData", {})
                            session_id = str(show_add.get("sessionId", ""))
                            if not session_id or session_id in checked_sessions:
                                continue

                            screen_attr = str(
                                show.get("screenAttr") or show_add.get("attributes") or ""
                            ).strip()
                            screen_name = str(show_add.get("screenName", "")).strip()

                            if not is_target_show(screen_attr, screen_name):
                                continue

                            checked_sessions.add(session_id)
                            show_time = str(show.get("title") or show_add.get("showTime", "Detected")).strip()
                            
                            cats = show_add.get("categories", [])
                            prices = [
                                f"{c.get('priceDesc', '').strip()}: Rs.{c.get('curPrice', '')}"
                                for c in cats
                                if c.get("curPrice")
                            ]
                            price_str = ", ".join(prices) if prices else "Available"

                            date_formatted = f"{date_code[:4]}-{date_code[4:6]}-{date_code[6:8]}"
                            booking_url = (
                                f"https://in.bookmyshow.com/cinemas/hyderabad/{CINEMA_SLUG}/buytickets/{VENUE}/{date_code}"
                            )

                            display_screen = screen_attr or screen_name or "PCX Infinity Vision 3D"
                            if screen_name and screen_name not in display_screen:
                                display_screen = f"{display_screen} ({screen_name})"

                            show_record = {
                                "sessionId": session_id,
                                "date": date_formatted,
                                "time": show_time,
                                "screen": display_screen,
                                "tickets": price_str,
                                "url": booking_url,
                            }
                            all_active_shows.append(show_record)

                            if session_id not in known_sessions:
                                new_shows.append(show_record)

    return all_active_shows, new_shows, len(total_dates_checked)

def main():
    print(f"[{datetime.datetime.now()}] Starting BookMyShow monitor for new shows of '{MOVIE_NAME}' (PCX 3D) at {VENUE}...")

    state = load_state()
    known_sessions = state.setdefault("known_sessions", {})
    is_initial_seeding = len(known_sessions) == 0

    # In CI/GitHub Actions, check 3 times across a 2-minute window (every 60s)
    # Locally, perform a single immediate check
    total_checks = 3 if os.getenv("GITHUB_ACTIONS") else 1
    poll_interval_seconds = 60

    new_shows_found = False

    for attempt in range(1, total_checks + 1):
        if total_checks > 1:
            print(f"\n--- Poll Check {attempt}/{total_checks} at {datetime.datetime.now().strftime('%H:%M:%S')} ---")

        all_active_shows, new_shows, dates_count = check_shows_once(known_sessions)

        if not dates_count and not all_active_shows:
            print("Warning: Could not query BookMyShow API for any active dates on this attempt.")
            if attempt < total_checks:
                time.sleep(poll_interval_seconds)
                continue
            else:
                set_output("available", "false")
                set_output("new_shows_found", "false")
                set_output("check_failed", "true")
                sys.exit(1)

        if is_initial_seeding:
            for s in all_active_shows:
                known_sessions[s["sessionId"]] = {
                    "date": s["date"],
                    "time": s["time"],
                    "screen": s["screen"],
                    "first_seen": datetime.datetime.now().isoformat(),
                }
            save_state(state)
            print(f"\nInitial baseline seeded with {len(all_active_shows)} currently active shows.")
            print("Future runs will only alert when a brand-new show is added.")
            with open("matches.txt", "w", encoding="utf-8") as out:
                out.write("")
            set_output("available", "true" if all_active_shows else "false")
            set_output("new_shows_found", "false")
            set_output("check_failed", "false")
            return

        if new_shows:
            print(f"\n🚨 ALERT: {len(new_shows)} NEW SHOW(S) ADDED!")
            print("-" * 50)
            
            # Sort new shows chronologically
            new_shows.sort(key=lambda m: (m["date"], m["time"]))

            with open("matches.txt", "w", encoding="utf-8") as out:
                for item in new_shows:
                    block = (
                        f"Date: {item['date']}\n"
                        f"Show time: {item['time']}\n"
                        f"Screen: {item['screen']}\n"
                        f"Tickets: {item['tickets']}\n"
                        f"BookMyShow: {item['url']}\n\n"
                    )
                    out.write(block)
                    print(block.strip() + "\n")
            print("-" * 50)

            # Record newly found shows into state
            for item in new_shows:
                known_sessions[item["sessionId"]] = {
                    "date": item["date"],
                    "time": item["time"],
                    "screen": item["screen"],
                    "first_seen": datetime.datetime.now().isoformat(),
                }

            prune_old_sessions(known_sessions)
            save_state(state)

            set_output("available", "true")
            set_output("new_shows_found", "true")
            set_output("check_failed", "false")
            new_shows_found = True
            break  # Break out immediately so alert can be dispatched without waiting

        print(f"Check {attempt}/{total_checks}: No new shows. ({len(all_active_shows)} active shows currently running).")

        if attempt < total_checks:
            time.sleep(poll_interval_seconds)

    if not new_shows_found:
        prune_old_sessions(known_sessions)
        save_state(state)
        with open("matches.txt", "w", encoding="utf-8") as out:
            out.write("")
        set_output("available", "true" if all_active_shows else "false")
        set_output("new_shows_found", "false")
        set_output("check_failed", "false")

if __name__ == "__main__":
    main()
