## TechReady – Local Setup and Developer Guide

Welcome! This guide walks you through configuring and running the project locally on Windows. It also explains the full interview workflow (Behavioral ➜ Technical), live voice practice, and where the progress bar appears.

### What you’ll build/run
- Next.js 15 + React 19 app with Tailwind CSS 4
- Behavioral interview practice: chat-based and live voice
- Technical interview practice with coding tasks
- Full Interview flow with a progress bar across stages

---

## Prerequisites
- Node.js 18.18+ (Node 20 LTS recommended)
- npm (recommended) or pnpm/yarn
- A modern browser (Chrome/Edge) with microphone access for live practice
- Accounts/API keys for:
	- Google Gemini (Generative AI)
	- ElevenLabs (Text-to-Speech)
	- Deepgram (Speech-to-Text)
	- Firebase (Web app config)

---

## 1) Clone and install
```cmd
git clone https://github.com/Loganaan/kstate-hackathon-2025.git
cd kstate-hackathon-2025
npm install
```

This repo uses Next.js Turbopack. Common scripts:
- `npm run dev` – Start local dev server
- `npm run build` – Production build
- `npm start` – Run the built app

---

## 2) Environment variables
Create a `.env` file in the project root. Do NOT commit real keys to git.

Use this template (aligns with how the app reads variables):
```env
# Google Gemini (Generative AI)
GEMINI_API_KEY=your-gemini-api-key

# ElevenLabs (Text-to-Speech)
XI_API_KEY=your-elevenlabs-api-key

# Deepgram (Speech-to-Text)
DEEPGRAM_API_KEY=your-deepgram-api-key

# Firebase Web App (must be NEXT_PUBLIC_* so client can read them)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

---

## 3) Run the app
```cmd
npm run dev
```
Visit http://localhost:3000

If you encounter blank screens due to cached artifacts, clear the Next.js cache and restart:
```cmd
rd /s /q .next
npm run dev
```

---

## 5) Firebase setup (minimal)
You can explore without signing in, but saving sessions requires Firebase.

1) Create a Firebase project and a Web App under it.
2) Copy the Web App config into your `.env` using the `NEXT_PUBLIC_*` variables above.
3) Optional: enable Authentication (e.g., Email/Password) if you want sign-in flows to persist sessions to Firestore.

---

## 6) API keys – where to get them
- Google Gemini: Google AI Studio -> Create API Key
- ElevenLabs: User dashboard -> API Keys
- Deepgram: Console -> API Keys (Project ID optional for temp key flow)
- Firebase: Project Settings -> Your apps -> Web App configuration

---