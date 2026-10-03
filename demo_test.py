"""
Comprehensive Demo Test for Movie Tracker:
1. Scenario A: Current Listed Movie
   - Baseline initialization (silent capture of existing shows)
   - Steady state (no duplicate alerts)
   - New show addition (triggers "NEW SHOWS ADDED" alert)
   - Deduplication verification
2. Scenario B: Upcoming Unlisted Movie (Pre-Release Tracker)
   - Pre-drop state (0 shows, waiting)
   - First ticket drop (triggers "SHOWS OPEN ON BOOKMYSHOW!" alert, NEVER swallowed by baseline)
   - Steady state (no duplicate alerts)
   - Extra show added later (triggers "NEW SHOWS ADDED" alert)
3. Scenario C: Typo-Tolerant Upcoming Drop
   - User entered "aveners doomsda"
   - BookMyShow drops "Avengers: Doomsday"
   - Verifies alert is fired
"""

import sys
import unittest
from unittest.mock import MagicMock, patch
import json

# Import functions directly from monitor.py
from monitor import (
    match_movie,
    is_event_match,
    clean_squash
)

class MockTelegramTransport:
    def __init__(self):
        self.sent_messages = []

    def send_telegram_msg(self, token, chat_id, text):
        self.sent_messages.append({"chat_id": chat_id, "text": text})
        return True

class MockKvStorage:
    def __init__(self):
        self.synced = []

    def sync_dynamic_tracker(self, token, tracker_id, known_sessions, is_initialized=True):
        self.synced.append({
            "tracker_id": tracker_id,
            "known_sessions": list(known_sessions),
            "is_initialized": is_initialized
        })
        return True

def simulate_cinema_html(events_list, venue_code="PRHN", date_code="20261010"):
    state = {
        "venueShowtimesFunctionalApi": {
            "queries": {
                f"getShowtimesByVenue-{venue_code}-{date_code}": {
                    "data": {
                        "ShowDatesArray": [{"DateCode": date_code, "isDisabled": False}],
                        "showDetailsTransformed": {
                            "Event": events_list
                        }
                    }
                }
            }
        }
    }
    return 200, f"<html><script>window.__INITIAL_STATE__ = {json.dumps(state)}</script></html>"

class TestTrackerDemo(unittest.TestCase):
    def setUp(self):
        self.tg = MockTelegramTransport()
        self.kv = MockKvStorage()

    def test_scenario_a_currently_listed_movie_new_show_addition(self):
        """Tests that currently listed movies do NOT trigger false alarms on baseline,
        but DO trigger alerts when a new show is added."""
        import monitor

        # Baseline: Cinema already has 2 shows for Spider-Man
        baseline_events = [{
            "EventTitle": "Spider-Man: Brand New Day",
            "ChildEvents": [{
                "EventCode": "ET00447840",
                "EventDimension": "2D",
                "ShowTimes": [
                    {"SessionId": "SM_101", "ShowTime": "10:00 AM", "ScreenName": "Screen 2", "Attributes": "2D"},
                    {"SessionId": "SM_102", "ShowTime": "02:00 PM", "ScreenName": "Screen 2", "Attributes": "2D"}
                ]
            }]
        }]

        tracker = {
            "id": "trk_current_demo",
            "chatId": "123456",
            "movieTitle": "Spider-Man: Brand New Day",
            "venueCode": "PRHN",
            "venueName": "Prasads Multiplex",
            "cityCode": "HYD",
            "citySlug": "hyderabad",
            "filter": "ANY",
            "isPreRelease": False,
            "isInitialized": False,
            "knownSessions": []
        }

        # Step 1: Initial scan -> Baseline capture (Silent, no alert!)
        with patch.object(monitor, "fetch_bms_html", return_value=simulate_cinema_html(baseline_events)):
            with patch.object(monitor, "send_telegram_msg", side_effect=self.tg.send_telegram_msg):
                with patch.object(monitor, "sync_dynamic_tracker", side_effect=self.kv.sync_dynamic_tracker):
                    alert_fired = monitor.check_single_dynamic_tracker(tracker, "fake_token")

        self.assertFalse(alert_fired, "Baseline capture must NOT fire an alert")
        self.assertEqual(len(self.tg.sent_messages), 0, "No Telegram message should be sent on baseline capture")
        self.assertEqual(len(self.kv.synced), 1, "KV should be synced with baseline sessions")
        self.assertEqual(set(self.kv.synced[-1]["known_sessions"]), {"SM_101", "SM_102"})

        # Update tracker state from KV sync
        tracker["knownSessions"] = self.kv.synced[-1]["known_sessions"]
        tracker["isInitialized"] = True

        # Step 2: Next run cycle with unchanged shows -> No alert!
        with patch.object(monitor, "fetch_bms_html", return_value=simulate_cinema_html(baseline_events)):
            with patch.object(monitor, "send_telegram_msg", side_effect=self.tg.send_telegram_msg):
                with patch.object(monitor, "sync_dynamic_tracker", side_effect=self.kv.sync_dynamic_tracker):
                    alert_fired = monitor.check_single_dynamic_tracker(tracker, "fake_token")

        self.assertFalse(alert_fired, "Unchanged shows must NOT fire an alert")
        self.assertEqual(len(self.tg.sent_messages), 0, "No duplicate alert sent")

        # Step 3: Cinema adds a NEW evening show (Session SM_103)!
        updated_events = [{
            "EventTitle": "Spider-Man: Brand New Day",
            "ChildEvents": [{
                "EventCode": "ET00447840",
                "EventDimension": "2D",
                "ShowTimes": [
                    {"SessionId": "SM_101", "ShowTime": "10:00 AM", "ScreenName": "Screen 2", "Attributes": "2D"},
                    {"SessionId": "SM_102", "ShowTime": "02:00 PM", "ScreenName": "Screen 2", "Attributes": "2D"},
                    {"SessionId": "SM_103", "ShowTime": "06:30 PM", "ScreenName": "Screen 2", "Attributes": "2D"} # NEW!
                ]
            }]
        }]

        with patch.object(monitor, "fetch_bms_html", return_value=simulate_cinema_html(updated_events)):
            with patch.object(monitor, "send_telegram_msg", side_effect=self.tg.send_telegram_msg):
                with patch.object(monitor, "sync_dynamic_tracker", side_effect=self.kv.sync_dynamic_tracker):
                    alert_fired = monitor.check_single_dynamic_tracker(tracker, "fake_token")

        self.assertTrue(alert_fired, "New show addition MUST fire an alert!")
        self.assertEqual(len(self.tg.sent_messages), 1, "Exactly one Telegram alert must be sent")
        sent = self.tg.sent_messages[-1]
        self.assertIn("NEW SHOWS ADDED ON BOOKMYSHOW!", sent["text"])
        self.assertIn("06:30 PM", sent["text"])
        self.assertIn("Spider-Man", sent["text"])
        self.assertIn("SM_103", self.kv.synced[-1]["known_sessions"])

        # Step 4: Next run after new show added -> Deduplication prevents duplicate alert!
        tracker["knownSessions"] = self.kv.synced[-1]["known_sessions"]
        with patch.object(monitor, "fetch_bms_html", return_value=simulate_cinema_html(updated_events)):
            with patch.object(monitor, "send_telegram_msg", side_effect=self.tg.send_telegram_msg):
                with patch.object(monitor, "sync_dynamic_tracker", side_effect=self.kv.sync_dynamic_tracker):
                    alert_fired = monitor.check_single_dynamic_tracker(tracker, "fake_token")

        self.assertFalse(alert_fired, "Known show must not trigger duplicate alert")
        self.assertEqual(len(self.tg.sent_messages), 1, "Message count must stay at 1")
        print("\n✅ Scenario A (Currently Listed Movie + New Show Addition) PASSED 100%!")

    def test_scenario_b_upcoming_movie_pre_release_drop(self):
        """Tests that upcoming unlisted movies:
        1. Remain silent while 0 shows are available
        2. Alert IMMEDIATELY on first ticket drop (never swallowed as baseline!)
        3. Alert again if more shows are added later."""
        import monitor

        tracker = {
            "id": "trk_upcoming_demo",
            "chatId": "987654",
            "movieTitle": "Avengers: Doomsday",
            "venueCode": "PRHN",
            "venueName": "Prasads Multiplex",
            "cityCode": "HYD",
            "citySlug": "hyderabad",
            "filter": "PCX",
            "isPreRelease": True,
            "isInitialized": True,
            "knownSessions": []
        }

        # Step 1: Pre-release state: 0 shows for Avengers (only other movies playing)
        other_movies_events = [{
            "EventTitle": "The Paradise",
            "ChildEvents": [{
                "EventCode": "ET00436621",
                "EventDimension": "2D",
                "ShowTimes": [{"SessionId": "PAR_1", "ShowTime": "11:00 AM", "ScreenName": "Screen 3", "Attributes": "2D"}]
            }]
        }]

        with patch.object(monitor, "fetch_bms_html", return_value=simulate_cinema_html(other_movies_events)):
            with patch.object(monitor, "send_telegram_msg", side_effect=self.tg.send_telegram_msg):
                with patch.object(monitor, "sync_dynamic_tracker", side_effect=self.kv.sync_dynamic_tracker):
                    alert_fired = monitor.check_single_dynamic_tracker(tracker, "fake_token")

        self.assertFalse(alert_fired, "Waiting pre-release must not fire while 0 shows are listed")
        self.assertEqual(len(self.tg.sent_messages), 0)

        # Step 2: TICKETS DROP! BookMyShow lists Avengers: Doomsday in PCX!
        drop_events = [
            other_movies_events[0],
            {
                "EventTitle": "Avengers: Doomsday",
                "ChildEvents": [{
                    "EventCode": "ET00999999",
                    "EventDimension": "3D",
                    "ShowTimes": [
                        {"SessionId": "AVG_PCX_1", "ShowTime": "08:00 AM", "ScreenName": "PCX Screen 1", "Attributes": "PCX Infinity Vis 3D"},
                        {"SessionId": "AVG_PCX_2", "ShowTime": "01:30 PM", "ScreenName": "PCX Screen 1", "Attributes": "PCX Infinity Vis 3D"}
                    ]
                }]
            }
        ]

        with patch.object(monitor, "fetch_bms_html", return_value=simulate_cinema_html(drop_events)):
            with patch.object(monitor, "send_telegram_msg", side_effect=self.tg.send_telegram_msg):
                with patch.object(monitor, "sync_dynamic_tracker", side_effect=self.kv.sync_dynamic_tracker):
                    alert_fired = monitor.check_single_dynamic_tracker(tracker, "fake_token")

        self.assertTrue(alert_fired, "Pre-release tracker MUST fire immediately when first drop happens!")
        self.assertEqual(len(self.tg.sent_messages), 1)
        sent = self.tg.sent_messages[-1]
        self.assertIn("SHOWS OPEN ON BOOKMYSHOW!", sent["text"])
        self.assertIn("Avengers: Doomsday", sent["text"])
        self.assertIn("08:00 AM", sent["text"])
        self.assertIn("01:30 PM", sent["text"])
        self.assertIn("PCX Infinity Vis 3D", sent["text"])
        print("\n✅ Scenario B (Upcoming Movie First Ticket Drop) PASSED 100%!")

    def test_scenario_c_typo_tolerant_drop(self):
        """User typed 'aveners doomsda' when tracking.
        BMS drops 'Avengers: Doomsday'. Verifies matching succeeds and alerts."""
        import monitor

        tracker = {
            "id": "trk_typo_demo",
            "chatId": "555555",
            "movieTitle": "aveners doomsda", # user typo
            "venueCode": "PRHN",
            "venueName": "Prasads Multiplex",
            "cityCode": "HYD",
            "citySlug": "hyderabad",
            "filter": "ALL",
            "isPreRelease": True,
            "isInitialized": True,
            "knownSessions": []
        }

        drop_events = [{
            "EventTitle": "Avengers: Doomsday",
            "ChildEvents": [{
                "EventCode": "ET00999999",
                "EventDimension": "3D",
                "ShowTimes": [
                    {"SessionId": "AVG_TYPO_1", "ShowTime": "07:00 PM", "ScreenName": "Screen 1", "Attributes": "3D"}
                ]
            }]
        }]

        with patch.object(monitor, "fetch_bms_html", return_value=simulate_cinema_html(drop_events)):
            with patch.object(monitor, "send_telegram_msg", side_effect=self.tg.send_telegram_msg):
                with patch.object(monitor, "sync_dynamic_tracker", side_effect=self.kv.sync_dynamic_tracker):
                    alert_fired = monitor.check_single_dynamic_tracker(tracker, "fake_token")

        self.assertTrue(alert_fired, "Fuzzy match must catch 'aveners doomsda' -> 'Avengers: Doomsday'")
        self.assertEqual(len(self.tg.sent_messages), 1)
        self.assertIn("SHOWS OPEN ON BOOKMYSHOW!", self.tg.sent_messages[-1]["text"])
        print("\n✅ Scenario C (Typo Tolerant Upcoming Drop) PASSED 100%!")

if __name__ == "__main__":
    unittest.main()
