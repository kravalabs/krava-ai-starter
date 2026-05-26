# Krava AI Starter

A production-ready Lovable template for building **private AI companion apps** powered by [Krava AI](https://krava.io).

Ships with:
- Chat UI with real-time streaming (SSE)
- Dual AI backend: **Krava AI** (zero-knowledge encrypted) + **Gemini** (via Lovable gateway)
- Deep Research mode with cited answers
- One-tap data burn (delete all memories + sign out)
- Supabase auth (email + password, magic link ready)
- Fully customisable persona, branding, and copy — all in one file

---

## What you'll need

| Dependency | Purpose | Free tier? |
|---|---|---|
| [Supabase](https://supabase.com) | Auth + database + edge function hosting | Yes |
| [Krava AI](https://krava.io) | Zero-knowledge encrypted AI with memory | Use code `HACKATHON2026` |
| [Lovable](https://lovable.dev) | AI gateway (Gemini 2.5 Flash) | Yes (workspace credits) |

---

## Quick start

### 1. Clone into Lovable

Open [lovable.dev](https://lovable.dev) → **Import from GitHub** → paste this repo URL.

Or clone locally:

```bash
git clone https://github.com/krava-ai/krava-ai-starter.git my-app
cd my-app
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. From **Project Settings → API**, copy:
   - Project URL → `VITE_SUPABASE_URL`
   - `anon` key → `VITE_SUPABASE_PUBLISHABLE_KEY`
   - Project ID → `VITE_SUPABASE_PROJECT_ID`

### 3. Register your Krava AI app

```bash
curl -X POST https://krava.io/api/platform/apps \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My App",
    "persona": "You are a helpful AI companion. Be warm, concise, and thoughtful."
  }'
```

Save the returned `appKey` → `KRAVA_APP_KEY`.

> **Hackathon participants:** use promo code `HACKATHON2026` for 30 days free when signing up at [krava.io](https://krava.io).

### 4. Set environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your values:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
KRAVA_APP_KEY=your_krava_app_key
LOVABLE_API_KEY=your_lovable_api_key
```

### 5. Deploy Supabase Edge Functions

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_ID

# Set secrets for the edge functions
npx supabase secrets set KRAVA_APP_KEY=your_krava_app_key
npx supabase secrets set LOVABLE_API_KEY=your_lovable_api_key

# Deploy all four functions
npx supabase functions deploy krava-session
npx supabase functions deploy krava-chat
npx supabase functions deploy krava-burn
npx supabase functions deploy research
```

### 6. Run locally

```bash
npm run dev
```

---

## Customise your app

Everything user-facing lives in **`src/config.ts`**:

```ts
export const APP_NAME = "YOUR_APP_NAME";        // shown in header, footer, page title
export const APP_TAGLINE = "...";               // subtitle under the app name
export const CHAT_GREETING = "...";             // first message shown in empty chat
export const SYSTEM_PROMPT = "...";             // AI persona for the main chat
export const RESEARCH_SYSTEM_PROMPT = "...";    // AI persona for Deep Research mode
export const RESEARCH_SUGGESTED = [...];        // example questions on Research empty state
export const RESEARCH_SOURCES = [...];          // trusted source links shown in Research
export const FEATURES = [...];                  // landing page feature cards
export const HOW_IT_WORKS = [...];              // landing page steps
```

Replace the logo by editing `src/components/AppLogo.tsx` — swap the SVG or use any [Lucide](https://lucide.dev) icon.

Update the HTML `<title>` and Open Graph tags in `index.html`.

---

## Architecture

```
Browser (React + Vite)
  │
  ├── /chat          → KravaChat.tsx          (streaming chat UI)
  ├── /research      → Research.tsx           (cited deep research)
  ├── /auth          → Auth.tsx               (Supabase email auth)
  └── /              → Landing.tsx            (marketing page)

Supabase Edge Functions (Deno)
  ├── krava-session  → exchanges Supabase JWT for Krava userToken
  ├── krava-chat     → proxies to Krava AI (encrypted) or Gemini
  ├── krava-burn     → clears Krava memory + signs user out
  └── research       → streams cited answers via Lovable AI gateway
```

### Two AI providers, switchable in the UI

| Provider | Privacy | Model | When to use |
|---|---|---|---|
| **Krava AI** | Zero-knowledge encrypted | kimi-k2-5 (hardware-attested) | Sensitive conversations |
| **Gemini** | Standard | Gemini 2.5 Flash | Fast general answers |

Users switch between them with the toggle in the chat input bar.

---

## Edge function secrets reference

Set these with `npx supabase secrets set KEY=value`:

| Secret | Required | Description |
|---|---|---|
| `KRAVA_APP_KEY` | Yes | Your Krava AI platform app key |
| `LOVABLE_API_KEY` | Yes | Lovable AI gateway key (for Gemini) |
| `GEMINI_SYSTEM_PROMPT` | No | Override the Gemini system prompt at runtime |
| `RESEARCH_SYSTEM_PROMPT` | No | Override the Research system prompt at runtime |

---

## Optional: override system prompts at runtime

Both `krava-chat` and `research` edge functions check for environment variable overrides first, so you can change the AI persona without redeploying:

```bash
npx supabase secrets set GEMINI_SYSTEM_PROMPT="You are Aria, a wellness coach..."
npx supabase secrets set RESEARCH_SYSTEM_PROMPT="You are a medical research assistant..."
```

---

## Deploy to production

### Lovable (recommended)
Connect this repo in your Lovable project — it auto-deploys on push.

### Vercel
```bash
npm install -g vercel
vercel --prod
```
Add the `VITE_*` env vars in Vercel project settings.

### Any static host (Netlify, Cloudflare Pages, etc.)
```bash
npm run build        # outputs to dist/
```
Upload `dist/` to your host. Set the `VITE_*` vars in the host's env settings.

---

## Krava AI platform — what you get

When you register an app via `POST /api/platform/apps`:

- **Encrypted memory** — each user's conversation history is AES-256-GCM encrypted with a key only they hold
- **Hardware-attested inference** — runs on Tinfoil enclaves; cryptographic proof that inference is isolated
- **Per-user sessions** — `POST /api/platform/users` provisions or retrieves a user by your `externalUserId`
- **Streaming chat** — `POST /api/platform/chat` returns SSE; wire directly from browser or via edge function

---

## License

MIT — build whatever you want.

---

*Built with [Lovable](https://lovable.dev) · Powered by [Krava AI](https://krava.io)*
