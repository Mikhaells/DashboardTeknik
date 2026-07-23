# Dashboard Teknik TVRI

Sistem manajemen dan monitoring operasional teknik untuk **TVRI (Televisi Republik Indonesia)** Direktorat Teknik. Web application ini menyediakan platform terpusat untuk pengelolaan laporan harian teknisi, pemeriksaan genset, laporan maintenance, laporan teknikal direktor, serta kalender kegiatan.

## Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| **Laporan Harian Teknisi** | Pencatatan dan pengelolaan laporan kerja harian teknisi dengan alur approval (Draft → Pending → Review → Approved/Rejected) dan upload gambar |
| **Laporan Pemeriksaan Genset** | Pencatatan hasil pemeriksaan genset harian (tanggal, jam operasi, operator, catatan & temuan) dengan sistem approval |
| **Laporan Maintenance** | Pencatatan dan manajemen laporan maintenance perangkat/laporan IT |
| **Laporan Teknikal Direktor** | Laporan teknikal untuk kebutuhan direktorat |
| **Kalender Kegiatan** | Penjadwalan dan pemantauan kegiatan teknis |
| **Manajemen User & Role** | Autentikasi dengan role-based access (Admin, Manager, User) |
| **Upload File** | Upload gambar/dokumen untuk setiap laporan |
| **Export/Print** | Cetak laporan yang telah disetujui (print all approved) |

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router + standalone output)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **UI:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Database:** [Microsoft SQL Server](https://www.microsoft.com/en-us/sql-server) (via `mssql` driver, optional `msnodesqlv8` for Windows Auth)
- **Session:** [iron-session](https://github.com/vvo/iron-session) (encrypted cookie-based)
- **Form:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Runtime:** Node.js
- **Deployment:** PM2 (process manager) + PowerShell scripts
- **Password Hashing:** [bcryptjs](https://github.com/nicolo-ribaudo/bcryptjs)

## Struktur Proyek

```
dashboard-teknik/
├── public/                  # Static assets (logo TVRI, dll.)
├── uploads/                 # File upload laporan (sumber data)
├── scripts/
│   └── deploy.ps1           # Script deployment (PowerShell)
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (auth)/          # Auth layout group (login page)
│   │   ├── api/             # API routes (REST)
│   │   │   ├── auth/        # Login, logout, session, change-password
│   │   │   ├── dashboard/   # Dashboard summary data
│   │   │   ├── dropdown/    # Data dropdown (kegiatan, profesi, shift, dll.)
│   │   │   ├── kalender/    # CRUD kalender kegiatan
│   │   │   ├── laporan-harian-teknisi/  # CRUD + approval laporan teknisi
│   │   │   ├── laporan-genset/          # CRUD + approval laporan genset
│   │   │   ├── laporan-maintenance/     # CRUD + approval laporan maintenance
│   │   │   ├── laporan-teknikal-direktor/ # CRUD laporan teknikal
│   │   │   ├── laporan-it/              # CRUD laporan IT
│   │   │   ├── teknisi/                 # Data teknisi & jabatan
│   │   │   └── uploads/                 # File upload serving
│   │   ├── dashboard/       # Halaman dashboard (protected)
│   │   │   ├── harian-teknisi/  # Laporan harian teknisi
│   │   │   ├── genset/          # Laporan pemeriksaan genset
│   │   │   ├── laporan-maintenance/
│   │   │   ├── laporan-teknikal-direktor/
│   │   │   ├── it/              # Laporan IT
│   │   │   └── kalender/        # Kalender kegiatan
│   │   ├── globals.css      # Global styles
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Landing/redirect page
│   ├── components/
│   │   ├── auth/            # Login form, password change modal
│   │   ├── dashboard/       # Sidebar, header, pagination, modals
│   │   │   ├── harian/      # Widget statistik laporan harian
│   │   │   ├── harian-teknisi/ # Komponen laporan teknisi
│   │   │   ├── genset/      # Komponen laporan genset
│   │   │   ├── it/          # Komponen laporan IT
│   │   │   ├── kalender/    # Komponen kalender
│   │   │   ├── laporan-maintenance/
│   │   │   ├── laporan-teknikal-direktor/
│   │   │   ├── teknisi/     # Komponen data teknisi
│   │   │   └── backup/      # Komponen backup
│   │   └── ui/              # Reusable UI components (Button, Input)
│   ├── lib/                 # Utility & business logic
│   │   ├── auth.ts          # User session helpers
│   │   ├── dashboard.ts     # Dashboard data fetching
│   │   ├── db.ts            # Database connection pool (mssql)
│   │   ├── file-upload.ts   # File upload handling
│   │   ├── kalender.ts      # Kalender queries
│   │   ├── session.ts       # iron-session config & helpers
│   │   ├── status.ts        # Status constants & helpers
│   │   ├── laporan-*.ts     # Query logic per modul laporan
│   │   └── utils.ts         # General utilities
│   ├── types/               # TypeScript type definitions
│   │   ├── auth.ts          # User, session, login types
│   │   ├── kalender.ts
│   │   ├── laporan-teknisi.ts
│   │   ├── laporan-genset.ts
│   │   ├── laporan-maintenance.ts
│   │   ├── laporan-it.ts
│   │   └── laporan-teknikal-direktor.ts
│   └── proxy.ts             # Middleware proxy (route protection)
├── ecosystem.config.js      # PM2 configuration
├── deploy.bat               # Shortcut ke deploy.ps1
├── next.config.ts           # Next.js config (standalone, rewrites, headers)
├── tsconfig.json
├── postcss.config.mjs
├── eslint.config.mjs
├── .env.example             # Template environment variables
└── package.json
```

## Role & Permission

| Role | Akses |
|------|-------|
| **Admin (level 1)** | Full access. Kelola semua laporan, user, dan pengaturan sistem |
| **Manager (level 2)** | Review & approve/reject laporan. Edit laporan berstatus Draft, Pending, Rejected |
| **User (level 3)** | Buat dan submit laporan. Lihat laporan sendiri |

### Alur Status Laporan

```
Draft (1) → Pending (2) → Review (3) → Approved (5) → Processing (7) → Completed (8)
                        ↘ Revision (4) ↗
                        ↘ Rejected (6)
                        ↘ Cancelled (9)
                        ↘ Expired (10)
```

## Prasyarat

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Microsoft SQL Server** (2014 atau lebih baru)
- **PM2** (untuk production deployment): `npm install -g pm2`

## Instalasi

### 1. Clone & Install

```bash
git clone <repository-url>
cd dashboard-teknik
npm install
```

### 2. Konfigurasi Environment

Copy `.env.example` ke `.env` dan sesuaikan konfigurasinya:

```powershell
Copy-Item .env.example .env
```

Buka `.env` dan edit isinya:

```env
# Database - SQL Server Auth
DB_AUTH_TYPE=sql
DB_SERVER=127.0.0.1
DB_DATABASE=Teknik_TVRI
DB_USER=sa
DB_PASSWORD=your_password
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true

# Database - Windows Auth (NTLM) [alternatif]
# DB_AUTH_TYPE=windows
# DB_SERVER=127.0.0.1
# DB_DATABASE=Teknik_TVRI
# DB_USER=DOMAIN\username
# DB_PASSWORD=your_password

# Session - WAJIB diganti di production!
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SESSION_PASSWORD=your-32-char-or-longer-secure-password-here!!
SESSION_COOKIE_SECURE=false

# Application URL
NEXTAUTH_URL=http://localhost:3000

# Upload Directory (opsional, default: <project>/public/uploads)
# Gunakan path absolut di production agar file tidak hilang saat rebuild
UPLOAD_DIR=D:\AplikasiTVRI\uploads
```

## Development

```bash
# Jalankan development server
npm run dev

# Buka http://localhost:3000
```

## Build & Production

### Menggunakan Script Deploy (Recommended)

```powershell
# Full deployment: Install → Build → Start (PM2)
.\scripts\deploy.ps1 -All

# Atau per langkah:
.\scripts\deploy.ps1 -Install    # Install dependencies
.\scripts\deploy.ps1 -Build      # Build untuk production
.\scripts\deploy.ps1 -Start      # Mulai dengan PM2

# Utilitas lain:
.\scripts\deploy.ps1 -Restart    # Restart PM2
.\scripts\deploy.ps1 -Stop       # Stop PM2
.\scripts\deploy.ps1 -Logs       # Lihat logs
.\scripts\deploy.ps1 -Status     # Status PM2
```

Atau gunakan shortcut batch file:

```powershell
deploy.bat   # Menjalankan full deployment
```

### Manual Build

```bash
npm run build
npm start
```

### PM2 Management

```bash
# Start
pm2 start ecosystem.config.js

# Status
pm2 status

# Logs
pm2 logs dashboard-teknik-tvri

# Restart
pm2 restart dashboard-teknik-tvri

# Stop
pm2 stop dashboard-teknik-tvri
```

## Database

Aplikasi ini menggunakan **Microsoft SQL Server** sebagai database. Pool koneksi diatur di `src/lib/db.ts` dengan support untuk:

- **SQL Server Authentication** (`DB_AUTH_TYPE=sql`)
- **Windows Authentication / NTLM** (`DB_AUTH_TYPE=windows`)
- Auto-reconnect dan retry mechanism

### Konfigurasi Koneksi

| Env Variable | Default | Deskripsi |
|---|---|---|
| `DB_AUTH_TYPE` | `sql` | Tipe autentikasi: `sql` atau `windows` |
| `DB_SERVER` | `127.0.0.1` | Hostname/IP SQL Server |
| `DB_DATABASE` | `Teknik_TVRI` | Nama database |
| `DB_USER` | `sa` | Username database |
| `DB_PASSWORD` | - | Password database |
| `DB_ENCRYPT` | `false` | Enripsi koneksi |
| `DB_TRUST_SERVER_CERTIFICATE` | `true` | Trust self-signed cert |

## API Routes

| Endpoint | Method | Deskripsi |
|---|---|---|
| `/api/auth/login` | POST | Login user |
| `/api/auth/logout` | POST | Logout user |
| `/api/auth/me` | GET | Info user saat ini |
| `/api/auth/session` | GET | Data session |
| `/api/auth/change-password` | POST | Ganti password |
| `/api/laporan-harian-teknisi` | GET/POST | List & buat laporan teknisi |
| `/api/laporan-harian-teknisi/[id]` | GET/PUT/DELETE | Detail, edit, hapus laporan teknisi |
| `/api/laporan-harian-teknisi/create` | POST | Buat laporan teknisi baru |
| `/api/laporan-harian-teknisi/stats` | GET | Statistik laporan teknisi |
| `/api/laporan-harian-teknisi/print-all-approved` | GET | Cetak semua laporan approved |
| `/api/laporan-genset` | GET/POST | List & buat laporan genset |
| `/api/laporan-genset/[id]` | GET/PUT/DELETE | Detail laporan genset |
| `/api/laporan-maintenance` | GET/POST | List & buat laporan maintenance |
| `/api/laporan-maintenance/[id]` | GET/PUT/DELETE | Detail laporan maintenance |
| `/api/laporan-teknikal-direktor` | GET/POST | List & buat laporan teknikal |
| `/api/laporan-it` | GET/POST | List & buat laporan IT |
| `/api/kalender` | GET/POST | List & buat kegiatan |
| `/api/kalender/[id]` | GET/PUT/DELETE | Detail kegiatan |
| `/api/dropdown/*` | GET | Data dropdown (kegiatan, profesi, shift, dll.) |
| `/api/uploads/[...path]` | GET | Serve uploaded files |
| `/api/dashboard/kegiatan` | GET | Data kegiatan dashboard |
| `/api/dashboard/laporan` | GET | Data laporan dashboard |

## Upload File

File upload (gambar/dokumen) disimpan di folder yang ditentukan oleh env variable `UPLOAD_DIR`:

- **Development:** `<project_root>/public/uploads/`
- **Production:** Path absolut yang dikonfigurasi (contoh: `D:\AplikasiTVRI\uploads`)

> **Penting:** Di production, selalu set `UPLOAD_DIR` ke folder permanen di luar direktori project agar file tidak hilang saat rebuild.

File diakses melalui URL rewrite `/uploads/*` → `/api/uploads/*` yang ditangani oleh API route handler.

## Security

- Autentikasi berbasis encrypted cookie (iron-session)
- Route protection via middleware proxy (`src/proxy.ts`)
- Security headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`
- Password di-hash dengan bcryptjs
- Session timeout: 7 hari

## License

Properti TVRI - Direktorat Teknik
