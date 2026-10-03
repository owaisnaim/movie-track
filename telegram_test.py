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
    "🤖 *Movie Ticket Tracker — Test Notification*\n\n"
    "✅ *Telegram Integration Verified!*\n\n"
    "• *System Status:* 🟢 Online & Monitoring\n"
    "• *Engine:* Autonomous 24/7 BookMyShow Scraper\n"
    "• *Capabilities:* Instant drop alerts for upcoming & currently listed shows\n"
    "• *Notification Mode:* Real-time with direct booking links\n\n"
    "⚡ _This confirms your GitHub Actions workflow is fully connected and ready to dispatch alerts._"
)

data = urllib.parse.urlencode({
    "chat_id": chat_id,
    "text": message,
    "parse_mode": "Markdown",
}).encode("utf-8")

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Content-Type": "application/x-www-form-urlencoded",
}

url = f"https://api.telegram.org/bot{token}/sendMessage"
request = urllib.request.Request(url, data=data, headers=headers, method="POST")

try:
    with urllib.request.urlopen(request, timeout=30) as response:
        print(response.read().decode("utf-8", "ignore"))
        print("\n✅ Test message sent successfully!")
except Exception as e:
    print(f"Failed to send Telegram test message: {e}", file=sys.stderr)
    raise SystemExit(1)
