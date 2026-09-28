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
- [Telegram Bot Usage](#telegram-bot-usage)
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
|   - Serves multi-step setup flow: City -> Movie -> Cinema Hall -> Screen/Format|
|   - Stores user tracker configurations in Cloudflare KV (TRACKER_DB)           |
|   - Exposes authenticated APIs: /api/trackers and /api/trackers/sync           |
+---------------------------------------+----------------------------------------+
                                        |
                   (Periodic Poll via Cron / External Webhook)
                                        |
                                        v
+--------------------------------------------------------------------------------+
|                        GITHUB ACTIONS (Execution Engine)                       |
|   - Scheduled runner (movie-tracker.yml) executing on Ubuntu                   |
|   - Bypasses BookMyShow WAF using curl_cffi with Chrome TLS impersonation      |
|   - Pulls active tracker configs from Cloudflare KV                            |
|   - Queries BookMyShow showtime APIs and detects newly opened sessions         |
|   - Performs silent baseline initialization for newly created trackers         |
|   - Dispatches instant Telegram notifications when genuine new shows drop      |
|   - Syncs verified session IDs to KV to eliminate duplicate alerts             |
+--------------------------------------------------------------------------------+
```

---

## Features

- **Autonomous 24/7 Monitoring**: Runs continuously in the background using GitHub Actions scheduled workflows or external cron services (e.g., cron-job.org).
- **WAF Bypass**: Uses `curl_cffi` with Chrome 124 TLS fingerprint impersonation (JA3/JA4) to query BookMyShow endpoints without triggering Cloudflare anti-bot blocks or HTTP 429 rate limits.
- **Silent Baseline Initialization (Zero False Alarms)**: Newly created trackers for ongoing movies capture the existing showtimes silently on their first scan. You will never receive false alarms for shows that were already open before tracker creation.
- **Zero-Guessing Movie Catalog**: Automatically syncs confirmed active BookMyShow movies by city into Cloudflare KV, ensuring only movies actually running or upcoming in your city are selectable.
- **Exact Official BMS Screen Formats**: Matches official BookMyShow attributes (e.g. `PCX Infinity Vis 3D`, `Infinity Vision 2D`, `IMAX 3D`, `4DX 3D`, `Screen 1`) without artificial labels or clutter.
- **640+ Cinema Halls**: Pre-mapped database covering major metro areas including Kanpur, Lucknow, Hyderabad, Mumbai, NCR (Delhi/Gurgaon/Noida), Bengaluru, Pune, and Kolkata.
- **Multi-User Isolation**: Independent users can track different cinemas and movies simultaneously; alerts route directly to each user's Telegram chat ID.

---

## How It Works

1. **Tracker Creation**: The user sends `/start` in Telegram and selects City $\rightarrow$ Movie $\rightarrow$ Cinema Hall $\rightarrow$ Screen & Format.
2. **State Storage**: The Cloudflare Worker saves the tracker to Cloudflare KV (`TRACKER_DB`) with `isInitialized: false`.
3. **Scheduled Scan**: `monitor.py` is triggered periodically by GitHub Actions (via cron schedule or external webhook):
   - Retrieves active dynamic trackers from Cloudflare KV via `GET /api/trackers?token=...`.
   - Queries BookMyShow's showtime endpoints with residential/datacenter headers.
   - Filters shows matching the cinema hall and target screen format.
4. **Silent Baseline Capture**: On a tracker's very first scan, all pre-existing shows are recorded silently into Cloudflare KV (`isInitialized: true`). No false alarm is sent to Telegram.
5. **Instant Alerting**: On subsequent scans, any brand-new show ID triggers an immediate Telegram notification with date, time, screen, cinema, and a direct booking link, and syncs the new session ID to KV via `POST /api/trackers/sync?token=...`.

---

## Telegram Bot Usage

The bot is designed to be zero-friction and driven entirely via `/start` with an interactive, button-based interface:

| Command | Description |
| :--- | :--- |
| `/start` | Launch the interactive ticket tracker wizard or view and manage active trackers |

> [!TIP]
> **No manual commands needed**: Everything from city selection, movie picking, cinema choosing, screen format filtering, pausing, resuming, and deleting trackers is handled seamlessly through clickable inline buttons. You can also paste any BookMyShow movie link directly into the chat to configure a tracker instantly.

---

## Interactive Bot Flow

```text
Step 1: Choose City
[ Kanpur ]  [ Lucknow ]  [ Hyderabad ]  [ Mumbai ]  [ NCR (Delhi) ]  [ Bengaluru ] ...

Step 2: Choose Movie
[ Avengers: Endgame ]  [ Interstellar ]  [ Dune: Part Two ] ...

Step 3: Choose Cinema Hall
[ Prasads Multiplex, Hyderabad ]  [ PVR: Next Galleria ]  [ INOX: GVK One ] ...

Step 4: Choose Screen & Format
[ Exact Match: English 3D (PCX Infinity Vis 3D) ]  [ All Formats ]

Confirmation & Management:
Tracker activated! Existing Shows: 22 (monitoring for new drops).
[ 📋 View My Trackers ]  [ ⏸️ Pause ]  [ ▶️ Resume ]  [ 🗑️ Delete ]
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
3. The workflow file [`.github/workflows/movie-tracker.yml`](.github/workflows/movie-tracker.yml) can be run via GitHub's scheduled cron, manual dispatch, or an external cron service (e.g. cron-job.org every 10 minutes).

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
│       ├── movie-tracker.yml       # Background ticket scanner workflow
│       └── test-telegram.yml       # Diagnostic test for Telegram messaging
├── monitor.py                      # Core scraper, baseline initializer, and alert engine
├── worker.js                       # Cloudflare Worker handling Telegram webhooks, UI, and KV state
├── sync_cinema_catalog.py          # Cinema hall catalog and venue synchronization utility
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
