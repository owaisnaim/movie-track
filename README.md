# 🎬 Movie Track — Autonomous 24/7 BookMyShow Ticket Tracker

[![GitHub Actions Workflow](https://img.shields.io/github/actions/workflow/status/owaisnaim/movie-track/movie-tracker.yml?branch=main&label=Ticket%20Monitor&style=flat-square)](https://github.com/owaisnaim/movie-track/actions/workflows/movie-tracker.yml)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers%20%2B%20KV-orange?style=flat-square&logo=cloudflare)](https://workers.cloudflare.com/)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue?style=flat-square&logo=python)](https://python.org)
[![Telegram Bot API](https://img.shields.io/badge/Telegram-Bot%20API-2CA5E0?style=flat-square&logo=telegram)](https://core.telegram.org/bots/api)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

An autonomous, 100% free-tier, 24/7 movie ticket tracking and alert system for **BookMyShow**. Built with an interactive **Telegram Bot**, **Cloudflare Workers + KV**, and **GitHub Actions**.

Never miss opening day or premium format bookings (PCX, IMAX, 3D, 2D) again. Configure tracking for any cinema hall in seconds directly within Telegram, and receive immediate alerts the instant new tickets drop.

---

## 📑 Table of Contents
- [Architecture Overview](#-architecture-overview)
- [Key Features](#-key-features)
- [How It Works](#-how-it-works)
- [Telegram Bot Commands](#-telegram-bot-commands)
- [Interactive Bot Walkthrough](#-interactive-bot-walkthrough)
- [Setup & Deployment Guide](#-setup--deployment-guide)
  - [1. Telegram Bot Token](#1-create-your-telegram-bot)
  - [2. Cloudflare Worker & KV](#2-deploy-the-cloudflare-worker)
  - [3. Register Telegram Webhook](#3-register-telegram-webhook)
  - [4. GitHub Secrets & Workflow](#4-configure-github-repository-secrets)
- [Local Development & Testing](#-local-development--testing)
- [Project Structure](#-project-structure)
- [License](#-license)

---

## 🏛️ Architecture Overview

The system is designed with a high-performance **two-tier architecture**:

```
+--------------------------------------------------------------------------------+
|                               TELEGRAM MESSENGER                               |
|   • User interacts via fast inline keyboards & buttons                         |
|   • Direct booking links delivered with instant alerts                         |
+---------------------------------------+----------------------------------------+
                                        | (Webhook: < 50ms)
                                        v
+--------------------------------------------------------------------------------+
|                        CLOUDFLARE WORKER + KV (Front Office)                   |
|   • Handles Telegram Webhook without server costs                              |
|   • Manages interactive 4-step wizard: City -> Cinema -> Movie -> Screen      |
|   • Stores active user trackers in Cloudflare KV (TRACKER_DB)                  |
|   • Exposes authenticated endpoints: /api/trackers & /api/trackers/sync        |
+---------------------------------------+----------------------------------------+
                                        |
                         (Every 5 Mins Background Poll)
                                        |
                                        v
+--------------------------------------------------------------------------------+
|                          GITHUB ACTIONS (Engine Room)                          |
|   • Scheduled runner (`movie-tracker.yml`) executing on Ubuntu                 |
|   • Bypasses BookMyShow Cloudflare WAF using `curl_cffi` (Chrome 124 TLS)      |
|   • Pulls active trackers from Cloudflare KV                                   |
|   • Detects new show sessions (ignoring pre-existing baseline)                 |
|   • Dispatches Telegram notifications to tracker owners                        |
|   • Syncs newly seen session IDs to KV to eliminate duplicate spam             |
+--------------------------------------------------------------------------------+
```

---

## ✨ Key Features

- **24/7 Autonomous Tracking**: Runs continuously in the background at zero cost using GitHub Actions and Cloudflare Workers.
- **WAF & Anti-Bot Bypass**: Utilizes `curl_cffi` with full Chrome 124 TLS fingerprint impersonation (JA3/JA4) to seamlessly query BookMyShow's protected endpoints without triggering HTTP 403 or 429 rate limits.
- **640+ Cinema Halls Pre-Mapped**: Comprehensive database spanning top metros and cities:
  - **Kanpur, Lucknow, Hyderabad, Mumbai, NCR (Delhi/Gurgaon/Noida), Bengaluru, Pune, Kolkata**, and more.
- **Language & Screen Format Separation**:
  - Explicit badges for **English**, **Hindi**, and regional languages across 3D and 2D formats.
  - Option to **Track Both English & Hindi Shows** simultaneously.
  - Granular screen filters: **PCX**, **IMAX**, **Screen 1**, **3D Only**, **2D Only**, or **All Screens**.
- **No False Alarms / Baseline Seeding**: On initial tracker setup, currently available shows are seeded as the baseline. Alerts are only fired when a **new** showtime is released.
- **Session Deduplication**: Once alerted, session IDs are synchronized with Cloudflare KV so you are notified only once per showtime.
- **Multi-Tenant Ready**: Independent users can track different cinemas and movies simultaneously; alerts route to each user's specific Telegram `chat_id`.

---

## ⚡ How It Works

1. **User Configuration**: Send `/track` in Telegram. Choose your city, select your cinema hall, pick the movie & language format, and select your preferred screen type.
2. **Instant Persistence**: The Cloudflare Worker saves your tracker into Cloudflare KV (`TRACKER_DB`).
3. **Background Scanning**: Every 5 minutes, GitHub Actions runs `monitor.py`:
   - Fetches active trackers from Cloudflare KV via `GET /api/trackers?token=...`.
   - Resolves target coordinates and query headers for each city.
   - Queries BookMyShow's showtimes API for the requested cinema and movie.
   - Applies screen format filters (PCX, 3D, 2D, etc.).
4. **Instant Alerts**: If a newly added session ID is found:
   - Dispatches a Telegram notification containing the show date, time, screen name, venue, and a one-click BookMyShow direct booking URL.
   - Syncs the new session IDs back to Cloudflare KV via `POST /api/trackers/sync?token=...`.

---

## 🤖 Telegram Bot Commands

| Command | Description |
| :--- | :--- |
| `/track` | Launch the interactive 4-step wizard to track a new movie/cinema |
| `/mytrackers` | List all your currently active trackers with quick actions |
| `/pause` | Temporarily pause tracking (stops background checks) |
| `/resume` | Resume paused tracking |
| `/delete` | Remove a tracker from your account and Cloudflare KV |
| `/status` | View bot status, active tracker counts, and system diagnostics |
| `/help` | Display command usage and quick guide |

---

## 📱 Interactive Bot Walkthrough

```text
Step 1: Choose City
[ Kanpur ]  [ Lucknow ]  [ Hyderabad ]  [ Mumbai ]  [ NCR (Delhi) ]  [ Bengaluru ]

Step 2: Choose Cinema Hall
[ INOX: Z Square, Bada Chauraha ]  [ PVR: Deep, Kanpur ]  [ Miraj: Gurudev ] ...

Step 3: Choose Movie & Language
[ 🎬 Avengers Endgame: Encore (English 3D) ]
[ 🎬 Avengers Endgame: Encore (Hindi 2D) ]
[ 🌐 Track Both English & Hindi Shows ]

Step 4: Choose Screen Filter
[ All Screens ]  [ PCX / Large Screen Only ]  [ 3D Only ]  [ 2D Only ]

✅ Confirmation:
"Tracker activated for Avengers Endgame: Encore (English 3D) at INOX: Z Square, Kanpur. Monitoring 24/7!"
```

---

## 🚀 Setup & Deployment Guide

### 1. Create Your Telegram Bot
1. Open Telegram and search for `@BotFather`.
2. Send `/newbot`, choose a name and username (e.g., `my_movie_track_bot`).
3. Copy the HTTP API **Bot Token** (`TELEGRAM_BOT_TOKEN`).
4. Start a conversation with your newly created bot by clicking `/start`.
5. Retrieve your Telegram User ID (`TELEGRAM_CHAT_ID`) using `@userinfobot`.

---

### 2. Deploy the Cloudflare Worker
1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```
2. Authenticate with Cloudflare:
   ```bash
   wrangler login
   ```
3. Create the KV Namespace:
   ```bash
   wrangler kv namespace create TRACKER_DB
   ```
   *Note the `id` output in your console.*

4. Configure `wrangler.toml`:
   ```toml
   name = "movie-track-bot"
   main = "worker.js"
   compatibility_date = "2024-09-26"

   [vars]
   TELEGRAM_BOT_TOKEN = "YOUR_TELEGRAM_BOT_TOKEN"
   TELEGRAM_CHAT_ID = "YOUR_TELEGRAM_CHAT_ID"

   [[kv_namespaces]]
   binding = "TRACKER_DB"
   id = "YOUR_KV_NAMESPACE_ID"
   ```

5. Deploy the worker:
   ```bash
   npx wrangler deploy
   ```
   *Your worker URL will be output (e.g., `https://movie-track-bot.<subdomain>.workers.dev`).*

---

### 3. Register Telegram Webhook
Register your Cloudflare Worker URL with Telegram:
```bash
curl -F "url=https://YOUR_WORKER_URL" https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook
```
Verify webhook health:
```bash
curl https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo
```
*(Should return `"ok": true` and `"pending_update_count": 0`)*

---

### 4. Configure GitHub Repository Secrets
1. In your GitHub repository, go to **Settings** > **Secrets and variables** > **Actions**.
2. Add the following repository secrets:
   - `TELEGRAM_BOT_TOKEN`: Your Telegram Bot API token.
   - `TELEGRAM_CHAT_ID`: Your Telegram numeric Chat ID.
3. The workflow file [`.github/workflows/movie-tracker.yml`](.github/workflows/movie-tracker.yml) will automatically run every 5 minutes:
   ```yaml
   name: BookMyShow 24/7 Movie Tracker
   on:
     schedule:
       - cron: '*/5 * * * *'
     workflow_dispatch:
   ```

---

## 💻 Local Development & Testing

Test the monitor locally against active Cloudflare KV trackers:

```bash
# Clone the repository
git clone https://github.com/owaisnaim/movie-track.git
cd movie-track

# Install dependencies
pip install -r requirements.txt

# Run a test check
export TELEGRAM_BOT_TOKEN="your_bot_token"
export TELEGRAM_CHAT_ID="your_chat_id"
python monitor.py
```

---

## 📂 Project Structure

```text
movie-track/
├── .github/
│   └── workflows/
│       ├── movie-tracker.yml       # 5-minute scheduled background ticket scanner
│       └── test-telegram.yml       # Manual diagnostic test for Telegram alerts
├── monitor.py                      # Main monitoring engine (KV fetch, BMS scraper, alert logic)
├── worker.js                       # Cloudflare Worker (Telegram Webhook, KV storage, bot UI)
├── requirements.txt                # Python dependencies (curl_cffi)
├── telegram_notify.py              # Legacy notification fallback helper
├── telegram_test.py                # Bot credential verification utility
├── wrangler.toml                   # Cloudflare Workers configuration
└── README.md                       # Documentation
```

---

## 🔒 Security & Privacy
- **Secrets Management**: Sensitive bot tokens and chat IDs must never be committed to public repositories. Always use GitHub Secrets and Wrangler environment variables.
- **Rate-Limiting Respect**: The scanner uses polite request intervals and caches seen sessions to minimize load on BookMyShow endpoints.

---

## 📄 License
This project is open-source and licensed under the [MIT License](LICENSE).
