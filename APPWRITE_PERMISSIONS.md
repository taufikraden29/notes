# Panduan Atur Permissions di Appwrite

## Masalah
Error 401 "The current user is not authorized to perform the requested action" menunjukkan bahwa meskipun user ID benar, pengguna tidak memiliki izin yang cukup untuk mengakses collection.

## Solusi: Atur Permissions untuk Collection

### Untuk Collection "notes":
1. Buka dashboard Appwrite
2. Pergi ke Database > Collection "notes"
3. Klik tab "Permissions"
4. Tambahkan permission berikut:
   - Read: `user:690a11f900101c134a64` atau `role:all` (untuk testing)
   - Write: `user:690a11f900101c134a64` atau `role:all` (untuk testing)

### Untuk Collection "categories":
1. Buka dashboard Appwrite  
2. Pergi ke Database > Collection "categories"
3. Klik tab "Permissions"
4. Tambahkan permission berikut:
   - Read: `user:690a11f900101c134a64` atau `role:all` (untuk testing)
   - Write: `user:690a11f900101c134a64` atau `role:all` (untuk testing)

### Pendekatan yang Lebih Aman (Saat Production):
Alih-alih menggunakan `role:all`, gunakan atribut dokumentasi (document attributes) untuk mengontrol akses:

1. Pastikan field `owner` (untuk notes) dan `userId` (untuk categories) telah ditambahkan
2. Gunakan aturan read/write berdasarkan atribut ini:
   - Contoh untuk read: `owner = "currentUser"` atau `userId = "currentUser"`

### Atau Gunakan JWT untuk Otentikasi Lanjutan:
Jika Anda ingin menggunakan pendekatan berbasis query dan atribut, pastikan Anda:
1. Menggunakan JWT token yang valid
2. Mengatur aturan keamanan di Appwrite untuk memungkinkan akses berdasarkan atribut dokumen

## Catatan Tambahan:
- Pastikan collection ID yang digunakan di kode sesuai dengan ID sebenarnya
- Pastikan field-field seperti `owner` dan `userId` telah dibuat di skema
- Untuk testing, Anda bisa sementara waktu menggunakan `role:all` untuk read dan write
- Setelah development selesai, ganti dengan permission yang lebih spesifik untuk keamanan