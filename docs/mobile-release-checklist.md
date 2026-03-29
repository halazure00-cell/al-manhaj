# Mobile Release Checklist (Android-First)

Checklist ini membantu deploy stabil saat workflow utama dilakukan dari HP Android.

## 1) Sebelum deploy
- [ ] `DATABASE_URL` terisi untuk runtime.
- [ ] `DIRECT_URL` terisi untuk migrasi Prisma.
- [ ] `RUN_PRISMA_MIGRATIONS=false` di Vercel (default aman).
- [ ] Jalankan migrasi production sebagai langkah terpisah: `npm run db:migrate:deploy`.

## 2) Setelah deploy
- [ ] Cek `/api/health` mengembalikan `status: ok` dan `database: connected`.
- [ ] Cek fitur inti dari HP:
  - [ ] Tambah/edit/hapus kitab
  - [ ] Tambah/edit/hapus catatan
  - [ ] Link antar catatan
  - [ ] Tambah/edit/hapus habit
  - [ ] Log habit harian
  - [ ] Statistik tampil normal
  - [ ] Export JSON berhasil

## 3) Mobile UX minimum
- [ ] Tidak ada horizontal overflow di layar kecil (360px).
- [ ] Tombol utama mudah disentuh (target ~44px).
- [ ] Modal/form tetap dapat dipakai tanpa zoom paksa.
