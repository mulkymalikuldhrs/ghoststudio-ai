import sys, os
PDF_SKILL_DIR = "/home/z/my-project/skills/pdf"
_scripts = os.path.join(PDF_SKILL_DIR, "scripts")
if _scripts not in sys.path:
    sys.path.insert(0, _scripts)

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, CondPageBreak, HRFlowable
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ─── Font Registration ───
pdfmetrics.registerFont(TTFont('WenQuanYi', '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc'))
pdfmetrics.registerFont(TTFont('WenQuanYi', '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc'))
pdfmetrics.registerFont(TTFont('DejaVu', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))
registerFontFamily('WenQuanYi', normal='WenQuanYi', bold='WenQuanYi')
registerFontFamily('WenQuanYi', normal='WenQuanYi', bold='WenQuanYi')
registerFontFamily('Tinos', normal='Tinos', bold='Tinos')

from pdf import install_font_fallback
install_font_fallback()

# ─── Palette ───
ACCENT       = colors.HexColor('#c96879')
TEXT_PRIMARY  = colors.HexColor('#e0e2e3')
TEXT_MUTED    = colors.HexColor('#798286')
BG_SURFACE   = colors.HexColor('#1a2023')
BG_PAGE      = colors.HexColor('#0d0e0f')

# ─── Styles ───
PAGE_W, PAGE_H = A4
MARGIN = 1.0 * inch

styles = getSampleStyleSheet()

title_style = ParagraphStyle('Title', fontName='DejaVu', fontSize=28, leading=34,
    alignment=TA_CENTER, textColor=ACCENT, spaceAfter=12)
h1_style = ParagraphStyle('H1', fontName='DejaVu', fontSize=20, leading=26,
    textColor=ACCENT, spaceBefore=18, spaceAfter=10)
h2_style = ParagraphStyle('H2', fontName='DejaVu', fontSize=16, leading=22,
    textColor=colors.HexColor('#e0e2e3'), spaceBefore=14, spaceAfter=8)
h3_style = ParagraphStyle('H3', fontName='DejaVu', fontSize=13, leading=18,
    textColor=colors.HexColor('#c96879'), spaceBefore=10, spaceAfter=6)
body_style = ParagraphStyle('Body', fontName='DejaVu', fontSize=10.5, leading=17,
    alignment=TA_JUSTIFY, textColor=TEXT_PRIMARY, spaceAfter=6)
body_left = ParagraphStyle('BodyLeft', fontName='DejaVu', fontSize=10.5, leading=17,
    alignment=TA_LEFT, textColor=TEXT_PRIMARY, spaceAfter=4)
bullet_style = ParagraphStyle('Bullet', fontName='DejaVu', fontSize=10.5, leading=17,
    alignment=TA_LEFT, textColor=TEXT_PRIMARY, leftIndent=20, bulletIndent=8, spaceAfter=3)
code_style = ParagraphStyle('Code', fontName='DejaVuSans', fontSize=9, leading=13,
    textColor=colors.HexColor('#a0d0a0'), backColor=colors.HexColor('#1a2023'),
    leftIndent=12, rightIndent=12, spaceBefore=4, spaceAfter=4)
caption_style = ParagraphStyle('Caption', fontName='DejaVu', fontSize=9, leading=13,
    alignment=TA_CENTER, textColor=TEXT_MUTED, spaceAfter=12)
table_header_style = ParagraphStyle('TH', fontName='DejaVu', fontSize=10, leading=14,
    textColor=colors.white, alignment=TA_CENTER)
table_cell_style = ParagraphStyle('TC', fontName='DejaVu', fontSize=9.5, leading=14,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, wordWrap='CJK')
table_cell_center = ParagraphStyle('TCC', fontName='DejaVu', fontSize=9.5, leading=14,
    textColor=TEXT_PRIMARY, alignment=TA_CENTER)

available_width = PAGE_W - 2 * MARGIN

def make_table(data, col_ratios, has_header=True):
    col_widths = [r * available_width for r in col_ratios]
    t = Table(data, colWidths=col_widths, hAlign='CENTER')
    style_cmds = [
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('GRID', (0,0), (-1,-1), 0.5, TEXT_MUTED),
    ]
    if has_header:
        style_cmds.append(('BACKGROUND', (0,0), (-1,0), ACCENT))
        style_cmds.append(('TEXTCOLOR', (0,0), (-1,0), colors.white))
        for i in range(1, len(data)):
            bg = colors.white if i % 2 == 1 else colors.HexColor('#f0f0f0')
            style_cmds.append(('BACKGROUND', (0,i), (-1,i), bg))
    t.setStyle(TableStyle(style_cmds))
    return t

def h1(text): return Paragraph(f'<b>{text}</b>', h1_style)
def h2(text): return Paragraph(f'<b>{text}</b>', h2_style)
def h3(text): return Paragraph(f'<b>{text}</b>', h3_style)
def p(text): return Paragraph(text, body_style)
def pl(text): return Paragraph(text, body_left)
def bullet(text): return Paragraph(f'<bullet>&bull;</bullet> {text}', bullet_style)

# ─── Build Document ───
output_path = '/home/z/my-project/download/GhostStudio_AI_Merger_Blueprint.pdf'
doc = SimpleDocTemplate(output_path, pagesize=A4,
    leftMargin=MARGIN, rightMargin=MARGIN,
    topMargin=MARGIN, bottomMargin=MARGIN)

story = []

# ═══════════════════════════════════════════════════
# COVER PAGE
# ═══════════════════════════════════════════════════
story.append(Spacer(1, 120))
story.append(Paragraph('<b>GHOSTSTUDIO AI</b>', ParagraphStyle('CoverTitle',
    fontName='DejaVu', fontSize=36, leading=44, alignment=TA_CENTER, textColor=ACCENT)))
story.append(Spacer(1, 8))
story.append(Paragraph('<b>Merger Blueprint</b>', ParagraphStyle('CoverSub',
    fontName='DejaVu', fontSize=24, leading=30, alignment=TA_CENTER, textColor=TEXT_PRIMARY)))
story.append(Spacer(1, 24))
story.append(HRFlowable(width='60%', thickness=2, color=ACCENT, spaceAfter=24))
story.append(Paragraph('AI Media Intelligence OS + GhostStudio AI + Reference Repos',
    ParagraphStyle('CoverDesc', fontName='DejaVu', fontSize=14, leading=20,
    alignment=TA_CENTER, textColor=TEXT_MUTED)))
story.append(Spacer(1, 12))
story.append(Paragraph('Comprehensive Brainstorm, Logic Audit, and Implementation Plan',
    ParagraphStyle('CoverDesc2', fontName='DejaVu', fontSize=12, leading=18,
    alignment=TA_CENTER, textColor=TEXT_MUTED)))
story.append(Spacer(1, 60))
story.append(Paragraph('Version 1.0 | May 2026', ParagraphStyle('CoverMeta',
    fontName='DejaVu', fontSize=11, leading=16, alignment=TA_CENTER, textColor=TEXT_MUTED)))
story.append(PageBreak())

# ═══════════════════════════════════════════════════
# TABLE OF CONTENTS
# ═══════════════════════════════════════════════════
story.append(Paragraph('<b>Table of Contents</b>', h1_style))
story.append(Spacer(1, 12))

toc_items = [
    ("1. Executive Summary", "Overview of the merger strategy and key decisions"),
    ("2. Repository Analysis Summary", "Deep-dive findings from all 5 repos"),
    ("3. Critical Issues & Logic Audit", "Bugs, security gaps, and broken logic found"),
    ("4. Merger Architecture", "How the two main repos will be merged"),
    ("5. Multi-Agent System Design", "Full agent orchestration with 24+ specialized agents"),
    ("6. Puppeteer/ChromeDriver Integration", "Real-time browser interaction layer"),
    ("7. Reference Feature Integration", "Features from youtube-heatmap-clipper, Pixelle-Video, etc."),
    ("8. Database Schema Merger", "Unified 25+ table schema from both repos"),
    ("9. Security Hardening Plan", "Authentication, authorization, input validation"),
    ("10. Implementation Roadmap", "Phase-by-phase execution plan"),
]
for title, desc in toc_items:
    story.append(Paragraph(f'<b>{title}</b>', ParagraphStyle('TOCItem',
        fontName='DejaVu', fontSize=12, leading=18, textColor=TEXT_PRIMARY, spaceAfter=2)))
    story.append(Paragraph(desc, ParagraphStyle('TOCDesc',
        fontName='DejaVu', fontSize=10, leading=14, textColor=TEXT_MUTED, leftIndent=20, spaceAfter=8)))

story.append(PageBreak())

# ═══════════════════════════════════════════════════
# 1. EXECUTIVE SUMMARY
# ═══════════════════════════════════════════════════
story.append(h1('1. Executive Summary'))
story.append(p('This document presents a comprehensive merger blueprint for combining GhostStudio AI (the target repository) with AI Media Intelligence OS (the source repository), while integrating valuable features from three additional reference repositories: youtube-heatmap-clipper, Clipper-AI, and Pixelle-Video. The fourth reference repo (Auto-Tiktok-Affiliate-AI) could not be accessed as it appears to be a private repository. The merger will be executed as an upgrade to the GhostStudio AI repository, preserving its existing structure while dramatically enhancing its capabilities.'))
story.append(p('The core philosophy of this merger is to create a single, extraordinary project that embodies the "True Loop" concept from AI Media Intelligence OS: Signal, Interpretation, Content, Distribution, Audience, Analytics, Memory, and Strategy Update. This loop represents the complete lifecycle of intelligent content creation and distribution, where every piece of data feeds back into the system to improve future output. GhostStudio AI already has the scaffolding for this vision with its 16 agents, OS dashboard, and pipeline architecture, but most of the critical functionality is currently stubbed or returns placeholder data.'))
story.append(p('The merger addresses three fundamental problems discovered during the logic audit. First, security is critically weak: most API routes have no authentication, password hashing uses SHA-256 instead of bcrypt, and mass assignment vulnerabilities exist across multiple endpoints. Second, core functionality is non-functional: content generation, video rendering, browser automation, and scheduler processing all return stub data without actually executing. Third, the architecture has structural issues: the OS dashboard is a 3000-line single-file component, duplicate store exports create confusion, and the codebase lacks any test coverage whatsoever.'))

story.append(Spacer(1, 12))
story.append(h2('1.1 Key Merger Decisions'))

decisions_data = [
    [Paragraph('<b>Decision</b>', table_header_style), Paragraph('<b>Choice</b>', table_header_style), Paragraph('<b>Rationale</b>', table_header_style)],
    [Paragraph('Target Repository', table_cell_style), Paragraph('ghoststudio-ai', table_cell_center), Paragraph('More complete scaffold with 16 agents, Puppeteer stubs, video/heatmap engines', table_cell_style)],
    [Paragraph('Database', table_cell_style), Paragraph('Prisma (merged schema)', table_cell_center), Paragraph('Combine 21 models from GS + 13 from AMI; add TikTok, Heatmap, Video tables', table_cell_style)],
    [Paragraph('Agent System', table_cell_style), Paragraph('24+ specialized agents', table_cell_center), Paragraph('Expand from 16 stubs to 24+ fully functional agents with real LLM calls', table_cell_style)],
    [Paragraph('Browser Automation', table_cell_style), Paragraph('Puppeteer (primary)', table_cell_center), Paragraph('Already in GS codebase; add ChromeDriver fallback for complex scenarios', table_cell_style)],
    [Paragraph('Video Engine', table_cell_style), Paragraph('Pixelle-Video pipeline', table_cell_center), Paragraph('Much more mature than GS stub; has ComfyUI, Playwright rendering, TTS', table_cell_style)],
    [Paragraph('Heatmap Engine', table_cell_style), Paragraph('youtube-heatmap-clipper', table_cell_center), Paragraph('Working Python microservice; integrate into FastAPI heatmap-engine', table_cell_style)],
    [Paragraph('Dashboard', table_cell_style), Paragraph('Modular component split', table_cell_center), Paragraph('Break 3000-line OS page into per-tab components', table_cell_style)],
    [Paragraph('Auth', table_cell_style), Paragraph('bcrypt + session auth on all routes', table_cell_center), Paragraph('Fix critical security gap; add middleware auth checks', table_cell_style)],
]
story.append(make_table(decisions_data, [0.20, 0.25, 0.55]))

story.append(PageBreak())

# ═══════════════════════════════════════════════════
# 2. REPOSITORY ANALYSIS SUMMARY
# ═══════════════════════════════════════════════════
story.append(h1('2. Repository Analysis Summary'))
story.append(p('Five repositories were cloned and deeply analyzed. Each repository was examined for its directory structure, dependencies, tech stack, API routes, database schema, code quality, and integration potential. The following table provides a high-level comparison of the key metrics across all repositories.'))

repo_data = [
    [Paragraph('<b>Metric</b>', table_header_style), Paragraph('<b>ghoststudio-ai</b>', table_header_style), Paragraph('<b>ai-media-intel-os</b>', table_header_style), Paragraph('<b>yt-heatmap</b>', table_header_style), Paragraph('<b>Pixelle-Video</b>', table_header_style), Paragraph('<b>Clipper-AI</b>', table_header_style)],
    [Paragraph('Language', table_cell_style), Paragraph('TypeScript/Python', table_cell_center), Paragraph('TypeScript', table_cell_center), Paragraph('Python', table_cell_center), Paragraph('Python', table_cell_center), Paragraph('None (empty)', table_cell_center)],
    [Paragraph('DB Models', table_cell_style), Paragraph('21', table_cell_center), Paragraph('13', table_cell_center), Paragraph('0', table_cell_center), Paragraph('0', table_cell_center), Paragraph('0', table_cell_center)],
    [Paragraph('Agents', table_cell_style), Paragraph('16 (stubs)', table_cell_center), Paragraph('10 (stubs)', table_cell_center), Paragraph('0', table_cell_center), Paragraph('0', table_cell_center), Paragraph('0', table_cell_center)],
    [Paragraph('API Routes', table_cell_style), Paragraph('25+', table_cell_center), Paragraph('18+', table_cell_center), Paragraph('7', table_cell_center), Paragraph('18', table_cell_center), Paragraph('0', table_cell_center)],
    [Paragraph('Auth', table_cell_style), Paragraph('Weak', table_cell_center), Paragraph('Broken', table_cell_center), Paragraph('None', table_cell_center), Paragraph('None', table_cell_center), Paragraph('N/A', table_cell_center)],
    [Paragraph('Tests', table_cell_style), Paragraph('0', table_cell_center), Paragraph('0', table_cell_center), Paragraph('0', table_cell_center), Paragraph('0', table_cell_center), Paragraph('0', table_cell_center)],
    [Paragraph('Functional', table_cell_style), Paragraph('Scaffold', table_cell_center), Paragraph('Scaffold', table_cell_center), Paragraph('Working', table_cell_center), Paragraph('Working', table_cell_center), Paragraph('Empty', table_cell_center)],
]
story.append(make_table(repo_data, [0.12, 0.16, 0.16, 0.14, 0.14, 0.12]))

story.append(Spacer(1, 12))
story.append(h2('2.1 GhostStudio AI (Target Repo)'))
story.append(p('GhostStudio AI is the most complete scaffold of the two main repositories. It has 21 Prisma models covering users, workspaces, content items, video projects, heatmap jobs, scheduler jobs, memory entries, energy tracking, analytics, and subscriptions. The project includes 16 AI agents (draft, humanic, scoring, SEO, publish, memory, strategy, clip, heatmap, script, voice, image, repurpose, tagging, video-compose, and browser agents), though most return placeholder data. The OS dashboard features 8 tabs (Content Pipeline, Video Studio, Viral Lab, Scheduler, Memory, Analytics, Energy, and Browser Lab) but is implemented as a monolithic 3000-line single-file component.'))
story.append(p('The codebase also includes two Python FastAPI microservices: a heatmap-engine for YouTube heatmap scanning and clipping, and a video-engine for video generation and rendering. Both are functional scaffolds but lack complete implementations. The project uses Next.js 16 with App Router, Zustand for state management, TanStack Query for server state, NextAuth v4 for authentication, Stripe for payments, and Puppeteer for browser automation (currently stubbed).'))

story.append(Spacer(1, 8))
story.append(h2('2.2 AI Media Intelligence OS (Source Repo)'))
story.append(p('AI Media Intelligence OS has a more mature conceptual architecture with extensive documentation (15+ docs covering architecture, database, agents, memory, content engine, scoring, platform strategy, AI routing, energy system, and scheduler). It implements the "True Loop" philosophy and Content DNA system, which provides a genetic blueprint for all content generated by the system. The Content DNA stores voice, tone, audience, niche, perspective, values, avoid patterns, and signature moves in the Workspace settings, ensuring consistency across all generated content.'))
story.append(p('However, the implementation has critical bugs. The auth system references database fields that do not exist in the Prisma schema (the User model has no "plan" field, and there is no Subscription model), causing OAuth sign-in to crash at runtime. There are duplicate store exports creating naming collisions, two competing dashboard systems that are disconnected from each other, and the Content DNA configuration is documented extensively but never actually injected into AI prompts. The scheduler job processors are stubs that return hardcoded messages without calling the AI orchestrator. The energy system has a bug where the "audience exhaustion" category incorrectly falls through to the "publish saturation" tracking function.'))

story.append(Spacer(1, 8))
story.append(h2('2.3 YouTube Heatmap Clipper'))
story.append(p('This is the only fully functional repository among the reference repos. It implements YouTube "Most Replayed" heatmap extraction via HTML scraping (no API key needed), automated clip generation with FFmpeg (download, crop, transcode, subtitle burn), multi-ratio video repurposing (16:9 to 9:16, 1:1), AI subtitle generation with faster-whisper, and a clean Flask web UI with i18n support. The core heatmap extraction algorithm uses regex to parse YouTube page HTML for heatMarkerRenderer data, filters by intensity score, and sorts by engagement. The clip generation pipeline supports center-crop and split-crop (for gaming facecam layouts).'))
story.append(p('Key issues include thread-unsafe global state (12+ module-level globals mutated freely), in-memory job store with no persistence, hardcoded Indonesian language for Whisper transcription, temp file naming collisions under concurrent access, and Flask running in debug mode. Despite these issues, the core algorithms are solid and represent high-value integration candidates for the merged project.'))

story.append(Spacer(1, 8))
story.append(h2('2.4 Pixelle-Video'))
story.append(p('Pixelle-Video is a comprehensive video generation platform with a well-architected pipeline system using the Template Method Pattern. It features a FastAPI backend with 18 API endpoints, a Streamlit web UI, ComfyUI workflow integration for AI image and video generation (supporting FLUX, SDXL, SD3.5, WAN 2.1/2.2), local Edge-TTS and cloud TTS support, Playwright-based HTML frame rendering with 29+ templates, ffmpeg-python video composition with intelligent audio/video duration matching, and both self-hosted and cloud (RunningHub) GPU support.'))
story.append(p('The pipeline architecture defines 8 lifecycle steps (setup, generate content, determine title, plan visuals, initialize storyboard, produce assets, post-production, finalize) that subclasses override. Three pipeline implementations exist: StandardPipeline (default), CustomPipeline (extensible template), and AssetBasedPipeline (user-provided media). The frame processing pipeline (TTS to audio, image/video generation, HTML template composition, ffmpeg video segment) is the core reusable unit. Key bugs include a path traversal risk in the file server, AssetBasedPipeline returning the wrong type, and a digital human workflow passing string representations instead of file paths.'))

story.append(Spacer(1, 8))
story.append(h2('2.5 Clipper-AI'))
story.append(p('Clipper-AI is an empty scaffold repository containing only documentation files and GitHub community templates. It has zero source code, zero dependencies, zero API endpoints, and zero algorithms. The README describes planned features including AI-powered text clipping, smart summarization, clipboard history management, and multi-language support, but none of these have been implemented. The version numbers in the changelog (v1.1.0, v1.2.0) are misleading as no functional software exists. While the concepts are relevant to a media intelligence platform, there is nothing from this repository that can be directly integrated. The features described will need to be built from scratch within the merged project if desired.'))

story.append(PageBreak())

# ═══════════════════════════════════════════════════
# 3. CRITICAL ISSUES & LOGIC AUDIT
# ═══════════════════════════════════════════════════
story.append(h1('3. Critical Issues & Logic Audit'))
story.append(p('The logic audit uncovered 23 critical and significant issues across the two main repositories. These issues must be resolved as part of the merger, as they represent fundamental problems that would prevent the system from functioning correctly in production. The issues are categorized by severity and repository below.'))

story.append(Spacer(1, 8))
story.append(h2('3.1 Security Critical (Must Fix First)'))

sec_data = [
    [Paragraph('<b>#</b>', table_header_style), Paragraph('<b>Issue</b>', table_header_style), Paragraph('<b>Repo</b>', table_header_style), Paragraph('<b>Impact</b>', table_header_style), Paragraph('<b>Fix</b>', table_header_style)],
    [Paragraph('S1', table_cell_center), Paragraph('No auth on most API routes', table_cell_style), Paragraph('Both', table_cell_center), Paragraph('Anyone can access/modify any workspace data', table_cell_style), Paragraph('Add getServerSession checks to all routes', table_cell_style)],
    [Paragraph('S2', table_cell_center), Paragraph('SHA-256 password hashing', table_cell_style), Paragraph('GS', table_cell_center), Paragraph('Brute-force attacks trivial', table_cell_style), Paragraph('Replace with bcrypt/argon2', table_cell_style)],
    [Paragraph('S3', table_cell_center), Paragraph('Mass assignment vulnerability', table_cell_style), Paragraph('GS', table_cell_center), Paragraph('Attackers can modify workspaceId, scores, status', table_cell_style), Paragraph('Whitelist allowed fields in PUT handlers', table_cell_style)],
    [Paragraph('S4', table_cell_center), Paragraph('No input validation on most routes', table_cell_style), Paragraph('Both', table_cell_center), Paragraph('Malicious data passed directly to Prisma', table_cell_style), Paragraph('Add Zod schemas to all endpoints', table_cell_style)],
    [Paragraph('S5', table_cell_center), Paragraph('Auth references non-existent DB fields', table_cell_style), Paragraph('AMI', table_cell_center), Paragraph('OAuth sign-in crashes at runtime', table_cell_style), Paragraph('Add missing Subscription model and plan field', table_cell_style)],
    [Paragraph('S6', table_cell_center), Paragraph('Path traversal in file server', table_cell_style), Paragraph('Pixelle', table_cell_center), Paragraph('Read arbitrary files from server', table_cell_style), Paragraph('Validate paths with resolve + startswith check', table_cell_style)],
]
story.append(make_table(sec_data, [0.05, 0.22, 0.08, 0.30, 0.35]))

story.append(Spacer(1, 12))
story.append(h2('3.2 Logic Critical (Core Functionality Broken)'))

logic_data = [
    [Paragraph('<b>#</b>', table_header_style), Paragraph('<b>Issue</b>', table_header_style), Paragraph('<b>Repo</b>', table_header_style), Paragraph('<b>Impact</b>', table_header_style), Paragraph('<b>Fix</b>', table_header_style)],
    [Paragraph('L1', table_cell_center), Paragraph('Content generation does not actually generate', table_cell_style), Paragraph('GS', table_cell_center), Paragraph('Content pipeline is non-functional', table_cell_style), Paragraph('Wire generate route to AI orchestrator pipeline', table_cell_style)],
    [Paragraph('L2', table_cell_center), Paragraph('Video generation pipeline does not execute', table_cell_style), Paragraph('GS', table_cell_center), Paragraph('Video studio is non-functional', table_cell_style), Paragraph('Integrate Pixelle-Video pipeline as backend', table_cell_style)],
    [Paragraph('L3', table_cell_center), Paragraph('Browser routes are no-ops', table_cell_style), Paragraph('GS', table_cell_center), Paragraph('Browser Lab tab does nothing', table_cell_style), Paragraph('Implement real Puppeteer session management', table_cell_style)],
    [Paragraph('L4', table_cell_center), Paragraph('Scheduler process does not execute jobs', table_cell_style), Paragraph('Both', table_cell_center), Paragraph('Jobs queue but never run', table_cell_style), Paragraph('Wire processJob() to actual agent execution', table_cell_style)],
    [Paragraph('L5', table_cell_center), Paragraph('Content DNA never injected into AI prompts', table_cell_style), Paragraph('AMI', table_cell_center), Paragraph('Generated content ignores workspace personality', table_cell_style), Paragraph('Read settingsJson and inject into system prompts', table_cell_style)],
    [Paragraph('L6', table_cell_center), Paragraph('Duplicate scoring implementations', table_cell_style), Paragraph('AMI', table_cell_center), Paragraph('Two conflicting scoring paths', table_cell_style), Paragraph('Consolidate to single 4-dimension scorer', table_cell_style)],
    [Paragraph('L7', table_cell_center), Paragraph('Energy audience_exhaustion falls through to wrong function', table_cell_style), Paragraph('AMI', table_cell_center), Paragraph('Two fatigue concepts conflated', table_cell_style), Paragraph('Add dedicated trackAudienceExhaustion()', table_cell_style)],
]
story.append(make_table(logic_data, [0.05, 0.25, 0.08, 0.28, 0.34]))

story.append(Spacer(1, 12))
story.append(h2('3.3 Architecture Issues'))

arch_data = [
    [Paragraph('<b>#</b>', table_header_style), Paragraph('<b>Issue</b>', table_header_style), Paragraph('<b>Repo</b>', table_header_style), Paragraph('<b>Fix</b>', table_header_style)],
    [Paragraph('A1', table_cell_center), Paragraph('3000-line single-file OS dashboard', table_cell_style), Paragraph('GS', table_cell_center), Paragraph('Split into per-tab component files', table_cell_style)],
    [Paragraph('A2', table_cell_center), Paragraph('Duplicate useAppStore exports', table_cell_style), Paragraph('AMI', table_cell_center), Paragraph('Consolidate into single store', table_cell_style)],
    [Paragraph('A3', table_cell_center), Paragraph('Two competing dashboard systems', table_cell_style), Paragraph('AMI', table_cell_center), Paragraph('Remove /dashboard/ routes; use single /os page', table_cell_style)],
    [Paragraph('A4', table_cell_center), Paragraph('OS dashboard uses mock data, not TanStack hooks', table_cell_style), Paragraph('GS', table_cell_center), Paragraph('Replace mock data with real API hooks', table_cell_style)],
    [Paragraph('A5', table_cell_center), Paragraph('Pricing discrepancy (landing vs Stripe config)', table_cell_style), Paragraph('GS', table_cell_center), Paragraph('Align prices across all references', table_cell_style)],
    [Paragraph('A6', table_cell_center), Paragraph('ESLint effectively disabled', table_cell_style), Paragraph('GS', table_cell_center), Paragraph('Re-enable key rules incrementally', table_cell_style)],
    [Paragraph('A7', table_cell_center), Paragraph('In-memory rate limiting', table_cell_style), Paragraph('GS', table_cell_center), Paragraph('Use Redis-backed rate limiter for production', table_cell_style)],
    [Paragraph('A8', table_cell_center), Paragraph('No test coverage anywhere', table_cell_style), Paragraph('Both', table_cell_center), Paragraph('Add Jest + Playwright tests for critical paths', table_cell_style)],
]
story.append(make_table(arch_data, [0.05, 0.30, 0.08, 0.57]))

story.append(PageBreak())

# ═══════════════════════════════════════════════════
# 4. MERGER ARCHITECTURE
# ═══════════════════════════════════════════════════
story.append(h1('4. Merger Architecture'))
story.append(p('The merger follows a "best of both" strategy: GhostStudio AI serves as the structural foundation (more complete scaffold, more agents, more features), while AI Media Intelligence OS contributes its conceptual architecture (True Loop, Content DNA, 7-layer design), documentation, and working implementations that GhostStudio lacks. Reference repos contribute specific working components: youtube-heatmap-clipper for the heatmap engine, Pixelle-Video for the video engine, and Clipper-AI provides only conceptual guidance.'))

story.append(Spacer(1, 8))
story.append(h2('4.1 What We Keep from GhostStudio AI'))
story.append(bullet('Project structure, package.json, Next.js 16 App Router setup'))
story.append(bullet('21 Prisma models (expanded to 25+ with merged additions)'))
story.append(bullet('16 agent stubs (expanded to 24+ with full implementations)'))
story.append(bullet('OS dashboard concept with 8 tabs (split into modular components)'))
story.append(bullet('Auth system with NextAuth v4 (fixed and hardened)'))
story.append(bullet('Stripe integration (with pricing fix)'))
story.append(bullet('Landing page with Framer Motion animations'))
story.append(bullet('Puppeteer browser automation structure (fully implemented)'))
story.append(bullet('TanStack Query hooks (connected to real data)'))
story.append(bullet('Python microservices architecture (heatmap + video engines)'))

story.append(Spacer(1, 8))
story.append(h2('4.2 What We Take from AI Media Intelligence OS'))
story.append(bullet('True Loop philosophy: Signal, Interpretation, Content, Distribution, Audience, Analytics, Memory, Strategy Update'))
story.append(bullet('Content DNA system with workspace-scoped voice, tone, audience, perspective, values, avoid patterns, and signature moves'))
story.append(bullet('7-layer architecture: Presentation, Orchestration, Agents, Engine, Memory, Scheduler, Persistence'))
story.append(bullet('AI Orchestrator with model tier routing (cheap/mid/premium) per task type'))
story.append(bullet('Memory system with reinforcement learning, pattern detection, decay, and platform behavior aggregation'))
story.append(bullet('Content scoring with 4 dimensions (Quality 30%, Humanic 30%, SEO 20%, Trust 20%)'))
story.append(bullet('Energy system with 5 fatigue categories and time-based natural decay'))
story.append(bullet('WordPress publisher with exponential backoff retry'))
story.append(bullet('Publisher Factory pattern with 9 platform registry'))
story.append(bullet('Daily autonomous cycle for job processing, content scheduling, and cleanup'))
story.append(bullet('15+ documentation files covering all system aspects'))

story.append(Spacer(1, 8))
story.append(h2('4.3 What We Take from Reference Repos'))
story.append(bullet('<b>youtube-heatmap-clipper</b>: Heatmap extraction algorithm (ambil_most_replayed), FFmpeg clip generation pipeline with multi-ratio crop, faster-whisper subtitle generation, split-crop for gaming facecam, progress estimation with easing'))
story.append(bullet('<b>Pixelle-Video</b>: Linear video pipeline (8-step Template Method Pattern), ComfyKit workflow abstraction (self-host + RunningHub), HTML frame rendering via Playwright with 29+ templates, TTS service (Edge-TTS + cloud), ffmpeg-python video composition, asset-based pipeline for user-provided media'))
story.append(bullet('<b>Clipper-AI</b>: Conceptual reference only (AI text clipping, smart summarization) - must be built from scratch'))

story.append(Spacer(1, 8))
story.append(h2('4.4 Merged Architecture Diagram'))
story.append(p('The merged system follows a 7-layer architecture with the True Loop at its core:'))

arch_layers = [
    [Paragraph('<b>Layer</b>', table_header_style), Paragraph('<b>Name</b>', table_header_style), Paragraph('<b>Components</b>', table_header_style)],
    [Paragraph('7', table_cell_center), Paragraph('Presentation', table_cell_style), Paragraph('Next.js App Router + shadcn/ui + Modular Tab Components + Landing Page', table_cell_style)],
    [Paragraph('6', table_cell_center), Paragraph('Orchestration', table_cell_style), Paragraph('AI Orchestrator (model tier routing) + True Loop Engine + Pipeline Runner', table_cell_style)],
    [Paragraph('5', table_cell_center), Paragraph('Agents', table_cell_style), Paragraph('24+ Specialized Agents (Draft, Humanic, SEO, Repurpose, Scoring, Memory, Strategy, Clip, Heatmap, Script, Voice, Image, Video, Browser, TikTok, etc.)', table_cell_style)],
    [Paragraph('4', table_cell_center), Paragraph('Engine', table_cell_style), Paragraph('Content DNA + Scoring Engine + Energy System + Video Pipeline (Pixelle) + Heatmap Pipeline (YT)', table_cell_style)],
    [Paragraph('3', table_cell_center), Paragraph('Memory', table_cell_style), Paragraph('Reinforcement Learning Memory + Pattern Detection + Decay + Platform Behavior + Context Injection', table_cell_style)],
    [Paragraph('2', table_cell_center), Paragraph('Scheduler', table_cell_style), Paragraph('Persistent Job Queue + Priority + Locking + Retry + Dead Letter + Daily Cycle + BullMQ (Redis)', table_cell_style)],
    [Paragraph('1', table_cell_center), Paragraph('Persistence', table_cell_style), Paragraph('Prisma ORM (25+ models) + PostgreSQL + Redis Cache + Cloudflare R2 Storage', table_cell_style)],
]
story.append(make_table(arch_layers, [0.08, 0.15, 0.77]))

story.append(PageBreak())

# ═══════════════════════════════════════════════════
# 5. MULTI-AGENT SYSTEM DESIGN
# ═══════════════════════════════════════════════════
story.append(h1('5. Multi-Agent System Design'))
story.append(p('The merged system will feature 24+ specialized AI agents, each with a clearly defined responsibility, model tier assignment, and integration point. Every agent will make real LLM calls via the z-ai-web-dev-sdk, with the AI Orchestrator routing tasks to the appropriate agent based on job type and model tier. The model tier system uses three levels: "cheap" for high-volume, low-complexity tasks (gpt-4o-mini), "mid" for balanced tasks (claude-3.5-sonnet), and "premium" for complex reasoning tasks (claude-3-opus).'))

story.append(Spacer(1, 8))
story.append(h2('5.1 Complete Agent Registry'))

agent_data = [
    [Paragraph('<b>#</b>', table_header_style), Paragraph('<b>Agent</b>', table_header_style), Paragraph('<b>Tier</b>', table_header_style), Paragraph('<b>Responsibility</b>', table_header_style), Paragraph('<b>Source</b>', table_header_style)],
    [Paragraph('1', table_cell_center), Paragraph('Draft Agent', table_cell_style), Paragraph('premium', table_cell_center), Paragraph('Generate canonical content from ideas with DNA context', table_cell_style), Paragraph('Both', table_cell_center)],
    [Paragraph('2', table_cell_center), Paragraph('Humanic Agent', table_cell_style), Paragraph('premium', table_cell_center), Paragraph('Rewrite content to pass AI detection using 10 Humanic Rules', table_cell_style), Paragraph('Both', table_cell_center)],
    [Paragraph('3', table_cell_center), Paragraph('SEO Agent', table_cell_style), Paragraph('mid', table_cell_center), Paragraph('Generate SEO pack: meta, keywords, schema, headings', table_cell_style), Paragraph('Both', table_cell_center)],
    [Paragraph('4', table_cell_center), Paragraph('Repurpose Agent', table_cell_style), Paragraph('mid', table_cell_center), Paragraph('Adapt content for each platform with tone adjustment', table_cell_style), Paragraph('Both', table_cell_center)],
    [Paragraph('5', table_cell_center), Paragraph('Scoring Agent', table_cell_style), Paragraph('mid', table_cell_center), Paragraph('4-dimension scoring: Quality, Humanic, SEO, Trust', table_cell_style), Paragraph('Both', table_cell_center)],
    [Paragraph('6', table_cell_center), Paragraph('Memory Agent', table_cell_style), Paragraph('cheap', table_cell_center), Paragraph('Store/retrieve/reinforce memory entries with pattern detection', table_cell_style), Paragraph('Both', table_cell_center)],
    [Paragraph('7', table_cell_center), Paragraph('Strategy Agent', table_cell_style), Paragraph('premium', table_cell_center), Paragraph('Analyze analytics + memory to update content strategy', table_cell_style), Paragraph('Both', table_cell_center)],
    [Paragraph('8', table_cell_center), Paragraph('Tagging Agent', table_cell_style), Paragraph('cheap', table_cell_center), Paragraph('Auto-classify content with topic/format/niche/tone tags', table_cell_style), Paragraph('GS', table_cell_center)],
    [Paragraph('9', table_cell_center), Paragraph('Script Agent', table_cell_style), Paragraph('mid', table_cell_center), Paragraph('Generate video scripts with scene breakdowns', table_cell_style), Paragraph('GS', table_cell_center)],
    [Paragraph('10', table_cell_center), Paragraph('Voice Agent', table_cell_style), Paragraph('cheap', table_cell_center), Paragraph('TTS voice selection and narration generation', table_cell_style), Paragraph('GS', table_cell_center)],
    [Paragraph('11', table_cell_center), Paragraph('Image Agent', table_cell_style), Paragraph('mid', table_cell_center), Paragraph('AI image generation via ComfyUI/Replicate', table_cell_style), Paragraph('GS', table_cell_center)],
    [Paragraph('12', table_cell_center), Paragraph('Video Compose Agent', table_cell_style), Paragraph('mid', table_cell_center), Paragraph('Compose video scenes with templates + media + TTS', table_cell_style), Paragraph('GS', table_cell_center)],
    [Paragraph('13', table_cell_center), Paragraph('Publish Agent', table_cell_style), Paragraph('cheap', table_cell_center), Paragraph('Execute publishing to platforms via Publisher Factory', table_cell_style), Paragraph('GS', table_cell_center)],
    [Paragraph('14', table_cell_center), Paragraph('Clip Agent', table_cell_style), Paragraph('mid', table_cell_center), Paragraph('Extract viral clips from heatmap data', table_cell_style), Paragraph('GS', table_cell_center)],
    [Paragraph('15', table_cell_center), Paragraph('Heatmap Agent', table_cell_style), Paragraph('cheap', table_cell_center), Paragraph('Scan YouTube heatmaps and extract engagement segments', table_cell_style), Paragraph('GS+YT', table_cell_center)],
    [Paragraph('16', table_cell_center), Paragraph('Browser Agent', table_cell_style), Paragraph('cheap', table_cell_center), Paragraph('Execute Puppeteer actions for live testing and publishing', table_cell_style), Paragraph('GS', table_cell_center)],
    [Paragraph('17', table_cell_center), Paragraph('TikTok Agent', table_cell_style), Paragraph('mid', table_cell_center), Paragraph('TikTok content creation, scheduling, affiliate linking', table_cell_style), Paragraph('New', table_cell_center)],
    [Paragraph('18', table_cell_center), Paragraph('Thumbnail Agent', table_cell_style), Paragraph('mid', table_cell_center), Paragraph('Generate click-optimized thumbnails for videos', table_cell_style), Paragraph('New', table_cell_center)],
    [Paragraph('19', table_cell_center), Paragraph('Caption Agent', table_cell_style), Paragraph('cheap', table_cell_center), Paragraph('Generate captions/subtitles via Whisper + translation', table_cell_style), Paragraph('YT+Pixelle', table_cell_center)],
    [Paragraph('20', table_cell_center), Paragraph('Trend Agent', table_cell_style), Paragraph('mid', table_cell_center), Paragraph('Detect trending topics and signals from web/social data', table_cell_style), Paragraph('New', table_cell_center)],
    [Paragraph('21', table_cell_center), Paragraph('Review Agent', table_cell_style), Paragraph('premium', table_cell_center), Paragraph('Human-in-the-loop review: approve/reject/modify content', table_cell_style), Paragraph('New', table_cell_center)],
    [Paragraph('22', table_cell_center), Paragraph('Format Agent', table_cell_style), Paragraph('cheap', table_cell_center), Paragraph('Format content to platform-specific requirements', table_cell_style), Paragraph('AMI', table_cell_center)],
    [Paragraph('23', table_cell_center), Paragraph('Summary Agent', table_cell_style), Paragraph('cheap', table_cell_center), Paragraph('Generate summaries and key point extraction', table_cell_style), Paragraph('AMI', table_cell_center)],
    [Paragraph('24', table_cell_center), Paragraph('QA Agent', table_cell_style), Paragraph('mid', table_cell_center), Paragraph('Pre-publish quality assurance checks and validation', table_cell_style), Paragraph('New', table_cell_center)],
]
story.append(make_table(agent_data, [0.04, 0.14, 0.07, 0.58, 0.10]))

story.append(Spacer(1, 12))
story.append(h2('5.2 Agent Orchestration Flow'))
story.append(p('The AI Orchestrator receives tasks from the Scheduler or direct API calls, resolves the appropriate agent and model tier, injects Content DNA and Memory context into the system prompt, executes the LLM call via z-ai-web-dev-sdk, parses the structured response, logs the result to SystemLog, and updates Memory entries via reinforcement learning. Each agent follows a consistent pattern: receive task context, call LLM with DNA-injected prompt, parse response, update database, return result. The orchestrator supports sequential pipelines (draft, then humanic, then SEO, then score) and parallel execution for independent agents (e.g., scoring 4 dimensions simultaneously).'))

story.append(h3('Content Pipeline Flow'))
story.append(p('Idea (Signal) - Draft Agent generates canonical content using DNA context and memory-informed hooks and topics. The draft agent pulls the top-performing hooks and topics from the memory system to guide its generation, ensuring that new content builds on proven patterns rather than starting from scratch.'))
story.append(p('Humanic Rewrite - Humanic Agent applies the 10 Humanic Rules to make the content feel genuinely human-written. This includes breaking repetitive sentence structures, removing generic transitions, adding personality and conviction, using contractions, creating unexpected transitions, and eliminating hedging language. The agent also checks alignment with the workspace Content DNA values and avoid patterns.'))
story.append(p('SEO Optimization - SEO Agent generates a comprehensive SEO pack including meta title and description, focus and secondary keywords, heading structure recommendations, internal link suggestions, schema markup, and readability score. The SEO agent considers the platform target and adjusts its recommendations accordingly.'))
story.append(p('Scoring - Scoring Agent evaluates the content on 4 dimensions (Quality 30%, Humanic 30%, SEO 20%, Trust 20%) and produces a composite score. Based on the score, the content is either auto-scheduled for publication (score 80+), flagged for human review (60-79), or rejected for rewrite (below 60). Trust scoring includes hallucination risk detection and confidence assessment.'))
story.append(p('Publishing - Publish Agent executes the distribution through the Publisher Factory, checking energy levels first to prevent audience fatigue. The agent selects the optimal timing based on memory-informed platform behavior data and creates scheduler jobs for each platform variant.'))

story.append(PageBreak())

# ═══════════════════════════════════════════════════
# 6. PUPPETEER/CHROMEDRIVER INTEGRATION
# ═══════════════════════════════════════════════════
story.append(h1('6. Puppeteer/ChromeDriver Integration'))
story.append(p('The browser automation layer is one of the most critical additions to the merged system. It enables real-time screen interaction, live testing of published content, automated posting to platforms that lack APIs, visual regression testing, and screenshot capture for analytics. The current implementation in GhostStudio AI has three API routes (/api/browser, /api/browser/interact, /api/browser/screenshot) that are all placeholders returning stub data. The browser-manager.ts, page-interactions.ts, platform-actions.ts, testing-runner.ts, and live-preview.ts modules exist but are not connected to the API routes.'))

story.append(Spacer(1, 8))
story.append(h2('6.1 Architecture'))

browser_arch = [
    [Paragraph('<b>Component</b>', table_header_style), Paragraph('<b>Technology</b>', table_header_style), Paragraph('<b>Purpose</b>', table_header_style)],
    [Paragraph('Browser Manager', table_cell_style), Paragraph('Puppeteer (primary)', table_cell_center), Paragraph('Session lifecycle, pool management, health checks', table_cell_style)],
    [Paragraph('Page Interactions', table_cell_style), Paragraph('Puppeteer + CDP', table_cell_center), Paragraph('Click, type, scroll, wait, evaluate JS on pages', table_cell_style)],
    [Paragraph('Platform Actions', table_cell_style), Paragraph('Puppeteer + custom scripts', table_cell_center), Paragraph('Auto-login, auto-post, auto-schedule on social platforms', table_cell_style)],
    [Paragraph('Testing Runner', table_cell_style), Paragraph('Puppeteer + Jest', table_cell_center), Paragraph('E2E testing, visual regression, accessibility checks', table_cell_style)],
    [Paragraph('Live Preview', table_cell_style), Paragraph('Puppeteer + WebSocket', table_cell_center), Paragraph('Real-time browser view streamed to dashboard', table_cell_style)],
    [Paragraph('ChromeDriver Fallback', table_cell_style), Paragraph('Selenium WebDriver', table_cell_center), Paragraph('Fallback for complex scenarios Puppeteer cannot handle', table_cell_style)],
]
story.append(make_table(browser_arch, [0.22, 0.22, 0.56]))

story.append(Spacer(1, 8))
story.append(h2('6.2 Browser Session Management'))
story.append(p('The Browser Manager will implement a pool-based session management system. Each browser instance runs in headless mode (configurable via PUPPETEER_HEADLESS env var) with a maximum concurrent instance limit (default: 5, configurable via PUPPETEER_MAX_INSTANCES). Sessions are created per-workspace with automatic cleanup after idle timeout (default: 5 minutes, configurable via PUPPETEER_IDLE_TIMEOUT). The manager tracks session state (active, idle, error) and provides health check endpoints for monitoring.'))
story.append(p('Each browser session maintains its own context with cookies, localStorage, and session storage persisted across navigation. This enables the system to log into platforms once and reuse the session for subsequent actions. The platform actions module provides pre-built scripts for common operations: login to WordPress admin, create draft, upload media, publish post; login to TikTok Creator, upload video, set caption and tags; login to YouTube Studio, upload video, set metadata. These scripts use the page interactions module for low-level operations and include error recovery with retry logic.'))
story.append(p('The Live Preview feature streams the browser viewport to the OS dashboard via WebSocket, allowing users to watch the automation in real-time and intervene manually if needed. The browser screenshot API captures high-resolution screenshots at any point during automation for analytics, thumbnails, or visual regression testing. The Testing Runner integrates with Jest to run E2E test suites against the live application, including visual comparison tests that detect UI regressions between deployments.'))

story.append(Spacer(1, 8))
story.append(h2('6.3 API Endpoints (Fully Implemented)'))

browser_api = [
    [Paragraph('<b>Endpoint</b>', table_header_style), Paragraph('<b>Method</b>', table_header_style), Paragraph('<b>Function</b>', table_header_style)],
    [Paragraph('/api/browser/session', table_cell_style), Paragraph('POST', table_cell_center), Paragraph('Create new browser session with platform context', table_cell_style)],
    [Paragraph('/api/browser/session/[id]', table_cell_style), Paragraph('GET/DELETE', table_cell_center), Paragraph('Get session status / Terminate session', table_cell_style)],
    [Paragraph('/api/browser/navigate', table_cell_style), Paragraph('POST', table_cell_center), Paragraph('Navigate session to URL with wait conditions', table_cell_style)],
    [Paragraph('/api/browser/interact', table_cell_style), Paragraph('POST', table_cell_center), Paragraph('Execute click/type/scroll/select actions on page', table_cell_style)],
    [Paragraph('/api/browser/screenshot', table_cell_style), Paragraph('POST', table_cell_center), Paragraph('Capture screenshot (full page or element)', table_cell_style)],
    [Paragraph('/api/browser/execute', table_cell_style), Paragraph('POST', table_cell_center), Paragraph('Run custom JavaScript in page context', table_cell_style)],
    [Paragraph('/api/browser/platform-action', table_cell_style), Paragraph('POST', table_cell_center), Paragraph('Execute pre-built platform automation script', table_cell_style)],
    [Paragraph('/api/browser/test', table_cell_style), Paragraph('POST', table_cell_center), Paragraph('Run E2E test suite and return results', table_cell_style)],
    [Paragraph('/api/browser/live', table_cell_style), Paragraph('WebSocket', table_cell_center), Paragraph('Stream live browser viewport to dashboard', table_cell_style)],
]
story.append(make_table(browser_api, [0.28, 0.12, 0.60]))

story.append(PageBreak())

# ═══════════════════════════════════════════════════
# 7. REFERENCE FEATURE INTEGRATION
# ═══════════════════════════════════════════════════
story.append(h1('7. Reference Feature Integration'))
story.append(p('The reference repositories contribute specific working components that significantly enhance the merged system. Each integration is designed to be modular, so that the core system can function without the optional components while benefiting from them when available.'))

story.append(Spacer(1, 8))
story.append(h2('7.1 YouTube Heatmap Clipper Integration'))
story.append(p('The youtube-heatmap-clipper provides the most valuable integration: a working YouTube engagement data extraction pipeline. The core algorithm (ambil_most_replayed) scrapes the YouTube watch page HTML and extracts heatMarkerRenderer data using regex, filters by intensity score (configurable threshold, default 0.40), sorts by engagement, and returns structured segment data. This replaces the current heatmap-engine stub with a fully functional implementation.'))
story.append(p('The integration plan involves refactoring the Flask-based clipper into a FastAPI module that fits within the existing heatmap-engine microservice. The global mutable state will be replaced with a ClipJob class that holds all configuration per-job, making it thread-safe. The in-memory job store will be replaced with the Prisma-backed SchedulerJob system for persistence and reliability. The Whisper transcription language will be made configurable (not hardcoded to Indonesian). FFmpeg command construction will be abstracted into a structured builder to prevent injection and improve testability.'))

story.append(Spacer(1, 8))
story.append(h2('7.2 Pixelle-Video Integration'))
story.append(p('Pixelle-Video provides a mature video generation pipeline that dramatically surpasses the current video-engine stub. The integration will replace the video-engine FastAPI microservice with a Pixelle-Video-based implementation that inherits its pipeline architecture, ComfyKit workflow abstraction, TTS service, HTML frame rendering, and ffmpeg-python video composition. The key components to integrate include:'))

pixelle_features = [
    [Paragraph('<b>Component</b>', table_header_style), Paragraph('<b>Current GS Status</b>', table_header_style), Paragraph('<b>Pixelle Contribution</b>', table_header_style)],
    [Paragraph('Pipeline Architecture', table_cell_style), Paragraph('Stub only', table_cell_center), Paragraph('8-step LinearVideoPipeline with Template Method Pattern', table_cell_style)],
    [Paragraph('Image Generation', table_cell_style), Paragraph('Replicate (stub)', table_cell_center), Paragraph('ComfyKit: FLUX, SDXL, SD3.5 via self-host or RunningHub', table_cell_style)],
    [Paragraph('Video Generation', table_cell_style), Paragraph('Stub only', table_cell_center), Paragraph('WAN 2.1/2.2, LTX2 workflows via ComfyKit', table_cell_style)],
    [Paragraph('TTS', table_cell_style), Paragraph('Edge-TTS (stub)', table_cell_center), Paragraph('Edge-TTS + Index-TTS + Spark TTS via ComfyUI', table_cell_style)],
    [Paragraph('Frame Rendering', table_cell_style), Paragraph('None', table_cell_center), Paragraph('Playwright HTML rendering with 29+ templates', table_cell_style)],
    [Paragraph('Video Composition', table_cell_style), Paragraph('FFmpeg CLI (stub)', table_cell_center), Paragraph('ffmpeg-python with intelligent duration matching', table_cell_style)],
    [Paragraph('Asset Pipeline', table_cell_style), Paragraph('None', table_cell_center), Paragraph('AI analyzes uploaded media and generates matching scripts', table_cell_style)],
]
story.append(make_table(pixelle_features, [0.18, 0.18, 0.64]))

story.append(Spacer(1, 8))
story.append(h2('7.3 TikTok Affiliate Integration'))
story.append(p('The Auto-Tiktok-Affiliate-AI repository could not be cloned (likely private), but based on its name and the user requirements, the merged system should include TikTok automation capabilities. These will be built from scratch as a new TikTok Agent and Platform Publisher. The TikTok Agent will handle content adaptation for TikTok format (9:16 vertical, under 60 seconds, hook-first structure), affiliate link generation and tracking, hashtag research and optimization, and scheduling for optimal posting times. The TikTok Publisher will extend the Publisher Factory with browser-based automation via Puppeteer, since TikTok lacks a public content posting API. This publisher will use the browser automation layer from Section 6 to log into TikTok Creator, upload videos, set captions and tags, and manage posting schedules.'))

story.append(PageBreak())

# ═══════════════════════════════════════════════════
# 8. DATABASE SCHEMA MERGER
# ═══════════════════════════════════════════════════
story.append(h1('8. Database Schema Merger'))
story.append(p('The merged database schema combines the 21 models from GhostStudio AI with the 13 models from AI Media Intelligence OS, resolving conflicts and adding new tables for TikTok, enhanced video pipeline, and improved analytics. The result is a unified 25+ model schema that preserves all functionality from both repos while adding new capabilities.'))

story.append(Spacer(1, 8))
story.append(h2('8.1 Schema Unification Decisions'))

schema_data = [
    [Paragraph('<b>Model</b>', table_header_style), Paragraph('<b>Source</b>', table_header_style), Paragraph('<b>Changes</b>', table_header_style)],
    [Paragraph('User', table_cell_style), Paragraph('Both (merged)', table_cell_center), Paragraph('Add plan field from AMI; add Subscription model; fix auth references', table_cell_style)],
    [Paragraph('Workspace', table_cell_style), Paragraph('Both (merged)', table_cell_center), Paragraph('Keep settingsJson with Content DNA; add automationConfig field', table_cell_style)],
    [Paragraph('ContentItem', table_cell_style), Paragraph('Both (merged)', table_cell_center), Paragraph('Keep all GS fields; add sourceNotes, sourceType from AMI', table_cell_style)],
    [Paragraph('ContentVariant', table_cell_style), Paragraph('Both (merged)', table_cell_center), Paragraph('Add TikTok to platform enum; add metadataJson', table_cell_style)],
    [Paragraph('SeoData', table_cell_style), Paragraph('Both (same)', table_cell_center), Paragraph('Keep as-is', table_cell_style)],
    [Paragraph('ContentTag', table_cell_style), Paragraph('Both (same)', table_cell_center), Paragraph('Keep as-is', table_cell_style)],
    [Paragraph('PublishJob', table_cell_style), Paragraph('Both (merged)', table_cell_center), Paragraph('Add isDryRun, responsePayload from AMI', table_cell_style)],
    [Paragraph('SchedulerJob', table_cell_style), Paragraph('Both (merged)', table_cell_center), Paragraph('Expand jobType enum; add TikTok job types', table_cell_style)],
    [Paragraph('AnalyticsEvent', table_cell_style), Paragraph('Both (merged)', table_cell_center), Paragraph('Add source field (auto/manual/api); add rawPayload', table_cell_style)],
    [Paragraph('MemoryEntry', table_cell_style), Paragraph('Both (merged)', table_cell_center), Paragraph('Add isActive flag; add contextJson; add source types', table_cell_style)],
    [Paragraph('EnergyEntry', table_cell_style), Paragraph('Both (merged)', table_cell_center), Paragraph('Add audience_exhaustion and hook_repetition categories', table_cell_style)],
    [Paragraph('VideoProject', table_cell_style), Paragraph('GS (kept)', table_cell_center), Paragraph('Keep all GS fields; add pipelineType, assetPaths', table_cell_style)],
    [Paragraph('VideoScene', table_cell_style), Paragraph('GS (kept)', table_cell_center), Paragraph('Add templateName from Pixelle; add htmlContent', table_cell_style)],
    [Paragraph('VideoAsset', table_cell_style), Paragraph('GS (kept)', table_cell_center), Paragraph('Keep as-is', table_cell_style)],
    [Paragraph('VideoTemplate', table_cell_style), Paragraph('GS+Pixelle', table_cell_center), Paragraph('Add htmlTemplate field; add category; add isPremium', table_cell_style)],
    [Paragraph('VideoRenderJob', table_cell_style), Paragraph('GS+Pixelle', table_cell_center), Paragraph('Add engineUrl, outputUrl; add progress tracking', table_cell_style)],
    [Paragraph('HeatmapClipJob', table_cell_style), Paragraph('GS+YT', table_cell_center), Paragraph('Add transcriptData, clipReason, peakScore from YT', table_cell_style)],
    [Paragraph('Subscription', table_cell_style), Paragraph('New', table_cell_center), Paragraph('Add from AMI design (was missing from schema); Stripe integration', table_cell_style)],
    [Paragraph('ApiCredential', table_cell_style), Paragraph('AMI (kept)', table_cell_center), Paragraph('Keep for platform API tokens and credentials', table_cell_style)],
    [Paragraph('SystemLog', table_cell_style), Paragraph('Both (same)', table_cell_center), Paragraph('Keep as-is; essential for audit trail', table_cell_style)],
    [Paragraph('TikTokCampaign', table_cell_style), Paragraph('New', table_cell_center), Paragraph('TikTok affiliate campaigns, links, tracking, revenue', table_cell_style)],
    [Paragraph('BrowserSession', table_cell_style), Paragraph('New', table_cell_center), Paragraph('Active Puppeteer sessions with state tracking', table_cell_style)],
    [Paragraph('ContentTest', table_cell_style), Paragraph('New', table_cell_center), Paragraph('A/B test results, visual regression, E2E outcomes', table_cell_style)],
]
story.append(make_table(schema_data, [0.17, 0.12, 0.71]))

story.append(PageBreak())

# ═══════════════════════════════════════════════════
# 9. SECURITY HARDENING PLAN
# ═══════════════════════════════════════════════════
story.append(h1('9. Security Hardening Plan'))
story.append(p('Security is the highest priority for the merger. The current codebases have critical security gaps that must be addressed before any feature development. The following plan outlines the security measures that will be implemented as part of the merger, organized by priority level.'))

story.append(Spacer(1, 8))
story.append(h2('9.1 Priority 1: Authentication & Authorization'))
story.append(bullet('<b>Replace SHA-256 with bcrypt</b>: The current password hashing in /api/auth/signup uses SHA-256 with a salt, which is not designed for password hashing. bcrypt automatically handles salting and has a configurable work factor that makes brute-force attacks computationally expensive. The migration will update existing hashes on next login.'))
story.append(bullet('<b>Add session checks to all API routes</b>: Every API route (except /api/auth/signup and /api/health) must verify the user session using getServerSession. Routes that modify data must also verify workspace membership. A middleware helper function will be created to DRY this pattern across all routes.'))
story.append(bullet('<b>Fix AMI auth crash</b>: The AMI auth.ts references dbUser.plan and creates a Subscription that does not exist in the Prisma schema. The merged schema will include the Subscription model and plan field on User, resolving this runtime crash.'))
story.append(bullet('<b>Implement role-based access control</b>: The User model already has a role field (operator/admin/viewer). This will be enforced at the API level: operators can create/edit content, admins can manage users and settings, viewers can only read. The middleware will check role permissions for each route.'))

story.append(Spacer(1, 8))
story.append(h2('9.2 Priority 2: Input Validation'))
story.append(bullet('<b>Add Zod schemas to all API routes</b>: Currently only /api/auth/signup validates input. Every POST and PUT endpoint will receive a Zod schema that validates request body structure, types, and constraints before data reaches Prisma. This prevents malformed data, injection attacks, and mass assignment vulnerabilities.'))
story.append(bullet('<b>Whitelist updatable fields</b>: Instead of passing req.body directly to Prisma update operations, each route will explicitly destructure only the allowed fields. This prevents mass assignment attacks where an attacker could modify workspaceId, scores, or status fields.'))
story.append(bullet('<b>Sanitize HTML content</b>: Content markdown and HTML will be sanitized before storage and rendering to prevent XSS attacks. The react-markdown renderer will be configured with a whitelist of allowed HTML tags and attributes.'))

story.append(Spacer(1, 8))
story.append(h2('9.3 Priority 3: Infrastructure Security'))
story.append(bullet('<b>Redis-backed rate limiting</b>: The current in-memory rate limiter resets on server restart and does not work in multi-instance deployments. A Redis-backed rate limiter (using the ioredis library) will provide distributed rate limiting that persists across restarts and works with horizontal scaling.'))
story.append(bullet('<b>CORS configuration</b>: Add proper CORS headers for the Python microservice callbacks and API access from different origins. The configuration will be environment-aware, allowing broader access in development and restricting to known origins in production.'))
story.append(bullet('<b>Environment variable validation</b>: Add a startup check that verifies all required environment variables are present and properly formatted. Missing required variables will prevent the server from starting with a clear error message rather than crashing at runtime.'))
story.append(bullet('<b>HTTPS enforcement</b>: Add middleware that redirects HTTP requests to HTTPS in production, ensuring all data in transit is encrypted.'))

story.append(PageBreak())

# ═══════════════════════════════════════════════════
# 10. IMPLEMENTATION ROADMAP
# ═══════════════════════════════════════════════════
story.append(h1('10. Implementation Roadmap'))
story.append(p('The merger will be executed in 5 phases, each building on the previous phase and delivering a functional increment. This phased approach allows for testing and validation at each stage, reducing the risk of integration failures. Each phase includes specific deliverables, estimated duration, and dependencies.'))

story.append(Spacer(1, 8))
story.append(h2('Phase 1: Security & Foundation (Week 1)'))
story.append(p('This phase addresses the critical security issues and establishes the merged project foundation. All subsequent work depends on a secure, stable base. The deliverables include: replacing SHA-256 with bcrypt for password hashing, adding session authentication checks to all API routes, implementing Zod input validation on all endpoints, fixing the AMI auth crash by adding the Subscription model, whitelisting updatable fields in PUT handlers, merging the Prisma schemas into a unified 25+ model schema, and resolving the duplicate store exports. By the end of this phase, the system should be secure against the identified vulnerabilities and have a unified database schema.'))

story.append(Spacer(1, 8))
story.append(h2('Phase 2: Agent System & AI Pipeline (Week 2-3)'))
story.append(p('This phase brings the AI system to life by implementing all 24+ agents with real LLM calls. The deliverables include: wiring the AI Orchestrator to actually route tasks to agents, implementing each agent with proper system prompts injected with Content DNA and Memory context, connecting the content generation pipeline (Draft, Humanic, SEO, Score) to the /api/content/[id]/generate route, connecting the scheduler process endpoint to the actual agent execution pipeline, implementing the reinforcement learning memory system with pattern detection and context injection, and integrating the energy system with the publish flow to enforce fatigue limits. By the end of this phase, the True Loop should be functional: ideas flow through the content pipeline, get scored, published, and feed back into memory for strategy updates.'))

story.append(Spacer(1, 8))
story.append(h2('Phase 3: Video & Heatmap Engines (Week 3-4)'))
story.append(p('This phase replaces the stub video and heatmap engines with working implementations based on the reference repos. The deliverables include: integrating Pixelle-Video pipeline as the video-engine FastAPI microservice, implementing ComfyKit workflow abstraction for image and video generation, integrating youtube-heatmap-clipper into the heatmap-engine FastAPI microservice, refactoring the clipper to use ClipJob class instead of global mutable state, connecting both engines to the Next.js API routes, and implementing progress tracking via WebSocket for real-time updates in the OS dashboard. By the end of this phase, users should be able to generate videos and extract YouTube heatmap clips through the dashboard.'))

story.append(Spacer(1, 8))
story.append(h2('Phase 4: Browser Automation & Dashboard (Week 4-5)'))
story.append(p('This phase implements the Puppeteer browser automation layer and redesigns the OS dashboard into modular components. The deliverables include: implementing the Browser Manager with session pool and lifecycle management, building the Page Interactions module for click, type, scroll, and evaluate operations, creating Platform Actions scripts for WordPress, TikTok, and YouTube Studio automation, implementing Live Preview via WebSocket for real-time browser view streaming, splitting the 3000-line OS dashboard into per-tab component files, connecting the dashboard to real API data via TanStack Query hooks (replacing mock data), and adding proper loading states, error boundaries, and optimistic updates. By the end of this phase, the browser lab should be fully functional and the dashboard should display real data.'))

story.append(Spacer(1, 8))
story.append(h2('Phase 5: Testing, Polish & Deploy (Week 5-6)'))
story.append(p('The final phase adds test coverage, polishes the UI, and prepares for production deployment. The deliverables include: adding Jest unit tests for all lib modules (orchestrator, memory, scoring, energy, scheduler), adding Playwright E2E tests for critical user flows (auth, content pipeline, video generation, browser automation), implementing the daily autonomous cycle that processes jobs, schedules content, and updates memory automatically, adding Redis-backed rate limiting and session management, creating Docker Compose configuration with PostgreSQL and Redis services, setting up CI/CD pipeline with GitHub Actions, and deploying to Vercel with the Python microservices on a separate container platform. By the end of this phase, the system should be production-ready with automated testing, monitoring, and deployment.'))

story.append(Spacer(1, 12))
story.append(h2('10.1 Risk Mitigation'))

risk_data = [
    [Paragraph('<b>Risk</b>', table_header_style), Paragraph('<b>Probability</b>', table_header_style), Paragraph('<b>Impact</b>', table_header_style), Paragraph('<b>Mitigation</b>', table_header_style)],
    [Paragraph('YouTube HTML structure changes break heatmap extraction', table_cell_style), Paragraph('Medium', table_cell_center), Paragraph('High', table_cell_center), Paragraph('Add fallback to YouTube API; monitor extraction success rate', table_cell_style)],
    [Paragraph('ComfyUI workflow compatibility issues', table_cell_style), Paragraph('Medium', table_cell_center), Paragraph('Medium', table_cell_center), Paragraph('Pin workflow versions; add health check endpoint', table_cell_style)],
    [Paragraph('Puppeteer detection by social platforms', table_cell_style), Paragraph('High', table_cell_center), Paragraph('Medium', table_cell_center), Paragraph('Use stealth plugin; rotate user agents; add human-like delays', table_cell_style)],
    [Paragraph('LLM API rate limits during batch processing', table_cell_style), Paragraph('Medium', table_cell_center), Paragraph('Medium', table_cell_center), Paragraph('Implement request queuing with backoff; use cheap tier for bulk tasks', table_cell_style)],
    [Paragraph('Database migration issues during merger', table_cell_style), Paragraph('Low', table_cell_center), Paragraph('High', table_cell_center), Paragraph('Use Prisma migrate with explicit rollback scripts; test on copy first', table_cell_style)],
]
story.append(make_table(risk_data, [0.28, 0.12, 0.10, 0.50]))

story.append(Spacer(1, 24))
story.append(HRFlowable(width='40%', thickness=1, color=TEXT_MUTED))
story.append(Spacer(1, 8))
story.append(Paragraph('End of Merger Blueprint', ParagraphStyle('EndNote',
    fontName='DejaVu', fontSize=10, leading=14, alignment=TA_CENTER, textColor=TEXT_MUTED)))

# ─── Build ───
doc.build(story)
print(f"PDF generated: {output_path}")
