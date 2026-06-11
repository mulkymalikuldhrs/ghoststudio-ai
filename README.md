<img src="docs/banner.png" width="100%">

<!-- CAPSULE-RENDER HEADER -->
<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:0a0a1a,50:141428,100:1e1e3c&fontColor=818cf8&descColor=c084fc&height=220&section=header&text=GhostStudio%20AI&fontSize=70&desc=AI%20Faceless%20Content%20Generator&animation=fadeIn" />

<!-- TYPING SVG -->
<div align="center">
  <a href="https://git.io/typing-svg">
    <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=22&duration=3000&pause=1000&color=818CF8&center=true&vCenter=true&width=600&lines=Faceless+Content+for+TikTok+%7C+Shorts+%7C+Reels;AI-Generated+Scripts+%2B+Voice+%2B+Visuals;Create+Without+Showing+Your+Face;Content+Quality+Varies+%E2%80%94+Viral+Not+Guaranteed" alt="Typing SVG" />
  </a>
</div>

<br/>

<!-- BADGES -->
<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TTS](https://img.shields.io/badge/TTS-AI_Voice-C084FC?style=for-the-badge&logo=audio&logoColor=white)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](./LICENSE)

</div>

---

## Overview

**GhostStudio AI** is a faceless content generation platform that creates short-form video content for TikTok, YouTube Shorts, and Instagram Reels -- without ever requiring you to appear on camera. The AI pipeline handles script writing, voiceover generation, visual asset selection, and video composition, producing ready-to-upload content in minutes.

Whether you're building a faceless brand, testing content niches, or scaling your content production, GhostStudio AI automates the creative heavy lifting so you can focus on strategy and distribution.

## Features

### AI Script Generation
- Niche-specific script templates (finance, motivation, facts, storytelling, etc.)
- Hook optimization for maximum retention
- Trending topic discovery and script suggestion
- Multi-language script generation
- Script variations for A/B testing content

### AI Voiceover
- Multiple AI voice profiles (male, female, various accents)
- Adjustable pacing, emphasis, and tone
- Background music auto-mixing
- Voice cloning capabilities (with consent)
- Multi-language voiceover support

### Visual Composition
- AI-generated background visuals and animations
- Text overlay with kinetic typography
- Stock footage and image integration
- Caption/subtitle auto-generation
- Brand-consistent visual templates

### Video Assembly Pipeline
- Automated end-to-end content production
- Platform-specific export settings (TikTok 9:16, Shorts, Reels)
- Batch content generation for scheduling
- Thumbnail and cover image generation
- Hashtag and description suggestions

### Content Management
- Content calendar and scheduling
- Performance analytics integration
- Niche performance tracking
- Content variant testing dashboard
- Export queue and batch processing

### Multi-Platform Support
- TikTok format optimization
- YouTube Shorts specifications
- Instagram Reels compatibility
- Cross-platform content adaptation

## Honest Notes

> **Setting realistic expectations:**

- **AI Content Quality Varies** -- Generated content ranges from impressive to mediocre. Scripts may need editing, AI voiceovers can sound robotic, and visual compositions sometimes require manual tweaks. Expect a human review step.
- **Viral Success Not Guaranteed** -- No tool can guarantee viral content. Success depends on timing, niche, audience, and many factors beyond content quality. GhostStudio AI produces content -- audience building is still your job.
- **Platform Algorithms Change** -- TikTok, YouTube, and Instagram regularly update their algorithms and content policies. What works today may not work tomorrow, and AI-generated content policies are evolving.
- **Content Saturation** -- As AI content tools become common, audiences may develop fatigue for AI-generated styles. Differentiation requires creativity beyond what any tool provides.
- **Platform Policies** -- Some platforms may require disclosure of AI-generated content. Stay informed about current policies and comply with disclosure requirements.

---

## Architecture Visualizations

### Content Generation Pipeline

```mermaid
flowchart LR
    subgraph Input["Input Stage"]
        Niche[Niche Research]
        Trend[Trending Topics]
    end

    subgraph Script["Script Stage"]
        Draft[Script Drafting]
        Hook[Hook Optimization]
        AB[A/B Variants]
    end

    subgraph Voice["Voiceover Stage"]
        TTS[AI TTS Engine]
        Mix[Music Mixing]
        Lang[Multi-Language]
    end

    subgraph Visual["Visual Stage"]
        BG[Background Generation]
        Kinetic[Kinetic Typography]
        Captions[Auto Captions]
    end

    subgraph Video["Video Stage"]
        Compose[Video Composition]
        Export[Platform Export]
        Thumb[Thumbnail Gen]
    end

    subgraph Publish["Publish Stage"]
        Schedule[Content Calendar]
        Upload[Platform Upload]
        Analytics[Performance Track]
    end

    Input --> Script --> Voice --> Visual --> Video --> Publish

    Draft -.->|Human Review| Script
    BG -.->|Manual Tweak| Visual

    style Input fill:#e8f4fd,stroke:#2196f3,color:#000
    style Script fill:#fff3e0,stroke:#ff9800,color:#000
    style Voice fill:#f3e5f5,stroke:#7b1fa2,color:#000
    style Visual fill:#e8f5e9,stroke:#4caf50,color:#000
    style Video fill:#fce4ec,stroke:#e91e63,color:#000
    style Publish fill:#e0f2f1,stroke:#009688,color:#000
```

### Python Agent Architecture

```mermaid
flowchart TB
    subgraph Engine["Python Autonomous Engine"]
        direction TB
        Orch[Orchestrator]

        subgraph Agents["8 Specialized Agents"]
            Draft[Draft Agent<br/>Script generation and templates]
            Score[Scoring Agent<br/>Quality assessment and ranking]
            SEO[SEO Agent<br/>Keywords, hashtags, descriptions]
            Trend[Trend Agent<br/>Trending topic discovery]
            Mem[Memory Agent<br/>Historical performance data]
            Repurpose[Repurpose Agent<br/>Cross-platform adaptation]
            Human[Humanic Agent<br/>Human review and approval gate]
            APIFree[API-Free Agent<br/>No-cost fallback content]
        end

        Orch --> Draft
        Orch --> Score
        Orch --> SEO
        Orch --> Trend
        Orch --> Mem
        Orch --> Repurpose
        Orch --> Human
        Orch --> APIFree
    end

    Draft -->|script| Score
    Score -->|ranked| SEO
    Trend -->|topics| Draft
    Mem -->|history| Score
    Human -->|approved| Repurpose
    APIFree -->|fallback| Draft

    style Engine fill:#1e1e3c,stroke:#818cf8,color:#fff
    style Agents fill:#141428,stroke:#818cf8,color:#fff
```

### Publisher Ecosystem

```mermaid
flowchart TB
    subgraph Publishers["22+ Publisher Integrations"]
        direction TB

        subgraph Video["Video Platforms"]
            TikTok[TikTok]
            YTShorts[YouTube Shorts]
            Reels[Instagram Reels]
            YTLong[YouTube Long-form]
        end

        subgraph Social["Social Media"]
            IG[Instagram Post and Story]
            Twitter[X / Twitter]
            FB[Facebook]
            LinkedIn[LinkedIn]
            Threads[Threads]
            Pinterest[Pinterest]
        end

        subgraph Blog["Blog and Article"]
            Medium[Medium]
            DevTo[Dev.to]
            Hashnode[Hashnode]
            WordPress[WordPress]
            GhostBlog[Ghost]
        end

        subgraph Audio["Audio and Podcast"]
            Spotify[Spotify Podcasts]
            Anchor[Anchor]
            ApplePod[Apple Podcasts]
        end

        subgraph Community["Community"]
            Reddit[Reddit]
            Discord[Discord]
            Telegram[Telegram]
            Slack[Slack]
        end
    end

    Engine[Python Engine] --> Publishers

    style Publishers fill:#141428,stroke:#818cf8,color:#fff
    style Video fill:#e8f4fd,stroke:#2196f3,color:#000
    style Social fill:#fce4ec,stroke:#e91e63,color:#000
    style Blog fill:#e8f5e9,stroke:#4caf50,color:#000
    style Audio fill:#f3e5f5,stroke:#7b1fa2,color:#000
    style Community fill:#fff3e0,stroke:#ff9800,color:#000
```

### Full Stack Architecture

```mermaid
flowchart TB
    subgraph Frontend["Next.js Frontend"]
        UI[React UI<br/>App Router]
        Editor[Content Editor]
        Calendar[Scheduling Dashboard]
        Analytics[Analytics View]
    end

    subgraph Backend["Python Autonomous Engine"]
        Orch[Orchestrator]
        Agents[8 AI Agents]
        Publishers[22+ Publishers]
    end

    subgraph Infra["Docker + Caddy"]
        Caddy[Caddy Reverse Proxy<br/>Auto HTTPS]
        DockerFE[Docker<br/>Next.js Container]
        DockerBE[Docker<br/>Python Container]
    end

    subgraph External["External APIs"]
        LLM[LLM Provider<br/>OpenAI / Anthropic]
        TTS[TTS Provider<br/>ElevenLabs]
        Assets[Asset Sources<br/>Pexels / Unsplash]
    end

    UI --> Editor
    UI --> Calendar
    UI --> Analytics
    Editor -->|API calls| Orch
    Orch --> Agents
    Agents --> Publishers
    Caddy --> DockerFE
    Caddy --> DockerBE
    DockerFE --> Frontend
    DockerBE --> Backend
    Backend --> External

    style Frontend fill:#e3f2fd,stroke:#1976d2,color:#000
    style Backend fill:#1e1e3c,stroke:#818cf8,color:#fff
    style Infra fill:#fff3e0,stroke:#ff9800,color:#000
    style External fill:#e8f5e9,stroke:#4caf50,color:#000
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- API keys for LLM and TTS providers

### Installation

```bash
# Clone the repository
git clone https://github.com/mulkymalikuldhrs/ghoststudio-ai.git
cd ghoststudio-ai

# Install dependencies
npm install

# Configure environment
cp .env.example .env
```

### Configuration

```env
# AI Providers
OPENAI_API_KEY=your_key
ELEVENLABS_API_KEY=your_key

# Asset Sources (optional)
PEXELS_API_KEY=your_key
UNSPLASH_ACCESS_KEY=your_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=your_database_url
```

### Running

```bash
# Development
npm run dev

# Production
npm run build && npm start
```

---

## Project Structure

```
ghoststudio-ai/
├── src/
│   ├── app/                # Next.js app router
│   ├── components/
│   │   ├── editor/         # Content editing interface
│   │   ├── generator/      # Content generation views
│   │   ├── calendar/       # Scheduling dashboard
│   │   └── analytics/      # Performance views
│   ├── lib/
│   │   ├── pipeline/       # Content generation pipeline
│   │   ├── scripts/        # AI script generation
│   │   ├── voiceover/      # TTS integration
│   │   ├── visuals/        # Visual asset generation
│   │   ├── video/          # Video composition engine
│   │   └── platforms/      # Platform-specific exporters
│   └── types/              # TypeScript definitions
├── templates/              # Content templates
└── tests/                  # Test suites
```

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

We're especially interested in:
- New content templates and niches
- Better visual composition algorithms
- Additional TTS provider integrations
- Platform-specific optimizations

---

## Disclaimer

GhostStudio AI is a content creation tool. Users are solely responsible for ensuring their content complies with platform terms of service, disclosure requirements for AI-generated content, copyright laws, and advertising regulations. The authors assume no liability for content produced using this tool or its performance on any platform.

---

## License

This project is licensed under the **MIT License** -- see the [LICENSE](./LICENSE) file for details.

---

## Author

<div align="center">

**Mulky Malikul Dhaher**

[![GitHub](https://img.shields.io/badge/GitHub-mulkymalikuldhrs-181717?style=flat-square&logo=github)](https://github.com/mulkymalikuldhrs)
[![Email](https://img.shields.io/badge/Email-mulkymalikudhr@mail.com-EA4335?style=flat-square&logo=gmail&logoColor=white)](mailto:mulkymalikudhr@mail.com)

</div>

---

<!-- FOOTER BANNER -->
<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:0a0a1a,50:141428,100:1e1e3c&fontColor=818cf8&descColor=c084fc&height=120&section=footer" />
