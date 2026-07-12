# Vireon ✂️

**استوديو المونتاج الذكي — مزيل السكتات بالذكاء الاصطناعي**

Vireon is an AI-powered video silence remover built for Arabic and English content creators. Upload a video, let Whisper AI (or FFmpeg fallback) detect silences and filler words, review the timeline interactively, and export a clean cut — or download EDL/XML for professional NLE workflows.

---

## Features

- **AI silence detection** — OpenAI Whisper with word-level timestamps for precise cuts
- **Arabic & English support** — understands dialects, filler words (آه، يعني، um, like…)
- **Interactive timeline** — review, adjust, and toggle keep/remove segments before rendering
- **Multiple export formats** — MP4, EDL, FCP XML, SRT
- **FFmpeg fallback** — works without an API key using silence detection
- **User authentication** — Supabase-powered signup, login, and dashboard
- **RTL Arabic UI** — fully localized landing page and editor

---

## Prerequisites

| Requirement | Version |
|---|---|
| [Node.js](https://nodejs.org/) | 18+ |
| [FFmpeg](https://ffmpeg.org/) | must be in `PATH` |
| OpenAI API key | optional (enables Whisper mode) |
| Supabase project | required for auth |

---

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/vireon.git
cd vireon

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your Supabase and OpenAI credentials
```

---

## Running the App

Open **two terminals**:

```bash
# Terminal 1 — Backend (video processing API on port 3000)
npm run start:server
```

```bash
# Terminal 2 — Frontend (Vite dev server on port 5173)
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

### Production build

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build
```

### Health check

```bash
curl http://localhost:3000/api/health
```

---

## Project Structure

```
vireon/
├── index.html          # SPA shell — all route views (landing, auth, dashboard, editor)
├── server.js           # Express backend — upload, Whisper, FFmpeg, export
├── vite.config.js      # Vite configuration
├── src/
│   ├── main.js         # Frontend router, auth, editor logic
│   ├── supabaseClient.js
│   └── style.css       # Global styles (RTL, dark theme)
├── public/             # Static assets (icons, favicon)
├── uploads/            # Temporary uploaded videos (gitignored)
├── output/             # Processed video output (gitignored)
├── .env.example        # Environment variable template
└── package.json
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla JS, Vite, CSS |
| Backend | Node.js, Express 5 |
| Auth & DB | Supabase |
| AI Transcription | OpenAI Whisper API |
| Video Processing | FFmpeg / fluent-ffmpeg |
| File Upload | Multer |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `VITE_OPENAI_API_KEY` | No | OpenAI key for Whisper (frontend build) |
| `OPENAI_API_KEY` | No | OpenAI key for backend Whisper calls |
| `FFMPEG_PATH` | No | Custom FFmpeg binary path |
| `FFPROBE_PATH` | No | Custom FFprobe binary path |

---

## License

This project is licensed under the [MIT License](LICENSE).
