# Dashboard Teknik TVRI

Sistem manajemen dan monitoring operasional teknik untuk **TVRI (Televisi Republik Indonesia)** Direktorat Teknik.

## Fitur Utama

- Laporan Harian Teknisi dengan alur approval
- Laporan Pemeriksaan Genset
- Laporan Maintenance & IT
- Laporan Teknikal Direktor
- Kalender Kegiatan
- Manajemen User & Role (Admin, Manager, User)
- Upload File & Export/Print

## Tech Stack

- **Framework:** Next.js 16 (App Router + standalone output)
- **Language:** TypeScript
- **UI:** Tailwind CSS v4
- **Database:** Microsoft SQL Server
- **Session:** iron-session (encrypted cookie-based)
- **Form:** React Hook Form + Zod
- **Deployment:** PM2 + PowerShell scripts

## Instalasi

### 1. Clone & Install

```bash
git clone <repository-url>
cd dashboard-teknik
npm install
```

### 2. Konfigurasi Environment

```powershell
Copy-Item .env.example .env
```

Edit `.env` sesuai kebutuhan. Lihat `.env.example` untuk template lengkap.

**Penting:** Jangan commit file `.env` ke repository!

## Development

```bash
npm run dev
# Buka http://localhost:3000
```

## Build & Production

```powershell
# Full deployment
.\scripts\deploy.ps1 -All

# Atau per langkah
.\scripts\deploy.ps1 -Install
.\scripts\deploy.ps1 -Build
.\scripts\deploy.ps1 -Start
```

## License

Properti TVRI - Direktorat Teknik
