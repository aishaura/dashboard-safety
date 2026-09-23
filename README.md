# Safety Intelligence Dashboard ID 🇮🇩
### *Integrated Safety, Disaster, Traffic Incident & Environmental Monitoring Platform*

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-green?style=flat&logo=leaflet)](https://leafletjs.com/)
[![Status](https://img.shields.io/badge/Status-Live%20Ready-success)](#)

Platform intelijen keselamatan berbasis web yang dirancang sebagai media demonstrasi interaktif dalam **webinar keselamatan (*safety presentation*)** sekaligus platform pemantauan berkelanjutan. Sistem ini mengintegrasikan data bencana alam, insiden kecelakaan lalu lintas, aktivitas gunung api, titik panas karhutla, dan kualitas lingkungan dari berbagai sumber terbuka legal di Indonesia.

---

## 🎯 Fokus Pengembangan (3 Pertanyaan Utama)

Platform ini secara khusus dirancang untuk menjawab 3 pertanyaan esensial:
1. **"Apa yang sedang terjadi sekarang?"** (*Real-time Situational Awareness*)
   * Pantauan langsung gempa bumi M5+ dan gempa dirasakan dari BMKG.
   * Deteksi anomali termal / titik panas karhutla dari satelit NASA FIRMS.
   * Parameter cuaca ekstrem dan kualitas udara (AQI / PM2.5) waktu nyata.
2. **"Apa saja yang pernah terjadi di suatu wilayah?"** (*Location Safety Memory & Risk Profile*)
   * Menampilkan **Safety Profile Wilayah** (contoh: **Bandung Raya**) yang merangkum skor indeks risiko, riwayat banjir luapan Sungai Citarum (Dayeuhkolot/Baleendah), kerawanan seismik Sesar Lembang & Garsela, serta titik rawan kecelakaan Tol Cipularang.
3. **"Di mana serta bagaimana pola kejadian safety terjadi?"** (*Spatial-Temporal Patterns & Trends*)
   * Peta interaktif multi-layer berlatar gelap (*dark command-center canvas*) dengan indikator titik rawan (*blackspot*), grafik distribusi kategori, dan analisis dinamika temporal.

---

## 🛡️ Kejujuran Data & Data Provenance

Untuk menjaga integritas ilmiah dan menghindari klaim keliru dalam presentasi, setiap entitas kejadian memiliki **Data Provenance Badge**:

| Badge | Status | Siklus Pembaruan | Sumber Terintegrasi |
| :---: | :--- | :--- | :--- |
| 🟢 | **REALTIME** | < 1 jam | **BMKG TEWS** (Gempa bumi & Shakemap), **Open-Meteo** (ISPU/AQI & Cuaca) |
| 🟡 | **NEAR REAL-TIME** | 3 - 24 jam | **NASA FIRMS** (Satelit MODIS Terra/Aqua & VIIRS Active Fire) |
| 🔵 | **HISTORICAL** | Rekap resmi | **BNPB DIBI** (Data Informasi Bencana Indonesia), **BPS** |
| 🟣 | **VERIFIED REPORT** | Laporan berkala | **KNKT** (Investigasi transportasi), **Korlantas Polri PJR**, **BPBD** |

---

## ✨ Fitur Unggulan

### 1. Smart Location Search & Natural Language Query Parser
Pencarian pintar yang memahami konteks bahasa alami:
* Ketik **`"Bandung"`** $\rightarrow$ Membuka berkas **Safety Profile Bandung Raya**, peta terfokus, dan daftar sub-area rawan (*hotspots*).
* Ketik **`"Kecelakaan Bandung"`** $\rightarrow$ Memfilter seluruh insiden kecelakaan lalu lintas di Bandung Raya.
* Ketik **`"Banjir Bandung"`** $\rightarrow$ Memfilter data genangan air dan luapan sungai di wilayah Bandung.
* Ketik **`"Kecelakaan Bandung September 2026"`** $\rightarrow$ Menampilkan filter kombinasi kategori, lokasi, serta periode spesifik.
* Ketik **`"Titik Api"`** $\rightarrow$ Menampilkan sebaran anomali termal satelit NASA FIRMS.

### 2. Dedicated Presentation / Webinar Mode
Mode presentasi layar penuh (*fullscreen command center*) yang dirancang khusus untuk dibagikan via Zoom, Google Meet, atau proyektor:
* Tipografi besar berkontras tinggi dan visual tajam bebas distraksi.
* **5 Alur Slide Presenter**:
  1. *Situasi Terkini Nasional (KPIs & High-Impact Map)*
  2. *Studi Kasus Wilayah: Profil Keselamatan Bandung Raya*
  3. *Pola Spasial & Titik Rawan Kecelakaan Lalu Lintas (Cipularang & KNKT)*
  4. *Deteksi Satelit Luar Angkasa Titik Panas Karhutla (NASA FIRMS)*
  5. *Safety Insights & Rekomendasi Kebijakan Mitigasi*
* **Fitur Auto-Rotation**: Opsi rotasi slide otomatis setiap 15 detik dengan visual progress bar.
* **Kontrol Navigasi**: Tombol `Panah Kanan` / `Spasi` (Next), `Panah Kiri` (Prev), dan `ESC` (Keluar).

### 3. Traceable Safety Insights Engine
Generator ringkasan analitis otomatis berbasis data agregat aktual (contoh: *"Dalam 7 hari terakhir terdeteksi X gempa tektonik..."*, *"Wilayah Dayeuhkolot mencatat frekuensi banjir tertinggi..."*). Dilengkapi tombol **[Lihat Data]** yang langsung menghubungkan narasi ke bukti empiris pada tabel.

### 4. Interactive Command-Center Map
* Menggunakan Leaflet dengan *dark basemap* (CartoDB Dark Matter).
* Simbol penanda berkode warna per kategori dengan animasi denyut (*pulse beacon*) untuk kejadian berstatus kritis (Level 4).
* Pop-up rincian dan tombol fokus peta.

---

## 💻 Tumpukan Teknologi (Tech Stack)

* **Frontend & Backend**: Next.js 14 (App Router, Serverless API Routes)
* **Bahasa**: TypeScript
* **Styling**: Tailwind CSS, Lucide React Icons
* **Pemetaan Spasial**: Leaflet, Leaflet Custom Markers
* **Grafik & Visualisasi**: Recharts (Bar, Donut, Area charts)
* **Penyimpanan Data**: In-memory repository dengan JSON persistence + skema referensi PostgreSQL / PostGIS (`lib/db/schema.sql`)

---

## 🚀 Panduan Instalasi & Menjalankan Aplikasi

### 1. Kloning Repository
```bash
git clone https://github.com/USERNAME_ANDA/dashboard-safety.git
cd dashboard-safety
```

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Sinkronisasi Data Awal (Opsional)
Untuk menarik data live terkini dari BMKG dan NASA FIRMS:
```bash
npm run sync
```

### 4. Menjalankan di Mode Development
```bash
npm run dev
```
Buka peramban di [http://localhost:3000](http://localhost:3000).

### 5. Membangun untuk Produksi
```bash
npm run build
npm run start
```

---

## 📂 Struktur Proyek

```
dashboard-safety/
├── app/
│   ├── api/
│   │   ├── events/route.ts          # Endpoint query insiden & Ingestion API
│   │   ├── regions/[slug]/route.ts  # Endpoint Safety Profile wilayah
│   │   ├── insights/route.ts        # Endpoint narasi insight terautomasi
│   │   └── sync/route.ts            # Trigger penarikan data BMKG & FIRMS
│   ├── layout.tsx                   # Tata letak dasar & tema gelap
│   └── page.tsx                     # Halaman utama dashboard
├── components/
│   ├── Navbar.tsx                   # Bar pencarian, chips, & tombol mode webinar
│   ├── StatsOverview.tsx            # Kartu metrik utama (KPI cards)
│   ├── FilterBar.tsx                # Filter kategori, keparahan, & status data
│   ├── Map/                         # Peta interaktif Leaflet
│   ├── EventFeed.tsx                # Daftar kejadian real-time & arsip
│   ├── AnalyticsCharts.tsx          # Visualisasi grafik Recharts
│   ├── EventDetailModal.tsx         # Modal rincian insiden & tautan sumber
│   ├── SafetyProfileDrawer.tsx      # Berkas dossier profil wilayah (Bandung)
│   ├── SafetyInsightsPanel.tsx      # Panel wawasan analitis otomatis
│   └── WebinarMode.tsx              # Komponen mode presentasi fullscreen
├── lib/
│   ├── db/                          # Engine database & schema PostgreSQL
│   ├── ingestion/                   # Adapters penyerapan data BMKG, FIRMS, dll.
│   ├── search-parser.ts             # Parser bahasa alami pencarian
│   └── insights.ts                  # Logika generator insight
└── data/
    └── safety-events.json           # Basis data persisten insiden keselamatan
```

---

## 📄 Lisensi & Atribusi Data

Sistem ini menggunakan data publik resmi dari:
* **BMKG** (Badan Meteorologi, Klimatologi, dan Geofisika)
* **NASA FIRMS** (Fire Information for Resource Management System)
* **Open-Meteo & Copernicus Atmosphere Monitoring Service**
* **BNPB DIBI** (Badan Nasional Penanggulangan Bencana)
* **Korlantas Polri & KNKT** (Komite Nasional Keselamatan Transportasi)
