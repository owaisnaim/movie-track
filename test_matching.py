import unittest
from monitor import match_movie, is_event_match, clean_squash

class TestMovieMatching(unittest.TestCase):
    def test_clean_squash(self):
        self.assertEqual(clean_squash("Avengers : Dooms Day"), "avengersdoomsday")
        self.assertEqual(clean_squash("Avengers: Doomsday (3D)"), "avengersdoomsday")
        self.assertEqual(clean_squash("Spider-Man: Brand New Day"), "spidermanbrandnewday")
        self.assertEqual(clean_squash("Top Gun: Maverick (IMAX)"), "topgunmaverick")

    def test_user_variations(self):
        # 1. User typed 'Avengers : Dooms Day'
        self.assertTrue(match_movie("Avengers : Dooms Day", "Avengers: Doomsday (3D)"))
        self.assertTrue(match_movie("Avengers Dooms Day", "Avengers: Doomsday (IMAX 3D)"))
        self.assertTrue(match_movie("Avengers Doomsday Single", "Avengers: Doomsday"))

        # 2. Typos handled via fuzzy matching
        self.assertTrue(match_movie("aveners doomsda", "Avengers: Doomsday (3D)"))
        self.assertTrue(match_movie("avenger doomsday", "Avengers: Doomsday"))

        # 3. Sequel distinction (avoid false positives)
        self.assertFalse(match_movie("Avatar 3", "Avatar: The Way of Water"))
        self.assertTrue(match_movie("Avatar 3", "Avatar 3: Fire and Ash"))
        self.assertFalse(match_movie("aveners doomsda", "Avatar: The Way of Water"))
        self.assertFalse(match_movie("aveners doomsda", "Captain America: Brave New World"))

    def test_is_event_match(self):
        ev_sample = {
            "EventTitle": "Avengers: Doomsday",
            "EventGroup": "EG00999999",
            "ChildEvents": [
                {
                    "EventCode": "ET00599999",
                    "EventName": "Avengers: Doomsday - Hindi",
                    "EventDimension": "3D",
                    "EventLanguage": "Hindi",
                },
                {
                    "EventCode": "ET00599998",
                    "EventName": "Avengers: Doomsday - English",
                    "EventDimension": "IMAX 3D",
                    "EventLanguage": "English",
                }
            ]
        }

        # Exact EventCode match
        self.assertTrue(is_event_match(ev_sample, "", "ET00599999"))
        self.assertTrue(is_event_match(ev_sample, "", "ET00599998"))
        self.assertFalse(is_event_match(ev_sample, "", "ET00000000"))

        # User title match (standard)
        self.assertTrue(is_event_match(ev_sample, "Avengers: Doomsday"))
        # User title match (spaced / compound)
        self.assertTrue(is_event_match(ev_sample, "Avengers : Dooms Day"))
        # User title match (with typos)
        self.assertTrue(is_event_match(ev_sample, "aveners doomsda"))
        # Suffix / single match
        self.assertTrue(is_event_match(ev_sample, "Avengers Doomsday Single"))

if __name__ == "__main__":
    unittest.main()
