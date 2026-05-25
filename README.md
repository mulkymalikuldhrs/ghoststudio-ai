# 🎬 GhostStudio AI

> **One Prompt. Infinite Content.**

AI Faceless Content Empire Generator — Mesin produksi konten viral otomatis yang mengubah satu prompt menjadi puluhan video shorts siap posting, tanpa kamera, tanpa wajah, tanpa batas.

![GhostStudio AI](https://img.shields.io/badge/GhostStudio-AI-00D1C7?style=for-the-badge&labelColor=0F172A)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss)

---

## 🚀 Features

### Core Engine
- **Prompt → Viral Script** — AI-generated scripts with hook optimization, retention patterns, and CTA
- **Script → Scene** — Auto visual generation with B-roll and scene mapping
- **Auto Motion Engine** — Zoom, shake, pan, beat sync effects
- **Subtitle Engine** — TikTok-style animated captions with emoji and highlights
- **AI Voice** — Natural TTS with emotional tone matching
- **Auto Posting** — Direct publishing to TikTok, YouTube Shorts, Instagram Reels
- **Analytics Loop** — ML-powered content optimization from performance data

### Platform
- 🎨 Industrial Cyberpunk theme (Dark mode default)
- 🔐 NextAuth.js authentication (GitHub, Google, Email)
- 💳 Stripe subscription billing
- 📊 Analytics dashboard with Recharts
- 🎬 Video project management & rendering pipeline
- 📱 Fully responsive design

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 + shadcn/ui |
| **Database** | Prisma ORM (SQLite) |
| **Auth** | NextAuth.js v4 |
| **State** | Zustand + TanStack Query |
| **Charts** | Recharts |
| **Animation** | Framer Motion |
| **Payments** | Stripe |
| **AI** | OpenAI + Replicate + ElevenLabs |
| **Video** | FFmpeg + Remotion |

---

## 📦 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- SQLite (included)

### Installation

```bash
# Clone the repository
git clone https://github.com/mulkymalikuldhrs/ghoststudio-ai.git
cd ghoststudio-ai

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Push database schema
bun run db:push

# Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 💰 Pricing Tiers

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0/mo | 3 videos/bulan, basic templates, watermark |
| **Creator** | $29/mo | 30 videos/bulan, all templates, no watermark, HD export |
| **Pro** | $49/mo | 100 videos/bulan, priority rendering, custom voices, analytics |
| **Agency** | $199/mo | Unlimited, team seats, white-label, API access, SLA |

---

## 🏗 Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Theme & styles
│   ├── auth/
│   │   ├── signin/page.tsx         # Sign in
│   │   └── signup/page.tsx         # Sign up
│   ├── dashboard/
│   │   ├── page.tsx                # Dashboard home
│   │   ├── create/page.tsx         # Video creation wizard
│   │   ├── project/[id]/page.tsx   # Project detail
│   │   ├── templates/page.tsx      # Template gallery
│   │   ├── analytics/page.tsx      # Analytics dashboard
│   │   └── settings/page.tsx       # Settings
│   └── api/
│       ├── auth/[...nextauth]/     # NextAuth API
│       ├── projects/               # Project CRUD
│       ├── templates/              # Templates API
│       ├── analytics/              # Analytics API
│       └── stripe/                 # Stripe webhooks & checkout
├── components/
│   ├── ui/                         # shadcn/ui components
│   ├── landing/                    # Landing page sections
│   ├── dashboard/                  # Dashboard components
│   └── video/                      # Video player & editor
├── lib/
│   ├── db.ts                       # Prisma client
│   ├── auth.ts                     # NextAuth config
│   ├── stripe.ts                   # Stripe client
│   ├── ai.ts                       # AI pipeline helpers
│   └── utils.ts                    # Utility functions
├── store/
│   ├── project-store.ts            # Project creation state
│   └── app-store.ts                # Global app state
└── prisma/
    └── schema.prisma               # Database schema
```

---

## 🎯 Target Users

1. **Faceless Creators** — Horror, motivation, crypto, AI facts, anime recap
2. **Content Agencies** — Social media management at scale
3. **Affiliate Marketers** — Product review, CPA, referral content

---

## 🔐 Environment Variables

See [.env.example](./.env.example) for all required environment variables.

---

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.

---

## 👤 Author

**Mulky Malikul Dhaher**
- Email: mulkymalikuldhaher@email.com
- GitHub: [@mulkymalikuldhrs](https://github.com/mulkymalikuldhrs)

---

> **"Build a faceless media empire."**
