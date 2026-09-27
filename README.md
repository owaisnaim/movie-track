# Movie Track — BookMyShow Ticket Tracker

[![Workflow Status](https://img.shields.io/github/actions/workflow/status/owaisnaim/movie-track/movie-tracker.yml?branch=main&label=Ticket%20Monitor&style=flat-square)](https://github.com/owaisnaim/movie-track/actions/workflows/movie-tracker.yml)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers%20%2B%20KV-orange?style=flat-square&logo=cloudflare)](https://workers.cloudflare.com/)
[![Python](https://img.shields.io/badge/Python-3.12-blue?style=flat-square&logo=python)](https://python.org)
[![Telegram Bot API](https://img.shields.io/badge/Telegram-Bot%20API-2CA5E0?style=flat-square&logo=telegram)](https://core.telegram.org/bots/api)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

An autonomous 24/7 movie ticket tracking and alert system for BookMyShow, built with an interactive Telegram Bot, Cloudflare Workers + KV, and GitHub Actions.

Configure tracking for any cinema hall and movie directly within Telegram, and receive immediate alerts the moment new tickets and showtimes are published.

---

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Features](#features)
- [How It Works](#how-it-works)
- [Telegram Bot Commands](#telegram-bot-commands)
- [Interactive Bot Flow](#interactive-bot-flow)
- [Setup and Deployment](#setup-and-deployment)
  - [1. Create Telegram Bot](#1-create-telegram-bot)
  - [2. Deploy Cloudflare Worker & KV](#2-deploy-cloudflare-worker--kv)
  - [3. Register Telegram Webhook](#3-register-telegram-webhook)
  - [4. Configure GitHub Secrets](#4-configure-github-secrets)
- [Local Development](#local-development)
- [Project Structure](#project-structure)
- [Security](#security)
- [License](#license)

---

## Architecture Overview

The system uses a decoupled two-tier architecture designed to run continuously on free-tier infrastructure:

```
+--------------------------------------------------------------------------------+
|                              TELEGRAM MESSENGER                                |
|   - User interacts with inline keyboards and quick-select buttons              |
|   - Receives instant ticket drop alerts with direct booking links              |
+---------------------------------------+----------------------------------------+
                                        | (Webhook: < 50ms)
                                        v
+--------------------------------------------------------------------------------+
|                     CLOUDFLARE WORKER + KV (Control Plane)                     |
|   - Handles Telegram Webhook requests without server infrastructure            |
|   - Serves multi-step setup flow: City -> Cinema -> Movie -> Screen Format     |
|   - Stores user tracker configurations in Cloudflare KV (TRACKER_DB)           |
|   - Exposes authenticated APIs: /api/trackers and /api/trackers/sync           |
+---------------------------------------+----------------------------------------+
                                        |
                         (Every 5 Mins Background Poll)
                                        |
                                        v
+--------------------------------------------------------------------------------+
|                        GITHUB ACTIONS (Execution Engine)                       |
|   - Scheduled runner (movie-tracker.yml) executing on Ubuntu                   |
|   - Bypasses Cloudflare WAF using curl_cffi with Chrome 124 TLS impersonation  |
|   - Pulls active tracker configs from Cloudflare KV                            |
|   - Queries BookMyShow showtime APIs and detects newly opened sessions         |
|   - Dispatches Telegram notifications to tracker owners                        |
|   - Syncs verified session IDs to KV to eliminate duplicate alerts             |
+--------------------------------------------------------------------------------+
```

---

## Features

- **Autonomous 24/7 Monitoring**: Runs continuously in the background using GitHub Actions scheduled workflows and Cloudflare Workers.
- **WAF Bypass**: Uses `curl_cffi` with Chrome 124 TLS fingerprint impersonation (JA3/JA4) to query BookMyShow endpoints without triggering Cloudflare anti-bot blocks or HTTP 429 rate limits.
- **640+ Cinema Halls**: Pre-mapped database covering major metro areas including Kanpur, Lucknow, Hyderabad, Mumbai, NCR (Delhi/Gurgaon/Noida), Bengaluru, Pune, and Kolkata.
- **Language and Format Granularity**:
  - Distinct tracking for English, Hindi, and regional language releases across 3D and 2D formats.
  - Option to track both English and Hindi versions simultaneously.
  - Screen filters: PCX, IMAX, Screen 1, 3D Only, 2D Only, or All Screens.
- **Baseline Seeding**: When a tracker is created, existing shows are seeded as the baseline. Alerts only trigger when genuine new showtimes are published.
- **Deduplication**: Recorded session IDs are synchronized with Cloudflare KV so duplicate notifications are never sent.
- **Multi-User Isolation**: Independent users can track different cinemas and movies simultaneously; alerts route directly to each user's Telegram chat ID.

---

## How It Works

1. **Tracker Creation**: The user sends `/start` in Telegram and selects their city, cinema hall, movie, language, and screen format.
2. **State Storage**: The Cloudflare Worker stores the tracker in Cloudflare KV (`TRACKER_DB`).
3. **Scheduled Check**: Every 5 minutes, GitHub Actions runs `monitor.py`:
   - Retrieves active trackers from Cloudflare KV via `GET /api/trackers?token=...`.
   - Resolves target coordinates and headers for the selected city.
   - Queries the BookMyShow showtime API for matching schedules.
   - Applies the configured screen format filters.
4. **Alerting**: When a new session ID is found:
   - Sends a Telegram notification with date, time, screen, venue, and a direct booking link.
   - Syncs the updated session IDs back to Cloudflare KV via `POST /api/trackers/sync?token=...`.

---

## Telegram Bot Commands

| Command | Description |
| :--- | :--- |
| `/start` | Start the 4-step interactive wizard to add a new tracker |
| `/mytrackers` | List all active trackers with pause, resume, and delete options |
| `/pause` | Temporarily pause active monitoring |
| `/resume` | Resume paused monitoring |
| `/delete` | Remove a tracker from your account and KV storage |
| `/status` | View system status, active tracker counts, and diagnostics |
| `/help` | Display usage instructions and available commands |

---

## Interactive Bot Flow

```text
Step 1: Choose City
[ Kanpur ]  [ Lucknow ]  [ Hyderabad ]  [ Mumbai ]  [ NCR (Delhi) ]  [ Bengaluru ]

Step 2: Choose Cinema Hall
[ INOX: Z Square, Bada Chauraha ]  [ PVR: Deep, Kanpur ]  [ Miraj: Gurudev ] ...

Step 3: Choose Movie & Language
[ Avengers Endgame: Encore (English 3D) ]
[ Avengers Endgame: Encore (Hindi 2D) ]
[ Track Both English & Hindi Shows ]

Step 4: Choose Screen Filter
[ All Screens ]  [ PCX / Large Screen Only ]  [ 3D Only ]  [ 2D Only ]

Confirmation:
Tracker activated for Avengers Endgame: Encore (English 3D) at INOX: Z Square, Kanpur. Monitoring 24/7.
```

---

## Setup and Deployment

### 1. Create Telegram Bot
1. Open Telegram, search for `@BotFather`, and run `/newbot`.
2. Save the API token (`TELEGRAM_BOT_TOKEN`).
3. Send `/start` to your new bot.
4. Retrieve your Telegram chat ID (`TELEGRAM_CHAT_ID`) using `@userinfobot`.

---

### 2. Deploy Cloudflare Worker & KV
1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```
2. Log in to Cloudflare:
   ```bash
   wrangler login
   ```
3. Create the KV Namespace:
   ```bash
   wrangler kv namespace create TRACKER_DB
   ```
   Note the `id` from the output.

4. Edit `wrangler.toml`:
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

---

### 3. Register Telegram Webhook
Point your Telegram bot to the Cloudflare Worker URL:
```bash
curl -F "url=https://YOUR_WORKER_URL" https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook
```

Verify webhook status:
```bash
curl https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo
```

---

### 4. Configure GitHub Secrets
1. Navigate to **Settings** > **Secrets and variables** > **Actions** in your GitHub repository.
2. Add the repository secrets:
   - `TELEGRAM_BOT_TOKEN`: Your Telegram Bot API token.
   - `TELEGRAM_CHAT_ID`: Your Telegram numeric chat ID.
3. The workflow file [`.github/workflows/movie-tracker.yml`](.github/workflows/movie-tracker.yml) will run every 5 minutes automatically.

---

## Local Development

To run a test scan locally:

```bash
git clone https://github.com/owaisnaim/movie-track.git
cd movie-track

pip install -r requirements.txt

export TELEGRAM_BOT_TOKEN="your_bot_token"
export TELEGRAM_CHAT_ID="your_chat_id"
python monitor.py
```

---

## Project Structure

```text
movie-track/
├── .github/
│   └── workflows/
│       ├── movie-tracker.yml       # 5-minute background ticket scanner
│       └── test-telegram.yml       # Diagnostic test for Telegram messaging
├── monitor.py                      # Core scraper and alert dispatch engine
├── worker.js                       # Cloudflare Worker handling Telegram webhooks and KV state
├── requirements.txt                # Python dependencies (curl_cffi)
├── telegram_notify.py              # Fallback notification helper
├── telegram_test.py                # Credential testing utility
├── wrangler.toml                   # Cloudflare configuration
└── README.md                       # Project documentation
```

---

## Security

- **Credential Safety**: Bot tokens and chat IDs must never be committed to git. Use GitHub Secrets and Wrangler environment variables.
- **Request Pacing**: The scanner implements interval-based querying and session caching to minimize request volume on upstream services.

---

## License

This project is licensed under the [MIT License](LICENSE).
