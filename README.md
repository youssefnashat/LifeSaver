# EmergiBridge — Backend

REST API backend for EmergiBridge, a 911 emergency bridge app for non-English speakers.

## What it does

1. Receives an emergency call request from the frontend (type, address, body zones, age)
2. Stores patient context in Supabase
3. Places an outbound call via Twilio
4. When the call connects, Twilio fetches `/api/twiml` which generates and speaks an opening script via Groq + Twilio `<Say>`
5. `<Gather>` listens for the dispatcher's response, transcribes it, and posts it to `/api/respond`
6. `/api/respond` feeds the dispatcher's message to Groq and speaks the answer back — this loop continues for the duration of the call

## Call flow

```
Frontend → POST /api/call
  → store context in Supabase
  → Twilio places call → GET /api/twiml?ctx=<id>
      → Groq generates opening script
      → <Say> speaks it
      → <Gather> listens for dispatcher
          → POST /api/respond?ctx=<id>  (Twilio posts transcript)
              → Groq generates answer
              → <Say> speaks it
              → <Gather> listens again
              → loop...
```

## API Routes

| Method | Route | Caller | Description |
|--------|-------|--------|-------------|
| POST | `/api/call` | Frontend | Trigger the full call flow |
| POST | `/api/geocode` | Frontend | Reverse geocode GPS coords to street address |
| GET | `/api/twiml` | Twilio | Opening script + start of conversation loop |
| POST | `/api/respond` | Twilio | Each turn of the dispatcher conversation |

## Tech Stack

| Purpose | Service |
|---------|---------|
| Script + responses | Groq LLaMA |
| Call + TTS + STT | Twilio Voice (`<Say>` + `<Gather>`) |
| Call context storage | Supabase |
| Reverse geocoding | Google Maps Geocoding API |
| Runtime | Node.js + Express + TypeScript |

## Setup

```bash
cd backend
npm install
cp .env.example .env
# fill in API keys
npm run dev
```

For Twilio to reach `/api/twiml` and `/api/respond` locally, expose the backend with ngrok:

```bash
ngrok http 4000
# copy the https URL into .env as PUBLIC_URL
```

## Supabase setup

Run this in the Supabase SQL editor once:

```sql
CREATE TABLE emergency_calls (
  id UUID PRIMARY KEY,
  type TEXT NOT NULL,
  address TEXT NOT NULL,
  zones TEXT[],
  age INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Environment Variables

See `.env.example` for all required variables.

## Project Structure

```
backend/
├── src/
│   ├── index.ts
│   ├── routes/
│   │   ├── call.ts        # POST /api/call       (frontend → triggers call flow)
│   │   ├── geocode.ts     # POST /api/geocode    (frontend → reverse geocoding)
│   │   ├── twiml.ts       # GET  /api/twiml      (Twilio → opening script)
│   │   └── respond.ts     # POST /api/respond    (Twilio → conversation loop)
│   ├── services/
│   │   ├── groqService.ts
│   │   ├── twilioService.ts
│   │   └── supabaseService.ts
│   └── utils/
│       └── xml.ts         # XML escaping for TwiML safety
├── .env.example
├── package.json
└── tsconfig.json
```
