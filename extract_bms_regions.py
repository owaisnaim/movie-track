"""
Extract all 2,000+ official Indian regions and cities from BookMyShow's GETREGIONS endpoint.
Outputs a clean, lightweight dictionary to data/all_cities.json.
"""

import json
import os
import re
import sys
from curl_cffi import requests

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
OUTPUT_FILE = os.path.join(DATA_DIR, "all_cities.json")

def extract_regions():
    print("[1/3] Fetching official GETREGIONS from BookMyShow...")
    url = "https://in.bookmyshow.com/serv/getData?cmd=GETREGIONS"
    res = requests.get(url, impersonate="chrome131", timeout=15)
    if res.status_code != 200:
        print(f"Failed to fetch GETREGIONS: HTTP {res.status_code}")
        sys.exit(1)
        
    text = res.text
    print(f"Downloaded {len(text)} bytes.")

    print("[2/3] Parsing regionlst and regionalias...")
    m = re.search(r'var\s+regionlst\s*=\s*(\{.+?\});var\s+', text)
    if not m:
        print("Could not locate var regionlst in response!")
        sys.exit(1)

    raw_regions = json.loads(m.group(1))
    print(f"Found {len(raw_regions)} region keys in BookMyShow.")

    cleaned_regions = {}
    for code, entries in raw_regions.items():
        if not entries or not isinstance(entries, list):
            continue
        entry = entries[0]
        c_code = entry.get("code") or code
        c_name = entry.get("name") or c_code
        c_slug = entry.get("slug") or c_name.lower().replace(" ", "-")
        c_lat = str(entry.get("lat") or "")
        c_lon = str(entry.get("long") or "")

        cleaned_regions[c_code] = {
            "code": c_code,
            "name": c_name,
            "slug": c_slug,
            "lat": c_lat,
            "lon": c_lon
        }

    print(f"[3/3] Processed {len(cleaned_regions)} normalized cities.")
    
    # Check Raebareli
    if "RAEB" in cleaned_regions:
        print(f"Verification: Found RAEB -> {cleaned_regions['RAEB']}")
    else:
        print("Warning: RAEB not found in cleaned regions!")

    os.makedirs(DATA_DIR, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(cleaned_regions, f, separators=(",", ":"), ensure_ascii=False)

    size_kb = os.path.getsize(OUTPUT_FILE) / 1024
    print(f"Successfully saved {len(cleaned_regions)} cities to {OUTPUT_FILE} ({size_kb:.1f} KB).")

if __name__ == "__main__":
    extract_regions()
