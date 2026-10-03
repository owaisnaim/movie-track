import datetime
import json
import os
import re
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from curl_cffi import requests as cffi_requests

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

def slugify(text: str) -> str:
    """Create a URL-safe slug matching BookMyShow format."""
    return re.sub(r"[^a-zA-Z0-9]+", "-", text.lower()).strip("-")

FORMAT_WORDS = {
    "english", "hindi", "telugu", "tamil", "kannada", "malayalam", "bengali", "marathi", "gujarati",
    "3d", "2d", "4dx", "imax", "pcx", "atmos", "hdr", "barco", "laser",
    "vsn", "vision", "re-release", "rerelease", "dubbed", "subbed"
}

def normalize_title(title: str) -> set:
    clean = re.sub(r"[^a-zA-Z0-9\s]", " ", title.lower())
    words = [w for w in clean.split() if len(w) > 2]
    core = [w for w in words if w not in FORMAT_WORDS]
    return set(core if core else words)

def match_movie(target_title: str, candidate_title: str) -> bool:
    target_words = normalize_title(target_title)
    cand_clean = re.sub(r"[^a-zA-Z0-9\s]", " ", candidate_title.lower())
    cand_words = set(cand_clean.split())
    if not target_words:
        return False
    return target_words.issubset(cand_words)


VENUE = "PRHN"
REGION_CODE = "HYD"
REGION_NAME = "hyderabad"
MOVIE_NAME = "Avengers: Endgame - Encore"
CINEMA_SLUG = "prasads-multiplex-hyderabad"

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
    return {"is_paused": False, "last_update_id": 0, "known_sessions": {}}

def save_state(state: dict):
    os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)

def commit_and_push_state(commit_msg: str):
    if not os.getenv("GITHUB_ACTIONS"):
        return
    if not os.path.exists(STATE_FILE):
        return
    subprocess.run(["git", "config", "user.name", "github-actions[bot]"], check=True)
    subprocess.run(
        ["git", "config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com"],
        check=True,
    )
    subprocess.run(["git", "add", STATE_FILE], check=True)
    diff = subprocess.run(["git", "diff", "--staged", "--quiet"])
    if diff.returncode != 0:
        subprocess.run(["git", "commit", "-m", commit_msg], check=True)
        subprocess.run(["git", "pull", "--rebase", "origin", "main"], check=False)
        subprocess.run(["git", "push", "origin", "HEAD:main"], check=True)
        print(f"Committed and pushed state: {commit_msg}")

def send_telegram_msg(token: str, chat_id: str, text: str, parse_mode: str = "Markdown") -> bool:
    params = {
        "chat_id": chat_id,
        "text": text,
        "disable_web_page_preview": "true",
    }
    if parse_mode:
        params["parse_mode"] = parse_mode
    data = urllib.parse.urlencode(params).encode("utf-8")
    req = urllib.request.Request(
        f"https://api.telegram.org/bot{token}/sendMessage",
        data=data,
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            print(f"[TELEGRAM] Message sent successfully to {chat_id}.")
            return True
    except urllib.error.HTTPError as http_err:
        err_body = http_err.read().decode("utf-8", "ignore")
        print(f"[TELEGRAM] Notice: HTTP {http_err.code} sending message ({err_body}). Retrying without parse_mode...")
        params.pop("parse_mode", None)
        retry_data = urllib.parse.urlencode(params).encode("utf-8")
        retry_req = urllib.request.Request(
            f"https://api.telegram.org/bot{token}/sendMessage",
            data=retry_data,
            method="POST",
        )
        try:
            with urllib.request.urlopen(retry_req, timeout=15) as retry_resp:
                print(f"[TELEGRAM] Plain-text fallback sent successfully to {chat_id}.")
                return True
        except Exception as retry_err:
            print(f"[TELEGRAM] Error sending plain-text fallback: {retry_err}")
            return False
    except Exception as e:
        print(f"[TELEGRAM] Error sending Telegram message: {e}")
        return False

def process_telegram_commands(state: dict, token: str, chat_id: str, active_shows_count: int) -> bool:
    last_update_id = state.get("last_update_id", 0)
    url = f"https://api.telegram.org/bot{token}/getUpdates?offset={last_update_id + 1}&timeout=5"
    print(f"[TELEGRAM] Checking updates with offset={last_update_id + 1}...")
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            res_data = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"Notice: Could not check Telegram commands ({e})")
        return False

    if not res_data.get("ok"):
        print(f"[TELEGRAM] API response not ok: {res_data}")
        return False

    updates = res_data.get("result", [])
    print(f"[TELEGRAM] Received {len(updates)} update(s).")
    if not updates:
        return False

    state_changed = False
    configured_id = str(chat_id).strip().strip("'\"")

    for update in updates:
        uid = update.get("update_id", 0)
        if uid > last_update_id:
            last_update_id = uid
            state["last_update_id"] = last_update_id
            state_changed = True

        msg = update.get("message") or update.get("edited_message") or update.get("channel_post") or {}
        sender_chat_id = str(msg.get("chat", {}).get("id", "")).strip().strip("'\"")
        sender_user_id = str(msg.get("from", {}).get("id", "")).strip().strip("'\"")
        text = str(msg.get("text", "")).strip()

        print(f"[TELEGRAM] Update {uid}: chat={sender_chat_id}, user={sender_user_id}, text='{text}'")

        # Accept commands if either chat ID or user ID matches the configured ID
        if sender_chat_id != configured_id and sender_user_id != configured_id:
            print(f"[TELEGRAM] Ignored update from unauthorized sender (chat: {sender_chat_id}, user: {sender_user_id}, expected: {configured_id})")
            continue

        reply_chat_id = sender_chat_id if sender_chat_id else configured_id
        cmd = text.lower().split()[0].split("@")[0] if text else ""

        if cmd in ("/stop", "/pause", "stop", "pause"):
            state["is_paused"] = True
            state_changed = True
            send_telegram_msg(
                token,
                reply_chat_id,
                "⏸️ *Monitoring Paused*\n\n"
                "The bot has stopped checking BookMyShow.\n"
                "Send /start anytime to resume tracking.",
            )
            print("[COMMAND] /stop received. Monitoring paused.")

        elif cmd in ("/start", "/resume", "start", "resume"):
            state["is_paused"] = False
            state_changed = True
            send_telegram_msg(
                token,
                reply_chat_id,
                "▶️ *Monitoring Resumed*\n\n"
                "The bot is now actively monitoring BookMyShow for new Avengers PCX 3D shows.\n"
                "Send /stop anytime to pause.",
            )
            print("[COMMAND] /start received. Monitoring resumed.")

        elif cmd in ("/status", "status"):
            is_paused = state.get("is_paused", False)
            status_str = "Paused ⏸️" if is_paused else "Active ✅"
            send_telegram_msg(
                token,
                reply_chat_id,
                f"📊 *Tracker Status Report*\n\n"
                f"• Status: *{status_str}*\n"
                f"• Movie: *{MOVIE_NAME}*\n"
                f"• Screen: *PCX / Infinity Vision 3D*\n"
                f"• Venue: *Prasads Multiplex, Hyderabad*\n"
                f"• Active Shows: *{active_shows_count}* currently known\n\n"
                f"Commands:\n"
                f"/stop - Pause monitoring\n"
                f"/start - Resume monitoring\n"
                f"/status - Check status\n"
                f"/help - Commands list",
            )
            print("[COMMAND] /status received. Sent status report.")

        elif cmd in ("/help", "help"):
            send_telegram_msg(
                token,
                reply_chat_id,
                "🤖 *Movie Tracker Bot Commands:*\n\n"
                "/stop - Pause monitoring (stops checks & alerts)\n"
                "/start - Resume active monitoring\n"
                "/status - Check current status & active show count\n"
                "/help - Show this command list",
            )
            print("[COMMAND] /help received. Sent help message.")
        else:
            print(f"[TELEGRAM] Unrecognized text: '{text}'")

    return state_changed

def prune_old_sessions(known_sessions: dict) -> bool:
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
        return True
    return False

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
        res = cffi_requests.get(url, headers=API_HEADERS, timeout=20, impersonate="chrome124", proxies=CFFI_PROXIES)
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

def get_dynamic_trackers(token: str) -> list:
    url = f"https://movie-track-bot.mustardshrek.workers.dev/api/trackers?token={token}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"[DYNAMIC] Notice: Could not fetch dynamic trackers ({e})")
        return []

def sync_dynamic_tracker(token: str, tracker_id: str, known_sessions: list, is_initialized: bool = True):
    url = f"https://movie-track-bot.mustardshrek.workers.dev/api/trackers/sync?token={token}"
    data = json.dumps({
        "trackerId": tracker_id,
        "knownSessions": known_sessions,
        "isInitialized": is_initialized
    }).encode("utf-8")
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
        print(f"[DYNAMIC] Failed to sync tracker {tracker_id}: {e}")
        return False

def fetch_bms_html(url: str, headers: dict) -> tuple[int, str]:
    """Fetch BMS HTML page with browser impersonation, and optional Tier-2 scraping proxy fallback."""
    try:
        # Primary attempt with chrome131
        res = cffi_requests.get(url, headers=headers, timeout=15, impersonate="chrome131", allow_redirects=True)
        if res.status_code == 200 and "window.__INITIAL_STATE__" in res.text:
            return 200, res.text

        # Fallback attempt with safari18_0 if chrome131 gets non-200
        if res.status_code != 200 or "window.__INITIAL_STATE__" not in res.text:
            try:
                res_fallback = cffi_requests.get(url, headers=headers, timeout=15, impersonate="safari18_0", allow_redirects=True)
                if res_fallback.status_code == 200 and "window.__INITIAL_STATE__" in res_fallback.text:
                    return 200, res_fallback.text
            except Exception:
                pass

        if res.status_code != 200:
            print(f"[FETCH] Direct fetch HTTP {res.status_code} for {url}")
    except Exception as e:
        print(f"[FETCH] Direct fetch error for {url}: {e}")

    # Tier-2 Fallback: If SCRAPING_API_KEY is configured in environment
    scraping_key = os.getenv("SCRAPING_API_KEY")
    if scraping_key:
        print(f"[FETCH] Attempting Tier-2 Scraping Proxy for {url}...")
        try:
            proxy_url = f"https://api.scrapingant.com/v2/general?url={urllib.parse.quote(url)}&x-api-key={scraping_key}&browser=false"
            res = cffi_requests.get(proxy_url, timeout=25)
            if res.status_code == 200:
                return 200, res.text
            print(f"[FETCH] Scraping proxy returned HTTP {res.status_code}")
        except Exception as e:
            print(f"[FETCH] Scraping proxy failed: {e}")

    return 0, ""


def sync_city_movies_to_cloudflare(token: str, city_code: str = "HYD"):
    """Catalog sync is now managed twice daily by sync_cinema_catalog.py."""
    return True


def check_single_dynamic_tracker(tracker: dict, token: str) -> bool:
    if tracker.get("isPaused", False):
        print(f"[DYNAMIC] Tracker {tracker.get('id')} ({tracker.get('movieTitle')}) is paused.")
        return False

    chat_id = tracker.get("chatId")
    if not chat_id:
        return False

    city_code = tracker.get("cityCode", "HYD")
    city_slug = tracker.get("citySlug", "hyderabad")
    venue_code = tracker.get("venueCode", "PRHN")
    venue_name = tracker.get("venueName", "Prasads Multiplex")
    movie_title = tracker.get("movieTitle", "Movie")
    screen_filter = tracker.get("filter", "ANY")
    known_sessions = set(str(sid) for sid in tracker.get("knownSessions", []))
    is_initialized = tracker.get("isInitialized")
    if is_initialized is None:
        is_initialized = len(known_sessions) > 0

    print(f"\n[DYNAMIC] 🔍 Checking tracker: {movie_title} in {city_code} ({venue_name}) | Filter: {screen_filter} | Initialized: {is_initialized}")

    venue_slug = slugify(venue_name)
    base_url = f"https://in.bookmyshow.com/cinemas/{city_slug}/{venue_slug}/{venue_code}"

    # Do not manually set User-Agent, sec-ch-ua, or Accept-Encoding!
    # Overriding them causes fingerprint mismatch with curl_cffi TLS on Linux and triggers Cloudflare 403.
    headers = {
        "Referer": "https://in.bookmyshow.com/",
        "x-region-code": city_code,
        "Cookie": f"Rgn=|Code={city_code}|; bms_region={city_code.lower()}; bms_location={city_slug}",
    }


    status, html_content = fetch_bms_html(base_url, headers)
    if status != 200 or not html_content:
        print(f"[DYNAMIC] Notice: Could not fetch cinema page for {venue_name}. Will retry next run.")
        return False

    # Extract React initial state
    try:
        idx = html_content.find("window.__INITIAL_STATE__ = ")
        raw = html_content[idx + 27:]
        data, _ = json.JSONDecoder().raw_decode(raw)
        queries = data.get("venueShowtimesFunctionalApi", {}).get("queries", {})
    except Exception as e:
        print(f"[DYNAMIC] Notice: Failed to decode initial state for {venue_name} ({e}).")
        return False

    first_query_data = None
    first_date_code = None
    for qk, qv in queries.items():
        if "getShowtimesByVenue" in qk:
            first_query_data = qv.get("data", {})
            parts = qk.split("-")
            if len(parts) >= 3:
                first_date_code = parts[-1]
            break

    if not first_query_data:
        print(f"[DYNAMIC] Notice: No showtimes query found in state for {venue_name}.")
        return False

    # Extract all active dates from ShowDatesArray
    dates_array = first_query_data.get("ShowDatesArray", [])
    active_dates = [d.get("DateCode") for d in dates_array if not d.get("isDisabled") and d.get("DateCode")]
    if not active_dates and first_date_code:
        active_dates = [first_date_code]

    matching_sessions = set()
    new_shows = []

    def parse_events(events_list, date_code):
        matched_shows = []
        for ev in events_list:
            ev_title = (ev.get("EventTitle") or "").strip()
            if not match_movie(movie_title, ev_title):
                continue

            childs = ev.get("ChildEvents", []) or []
            for ch in childs:
                dim = (ch.get("EventDimension") or "").strip()
                shows = ch.get("ShowTimes", []) or []
                for sh in shows:
                    session_id = str(sh.get("SessionId", "")).strip()
                    if not session_id:
                        continue
                    show_time = str(sh.get("ShowTime", "")).strip()
                    screen_name = str(sh.get("ScreenName", "")).strip()
                    screen_attr = str(sh.get("Attributes", "") or dim).strip()

                    # Apply screen filter
                    attr_lower = screen_attr.lower()
                    name_lower = screen_name.lower()
                    dim_lower = dim.lower()

                    if screen_filter in ("EXACT", "ALL", "ANY"):
                        pass
                    elif screen_filter == "PCX":
                        is_pcx = (
                            "pcx" in attr_lower or "pcx" in name_lower or "pcx" in dim_lower
                            or "infinity" in attr_lower or "infinity" in name_lower
                            or "screen 1" in name_lower
                            or "imax" in attr_lower or "4dx" in attr_lower
                        )
                        if not is_pcx:
                            continue
                    elif screen_filter == "3D":
                        if "3d" not in attr_lower and "3d" not in name_lower and "3d" not in dim_lower:
                            continue
                    elif screen_filter == "2D":
                        if "3d" in attr_lower or "3d" in name_lower or "3d" in dim_lower:
                            continue

                    matching_sessions.add(session_id)

                    d_str = f"{date_code[:4]}-{date_code[4:6]}-{date_code[6:8]}" if len(date_code) == 8 else date_code
                    booking_url = f"https://in.bookmyshow.com/cinemas/{city_slug}/{venue_slug}/buytickets/{venue_code}/{date_code}"

                    if session_id not in known_sessions:
                        matched_shows.append({
                            "sessionId": session_id,
                            "date": d_str,
                            "time": show_time,
                            "screen": screen_attr or screen_name or "Standard",
                            "venue": venue_name,
                            "url": booking_url,
                            "movieTitle": ev_title,
                        })
        return matched_shows

    # 1. Parse initial day (already in memory, zero extra HTTP calls)
    events_first = first_query_data.get("showDetailsTransformed", {}).get("Event", [])
    new_shows.extend(parse_events(events_first, first_date_code or active_dates[0]))

    # 2. Parse subsequent active upcoming dates
    for date_code in active_dates:
        if date_code == first_date_code:
            continue
        date_url = f"{base_url}/{date_code}"
        d_status, d_html = fetch_bms_html(date_url, headers)
        if d_status == 200 and d_html:
            try:
                idx = d_html.find("window.__INITIAL_STATE__ = ")
                raw = d_html[idx + 27:]
                d_data, _ = json.JSONDecoder().raw_decode(raw)
                d_queries = d_data.get("venueShowtimesFunctionalApi", {}).get("queries", {})
                for qk, qv in d_queries.items():
                    if f"getShowtimesByVenue-{venue_code}-{date_code}" in qk or "getShowtimesByVenue" in qk:
                        d_events = qv.get("data", {}).get("showDetailsTransformed", {}).get("Event", [])
                        new_shows.extend(parse_events(d_events, date_code))
                        break
            except Exception as e:
                print(f"[DYNAMIC] Notice: Could not parse date {date_code} for {venue_name} ({e})")

    # Silent baseline capture on first scan:
    if not is_initialized:
        print(f"[DYNAMIC] 🎯 Initializing baseline for {movie_title}: recorded {len(matching_sessions)} existing shows across {len(active_dates)} date(s) (silent baseline, no false alarm).")
        sync_dynamic_tracker(token, tracker["id"], list(matching_sessions), is_initialized=True)
        return False

    if new_shows:
        is_first_drop = len(known_sessions) == 0
        header_title = "🚨 *SHOWS OPEN ON BOOKMYSHOW!* 🚨" if is_first_drop else "🚨 *NEW SHOWS ADDED ON BOOKMYSHOW!* 🚨"
        print(f"[DYNAMIC] 🚨 Found {len(new_shows)} new show(s) for {movie_title} across {len(active_dates)} active date(s) (first_drop={is_first_drop})!")

        # Sort new shows chronologically
        new_shows.sort(key=lambda s: (s.get("date", ""), s.get("time", "")))

        alert_lines = []
        for s in new_shows[:10]:
            alert_lines.append(f"• *{s['date']}* at *{s['time']}* ({s['screen']})\n  📍 {s['venue']}")

        if len(new_shows) > 10:
            alert_lines.append(f"_...and {len(new_shows) - 10} more show(s)_")

        alert_text = (
            f"{header_title}\n\n"
            f"🎬 *{movie_title}*\n\n"
            + "\n\n".join(alert_lines) + "\n\n"
            f"🎟️ [Book Instantly on BookMyShow]({new_shows[0]['url']})\n\n"
            f"⚡ _Alert sent autonomously by your 24/7 Movie Tracker_"
        )

        send_telegram_msg(token, chat_id, alert_text)
        updated_known = list(known_sessions.union({s["sessionId"] for s in new_shows}))
        sync_dynamic_tracker(token, tracker["id"], updated_known, is_initialized=True)
        return True

    print(f"[DYNAMIC] No new shows for {movie_title} ({len(matching_sessions)} active matching shows across {len(active_dates)} date(s)).")
    return False

def main():
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")

    # Step 0: Scan Dynamic Trackers configured via Telegram in Cloudflare KV
    dynamic_new_found = False
    if token:
        dynamic_trackers = get_dynamic_trackers(token)
        if dynamic_trackers:
            print(f"[{datetime.datetime.now()}] Found {len(dynamic_trackers)} dynamic tracker(s) in Cloudflare KV.")
            active_cities = set()
            for trk in dynamic_trackers:
                active_cities.add(trk.get("cityCode", "HYD"))
                if check_single_dynamic_tracker(trk, token):
                    dynamic_new_found = True
            for c in active_cities:
                sync_city_movies_to_cloudflare(token, c)

            print(f"[{datetime.datetime.now()}] Successfully completed scan of {len(dynamic_trackers)} dynamic tracker(s).")
            set_output("available", "true")
            set_output("new_shows_found", "true" if dynamic_new_found else "false")
            set_output("check_failed", "false")
            return
        else:
            sync_city_movies_to_cloudflare(token, "HYD")

    print(f"[{datetime.datetime.now()}] No dynamic trackers found. Running fallback monitor for '{MOVIE_NAME}' (PCX 3D) at {VENUE}...")

    state = load_state()
    known_sessions = state.setdefault("known_sessions", {})
    is_initial_seeding = len(known_sessions) == 0

    # Step 1: Check if monitoring is paused
    if state.get("is_paused", False):
        print(f"\n⏸️ Monitoring is currently PAUSED via Telegram command.")
        print("Send /start in your Telegram bot chat to resume monitoring.")
        with open("matches.txt", "w", encoding="utf-8") as out:
            out.write("")
        set_output("available", "false")
        set_output("new_shows_found", "false")
        set_output("check_failed", "false")
        return

    # Step 2: Run showtimes check for fallback
    total_checks = int(os.getenv("POLL_CHECKS", "1"))
    poll_interval_seconds = 60
    new_shows_found = False

    for attempt in range(1, total_checks + 1):
        if total_checks > 1:
            print(f"\n--- Poll Check {attempt}/{total_checks} at {datetime.datetime.now().strftime('%H:%M:%S')} ---")

        all_active_shows, new_shows, dates_count = check_shows_once(known_sessions)

        if not dates_count and not all_active_shows:
            print("Notice: Could not query BookMyShow API for any active dates on this attempt.")
            if attempt < total_checks:
                time.sleep(poll_interval_seconds)
                continue
            else:
                set_output("available", "false")
                set_output("new_shows_found", "false")
                set_output("check_failed", "false")
                return

        if is_initial_seeding:
            for s in all_active_shows:
                known_sessions[s["sessionId"]] = {
                    "date": s["date"],
                    "time": s["time"],
                    "screen": s["screen"],
                    "first_seen": datetime.datetime.now().isoformat(),
                }
            save_state(state)
            commit_and_push_state("chore: seed initial shows baseline [skip ci]")
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
            break

        print(f"Check {attempt}/{total_checks}: No new shows. ({len(all_active_shows)} active shows currently running).")

        if attempt < total_checks:
            time.sleep(poll_interval_seconds)

    if not new_shows_found:
        if prune_old_sessions(known_sessions):
            save_state(state)
            commit_and_push_state("chore: prune expired shows from state [skip ci]")
        with open("matches.txt", "w", encoding="utf-8") as out:
            out.write("")
        set_output("available", "true" if all_active_shows else "false")
        set_output("new_shows_found", "false")
        set_output("check_failed", "false")

if __name__ == "__main__":
    main()
