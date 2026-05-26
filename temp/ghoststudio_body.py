#!/usr/bin/env python3
"""
GhostStudio AI - Project Specification Document (PRD)
AI Faceless Content Empire Generator
Body pages generated via ReportLab
"""

import os, sys, hashlib
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, mm, cm
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, CondPageBreak, HRFlowable
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ── Font Registration ──
pdfmetrics.registerFont(TTFont('DejaVuSerif', '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSerif-Bold', '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'))
pdfmetrics.registerFont(TTFont('Carlito', '/usr/share/fonts/truetype/english/Carlito-Regular.ttf'))
pdfmetrics.registerFont(TTFont('Carlito-Bold', '/usr/share/fonts/truetype/english/Carlito-Bold.ttf'))
pdfmetrics.registerFont(TTFont('SarasaMonoSC', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans-Bold', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'))

registerFontFamily('DejaVuSerif', normal='DejaVuSerif', bold='DejaVuSerif-Bold')
registerFontFamily('Carlito', normal='Carlito', bold='Carlito-Bold')
registerFontFamily('SarasaMonoSC', normal='SarasaMonoSC', bold='SarasaMonoSC')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSans-Bold')

# Install font fallback for mixed CJK/Latin
PDF_SKILL_DIR = os.path.expanduser('~/my-project/skills/pdf')
_scripts = os.path.join(PDF_SKILL_DIR, 'scripts')
if _scripts not in sys.path:
    sys.path.insert(0, _scripts)
from pdf import install_font_fallback
install_font_fallback()

# ── Color Palette (from cascade) ──
PAGE_BG       = colors.HexColor('#131414')
SECTION_BG    = colors.HexColor('#191b1c')
CARD_BG       = colors.HexColor('#181a1b')
TABLE_STRIPE  = colors.HexColor('#161819')
HEADER_FILL   = colors.HexColor('#2c3c44')
COVER_BLOCK   = colors.HexColor('#2d383d')
BORDER        = colors.HexColor('#3b4a52')
ICON          = colors.HexColor('#84b0c6')
ACCENT        = colors.HexColor('#df9a83')
ACCENT_2      = colors.HexColor('#7ecc69')
TEXT_PRIMARY   = colors.HexColor('#eaebec')
TEXT_MUTED     = colors.HexColor('#91979a')
SEM_SUCCESS   = colors.HexColor('#69b381')
SEM_WARNING   = colors.HexColor('#c2aa7a')
SEM_ERROR     = colors.HexColor('#c0746d')
SEM_INFO      = colors.HexColor('#7699bc')

# For cover accent color on body pages
ACCENT_CYAN   = colors.HexColor('#1a8a7d')
ACCENT_GOLD   = colors.HexColor('#d4a441')

# ── Page dimensions ──
PAGE_W, PAGE_H = A4
LEFT_M = 1.0 * inch
RIGHT_M = 1.0 * inch
TOP_M = 0.8 * inch
BOTTOM_M = 0.8 * inch
CONTENT_W = PAGE_W - LEFT_M - RIGHT_M

# ── Styles ──
styles = getSampleStyleSheet()

# TOC styles
toc_h1_style = ParagraphStyle(
    name='TOCH1', fontName='DejaVuSerif', fontSize=13,
    textColor=TEXT_PRIMARY, leftIndent=20, spaceBefore=6, spaceAfter=4,
    leading=20
)
toc_h2_style = ParagraphStyle(
    name='TOCH2', fontName='DejaVuSerif', fontSize=11,
    textColor=TEXT_MUTED, leftIndent=40, spaceBefore=3, spaceAfter=2,
    leading=16
)

# Body styles
body_style = ParagraphStyle(
    name='BodyText_Custom', fontName='DejaVuSerif', fontSize=10.5,
    leading=18, alignment=TA_JUSTIFY, textColor=TEXT_PRIMARY,
    spaceBefore=0, spaceAfter=8
)

h1_style = ParagraphStyle(
    name='H1_Custom', fontName='DejaVuSerif', fontSize=20,
    leading=28, textColor=ACCENT_CYAN, spaceBefore=18, spaceAfter=10
)

h2_style = ParagraphStyle(
    name='H2_Custom', fontName='DejaVuSerif', fontSize=15,
    leading=22, textColor=ACCENT, spaceBefore=14, spaceAfter=6
)

h3_style = ParagraphStyle(
    name='H3_Custom', fontName='DejaVuSerif', fontSize=12,
    leading=18, textColor=ICON, spaceBefore=10, spaceAfter=4
)

callout_style = ParagraphStyle(
    name='Callout', fontName='DejaVuSerif', fontSize=10.5,
    leading=17, textColor=TEXT_PRIMARY, leftIndent=20, rightIndent=20,
    borderColor=ACCENT_CYAN, borderWidth=2, borderPadding=10,
    backColor=CARD_BG, spaceBefore=10, spaceAfter=10,
    alignment=TA_LEFT
)

quote_style = ParagraphStyle(
    name='Quote', fontName='DejaVuSerif', fontSize=11,
    leading=18, textColor=ACCENT, leftIndent=30, rightIndent=30,
    spaceBefore=10, spaceAfter=10, alignment=TA_CENTER
)

bullet_style = ParagraphStyle(
    name='Bullet', fontName='DejaVuSerif', fontSize=10.5,
    leading=17, textColor=TEXT_PRIMARY, leftIndent=24, bulletIndent=12,
    spaceBefore=2, spaceAfter=2, alignment=TA_LEFT
)

meta_style = ParagraphStyle(
    name='Meta', fontName='DejaVuSerif', fontSize=9,
    leading=14, textColor=TEXT_MUTED, alignment=TA_LEFT
)

table_header_style = ParagraphStyle(
    name='TableHeader', fontName='DejaVuSerif', fontSize=10,
    textColor=colors.white, alignment=TA_CENTER, leading=14
)

table_cell_style = ParagraphStyle(
    name='TableCell', fontName='DejaVuSerif', fontSize=9.5,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, leading=14,
    wordWrap='CJK'
)

table_cell_center = ParagraphStyle(
    name='TableCellCenter', fontName='DejaVuSerif', fontSize=9.5,
    textColor=TEXT_PRIMARY, alignment=TA_CENTER, leading=14,
    wordWrap='CJK'
)

# ── Doc Template with TOC support ──
class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            key = getattr(flowable, 'bookmark_key', '')
            self.notify('TOCEntry', (level, text, self.page, key))

    # Dark background via page template
    pass

# Page background drawer
def draw_dark_bg(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(PAGE_BG)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    # Subtle left accent line
    canvas.setStrokeColor(ACCENT_CYAN)
    canvas.setLineWidth(0.5)
    canvas.line(LEFT_M - 15, PAGE_H - TOP_M, LEFT_M - 15, BOTTOM_M)
    # Page number
    canvas.setFont('DejaVuSerif', 9)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawCentredString(PAGE_W / 2, 25, f'{doc.page}')
    canvas.restoreState()

def draw_first_page(canvas, doc):
    draw_dark_bg(canvas, doc)

# ── Helper functions ──
def add_heading(text, style, level=0):
    key = 'h_%s' % hashlib.md5(text.encode()).hexdigest()[:8]
    p = Paragraph('<a name="%s"/>%s' % (key, text), style)
    p.bookmark_name = text
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    return p

def safe_keep_together(elements, max_h=PAGE_H * 0.4):
    total_h = 0
    for el in elements:
        w, h = el.wrap(CONTENT_W, PAGE_H)
        total_h += h
    if total_h <= max_h:
        return [KeepTogether(elements)]
    elif len(elements) >= 2:
        return [KeepTogether(elements[:2])] + list(elements[2:])
    else:
        return list(elements)

def make_table(headers, rows, col_ratios=None):
    """Create a styled table with dark theme."""
    header_row = [Paragraph('<b>%s</b>' % h, table_header_style) for h in headers]
    data = [header_row]
    for row in rows:
        data.append([Paragraph(str(c), table_cell_style) for c in row])

    if col_ratios:
        col_widths = [r * CONTENT_W for r in col_ratios]
    else:
        col_widths = None

    t = Table(data, colWidths=col_widths, hAlign='CENTER')
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_FILL),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]
    # Alternating row colors
    for i in range(1, len(data)):
        if i % 2 == 0:
            style_cmds.append(('BACKGROUND', (0, i), (-1, i), TABLE_STRIPE))
        else:
            style_cmds.append(('BACKGROUND', (0, i), (-1, i), CARD_BG))
    t.setStyle(TableStyle(style_cmds))
    return t

def make_hr():
    return HRFlowable(width='100%', thickness=0.5, color=BORDER, spaceAfter=8, spaceBefore=8)

def bullet(text):
    return Paragraph('<bullet>&bull;</bullet> ' + text, bullet_style)

# ── Build Document ──
output_path = '/home/z/my-project/temp/ghoststudio_body.pdf'

doc = TocDocTemplate(
    output_path,
    pagesize=A4,
    leftMargin=LEFT_M, rightMargin=RIGHT_M,
    topMargin=TOP_M, bottomMargin=BOTTOM_M,
)

story = []

# ════════════════════════════════════════════
# TABLE OF CONTENTS
# ════════════════════════════════════════════
toc_title = Paragraph('<b>Table of Contents</b>', ParagraphStyle(
    name='TOCTitle', fontName='DejaVuSerif', fontSize=22,
    leading=30, textColor=ACCENT_CYAN, spaceBefore=20, spaceAfter=16
))
story.append(toc_title)
toc = TableOfContents()
toc.levelStyles = [toc_h1_style, toc_h2_style]
story.append(toc)
story.append(PageBreak())

# ════════════════════════════════════════════
# 1. EXECUTIVE SUMMARY
# ════════════════════════════════════════════
story.append(add_heading('<b>1. Executive Summary</b>', h1_style, level=0))

story.append(Paragraph(
    'GhostStudio AI adalah platform produksi konten otomatis yang dirancang untuk para <b>faceless creator</b>, '
    '<b>affiliate marketer</b>, dan <b>content agency</b> yang ingin membangun empire konten viral tanpa harus tampil di depan kamera. '
    'Platform ini bukan sekadar alat animasi atau editor video. GhostStudio AI adalah mesin produksi massal yang mengubah satu prompt teks '
    'menjadi puluhan video shorts siap posting, lengkap dengan hook yang memikat, subtitle animasi, narasi AI, dan pacing yang dioptimasi '
    'untuk algoritma TikTok, YouTube Shorts, dan Instagram Reels.',
    body_style
))

story.append(Paragraph(
    'Di pasar yang sudah dipenuhi oleh tools seperti Runway, Canva, Animaker, Vyond, dan CapCut, GhostStudio AI tidak bersaing '
    'di ranah "AI animation maker". Alih-alih menjual kemampuan animasi, platform ini menjual <b>hasil</b>: views, engagement, dan pertumbuhan '
    'audiens. Pendekatan ini membedakan GhostStudio AI secara fundamental dari semua kompetitor yang fokus pada produksi visual, bukan pada '
    'outcome bisnis penggunanya. Positioning yang jelas ini memungkinkan platform untuk menargetkan niche yang spesifik dan sangat lapar '
    'akan solusi otomasi konten.',
    body_style
))

story.append(Paragraph(
    'Dengan tagline "<b>One Prompt. Infinite Content.</b>", GhostStudio AI menargetkan peluncuran MVP dalam waktu 12 minggu, '
    'dengan fitur inti mencakup script generator, subtitle animation engine, image slideshow motion, text-to-speech, dan export shorts. '
    'Fase selanjutnya akan mencakup auto-posting, analytics loop, dan fitur-fitur lanjutan yang memungkinkan pengguna membangun '
    'media empire sepenuhnya otomatis. Model monetisasi menggunakan pendekatan freemium dengan tier berbayar mulai dari $29/bulan '
    'untuk creator individu hingga $199/bulan untuk agency.',
    body_style
))

story.append(Spacer(1, 12))

# Key metrics callout
key_data = [
    ['Metric', 'Target'],
    ['MVP Launch Timeline', '12 minggu'],
    ['Target Users (Bulan 6)', '5,000 active users'],
    ['Monthly Recurring Revenue (Tahun 1)', '$150,000'],
    ['Customer Acquisition Cost', '< $15'],
    ['Lifetime Value Target', '> $350'],
]
story.append(make_table(
    key_data[0], key_data[1:],
    col_ratios=[0.45, 0.55]
))
story.append(Spacer(1, 6))
story.append(Paragraph('<i>Tabel 1: Key Metrics & Target</i>', meta_style))
story.append(Spacer(1, 18))

# ════════════════════════════════════════════
# 2. MARKET ANALYSIS & POSITIONING
# ════════════════════════════════════════════
story.append(add_heading('<b>2. Market Analysis & Positioning</b>', h1_style, level=0))

story.append(add_heading('<b>2.1 Masalah Besar Pasar</b>', h2_style, level=1))

story.append(Paragraph(
    'Industri konten digital saat ini menghadapi masalah fundamental: <b>creator kekurangan sistem produksi cepat</b>, '
    'bukan kekurangan ide. Setiap hari, jutaan creator harus melewati proses yang repetitif dan memakan waktu: menulis storyboard, '
    'membuat animasi, mengedit video, menambahkan subtitle, merekam voice over, menyesuaikan pacing, dan akhirnya posting ke berbagai platform. '
    'Proses ini membutuhkan waktu 4-8 jam untuk satu video berkualitas, sementara algoritma menuntut konsistensi posting 1-3 konten per hari.',
    body_style
))

story.append(Paragraph(
    'Masalah ini semakin diperparah oleh fakta bahwa mayoritas creator bukanlah animator atau video editor profesional. Mereka adalah '
    'pemilik bisnis kecil, affiliate marketer, crypto trader, horror storyteller, atau motivator yang membutuhkan konten sebagai alat '
    'untuk menarik audiens dan menghasilkan uang, bukan sebagai karya seni. Kesenjangan antara kebutuhan produksi massal dan kemampuan '
    'teknis individual inilah yang menciptakan peluang besar untuk GhostStudio AI.',
    body_style
))

story.append(add_heading('<b>2.2 Landscape Kompetitor</b>', h2_style, level=1))

story.append(Paragraph(
    'Pasar tools konten AI sudah sangat ramai dengan pemain besar yang masing-masing memiliki positioning yang berbeda. '
    'Memahami kekuatan dan kelemahan masing-masing kompetitor adalah kunci untuk menemukan celah pasar yang belum terlayani '
    'dan membangun defensibility yang kuat. Berikut adalah analisis komprehensif terhadap lima kompetitor utama:',
    body_style
))

comp_rows = [
    ['Runway', 'AI Video Generation', 'High quality AI video gen', 'Complex UI, expensive, no pipeline', '$12-76/mo'],
    ['Canva', 'All-in-One Design', 'Massive templates, easy UI', 'Not optimized for shorts, manual process', '$0-30/mo'],
    ['Animaker', 'Animation Platform', 'Drag-drop animation', 'Slow workflow, no AI automation', '$0-49/mo'],
    ['Vyond', 'Enterprise Animation', 'Professional animation', 'Enterprise pricing, steep learning curve', '$25-100/mo'],
    ['CapCut', 'Video Editor', 'Free, TikTok integration', 'Manual editing, no auto-generation', '$0-8/mo'],
]
story.append(Spacer(1, 8))
story.append(make_table(
    ['Platform', 'Kategori', 'Kekuatan', 'Kelemahan', 'Harga'],
    comp_rows,
    col_ratios=[0.12, 0.16, 0.24, 0.30, 0.18]
))
story.append(Spacer(1, 6))
story.append(Paragraph('<i>Tabel 2: Competitive Landscape Analysis</i>', meta_style))
story.append(Spacer(1, 12))

story.append(Paragraph(
    'Dari analisis di atas, terlihat jelas bahwa <b>tidak ada satupun kompetitor yang menawarkan end-to-end content pipeline</b>. '
    'Setiap platform hanya menyelesaikan satu bagian dari proses produksi konten, memaksa pengguna untuk menggabungkan 3-5 tools '
    'berbeda hanya untuk menghasilkan satu video. GhostStudio AI mengisi celah ini dengan menjadi satu-satunya platform yang mengotomasi '
    'seluruh pipeline dari prompt hingga posting, menjadikannya bukan sekadar tool, tetapi sebuah sistem produksi.',
    body_style
))

story.append(add_heading('<b>2.3 Positioning Strategy</b>', h2_style, level=1))

story.append(Paragraph(
    'Positioning GhostStudio AI bukan sebagai "AI animation platform untuk semua orang" karena pendekatan itu adalah jalan menuju kematian. '
    'Sebaliknya, platform ini diposisikan sebagai <b>"AI Audience Growth Machine"</b> yang secara eksplisit menjual outcome, bukan fitur. '
    'Perbedaan ini krusial: pengguna tidak membayar untuk kemampuan animasi, mereka membayar untuk views, follower, dan pendapatan yang '
    'dihasilkan dari konten yang diproduksi secara otomatis.',
    body_style
))

story.append(Paragraph(
    'Strategi positioning ini diperkuat oleh empat pilar diferensiasi yang sulit ditiru kompetitor: '
    '<b>niche specificity</b> (fokus pada faceless content, bukan semua jenis konten), '
    '<b>workflow speed</b> (dari prompt ke posting dalam menit, bukan jam), '
    '<b>automation depth</b> (bukan sekadar tool, tapi sistem yang mengoptimasi konten secara otonom), dan '
    '<b>emotional outcome</b> (menjual pertumbuhan audiens, bukan kemampuan teknis). '
    'Keempat pilar ini membentuk moat defensibel yang memisahkan GhostStudio AI dari tools generik.',
    body_style
))

# ════════════════════════════════════════════
# 3. TARGET USERS
# ════════════════════════════════════════════
story.append(add_heading('<b>3. Target Users</b>', h1_style, level=0))

story.append(Paragraph(
    'GhostStudio AI menargetkan tiga segmen pengguna utama yang masing-masing memiliki pain points, willingness to pay, '
    'dan pola penggunaan yang berbeda. Segmentasi ini memungkinkan pengembangan fitur yang terfokus dan messaging yang tajam '
    'untuk setiap kelompok, menghindari jebakan "membangun untuk semua orang" yang telah menghancurkan banyak startup.',
    body_style
))

story.append(add_heading('<b>3.1 Tier 1: Faceless Creators</b>', h2_style, level=1))

story.append(Paragraph(
    'Faceless creators adalah segmen primer dengan kebutuhan paling mendesak dan willingness to pay tertinggi. Mereka adalah individu yang '
    'membangun channel YouTube, TikTok, atau Instagram tanpa menampilkan wajah, mengandalkan konten berbasis narasi, visual AI, dan '
    'storytelling untuk menarik audiens. Segmen ini mencakup creator horror story, motivational content, crypto/trading analysis, '
    'AI facts dan trivia, serta anime recap. Rata-rata mereka menghabiskan 4-6 jam per hari untuk produksi konten dan sangat '
    'terbuka terhadap otomasi yang dapat mengurangi waktu produksi secara drastis.',
    body_style
))

story.append(Paragraph(
    'Pain point utama faceless creators adalah konsistensi: mereka harus posting 1-3 konten per hari untuk mempertahankan momentum '
    'algoritma, tetapi proses produksi manual membuat ini hampir mustahil untuk dilakukan sendiri. GhostStudio AI mengatasi ini dengan '
    'mengubah workflow yang biasanya memakan waktu berjam-jam menjadi proses yang hanya membutuhkan beberapa menit, memungkinkan '
    'mereka memproduksi 30+ konten per minggu tanpa burnout. Estimasi segmen ini mencapai 2 juta creator aktif secara global.',
    body_style
))

story.append(add_heading('<b>3.2 Tier 2: Content Agencies</b>', h2_style, level=1))

story.append(Paragraph(
    'Content agencies dan social media teams membentuk segmen sekunder yang memiliki volume kebutuhan lebih besar dan mampu '
    'membayar harga premium. Mereka mengelola 5-50 akun klien sekaligus dan membutuhkan sistem yang dapat memproduksi konten '
    'secara massal dengan kualitas konsisten. Untuk mereka, GhostStudio AI bukan sekadar tool kreativitas, melainkan infrastruktur '
    'produksi yang mengurangi kebutuhan hiring dan meningkatkan margin profit per klien.',
    body_style
))

story.append(Paragraph(
    'Agency biasanya menghadapi masalah scaling: menambah klien berarti menambah editor, copywriter, dan motion designer, '
    'yang menurunkan profit margin. Dengan GhostStudio AI, satu account manager dapat melayani 3x lebih banyak klien karena '
    'proses produksi diotomasi. Model pricing untuk segmen ini menggunakan struktur per-seat dengan volume discount, '
    'mendorong adoption yang lebih luas di dalam organisasi.',
    body_style
))

story.append(add_heading('<b>3.3 Tier 3: Affiliate Marketers</b>', h2_style, level=1))

story.append(Paragraph(
    'Affiliate marketers adalah segmen tersier yang sangat terdorong oleh ROI. Mereka menggunakan konten sebagai kendaraan untuk '
    'mengarahkan traffic ke link afiliasi, dan keberhasilan mereka diukur langsung dari konversi bukan dari engagement rate. '
    'Segmen ini termasuk digital product reseller, Amazon affiliate, SaaS referral partner, dan CPA network promoter. '
    'Mereka cenderung memproduksi konten dalam volume sangat tinggi dengan margin tipis, sehingga efisiensi produksi '
    'adalah prioritas absolut.',
    body_style
))

story.append(Paragraph(
    'Untuk affiliate marketers, GhostStudio AI menyediakan kemampuan batch production yang memungkinkan pembuatan 50-100 video '
    'dalam satu sesi, masing-masing dioptimasi untuk CTR dan conversion. Fitur analytics loop yang mempelajari performa konten '
    'sebelumnya dan mengoptimasi konten berikutnya secara otomatis menjadi nilai jual utama, karena langsung berdampak pada '
    'revenue mereka. Segmen ini diperkirakan berjumlah 500,000 marketer aktif yang mengeluarkan $50-200/bulan untuk tools.',
    body_style
))

# User segmentation table
user_rows = [
    ['Faceless Creator', 'Horror, Motivasi, Crypto, AI Facts', 'Konsistensi posting', '$29-49/bulan', '60%'],
    ['Content Agency', 'Social Media Management', 'Scaling produksi', '$99-199/bulan', '25%'],
    ['Affiliate Marketer', 'Product Review, CPA, Referral', 'Volume + ROI', '$29-79/bulan', '15%'],
]
story.append(Spacer(1, 8))
story.append(make_table(
    ['Segmen', 'Niche', 'Pain Point Utama', 'WTP', 'Revenue Share'],
    user_rows,
    col_ratios=[0.16, 0.24, 0.20, 0.18, 0.22]
))
story.append(Spacer(1, 6))
story.append(Paragraph('<i>Tabel 3: User Segmentation & Revenue Projection</i>', meta_style))
story.append(Spacer(1, 18))

# ════════════════════════════════════════════
# 4. PRODUCT ARCHITECTURE
# ════════════════════════════════════════════
story.append(add_heading('<b>4. Product Architecture</b>', h1_style, level=0))

story.append(Paragraph(
    'Arsitektur GhostStudio AI dirancang sebagai pipeline end-to-end yang mengubah input teks sederhana menjadi output video '
    'siap posting. Setiap komponen dalam pipeline dirancang untuk dapat beroperasi secara independen maupun terintegrasi, '
    'memungkinkan pengguna untuk menggunakan fitur secara modular atau sebagai sistem yang utuh. Modularitas ini penting '
    'untuk MVP agar pengembangan dapat dilakukan secara iteratif tanpa harus menunggu seluruh sistem selesai.',
    body_style
))

story.append(add_heading('<b>4.1 Seven Core Features</b>', h2_style, level=1))

# Feature 1
story.append(add_heading('<b>4.1.1 Prompt to Viral Script Engine</b>', h3_style, level=1))
story.append(Paragraph(
    'Fitur pertama dan paling fundamental adalah kemampuan mengubah satu prompt sederhana menjadi script viral yang dioptimasi '
    'untuk retensi audiens. Engine ini menggunakan model bahasa besar (LLM) yang telah di-fine-tune pada dataset ribuan script '
    'viral dari TikTok, YouTube Shorts, dan Instagram Reels. Output yang dihasilkan bukan sekadar narasi, melainkan script '
    'terstruktur yang mencakup tiga komponen kritis: hook (3 detik pertama yang menentukan apakah viewer akan scroll atau menonton), '
    'retention pattern (strategi menjaga engagement sepanjang video dengan cliffhanger dan reveal pattern), dan CTA (call-to-action '
    'yang mendorong interaksi dan follow). Engine ini juga menerapkan viral pacing algorithm yang menempatkan peak moment pada '
    'titik-titik kritis berdasarkan data retention curve dari platform.',
    body_style
))

# Feature 2
story.append(add_heading('<b>4.1.2 Script to Scene Generator</b>', h3_style, level=1))
story.append(Paragraph(
    'Setelah script dihasilkan, Scene Generator secara otomatis memecahnya menjadi urutan visual scenes, masing-masing dengan '
    'deskripsi visual, timing, dan transisi yang tepat. Proses ini mencakup pemilihan visual style (anime, cinematic, motion graphic, '
    'atau slideshow), generasi B-roll dari AI image generator, dan mapping emosi per scene untuk memastikan koherensi visual dengan '
    'narasi. Scene Generator juga mengintegrasikan intelligent asset sourcing yang secara otomatis mencari dan memilih visual dari '
    'library internal maupun API eksternal, mengurangi kebutuhan manual input dari pengguna hingga minimal.',
    body_style
))

# Feature 3
story.append(add_heading('<b>4.1.3 Auto Motion Engine</b>', h3_style, level=1))
story.append(Paragraph(
    'Auto Motion Engine mengubah static images dan text menjadi footage yang dinamis melalui empat teknik motion utama: zoom (Ken Burns '
    'effect untuk dramatisasi), shake (screen shake untuk impact moment), pan (horizontal/vertical pan untuk scene transition), dan '
    'beat sync (sinkronisasi pergerakan visual dengan beat musik atau narasi). Engine ini menggunakan FFmpeg dan Remotion sebagai '
    'backend rendering, dengan preset motion yang telah dioptimasi untuk setiap tipe konten (horror menggunakan slow zoom + dark filter, '
    'motivational menggunakan dynamic pan + warm color grade, crypto menggunakan fast cuts + data overlay).',
    body_style
))

# Feature 4
story.append(add_heading('<b>4.1.4 Subtitle Engine</b>', h3_style, level=1))
story.append(Paragraph(
    'Subtitle Engine menghasilkan caption animasi dalam style TikTok yang terbukti meningkatkan watch time hingga 40%. Fitur ini '
    'mencakup animated captions dengan entrance/exit effect, emoji integration yang kontekstual, highlighted words untuk emphasis '
    'pada keyword kunci, dan auto-positioning yang memastikan subtitle tidak tertutup oleh UI platform. Engine juga mendukung '
    'multi-language subtitle generation secara simultaneous, memungkinkan satu konten di-distribute ke market berbeda tanpa '
    'produksi ulang. Format subtitle mengikuti best practice terkini: satu baris per segment, font size minimal 40pt, '
    'dan warna kontras tinggi terhadap background.',
    body_style
))

# Feature 5
story.append(add_heading('<b>4.1.5 AI Voice Engine</b>', h3_style, level=1))
story.append(Paragraph(
    'AI Voice Engine menyediakan text-to-speech berkualitas tinggi dengan library voice yang beragam, mencakup narrator voice '
    'untuk konten edukatif, anime voice untuk niche animasi, emotional tone matching yang secara otomatis menyesuaikan intonasi '
    'dengan emosi scene, dan multi-accent support untuk market global. Engine ini mengintegrasikan dengan TTS API terdepan '
    'dan menambahkan post-processing untuk natural pacing, breath insertion, dan emphasis matching. Pengguna juga dapat '
    'membuat custom voice profile yang konsisten di seluruh konten mereka, membangun brand identity auditory.',
    body_style
))

# Feature 6
story.append(add_heading('<b>4.1.6 Auto Posting System</b>', h3_style, level=1))
story.append(Paragraph(
    'Auto Posting menghubungkan GhostStudio AI langsung ke platform distribusi utama: TikTok, YouTube Shorts, dan Instagram Reels. '
    'Sistem ini mencakup scheduling berbasis optimal posting time yang dihitung dari data engagement pengguna, format auto-adaptation '
    'yang menyesuaikan aspect ratio, durasi, dan metadata untuk setiap platform, hashtag optimization berbasis trending data, '
    'dan cross-platform publishing yang memungkinkan satu konten di-post ke semua platform sekaligus dengan format yang disesuaikan. '
    'Fitur ini direncanakan untuk Phase 2 setelah MVP tervalidasi.',
    body_style
))

# Feature 7
story.append(add_heading('<b>4.1.7 Analytics Loop</b>', h3_style, level=1))
story.append(Paragraph(
    'Analytics Loop adalah fitur paling ambisius yang menjadikan GhostStudio AI bukan sekadar tool, tapi sistem yang belajar dan '
    'berkembang secara otonom. Fitur ini membaca data retention, CTR, dan watch time dari konten yang sudah di-post, menganalisis '
    'pattern yang berkorelasi dengan performa tinggi, lalu mengoptimasi konten berikutnya secara otomatis. Sistem ini menggunakan '
    'reinforcement learning dari feedback loop platform, memastikan setiap iterasi konten lebih baik dari sebelumnya. '
    'Analytics Loop juga menyediakan dashboard yang menampilkan insight actionable, bukan sekadar vanity metrics, membantu '
    'pengguna memahami secara spesifik elemen mana yang bekerja dan mana yang perlu diperbaiki.',
    body_style
))

story.append(Spacer(1, 8))

# Features summary table
feat_rows = [
    ['Prompt to Viral Script', 'V1 (MVP)', 'LLM + Viral Dataset', 'High'],
    ['Script to Scene', 'V1 (MVP)', 'AI Visual + Asset API', 'High'],
    ['Auto Motion Engine', 'V1 (MVP)', 'FFmpeg + Remotion', 'High'],
    ['Subtitle Engine', 'V1 (MVP)', 'Fabric.js + Canvas', 'High'],
    ['AI Voice Engine', 'V1 (MVP)', 'TTS API + Post-proc', 'Medium'],
    ['Auto Posting', 'V2', 'Platform API', 'Medium'],
    ['Analytics Loop', 'V2', 'ML + Platform Data', 'High'],
]
story.append(make_table(
    ['Feature', 'Phase', 'Core Technology', 'Priority'],
    feat_rows,
    col_ratios=[0.25, 0.15, 0.35, 0.25]
))
story.append(Spacer(1, 6))
story.append(Paragraph('<i>Tabel 4: Feature Roadmap & Priority Matrix</i>', meta_style))
story.append(Spacer(1, 18))

# ════════════════════════════════════════════
# 5. TECHNICAL STACK
# ════════════════════════════════════════════
story.append(add_heading('<b>5. Technical Stack</b>', h1_style, level=0))

story.append(Paragraph(
    'Pemilihan teknologi untuk GhostStudio AI mengikuti prinsip pragmatis: gunakan teknologi yang paling masuk akal untuk setiap komponen, '
    'minimalkan custom development untuk hal-hal yang sudah ada solusi mapannya, dan maksimalkan integrasi API untuk mempercepat '
    'time-to-market. Stack ini dirancang untuk solo founder atau tim kecil yang perlu mengirim MVP secepat mungkin tanpa mengorbankan '
    'scalability di masa depan.',
    body_style
))

story.append(add_heading('<b>5.1 Frontend & Interface</b>', h2_style, level=1))

fe_rows = [
    ['Framework', 'Next.js 16 + React 19', 'SSR, API routes, fullstack capability'],
    ['Styling', 'Tailwind CSS 4 + shadcn/ui', 'Rapid UI development, consistent design'],
    ['State', 'Zustand + React Query', 'Lightweight state, server state caching'],
    ['Canvas', 'Fabric.js + Konva.js', 'Subtitle rendering, image manipulation'],
    ['Video Preview', 'Remotion Player', 'Real-time video preview in browser'],
]
story.append(make_table(
    ['Component', 'Technology', 'Rationale'],
    fe_rows,
    col_ratios=[0.20, 0.35, 0.45]
))
story.append(Spacer(1, 6))
story.append(Paragraph('<i>Tabel 5: Frontend Technology Stack</i>', meta_style))
story.append(Spacer(1, 12))

story.append(add_heading('<b>5.2 Backend & Processing</b>', h2_style, level=1))

be_rows = [
    ['API Server', 'Node.js + Fastify', 'High throughput, low latency video pipeline'],
    ['Database', 'PostgreSQL + Prisma', 'Relational data, type-safe queries'],
    ['Queue', 'BullMQ + Redis', 'Video rendering job queue, priority management'],
    ['Storage', 'S3-compatible (R2)', 'Video/image storage, CDN delivery'],
    ['Auth', 'NextAuth.js v5', 'OAuth, JWT, session management'],
    ['Deployment', 'Vercel + Fly.io', 'Edge functions + GPU workers'],
]
story.append(make_table(
    ['Component', 'Technology', 'Rationale'],
    be_rows,
    col_ratios=[0.20, 0.35, 0.45]
))
story.append(Spacer(1, 6))
story.append(Paragraph('<i>Tabel 6: Backend Technology Stack</i>', meta_style))
story.append(Spacer(1, 12))

story.append(add_heading('<b>5.3 AI & Media Engine</b>', h2_style, level=1))

ai_rows = [
    ['Script Generation', 'OpenAI GPT-4o + Custom Fine-tune', 'Viral script patterns, hook optimization'],
    ['Image Generation', 'Replicate (SDXL, Flux) + DALL-E 3', 'Scene visuals, B-roll, thumbnails'],
    ['Video Generation', 'Runway API + Pika Labs', 'Short video clips, transitions'],
    ['Text-to-Speech', 'ElevenLabs + OpenAI TTS', 'Natural voice, emotional tone matching'],
    ['Music/SFX', 'Suno AI + Epidemic Sound API', 'Background music, sound effects sync'],
    ['Video Render', 'FFmpeg + Remotion', 'Composition, encoding, export'],
    ['OCR/Subtitle', 'Whisper + Custom Aligner', 'Speech-to-text, subtitle timing'],
]
story.append(make_table(
    ['Function', 'Technology', 'Purpose'],
    ai_rows,
    col_ratios=[0.22, 0.38, 0.40]
))
story.append(Spacer(1, 6))
story.append(Paragraph('<i>Tabel 7: AI & Media Engine Stack</i>', meta_style))
story.append(Spacer(1, 18))

# ════════════════════════════════════════════
# 6. MVP SCOPE (V1)
# ════════════════════════════════════════════
story.append(add_heading('<b>6. MVP Scope (V1)</b>', h1_style, level=0))

story.append(Paragraph(
    'Prinsip utama pengembangan MVP adalah <b>jangan overengineering</b>. V1 tidak perlu menjadi platform lengkap yang '
    'mencakup semua fitur. Yang diperlukan adalah produk yang cukup baik untuk memvalidasi value proposition dan menghasilkan '
    'pengguna awal yang membayar. Setiap fitur MVP harus menjawab pertanyaan: "Apakah ini esensial untuk membuktikan bahwa '
    'pengguna bersedia membayar untuk outcome yang dijanjikan?" Jika jawabannya tidak, fitur tersebut ditunda ke fase berikutnya.',
    body_style
))

story.append(add_heading('<b>6.1 V1 Feature Scope</b>', h2_style, level=1))

mvp_rows = [
    ['Script Generator', 'Prompt ke viral script dengan hook + retention pattern + CTA', '4 minggu'],
    ['Subtitle Animation', 'TikTok-style animated captions dengan emoji dan highlights', '3 minggu'],
    ['Image Slideshow Motion', 'Zoom, pan, shake pada image sequence dengan beat sync', '3 minggu'],
    ['AI Voice (TTS)', 'Narrator voice dengan emotional tone, 5+ voice options', '2 minggu'],
    ['Export Shorts', 'Export MP4 9:16 untuk TikTok/Reels/Shorts, 15-60 detik', '2 minggu'],
    ['Basic Dashboard', 'Project management, template gallery, render queue', '2 minggu'],
]
story.append(make_table(
    ['Feature', 'Description', 'Estimasi'],
    mvp_rows,
    col_ratios=[0.22, 0.55, 0.23]
))
story.append(Spacer(1, 6))
story.append(Paragraph('<i>Tabel 8: V1 MVP Feature Scope & Timeline</i>', meta_style))
story.append(Spacer(1, 12))

story.append(add_heading('<b>6.2 V1 Architecture Diagram</b>', h2_style, level=1))

story.append(Paragraph(
    'Arsitektur MVP mengikuti pola producer-consumer dengan job queue sebagai penghubung. User mengirimkan prompt melalui web interface, '
    'prompt diproses oleh AI pipeline yang menghasilkan script + scene data + timing, lalu data ini dimasukkan ke render queue. '
    'Render worker mengambil job dari queue, menggabungkan visual + audio + subtitle menggunakan Remotion/FFmpeg, dan menghasilkan '
    'file MP4 final yang dapat di-download oleh pengguna. Arsitektur ini memungkinkan horizontal scaling dengan menambah render worker '
    'tanpa mengubah komponen lainnya.',
    body_style
))

arch_rows = [
    ['User Interface', 'Next.js App', 'Prompt input, preview, export, dashboard'],
    ['API Layer', 'Fastify Server', 'REST + WebSocket for real-time progress'],
    ['AI Pipeline', 'Orchestrator', 'Script gen, scene gen, voice gen in sequence'],
    ['Job Queue', 'BullMQ + Redis', 'Priority queue with retry and dead-letter'],
    ['Render Worker', 'Remotion + FFmpeg', 'Video composition and encoding'],
    ['Storage', 'R2 + CDN', 'Asset storage and fast delivery'],
]
story.append(make_table(
    ['Layer', 'Component', 'Responsibility'],
    arch_rows,
    col_ratios=[0.22, 0.30, 0.48]
))
story.append(Spacer(1, 6))
story.append(Paragraph('<i>Tabel 9: V1 System Architecture Components</i>', meta_style))
story.append(Spacer(1, 12))

story.append(add_heading('<b>6.3 V1 Out of Scope</b>', h2_style, level=1))

story.append(Paragraph(
    'Explicitly mendefinisikan apa yang <b>tidak</b> termasuk dalam MVP sama pentingnya dengan mendefinisikan apa yang termasuk. '
    'Fitur-fitur berikut ditunda ke fase selanjutnya untuk menjaga fokus dan menghindari scope creep yang dapat menunda peluncuran:',
    body_style
))

out_scope = [
    'Auto-posting ke platform (manual download + upload di V1)',
    'Analytics loop dan ML-based optimization',
    'Multi-user collaboration dan team features',
    'Custom voice cloning (menggunakan preset voice saja)',
    'Real-time video generation (batch rendering saja)',
    'Mobile app (web-only di V1)',
    'API untuk developer/third-party integration',
    'Character consistency untuk anime (sangat sulit technically)',
]
for item in out_scope:
    story.append(bullet(item))

story.append(Spacer(1, 18))

# ════════════════════════════════════════════
# 7. ROADMAP & EVOLUTION
# ════════════════════════════════════════════
story.append(add_heading('<b>7. Roadmap & Evolution</b>', h1_style, level=0))

story.append(Paragraph(
    'Roadmap GhostStudio AI dirancang dalam tiga fase utama yang masing-masing membangun di atas fondasi fase sebelumnya. '
    'Setiap fase memiliki milestone yang jelas, metrik keberhasilan yang terukur, dan decision gate yang menentukan apakah '
    'tim siap melanjutkan ke fase berikutnya atau perlu iterasi lebih lanjut pada fase saat ini.',
    body_style
))

story.append(add_heading('<b>7.1 Phase 1: Foundation (Minggu 1-12)</b>', h2_style, level=1))

story.append(Paragraph(
    'Phase 1 berfokus pada pembangunan dan peluncuran MVP. Tujuan utamanya adalah memvalidasi bahwa pengguna bersedia membayar '
    'untuk value proposition "prompt to shorts" dan mengumpulkan feedback awal untuk iterasi produk. Metrik keberhasilan Phase 1 '
    'adalah 500 pengguna terdaftar, 100 pengguna berbayar, dan NPS score di atas 40. Selama fase ini, pengembangan fokus pada '
    'kelima fitur MVP inti yang telah didefinisikan sebelumnya, dengan prioritas pada script generator dan export pipeline '
    'sebagai fondasi teknis.',
    body_style
))

p1_rows = [
    ['Minggu 1-2', 'Core infra setup, auth, database schema, CI/CD'],
    ['Minggu 3-6', 'Script Generator + Scene Generator development'],
    ['Minggu 5-8', 'Subtitle Engine + Auto Motion Engine'],
    ['Minggu 7-9', 'AI Voice integration + Export pipeline'],
    ['Minggu 9-10', 'Dashboard, template gallery, polish UI/UX'],
    ['Minggu 11-12', 'Beta testing, bug fixes, launch preparation'],
]
story.append(make_table(
    ['Timeline', 'Deliverables'],
    p1_rows,
    col_ratios=[0.20, 0.80]
))
story.append(Spacer(1, 6))
story.append(Paragraph('<i>Tabel 10: Phase 1 Detailed Timeline</i>', meta_style))
story.append(Spacer(1, 12))

story.append(add_heading('<b>7.2 Phase 2: Growth (Minggu 13-24)</b>', h2_style, level=1))

story.append(Paragraph(
    'Phase 2 berfokus pada pertumbuhan pengguna dan revenue setelah MVP tervalidasi. Fitur-fitur yang ditambahkan pada fase ini '
    'adalah auto-posting system, analytics dashboard, template marketplace, dan collaboration features. Tujuannya adalah meningkatkan '
    'retention dan mengurangi churn dengan membuat platform semakin indispensable bagi pengguna. Metrik keberhasilan Phase 2 mencakup '
    '5,000 active users, $30,000 MRR, dan monthly churn rate di bawah 5%. Fase ini juga memperkenalkan referral program dan '
    'affiliate system untuk mempercepat akuisisi pengguna secara organik.',
    body_style
))

story.append(add_heading('<b>7.3 Phase 3: Empire (Minggu 25-48)</b>', h2_style, level=1))

story.append(Paragraph(
    'Phase 3 adalah fase transformasi dari tool menjadi platform dan ekosistem. Fitur-fitur yang direncanakan mencakup Analytics Loop '
    'dengan ML-based optimization, API untuk developer, mobile app, dan kemampuan white-label untuk enterprise. Pada fase ini, '
    'GhostStudio AI juga mengeksplorasi vertical expansion ke niche-specific solutions: AI Influencer, AI VTuber, AI Streamer, '
    'AI Animated Series, AI Ads Generator, dan AI Education Media. Visi jangka panjang adalah menjadi "operating system produksi '
    'media otomatis" yang menyediakan infrastruktur untuk semua bentuk produksi konten berbasis AI.',
    body_style
))

phase_rows = [
    ['Phase 1', 'Minggu 1-12', 'MVP Launch', '500 users, 100 paid'],
    ['Phase 2', 'Minggu 13-24', 'Growth & Retention', '5K users, $30K MRR'],
    ['Phase 3', 'Minggu 25-48', 'Platform & Ecosystem', '25K users, $150K MRR'],
]
story.append(make_table(
    ['Phase', 'Timeline', 'Focus', 'Success Metrics'],
    phase_rows,
    col_ratios=[0.12, 0.18, 0.30, 0.40]
))
story.append(Spacer(1, 6))
story.append(Paragraph('<i>Tabel 11: Three-Phase Roadmap Overview</i>', meta_style))
story.append(Spacer(1, 18))

# ════════════════════════════════════════════
# 8. MONETIZATION STRATEGY
# ════════════════════════════════════════════
story.append(add_heading('<b>8. Monetization Strategy</b>', h1_style, level=0))

story.append(Paragraph(
    'Model monetisasi GhostStudio AI menggunakan struktur freemium dengan tiga tier berbayar yang masing-masing dirancang untuk '
    'segmen pengguna yang berbeda. Pricing strategy mengikuti prinsip value-based: pengguna membayar berdasarkan outcome yang '
    'mereka terima (jumlah konten yang diproduksi, kualitas output, dan fitur automation), bukan berdasarkan biaya produksi platform. '
    'Pendekatan ini memungkinkan margin yang sehat sambil tetap menawarkan entry point yang rendah untuk mengurangi friction '
    'dalam adoption.',
    body_style
))

price_rows = [
    ['Free', '$0', '3 videos/bulan, basic templates, watermark', 'Conversion funnel'],
    ['Creator', '$29/bulan', '30 videos/bulan, all templates, no watermark, HD export', 'Individual creators'],
    ['Pro', '$49/bulan', '100 videos/bulan, priority rendering, custom voices, analytics', 'Power users'],
    ['Agency', '$199/bulan', 'Unlimited, team seats, white-label, API access, SLA', 'Agencies & teams'],
]
story.append(make_table(
    ['Tier', 'Price', 'Features', 'Target Segment'],
    price_rows,
    col_ratios=[0.10, 0.15, 0.45, 0.30]
))
story.append(Spacer(1, 6))
story.append(Paragraph('<i>Tabel 12: Pricing Tier Structure</i>', meta_style))
story.append(Spacer(1, 12))

story.append(Paragraph(
    'Selain subscription revenue, GhostStudio AI juga memiliki tiga sumber pendapatan tambahan yang akan diaktifkan secara bertahap: '
    '<b>Template Marketplace</b> (creator dapat menjual template custom dan mendapatkan revenue share 70%), '
    '<b>Enterprise Contracts</b> (custom deployment dan integration untuk perusahaan besar dengan nilai kontrak $5,000-50,000/tahun), '
    'dan <b>API Access</b> (developer mengakses GhostStudio AI engine secara programatis dengan pricing per-render). '
    'Diversifikasi revenue stream ini memastikan ketahanan bisnis dan mengurangi ketergantungan pada satu sumber pendapatan.',
    body_style
))

story.append(Spacer(1, 12))

# Revenue projection
rev_rows = [
    ['Bulan 1-3', '$2,000', '$0', '$0', '$2,000'],
    ['Bulan 4-6', '$15,000', '$1,000', '$0', '$16,000'],
    ['Bulan 7-12', '$80,000', '$8,000', '$5,000', '$93,000'],
    ['Tahun 2', '$600,000', '$50,000', '$40,000', '$690,000'],
]
story.append(make_table(
    ['Period', 'Subscription', 'Marketplace', 'Enterprise/API', 'Total'],
    rev_rows,
    col_ratios=[0.18, 0.22, 0.22, 0.22, 0.16]
))
story.append(Spacer(1, 6))
story.append(Paragraph('<i>Tabel 13: Revenue Projection</i>', meta_style))
story.append(Spacer(1, 18))

# ════════════════════════════════════════════
# 9. COMPETITIVE ADVANTAGES
# ════════════════════════════════════════════
story.append(add_heading('<b>9. Competitive Advantages</b>', h1_style, level=0))

story.append(Paragraph(
    'GhostStudio AI memiliki beberapa keunggulan kompetitif yang membentuk moat defensibel terhadap kompetitor. Keunggulan ini '
    'tidak hanya bersifat teknis, tetapi juga mencakup positioning strategis dan network effect yang akan semakin kuat seiring '
    'pertumbuhan platform. Berikut adalah analisis mendalam terhadap setiap keunggulan kompetitif:',
    body_style
))

story.append(add_heading('<b>9.1 Niche Specificity</b>', h2_style, level=1))

story.append(Paragraph(
    'Fokus eksklusif pada faceless content creation memberikan dua keuntungan utama. Pertama, pengembangan fitur dapat sangat '
    'terfokus tanpa perlu mengakomodasi use case yang berbeda-beda, menghasilkan produk yang lebih baik untuk niche tersebut. '
    'Kedua, positioning sebagai specialist selalu menang melawan generalist dalam persepsi konsumen. Ketika seorang faceless creator '
    'memilih antara Canva (tool untuk semua orang) dan GhostStudio AI (tool yang dirancang khusus untuk mereka), pilihan menjadi '
    'sangat jelas. Spesialisasi ini juga memungkinkan marketing yang lebih efektif karena messaging dapat sangat spesifik dan resonan.',
    body_style
))

story.append(add_heading('<b>9.2 End-to-End Pipeline</b>', h2_style, level=1))

story.append(Paragraph(
    'Tidak ada kompetitor yang menawarkan pipeline lengkap dari prompt hingga posting. Setiap alternatif mengharuskan pengguna '
    'menggabungkan 3-5 tools berbeda, menciptakan friction dan inkonsistensi. GhostStudio AI menghilangkan kebutuhan ini dengan '
    'menyediakan satu sistem yang menangani seluruh workflow. Keunggulan ini semakin kuat seiring bertambahnya fitur karena switching '
    'cost meningkat: semakin banyak konten yang diproduksi dalam platform, semakin sulit pengguna berpindah ke alternatif.',
    body_style
))

story.append(add_heading('<b>9.3 Viral Knowledge Moat</b>', h2_style, level=1))

story.append(Paragraph(
    'Seiring penggunaan platform, GhostStudio AI mengumpulkan data tentang pola konten viral: hook mana yang paling efektif, '
    'pacing mana yang menghasilkan retensi tertinggi, dan visual style mana yang paling engaging. Data ini membentuk proprietary '
    'knowledge base yang semakin akurat seiring waktu, menciptakan positive feedback loop di mana semakin banyak pengguna, '
    'semakin baik rekomendasi sistem, semakin baik hasil pengguna, semakin banyak pengguna yang tertarik. Moat ini sangat '
    'sulit ditiru oleh kompetitor karena membutuhkan waktu dan volume pengguna untuk membangun dataset yang setara.',
    body_style
))

story.append(add_heading('<b>9.4 Speed to Market</b>', h2_style, level=1))

story.append(Paragraph(
    'Arsitektur yang berbasis API integration (bukan build-from-scratch) memungkinkan kecepatan pengembangan yang jauh lebih tinggi '
    'dibanding kompetitor yang mencoba membangun setiap komponen secara internal. Dengan memanfaatkan OpenAI untuk script, '
    'Replicate untuk image, ElevenLabs untuk voice, dan Remotion untuk rendering, GhostStudio AI dapat meluncurkan MVP dalam 12 minggu '
    'sementara kompetitor dengan pendekatan all-custom membutuhkan 6-12 bulan untuk mencapai parity fitur. Keunggulan waktu ini '
    'digunakan untuk membangun user base dan data moat sebelum kompetitor sempat bereaksi.',
    body_style
))

story.append(Spacer(1, 18))

# ════════════════════════════════════════════
# 10. RISK ASSESSMENT
# ════════════════════════════════════════════
story.append(add_heading('<b>10. Risk Assessment</b>', h1_style, level=0))

story.append(Paragraph(
    'Setiap proyek teknologi membawa risiko inherent yang harus diidentifikasi dan dimitigasi sejak awal. Berikut adalah analisis '
    'risiko komprehensif untuk GhostStudio AI beserta strategi mitigasi untuk masing-masing risiko:',
    body_style
))

risk_rows = [
    ['API Dependency', 'High', 'Medium', 'Multi-provider fallback, core abstraction layer'],
    ['AI Cost Scalability', 'High', 'High', 'Caching, batch processing, tier-based limits'],
    ['Content Quality', 'Medium', 'High', 'Human review option, quality scoring, A/B testing'],
    ['Platform ToS Changes', 'Medium', 'Medium', 'Diversified distribution, official API compliance'],
    ['Market Copycat', 'Medium', 'Low', 'Speed + data moat + niche loyalty'],
    ['Legal/Copyright', 'Low', 'High', 'Licensed assets, content policy, DMCA compliance'],
]
story.append(make_table(
    ['Risk', 'Probability', 'Impact', 'Mitigation Strategy'],
    risk_rows,
    col_ratios=[0.22, 0.14, 0.14, 0.50]
))
story.append(Spacer(1, 6))
story.append(Paragraph('<i>Tabel 14: Risk Assessment Matrix</i>', meta_style))
story.append(Spacer(1, 12))

story.append(Paragraph(
    'Risiko terbesar adalah <b>API dependency</b>: GhostStudio AI bergantung pada pihak ketiga untuk AI generation, TTS, dan video rendering. '
    'Mitigasi utama adalah membangun abstraction layer yang memungkinkan pergantian provider tanpa mengubah kode aplikasi. '
    'Sebagai contoh, jika OpenAI mengalami downtime atau price hike, sistem dapat secara otomatis beralih ke Anthropic atau Mistral. '
    'Demikian pula, jika ElevenLabs membatasi penggunaan, engine dapat beralih ke OpenAI TTS atau Google Cloud TTS sebagai fallback.',
    body_style
))

story.append(Paragraph(
    'Risiko kedua yang signifikan adalah <b>AI cost scalability</b>: semakin banyak pengguna, semakin tinggi biaya API per user. '
    'Untuk mengatasi ini, platform menerapkan strategi tiga lapis: caching (hasil generation yang identik dilayani dari cache), '
    'batch processing (permintaan digabungkan untuk mengurangi API calls), dan tier-based limits (pengguna free tier mendapat '
    'model yang lebih murah, pengguna premium mendapat model terbaik). Pendekatan ini memastikan bahwa marginal cost per user '
    'tetap terkendali seiring pertumbuhan pengguna.',
    body_style
))

story.append(Spacer(1, 18))

# ════════════════════════════════════════════
# 11. FINAL RECOMMENDATIONS
# ════════════════════════════════════════════
story.append(add_heading('<b>11. Final Recommendations</b>', h1_style, level=0))

story.append(Paragraph(
    'Berdasarkan seluruh analisis di atas, berikut adalah rekomendasi strategis untuk pelaksanaan GhostStudio AI:',
    body_style
))

rec_items = [
    '<b>Mulai dari "mesin konten viral otomatis"</b>, bukan "AI animasi canggih". Pendekatan ini lebih cepat diimplementasikan, '
    'lebih murah dikembangkan, lebih mudah viral, lebih mudah dimonetisasi, dan lebih realistis untuk solo founder.',

    '<b>Fokus MVP pada 5 fitur inti</b> yang langsung membuktikan value proposition: script generator, subtitle animation, '
    'image slideshow motion, TTS, dan export shorts. Fitur tambahan seperti auto-posting dan analytics loop ditunda ke Phase 2.',

    '<b>Gunakan API-first architecture</b> untuk mempercepat time-to-market. Jangan membangun AI model dari nol ketika '
    'OpenAI, Replicate, dan ElevenLabs sudah menyediakan API yang powerful. Bangun differentiation melalui pipeline integration '
    'dan viral knowledge, bukan melalui model custom.',

    '<b>Target faceless creator niche terlebih dahulu</b> sebelum melebar ke agency dan affiliate. Niche ini memiliki pain point '
    'paling akut, willingness to pay tertinggi, dan merupakan segmen yang paling under-served oleh kompetitor eksisting.',

    '<b>Bangun data moat sejak hari pertama</b>. Setiap konten yang dihasilkan dan performanya adalah data berharga yang '
    'membentuk proprietary knowledge base. Semakin cepat platform meluncur, semakin cepat data moat terbentuk, dan semakin '
    'sulit bagi kompetitor untuk mengejar.',

    '<b>Pertahankan kemampuan bootstrapping</b>. Jangan raise funding terlalu dini. Biarkan produk dan traction berbicara. '
    'Dengan arsitektur yang lean dan API-based, burn rate dapat dijaga rendah sambil memvalidasi product-market fit. '
    'Fundraising menjadi relevan hanya setelah traction terbukti dan untuk tujuan scaling, bukan survival.',
]

for item in rec_items:
    story.append(bullet(item))

story.append(Spacer(1, 18))

# ── Final positioning quote ──
story.append(Paragraph(
    '<b>Jangan jual "AI animation". Jual "AI audience growth machine".</b>',
    quote_style
))

story.append(Paragraph(
    'GhostStudio AI bukan animator. Bukan editor. Tapi mesin konten otomatis yang mengubah satu prompt menjadi '
    'empire media tanpa wajah. Itulah value proposition yang tidak dapat ditiru oleh kompetitor mana pun.',
    ParagraphStyle(
        name='FinalNote', fontName='DejaVuSerif', fontSize=10.5,
        leading=17, textColor=TEXT_MUTED, alignment=TA_CENTER,
        spaceBefore=8, spaceAfter=20
    )
))

# ── Build ──
doc.multiBuild(story, onFirstPage=draw_first_page, onLaterPages=draw_dark_bg)

print(f"Body PDF generated: {output_path}")
