import os
import subprocess
import sys
import urllib.parse
import urllib.request

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

token = os.environ.get("TELEGRAM_BOT_TOKEN")
chat_id = os.environ.get("TELEGRAM_CHAT_ID")

if not token or not chat_id:
    print("Warning: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set; skipping notification.")
    raise SystemExit(0)

if not os.path.exists("matches.txt"):
    print("No matches.txt file found; skipping.")
    raise SystemExit(0)

with open("matches.txt", "r", encoding="utf-8") as file:
    details = file.read().strip()

if not details:
    print("matches.txt is empty (no new shows); skipping notification.")
    raise SystemExit(0)

header = (
    "🚨 *New Show Added on BookMyShow!* 🚨\n\n"
    "*Avengers: Endgame - Encore* (PCX 3D)\n"
    "Prasads Multiplex, Hyderabad\n\n"
)

full_message = header + details

# Split message if exceeding Telegram limit of 4096 characters
max_chunk_size = 3800
chunks = []
current_chunk = ""

for block in full_message.split("\n\n"):
    if len(current_chunk) + len(block) + 2 > max_chunk_size:
        if current_chunk:
            chunks.append(current_chunk.strip())
        current_chunk = block + "\n\n"
    else:
        current_chunk += block + "\n\n"

if current_chunk.strip():
    chunks.append(current_chunk.strip())

for idx, chunk in enumerate(chunks, 1):
    part_suffix = f"\n\n(Part {idx}/{len(chunks)})" if len(chunks) > 1 else ""
    data = urllib.parse.urlencode({
        "chat_id": chat_id,
        "text": chunk + part_suffix,
        "disable_web_page_preview": "true",
    }).encode("utf-8")

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    request = urllib.request.Request(url, data=data, method="POST")

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            result = response.read().decode("utf-8", "ignore")
            print(f"Telegram chunk {idx}/{len(chunks)} sent successfully.")
    except Exception as exc:
        print(f"Failed to send Telegram chunk {idx}: {exc}")
        raise

# In GitHub Actions, commit and push updated state file
state_file = ".github/bms-pcx-state.json"
if os.getenv("GITHUB_ACTIONS") and os.path.exists(state_file):
    subprocess.run(["git", "config", "user.name", "github-actions[bot]"], check=True)
    subprocess.run(
        ["git", "config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com"],
        check=True,
    )
    subprocess.run(["git", "add", state_file], check=True)

    commit = subprocess.run(
        ["git", "commit", "-m", "chore: update known shows state [skip ci]"],
        capture_output=True,
        text=True,
    )

    if commit.returncode == 0:
        subprocess.run(["git", "pull", "--rebase", "origin", "main"], check=False)
        subprocess.run(["git", "push", "origin", "HEAD:main"], check=True)
        print("Updated state committed and pushed to git.")
