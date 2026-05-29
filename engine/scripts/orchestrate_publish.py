#!/usr/bin/env python3
"""
AI MEDIA ENGINE — Full Orchestration v1.0
Generate → Adapt → Publish → Report
"""

import json
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from publishers import get_publisher, list_publishers

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "output")

MASTER = {
    "title": "Masa Depan AI di Indonesia: Antara Peluang dan Kesiapan",
    "author": "Tim Riset Teknologi",
}

MASTER_BODY = """## Pendahuluan

Kecerdasan buatan (AI) bukan lagi sekadar konsep fiksi ilmiah. Di Indonesia, AI telah merasuk ke berbagai aspek kehidupan—dari rekomendasi konten di ponsel hingga sistem deteksi fraud di perbankan. Namun seberapa siapkah Indonesia menghadapi era AI?

## Peluang yang Terbuka Lebar

### Transformasi Ekonomi Digital

Ekonomi digital Indonesia diproyeksikan mencapai USD 130 miliar pada 2025. AI menjadi akselerator utamanya. Startup-startup Indonesia seperti Gojek, Bukalapak, dan Traveloka telah mengadopsi AI untuk personalisasi layanan, optimasi logistik, dan prediksi permintaan. Sektor UMKM yang mencakup 99% bisnis di Indonesia kini mulai merasakan manfaat AI—dari chatbot layanan pelanggan hingga analisis pasar otomatis.

### Revolusi Pendidikan

AI membuka akses pendidikan berkualitas ke seluruh pelosok negeri. Platform pembelajaran adaptif menggunakan AI untuk menyesuaikan materi dengan kemampuan masing-masing siswa. Di daerah terpencil yang kekurangan guru, AI bisa menjadi tutor virtual yang siap membantu 24 jam.

### Layanan Kesehatan yang Lebih Cerdas

Telemedicine dan diagnosis berbasis AI semakin relevan di negara kepulauan seperti Indonesia. Algoritma AI dapat membantu mendeteksi dini penyakit tropis, menganalisis hasil rontgen, dan memprediksi penyebaran wabah—semua dari jarak jauh.

## Tantangan yang Tidak Bisa Diabaikan

### Kesiapan Infrastruktur

Masih ada kesenjangan digital yang signifikan. Hanya 65% wilayah Indonesia yang memiliki akses internet stabil. AI membutuhkan data besar dan komputasi awan—tanpa infrastruktur yang memadai, manfaat AI hanya dinikmati segelintir orang di kota besar.

### Kesenjangan Talenta

Indonesia kekurangan tenaga ahli AI. Laporan Kementerian Kominfo mencatat kebutuhan 600.000 talenta digital per tahun, namun baru terpenuhi sekitar 200.000. Perguruan tinggi masih beradaptasi dengan kurikulum yang relevan.

### Regulasi dan Etika

UU Perlindungan Data Pribadi (UU PDP) yang baru disahkan menjadi langkah maju, tetapi masih diperlukan kerangka regulasi spesifik untuk AI—termasuk soal bias algoritma, transparansi keputusan AI, dan akuntabilitas.

## Masa Depan yang Kolaboratif

Indonesia tidak perlu memilih antara mengadopsi AI atau menolaknya. Kuncinya adalah kolaborasi: pemerintah menyediakan infrastruktur dan regulasi, akademisi menghasilkan riset dan talenta, industri mengembangkan solusi yang relevan, dan masyarakat menjadi partisipan aktif.

Langkah konkret yang bisa diambil: investasi infrastruktur digital, reformasi kurikulum pendidikan dengan integrasi literasi AI, insentif riset AI yang relevan dengan kebutuhan lokal, sandbox regulasi untuk inovasi, dan literasi publik tentang AI.

## Kesimpulan

AI bukanlah ancaman yang harus ditakuti, melainkan alat yang harus dipahami dan diarahkan. Indonesia memiliki modal besar—penduduk muda yang melek teknologi, pertumbuhan ekonomi digital yang pesat, dan semangat inovasi yang tinggi. Dengan persiapan yang matang, AI bisa menjadi lompatan besar bagi Indonesia menuju masa depan yang lebih cerah."""

PLATFORM_VARIANTS = {}

# Define all platform variants inline
PLATFORM_VARIANTS["telegraph"] = {
    "title": "AI di Indonesia 2025: Peluang, Tantangan & Kesiapan Nasional",
    "body": MASTER_BODY,
}
PLATFORM_VARIANTS["medium"] = {
    "title": "Masa Depan AI di Indonesia: Antara Peluang dan Kesiapan",
    "body": "Saya masih ingat pertama kali mendengar istilah 'kecerdasan buatan' dalam kuliah pengantar teknologi satu dekade lalu. Waktu itu, AI masih terasa seperti konsep abstrak yang hanya terjadi di film-film Silicon Valley. Tapi sekarang? AI ada di saku kita, di layar ponsel kita, dan—tanpa kita sadari—mulai membentuk kembali cara kita bekerja, belajar, dan hidup.\n\n" + MASTER_BODY + "\n\nLalu saya bertanya: apakah Indonesia siap? Jawabannya ada pada apa yang kita lakukan hari ini. Bukan besok.",
}
PLATFORM_VARIANTS["wordpress"] = {
    "title": "AI di Indonesia 2025: Peluang, Tantangan, dan Langkah Strategis — Analisis Komprehensif",
    "body": "<h2>Pendahuluan</h2><p>Kecerdasan buatan (AI) bukan lagi sekadar konsep fiksi ilmiah. Di Indonesia, AI telah merasuk ke berbagai aspek kehidupan—dari rekomendasi konten di ponsel hingga sistem deteksi fraud di perbankan. Artikel ini menyajikan analisis komprehensif tentang kesiapan Indonesia menghadapi era AI, mencakup peluang, tantangan, dan langkah strategis ke depan.</p>" + MASTER_BODY.replace("## ", "<h2>").replace("### ", "<h3>").replace("\n\n", "</p><p>") + "</p>",
}
PLATFORM_VARIANTS["blogger"] = {
    "title": "AI Udah Dekat, Indonesia Siap Belum?",
    "body": "Gue lagi mikir-mikir akhir-akhir ini. Lo tau AI kan? Yang suka lo liat di berita atau mungkin lo pake ChatGPT buat bantuin tugas. Nah, gue penasaran: Indonesia tuh sebenernya siap apa kagak sih sama teknologi ini?\n\n" + MASTER_BODY + "\n\nGue rasa sih siap, asal kita serius. Bukan cuma pemerintah, tapi kita semua. Lo, gue, tetangga lo, semuanya. Karena AI bakal ngaruh ke semua orang. Siap-siap ya!",
}
PLATFORM_VARIANTS["substack"] = {
    "title": "🇮🇩 Indonesia dan AI: Surat untuk Masa Depan",
    "body": "Hai pembaca setia,\n\nSelamat datang di edisi spesial newsletter pekan ini. Kali ini saya ingin mengajak kamu merenung sejenak tentang sesuatu yang mungkin sudah sering kamu dengar tapi jarang kita kupas dari sudut pandang Indonesia: Artificial Intelligence.\n\n---\n\n" + MASTER_BODY + "\n\n---\n\nBagaimana pendapatmu? Balas email ini atau tinggalkan komentar. Sampai jumpa di edisi berikutnya!\n\n— Tim Riset Teknologi\n\nPS: Jangan lupa share newsletter ini ke teman yang tertarik dengan teknologi Indonesia. 🇮🇩",
}
PLATFORM_VARIANTS["beehiiv"] = {
    "title": "🤖 AI di Indonesia: Data Baru, Fakta, dan Prediksi",
    "body": "**TL;DR:** Indonesia di persimpangan AI—peluang ekonomi digital USD 130 miliar vs kesenjangan infrastruktur dan talenta.\n\n---\n\n" + MASTER_BODY + "\n\n---\n\n**📊 Angka Penting:**\n• USD 130 miliar → Proyeksi ekonomi digital RI 2025\n• 65% → Wilayah RI dengan akses internet stabil\n• 400.000 → Kekurangan talenta digital per tahun\n\n**💡 Action Item:** Bagikan artikel ini ke satu kolega yang perlu tahu dampak AI di industri kita.",
}
PLATFORM_VARIANTS["devto"] = {
    "title": "AI in Indonesia 2025: A Developer's Perspective",
    "body": "## Why Indonesia Matters for AI\n\nAs a developer, Indonesia deserves your attention: 280M people, 4th largest population globally, fastest-growing digital economy. It's both a massive market and a unique testbed for AI solutions.\n\n### Market Opportunity\n\nIndonesia's digital economy is projected to reach $130B by 2025. AI is the primary accelerator. Gojek uses ML for route optimization, Bukalapak for recommendations, fintechs for fraud detection.\n\n### The Developer Reality\n\n**Talent gap**: 600K digital talents needed annually, only 200K produced. Demand far exceeds supply.\n\n**Infrastructure**: Only 65% of regions have stable internet. Edge AI and offline-first ML models are essential, not optional.\n\n### Tech Stack for Indonesia\n- **Edge**: TensorFlow Lite, ONNX Runtime\n- **Cloud**: Google Cloud Indonesia (Jakarta region)\n- **NLP**: IndoBERT, IndoLEM for Bahasa Indonesia\n- **Deployment**: Railway, Vercel for APIs\n\n## What Developers Can Do\n\n1. Build for low-bandwidth environments\n2. Focus on Indonesian-language NLP (Bahasa models are scarce)\n3. Contribute to open-source AI for emerging markets\n4. Join PyData Jakarta or Indonesia AI communities",
}
PLATFORM_VARIANTS["hashnode"] = {
    "title": "AI in Indonesia 2025: Infrastructure, Talent & Regulation",
    "body": "## Table of Contents\n1. Introduction\n2. Market Opportunity\n3. Infrastructure Reality\n4. Talent Landscape\n5. Regulatory Framework\n\n---\n\n## Introduction\n\nAs a developer working in or with Indonesia, understanding the AI landscape is crucial. This technical analysis covers infrastructure, talent gaps, and regulatory challenges facing the world's 4th most populous nation.\n\n## Market Opportunity\n\nIndonesia's digital economy at $130B by 2025. Startup adoption of AI is accelerating across Gojek, Traveloka, Bukalapak.\n\n## Infrastructure Reality\n\nOnly 65% internet penetration means building AI for offline-first scenarios. Edge computing is not optional.\n\n## Talent Landscape\n\n400K annual shortfall of digital talent. Need 600K/year, produce only 200K.\n\n## Regulatory Framework\n\nUU PDP is a start but AI-specific regulation needed for bias, transparency, accountability.",
}
PLATFORM_VARIANTS["ghost"] = {
    "title": "Indonesia di Persimpangan AI: Peta Jalan Menuju 2030",
    "body": "*Analisis mendalam tentang ekosistem AI Indonesia dan langkah-langkah strategis menuju 2030.*\n\n" + MASTER_BODY,
}
PLATFORM_VARIANTS["mirrorxyz"] = {
    "title": "Desentralisasi Intelijen: Mengapa AI dan Web3 Harus Bertemu di Indonesia",
    "body": "## Mengapa AI Perlu Desentralisasi\n\nBayangkan jika algoritma AI yang menentukan skor kreditmu, kelulusan beasiswamu, atau bahkan vonis hukummu—dan semua itu dikendalikan oleh segelintir korporasi. Itulah mengapa kita membutuhkan Desentralized AI (dAI).\n\n" + MASTER_BODY.replace("AI", "dAI (Desentralized AI)") + "\n\n## Peran Web3\n\nBlockchain bisa membawa transparansi ke dalam AI:\n- **On-chain audit trail** untuk setiap keputusan AI\n- **DAOs** untuk governance algoritma publik\n- **Token incentives** untuk berbagi data training\n\nIndonesia dengan populasi crypto-nya yang besar bisa menjadi pemimpin global dalam desentralisasi AI.",
}
PLATFORM_VARIANTS["writeas"] = {
    "title": "AI dan Indonesia",
    "body": "AI telah tiba di Indonesia.\n\nBukan lagi mimpi. Bukan lagi konsep. Tapi nyata—di ponsel, di kantor, di rumah sakit.\n\nPeluangnya besar. Tantangannya nyata. Tapi yang terpenting: kita punya pilihan.\n\nApakah kita akan menjadi penonton atau pemain?\n\nJawabannya ada pada apa yang kita lakukan hari ini.",
}
PLATFORM_VARIANTS["bearblog"] = {
    "title": "AI di Indonesia",
    "body": "AI bukan lagi masa depan. Ini masa kini.\n\nIndonesia ada di persimpangan—antara peluang USD 130 miliar dan kesenjangan infrastruktur.\n\nYang dibutuhkan sekarang: kolaborasi pemerintah, akademisi, industri, dan masyarakat.\n\nBukan pertanyaan apakah AI akan mengubah kita, tapi bagaimana kita mengarahkannya.",
}
PLATFORM_VARIANTS["hubpages"] = {
    "title": "Dampak AI terhadap Pekerjaan di Indonesia: Panduan Lengkap",
    "body": "## Pendahuluan\n\nApakah AI akan menggantikan pekerjaan Anda? Pertanyaan ini mungkin membuat banyak pekerja Indonesia khawatir. Artikel ini akan memandu Anda memahami dampak AI, sektor mana yang paling terpengaruh, dan bagaimana Anda bisa tetap relevan.\n\n" + MASTER_BODY.replace("## ", "### ").replace("Kesimpulan", "## Yang Harus Anda Lakukan Sekarang\n\n1. **Pelajari AI** — ambil kursus online gratis\n2. **Identifikasi skill unik Anda** — AI sulit menggantikan empati dan kreativitas\n3. **Bangun jaringan** — bergabung dengan komunitas teknologi\n\nAI bukan pengganti Anda. AI adalah alat yang bisa Anda gunakan untuk bekerja lebih baik."),
}
PLATFORM_VARIANTS["vocal"] = {
    "title": "Ketika AI Menggenggam Tangan Indonesia",
    "body": "Saya ingat pertama kali melihat kakek saya memegang smartphone. Tangannya gemetar, matanya bingung, tapi ada rasa bangga di sana. \"Canggih ya,\" katanya. \"Dulu kita cuma punya radio.\"\n\nSekarang, bayangkan kakek saya melihat AI. Bukan hanya smartphone, tapi sesuatu yang bisa berpikir, bicara, dan bahkan menulis.\n\n" + MASTER_BODY + "\n\nDan ketika saya selesai menulis ini, saya bertanya: apa yang akan dikatakan kakek saya tentang semua ini? Mungkin dia akan tersenyum dan berkata, \"Yang penting, jangan lupa jadi manusia.\"\n\nMungkin itu jawabannya.",
}
PLATFORM_VARIANTS["steemit"] = {
    "title": "Masa Depan AI di Indonesia: Antara Peluang dan Kesiapan — Analisis Komprehensif",
    "body": "> *Kecerdasan buatan bukan lagi cerita masa depan—ini adalah realitas yang sedang membentuk ulang Indonesia, dan kita semua adalah bagian dari perubahannya.*\n\n" + MASTER_BODY + "\n\n---\n\n**Bagaimana pendapat Anda?** Apakah Indonesia siap menghadapi era AI? Tinggalkan komentar di bawah dan jangan lupa vote jika artikel ini bermanfaat! 🙏",
}
PLATFORM_VARIANTS["lokal"] = {
    "title": "AI untuk Indonesia: Peluang Besar di Tengah Keterbatasan",
    "body": MASTER_BODY + "\n\n---\n\n**Apa artinya buat kita di daerah?**\n\nMeskipun pembahasan di atas terasa global, dampaknya sangat lokal. UMKM di daerah bisa memanfaatkan AI untuk:\n1. **Chatbot WhatsApp** — layanan pelanggan 24 jam tanpa perlu staff tambahan\n2. **Analisis pasar otomatis** — tahu produk apa yang lagi dicari konsumen\n3. **Terjemahan otomatis** — jangkau pasar nasional tanpa kendala bahasa\n\nMulailah dari yang kecil. Satu chatbot. Satu analisis pasar. Dari situ, skala bisnis Anda.",
}
PLATFORM_VARIANTS["tiktok"] = {
    "title": "AI di Indonesia: Siap atau Tidak?",
    "body": """SCRIPT FOR FACELESS VIDEO (TikTok/Shorts/Reels):

VISUAL: Fast-paced animation, AI-themed, Indonesia map, digital elements

INTRO (0-3s):
Text on screen: "INDONESIA VS AI" 
Background: Blinking circuit board map of Indonesia

MAIN CONTENT (3-45s):
Scene 1: AI icons popping up
Narration: "AI bukan lagi mimpi. Ini nyata. Udah ada di HP lo."

Scene 2: Dollar signs, growth chart
Narration: "Peluang ekonomi digital Indonesia: 130 miliar dolar pada 2025."

Scene 3: Split screen shows city vs remote village
Narration: "Tapi baru 65% wilayah kita yang punya internet stabil."

Scene 4: Graduates with laptops
Narration: "Kita butuh 600.000 talenta digital per tahun. Yang ada cuma 200.000."

Scene 5: Light bulb turning on
Narration: "Solusinya? Kolaborasi. Pemerintah, akademisi, industri, dan lo."

OUTRO (45-60s):
Text: "Follow untuk info teknologi Indonesia!"
Narration: "Indonesia siap? Jawabannya tergantung kita semua."
"""
}
PLATFORM_VARIANTS["youtube"] = {
    "title": "AI di Indonesia 2025: Peluang vs Kesiapan",
    "body": """SCRIPT FOR YOUTUBE (Long-form, 8-10 minutes):

[INTRO - 0:00-0:45]
Host on screen with Indonesia map overlay
"Selamat datang di channel ini. Hari ini kita akan bahas topik yang mungkin sudah sering kamu dengar, tapi jarang kita kupas dari perspektif Indonesia: Kecerdasan Buatan atau AI."

[SEGMENT 1 - 0:45-2:30] Peluang Ekonomi
"Ekonomi digital Indonesia diproyeksikan mencapai USD 130 miliar pada 2025..."

[SEGMENT 2 - 2:30-4:30] Tantangan Infrastruktur
"Tapi ada tantangan besar yang tidak bisa kita abaikan..."

[SEGMENT 3 - 4:30-6:30] Talenta dan Regulasi
"Indonesia kekurangan tenaga ahli AI..."

[SEGMENT 4 - 6:30-8:00] Langkah ke Depan
"Langkah konkret yang perlu diambil..."

[OUTRO - 8:00-9:00]
"Jadi, apakah Indonesia siap? Jawabannya... tergantung kita semua."
CTA: Like, subscribe, share pendapat di komentar
"""
}
PLATFORM_VARIANTS["instagram"] = {
    "title": "AI di Indonesia? Siap atau Kaget? 🇮🇩",
    "body": """SCRIPT FOR INSTAGRAM REEL (Vertical 9:16, 30-60 seconds):

[0-3s] Text: AI di Indonesia? Visual: Map of Indonesia with AI circuits
[3-10s] Text: PELUANG: USD 130 Miliar! Visual: Growth chart
[10-20s] Text: TANTANGAN: 65% akses internet. Visual: Connected vs disconnected
[20-30s] Text: BUTUH 600.000 TALENTA PER TAHUN. Visual: Coding screens
[30-45s] Text: SOLUSI: Kolaborasi! Visual: Government + tech + education
[45-60s] Text: INDONESIA SIAP? JAWABANNYA DI KITA!

Hashtags: #AI #Indonesia #Teknologi #ArtificialIntelligence #AIIndonesia
"""
}


def save_variant(platform, title, body):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    ts = datetime.now().strftime('%Y%m%d_%H%M%S')
    safe_platform = platform.replace("/", "-")
    filepath = os.path.join(OUTPUT_DIR, f"{safe_platform}_{ts}.json")
    data = {
        "platform": platform,
        "title": title,
        "body": body,
        "word_count": len(body.split()),
        "generated_at": datetime.now().isoformat(),
        "status": "ready_to_publish"
    }
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    return filepath


def check_credentials(platform_name):
    config_path = "engine_config.json"
    if not os.path.exists(config_path):
        return False, {}
    with open(config_path) as f:
        config = json.load(f)
    creds = config.get("credentials", {}).get(platform_name, {})
    has_creds = any(v for v in creds.values() if isinstance(v, str) and v.strip())
    return has_creds, creds


def main():
    print("=" * 64)
    print("  🚀 AI MEDIA ENGINE — FULL ORCHESTRATION v1.0")
    print(f"  📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 64)

    # ── PHASE 1: Generate variants ──
    print("\n📝 [1/4] GENERATING PLATFORM-SPECIFIC VARIANTS...")
    print(f"   Master: {MASTER['title']}")
    print(f"   Base kata: {len(MASTER_BODY.split())} kata\n")
    
    saved_files = {}
    master_file = save_variant("master", MASTER["title"], MASTER_BODY)
    print(f"   ✅ master → {os.path.basename(master_file)}")

    for platform, variant in PLATFORM_VARIANTS.items():
        filepath = save_variant(platform, variant["title"], variant["body"])
        saved_files[platform] = filepath
        wc = len(variant["body"].split())
        print(f"   ✅ {platform:12s} → {wc:4d} kata → {os.path.basename(filepath)}")

    # ── PHASE 2: Publish to Telegra.ph (no auth) ──
    print("\n📤 [2/4] PUBLISHING TO LIVE PLATFORMS...")
    
    published = []
    skipped = []

    tp = PLATFORM_VARIANTS.get("telegraph", {})
    if tp:
        print(f"\n   📡 Trying Telegra.ph (no auth needed)...")
        try:
            tp_pub = get_publisher("telegraph")
            if tp_pub:
                # Call publish with SEPARATE title, body, options arguments
                result = tp_pub.publish(
                    title=tp["title"],
                    body=tp["body"],
                    content_type="article",
                    options={"author_name": MASTER["author"]}
                )
                if result.success:
                    print(f"      ✅ Published! → {result.url}")
                    published.append(("telegraph", result.url))
                else:
                    err = result.error_msg or "unknown"
                    print(f"      ❌ Failed: {err}")
                    skipped.append(("telegraph", err))
            else:
                print("      ⚠️  Publisher not found")
                skipped.append(("telegraph", "publisher not loaded"))
        except Exception as e:
            print(f"      ❌ Error: {e}")
            skipped.append(("telegraph", str(e)))

    # ── PHASE 3: Try other platforms ──
    print(f"\n   🔑 Checking credentials for other platforms...")
    for platform in sorted(PLATFORM_VARIANTS.keys()):
        if platform == "telegraph":
            continue
        variant = PLATFORM_VARIANTS.get(platform, {})
        if not variant:
            continue

        has_creds, creds = check_credentials(platform)
        if not has_creds:
            print(f"      ⏭️  {platform:12s} → SKIP (no credentials)")
            skipped.append((platform, "no credentials in engine_config.json"))
            continue

        print(f"      📡 {platform:12s} credentials found, attempting...")
        try:
            pub = get_publisher(platform)
            if pub:
                result = pub.publish(
                    title=variant["title"],
                    body=variant["body"],
                    content_type="article",
                    options={"author_name": MASTER["author"]}
                )
                if result.success:
                    print(f"      ✅ Published! → {result.url}")
                    published.append((platform, result.url))
                else:
                    err = result.error_msg or "unknown"
                    print(f"      ❌ Failed: {err}")
                    skipped.append((platform, err))
            else:
                print(f"      ⚠️  No publisher for {platform}")
                skipped.append((platform, "no publisher adapter"))
        except Exception as e:
            print(f"      ❌ Error: {e}")
            skipped.append((platform, str(e)))

    # ── PHASE 4: Report ──
    print("\n" + "=" * 64)
    print("  📊 [4/4] ORCHESTRATION RESULTS")
    print("=" * 64)
    print(f"\n  📝  Master: \"{MASTER['title']}\"")
    print(f"  📦  Variants: {len(PLATFORM_VARIANTS)} (all in output/)")
    print(f"  ✅  Published: {len(published)} platform(s)")
    print(f"  ⏭️  Skipped:   {len(skipped)} platform(s)")

    if published:
        print(f"\n  🌐 LIVE LINKS:")
        for platform, url in published:
            print(f"      📍 {platform:12s} → {url}")
    else:
        print(f"\n  ❌ No platforms published yet.")

    if skipped:
        print(f"\n  ⏭️  SKIPPED:")
        for platform, reason in skipped:
            print(f"      {platform:12s} → {reason}")

    print(f"\n  💾  Files: {OUTPUT_DIR}/")
    print(f"\n  📋  NEXT STEPS:")
    print(f"     1. Isi credentials di engine_config.json untuk platform yang mau dipake")
    print(f"     2. Dapatkan API key (OpenRouter, Puter token baru, atau OpenAI)")
    print(f"     3. Set safe_mode=false → biarkan auto-publish berjalan")
    print(f"     4. Jalankan: python scripts/auto_publish.py run \"topik\"")
    print(f"     5. Cron auto-publish tiap 4 jam udah jalan")

    report = {
        "timestamp": datetime.now().isoformat(),
        "master_title": MASTER["title"],
        "total_variants": len(PLATFORM_VARIANTS),
        "published": [(p, u) for p, u in published],
        "skipped": [(p, r) for p, r in skipped],
        "output_dir": OUTPUT_DIR
    }
    report_file = os.path.join(OUTPUT_DIR, f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
    with open(report_file, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f"\n  📋  Report: {os.path.basename(report_file)}")
    print("=" * 64)
    print("  ✅  ORCHESTRATION COMPLETE")
    print("=" * 64)


if __name__ == "__main__":
    main()
