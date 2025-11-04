# Panduan Setup Appwrite untuk Aplikasi Notes

## Database
- Database ID: `690a0b4e000da938919f`

## Collection Notes
Buat collection dengan nama: `notes` (atau gunakan ID collection yang sebenarnya)
Field-field yang diperlukan:
1. `title` - String, size 256, required
2. `content` - String, size 400, required
3. `category` - String, size 128, nullable
4. `tags` - String, size 256, nullable  
5. `owner` - String, size 36, required

## Collection Categories
Buat collection dengan nama: `categories` (atau gunakan ID collection yang sebenarnya)
Field-field yang diperlukan:
1. `name` - String, size 255, required
2. `color` - String, size 7, required
3. `description` - String, size 102, nullable
4. `userId` - String, size 36, required
5. `parentId` - String, size 36, nullable

## Indexes
Untuk collection notes, tambahkan index:
- Field: `owner`, type: key (untuk query berdasarkan user)

## Konfigurasi Service
Setelah membuat collection dan field-field di atas, perbarui file-file berikut:

1. `src/services/notes.js`:
   - Ganti `COLLECTION_ID` dengan ID collection notes yang sebenarnya

2. `src/services/categoryServiceAppwrite.js`:
   - Ganti `CATEGORIES_COLLECTION_ID` dengan ID collection categories yang sebenarnya

## Catatan Tambahan
- ID collection biasanya berupa string seperti: `690a0b51001e475c97a6`
- Gunakan ID collection yang sebenarnya dari dashboard Appwrite Anda
- Setelah membuat collection dan field-field, restart aplikasi untuk memastikan koneksi berhasil