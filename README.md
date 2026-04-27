# TerraVoyage

TerraVoyage adalah website wisata dengan:

- halaman user di `/`
- halaman admin di `/admin`
- dashboard admin analytics, orders, packages, dan settings
- API serverless Vercel untuk konten dan upload gambar
- sinkronisasi data halus antara admin dan website utama

## Stack yang dipakai

- `React + Vite`
- `Vercel Functions`
- `Upstash Redis` untuk database konten, paket, settings, dan order
- `Vercel Blob` untuk upload gambar

## Kenapa database ini yang dipakai

Untuk codebase saat ini, database yang paling cocok adalah:

- `Upstash Redis`

Alasannya:

- sudah sesuai dengan implementasi kode sekarang
- paling cepat dipasang di Vercel
- cukup untuk menyimpan paket, order, settings, dan sinkronisasi admin-user

Untuk gambar:

- `Vercel Blob`

Karena admin perlu upload gambar paket dan gambar harus bisa diakses website utama.

## Jalankan lokal

```bash
npm install
npm run dev
```

Kalau mau simulasi environment Vercel lokal:

```bash
npm run dev:vercel
```

## Build

```bash
npm run build
```

## Environment Variables

Isi file `.env.local` atau env project di Vercel:

```bash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
BLOB_READ_WRITE_TOKEN=
```

Kalau env belum diisi:

- website tetap bisa jalan
- tapi data akan fallback ke `localStorage`
- sinkronisasi antar device / production belum benar-benar aktif

## Publish ke Vercel

### 1. Push project ke GitHub

Masuk ke folder project:

```bash
cd preview-web
```

Lalu commit dan push ke repo GitHub kamu.

### 2. Import project ke Vercel

Di dashboard Vercel:

1. klik `Add New Project`
2. pilih repo GitHub TerraVoyage
3. pastikan root project adalah `preview-web`

Project ini sudah disiapkan dengan:

- framework: `Vite`
- build command: `npm run build`
- output directory: `dist`

Konfigurasi ini juga sudah ditulis di [vercel.json](/c:/Users/Asus/Documents/web%20tour/preview-web/vercel.json).

### 3. Pasang database Upstash Redis

Ikuti langkah ini di Vercel:

1. buka project kamu di Vercel
2. masuk ke tab `Storage` atau `Marketplace`
3. cari `Upstash`
4. pilih `Upstash Redis`
5. klik `Install`
6. buat database baru
7. pilih region yang paling dekat dengan user kamu
   untuk Indonesia biasanya pilih region Asia yang paling dekat
8. hubungkan database itu ke project TerraVoyage

Setelah terhubung, Vercel akan mengisi env berikut:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Referensi resmi:

- Vercel Marketplace Storage: https://vercel.com/docs/marketplace-storage
- Redis on Vercel: https://vercel.com/docs/redis
- Upstash di Vercel Marketplace: https://vercel.com/marketplace/upstash

### 4. Pasang Vercel Blob untuk gambar

Ikuti langkah ini:

1. buka project di Vercel
2. masuk ke `Storage`
3. pilih `Blob`
4. buat Blob Store baru
5. hubungkan Blob ke project

Setelah aktif, Vercel akan menyediakan:

- `BLOB_READ_WRITE_TOKEN`

Referensi resmi:

- Vercel Blob: https://vercel.com/docs/vercel-blob

### 5. Redeploy project

Setelah Redis dan Blob terpasang:

1. buka tab `Deployments`
2. klik `Redeploy`

Setelah deploy selesai:

- admin update paket akan tersimpan ke database
- settings homepage akan sinkron ke website utama
- order baru dari checkout akan masuk ke admin orders
- upload gambar admin akan tersimpan ke Blob

## Route utama

- user: `/`
- admin login: `/admin/`
- analytics: `/admin/analytics/`
- orders: `/admin/orders/`
- packages: `/admin/packages/`
- settings: `/admin/settings/`

## Status project saat ini

Yang sudah siap:

- build production berhasil
- lint berhasil
- route admin dan user aktif
- API `/api/content` dan `/api/upload` sudah ada
- tombol back di halaman tanpa nav utama sudah ada
- upload gambar sudah disiapkan
- sinkronisasi data halus sudah ada

Yang perlu kamu lakukan sebelum live penuh:

- sambungkan `Upstash Redis`
- sambungkan `Vercel Blob`
- redeploy project

## File penting

- [src/App.jsx](/c:/Users/Asus/Documents/web%20tour/preview-web/src/App.jsx)
- [src/siteStore.js](/c:/Users/Asus/Documents/web%20tour/preview-web/src/siteStore.js)
- [src/AdminPackagePage.jsx](/c:/Users/Asus/Documents/web%20tour/preview-web/src/AdminPackagePage.jsx)
- [src/AdminOrdersPage.jsx](/c:/Users/Asus/Documents/web%20tour/preview-web/src/AdminOrdersPage.jsx)
- [src/AdminSettingsPage.jsx](/c:/Users/Asus/Documents/web%20tour/preview-web/src/AdminSettingsPage.jsx)
- [api/content.js](/c:/Users/Asus/Documents/web%20tour/preview-web/api/content.js)
- [api/upload.js](/c:/Users/Asus/Documents/web%20tour/preview-web/api/upload.js)
- [vercel.json](/c:/Users/Asus/Documents/web%20tour/preview-web/vercel.json)
- [.env.example](/c:/Users/Asus/Documents/web%20tour/preview-web/.env.example)
