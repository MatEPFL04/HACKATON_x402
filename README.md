# HumanLens — Human-verified image marketplace on TON

HumanLens is a peer-to-peer marketplace where sellers upload real, human-taken photos via Telegram and buyers pay for them using **BSA USD** (a TON stablecoin) through the **x402 protocol** — enabling both human buyers and autonomous AI agents to discover and purchase images programmatically.

---

## How it works

### Seller flow (Telegram bot)
1. Send `/start` to the bot
2. Upload a photo
3. Write a description
4. Set a price in BSA USD
5. Provide your TON wallet address (saved for future listings)

The bot automatically:
- Rejects AI-generated images (SightEngine, threshold 0.7)
- Extracts semantic search tags via Claude (`claude-opus-4-6`)
- Generates a sentence embedding for semantic search (`all-MiniLM-L6-v2`)
- Publishes the listing to the marketplace

### Buyer flow (web)
1. Visit `http://localhost:3000/marketplace`
2. Search in natural language — *"two people sitting outside"*, *"soldier in forest"*
3. Click an image to see details and price
4. Click **Pay & Download** — currently shows the 402 (web wallet integration coming)

### AI agent flow (CLI)
```bash
cd examples/client-script

# Search semantically and pick an image interactively
SEARCH_QUERY="two soldiers in a forest" pnpm buy

# Or use exact tag search
SEARCH_TAG=indoor pnpm buy

# No filter — show all images
pnpm buy
```

The agent:
1. Searches the marketplace
2. Shows results with prices, lets you pick by index
3. Hits the download endpoint → gets HTTP 402
4. Signs a BSA USD jetton transfer on TON (locally, no broadcast yet)
5. Retries with the signed BOC → server verifies + settles on-chain
6. Saves the full-resolution image to `examples/client-script/downloads/`

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Server (port 3000)              │
│                                                             │
│  /marketplace          → UI (HumanLens)                     │
│  /api/images/search    → Semantic search (free)             │
│  /api/images/:id       → Image metadata (free)              │
│  /api/images/:id/download → Full image (x402 payment)       │
│  /api/telegram/webhook → Seller bot                         │
│  /api/facilitator/*    → x402 verify + settle               │
└──────────────┬──────────────────────────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
  Telegram Bot      x402 Protocol
  (sellers)         (buyers / AI agents)
       │                │
  SightEngine       TON Blockchain
  Claude API        (BSA USD jetton)
  all-MiniLM-L6-v2
```

### Key packages (from BSA x TON starter)

| Package | Role |
|---|---|
| `@ton-x402/core` | Protocol types, header encode/decode |
| `@ton-x402/client` | `x402Fetch` — handles 402 → sign → retry automatically |
| `@ton-x402/facilitator` | Verifies BOC offline, broadcasts on-chain, polls confirmation |
| `@ton-x402/middleware` | `paymentGate` — wraps any Next.js route with payment logic |

---

## Setup

### Prerequisites

- Node.js >= 18
- pnpm (`npm i -g pnpm`)
- A Toncenter API key — [toncenter.com](https://toncenter.com)
- A Telegram bot token — [@BotFather](https://t.me/BotFather)
- An Anthropic API key — [console.anthropic.com](https://console.anthropic.com)
- A SightEngine account — [sightengine.com](https://sightengine.com) (free tier: 2000 checks/month)

### 1. Install & build

```bash
git clone <repo>
cd <repo>
pnpm install
pnpm build
```

### 2. Configure environment

Edit `examples/nextjs-server/.env.local`:

```env
# TON network
TON_NETWORK=testnet
JETTON_MASTER_ADDRESS=kQCd6G7c_HUBkgwtmGzpdqvHIQoNkYOEE0kSWoc5v57hPPnW

# Facilitator (built into the server)
FACILITATOR_URL=http://localhost:3000/api/facilitator

# Toncenter RPC
TON_RPC_URL=https://testnet.toncenter.com/api/v2/jsonRPC
RPC_API_KEY=your_toncenter_api_key

# Buyer wallet — used by client-script only, never by the server
WALLET_MNEMONIC="word1 word2 ... word24"

# Telegram bot
TELEGRAM_BOT_TOKEN=your_bot_token

# SightEngine — AI image detection
SIGHTENGINE_API_USER=your_user
SIGHTENGINE_API_SECRET=your_secret

# Anthropic — tag extraction
ANTHROPIC_API_KEY=your_key
```

### 3. Start the server

```bash
pnpm dev
```

### 4. Register the Telegram webhook

```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<your-domain>/api/telegram/webhook"
```

For local development use [ngrok](https://ngrok.com):
```bash
ngrok http 3000
# then set webhook to https://<ngrok-url>/api/telegram/webhook
```

---

## Testnet funds (for buyers)

The buyer wallet needs:
- **Testnet TON** (gas) → [@testgiver_ton_bot](https://t.me/testgiver_ton_bot)
- **Testnet BSA USD** → [BSA USD faucet](https://ton-x402-nextjs-server-dyvpwctew-hliosones-projects.vercel.app/)

---

## API Reference

### `GET /api/images/search`

Free endpoint. Returns image metadata + blurred thumbnails.

| Param | Type | Description |
|---|---|---|
| `q` | string | Natural language semantic query |
| `tags` | string | Comma-separated exact tags (fallback) |
| `min_price` | string | Minimum price in atomic BSA USD |
| `max_price` | string | Maximum price in atomic BSA USD |
| `limit` | number | Max results (default 20, max 100) |
| `offset` | number | Pagination offset |

Results when using `q=` are sorted by semantic similarity (best match first). Each result includes a `score` field (0–1).

```bash
# Semantic search
curl -G "http://localhost:3000/api/images/search" \
  --data-urlencode "q=two soldiers in a forest" | jq

# Tag search
curl "http://localhost:3000/api/images/search?tags=indoor,people" | jq
```

### `GET /api/images/:id/download`

Paid endpoint — protected by x402. Returns full-resolution image on successful payment.

```bash
# Step 1 — probe (returns 402 with payment details)
curl -i "http://localhost:3000/api/images/<ID>/download"

# Step 2 — pay using the client script
cd examples/client-script
RESOURCE_URL=http://localhost:3000/api/images/<ID>/download pnpm pay
```

**Payment details returned in 402:**
- `amount` — price in atomic BSA USD (divide by 10^9 for display)
- `payTo` — seller's TON wallet address (payments go directly to the seller)
- `asset` — BSA USD jetton master contract address

---

## Semantic Search

Images are embedded at upload time using `all-MiniLM-L6-v2` (384-dim, ~25MB, runs locally). Queries are embedded at search time and ranked by cosine similarity.

- **Threshold**: 0.40 — images below this score are excluded
- **First upload**: triggers model download (~25MB, cached after)
- **Old images**: no embedding → fall back to tag search

Score interpretation:
- `> 0.6` — very close match
- `0.4–0.6` — related topic
- `< 0.4` — excluded

---

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start Next.js server at `localhost:3000` |
| `pnpm build` | Build all packages |
| From `examples/client-script/`: | |
| `SEARCH_QUERY="..." pnpm buy` | Semantic search + interactive buy flow |
| `SEARCH_TAG=indoor pnpm buy` | Exact tag search + interactive buy flow |
| `RESOURCE_URL=<url> pnpm pay` | Pay for a specific URL directly |

---

## Tech Stack

- **Next.js 15** — server + marketplace UI
- **TON SDK** — wallet, transactions, jetton transfers
- **BSA USD** — TEP-74 stablecoin on TON testnet (9 decimals)
- **x402 protocol** — HTTP 402 micropayments
- **Telegram Bot API** — seller onboarding
- **SightEngine** — AI-generated image detection
- **Anthropic Claude** (`claude-opus-4-6`) — semantic tag extraction
- **HuggingFace Transformers** (`all-MiniLM-L6-v2`) — local sentence embeddings
- **Sharp** — server-side thumbnail generation

---

## Built at BSA x TON Hackathon 2026
