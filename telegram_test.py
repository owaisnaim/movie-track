import os
import sys
import urllib.parse
import urllib.request

token = os.environ.get("TELEGRAM_BOT_TOKEN")
chat_id = os.environ.get("TELEGRAM_CHAT_ID")

if not token or not chat_id:
    print("Error: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID environment variables must be set.", file=sys.stderr)
    raise SystemExit(1)

message = (
    "Telegram test successful.\n\n"
    "Your Avengers: Endgame PCX monitor can send alerts to this chat."
)

data = urllib.parse.urlencode({
    "chat_id": chat_id,
    "text": message,
}).encode("utf-8")

url = f"https://api.telegram.org/bot{token}/sendMessage"
request = urllib.request.Request(url, data=data, method="POST")

with urllib.request.urlopen(request, timeout=30) as response:
    print(response.read().decode("utf-8", "ignore"))
