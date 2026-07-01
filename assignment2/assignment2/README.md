# QR Code Attendance System

A Telegram bot that marks student attendance by scanning IITK ID card QR codes from photos.

## What It Does

- A volunteer sends a photo of a student's IITK ID card to the bot
- The bot decodes the QR code using `jimp` (pixel extraction) and `jsqr` (QR reading)
- It extracts the roll number from the decoded string using regex
- Validates the roll number is in the registered range (240001–240400)
- Marks the student present in a JSON file with a timestamp
- Handles duplicates — warns if already marked and shows the original timestamp
- `/report` — shows total count and sorted list of present roll numbers
- `/export` — sends a downloadable CSV of attendance records (bonus)

## Project Structure

```
assignment2/
├── bot.js          # Telegram bot — I/O only, wires up all modules
├── qr.js           # QR decoder using jimp + jsqr
├── parser.js       # Roll number extractor + range validator
├── attendance.js   # File-based attendance store (attendance.json)
├── .env.example    # Template for environment variables
├── .gitignore      # Excludes node_modules, .env, attendance.json
├── package.json    # Dependencies and scripts
└── README.md       # This file
```

## Setup Instructions

### 1. Create your bot via BotFather

1. Open Telegram, search `@BotFather`
2. Send `/newbot` and follow the prompts
3. Copy the bot token you receive

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and replace `your_token_here` with your actual bot token:

```
BOT_TOKEN=123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ
```

> ⚠️ Never commit `.env` to git. It's already in `.gitignore`.

### 3. Install dependencies

```bash
npm install
```

### 4. Run the bot

```bash
node bot.js
# or
npm start
```

## Usage

| Action | How |
|---|---|
| Mark attendance | Send a photo of an IITK ID card to the bot |
| View stats | Send `/report` |
| Download CSV | Send `/export` |
| Get help | Send `/start` |

## Module Testing

Each module can be tested independently:

```bash
# Test QR decoder on a local image
node qr.js path/to/image.jpg

# Test roll number parser
node parser.js

# Test attendance store
node attendance.js
```

## Dependencies

| Package | Purpose |
|---|---|
| `dotenv` | Load BOT_TOKEN from `.env` |
| `jimp` | Read image and extract raw pixel bitmap |
| `jsqr` | Decode QR code from pixel data |
| `node-telegram-bot-api` | Connect to the Telegram Bot API |

## Notes

- Attendance data is stored in `attendance.json` (auto-created, excluded from git)
- Timestamps are stored in ISO 8601 format (UTC), displayed in IST
- The bot uses polling mode — no webhook setup needed
- Roll number range: **240001–240400** (IIT Kanpur batch)