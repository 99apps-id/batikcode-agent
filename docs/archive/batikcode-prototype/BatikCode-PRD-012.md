# PRD-012 -- Database & Storage Design

**Produk:** BatikCode IDE\
**Versi:** 0.1 Draft

## 1. Tujuan

Mendefinisikan arsitektur penyimpanan data BatikCode agar konfigurasi,
metadata, cache, dan data aplikasi dikelola secara konsisten, aman, dan
mudah dimigrasikan.

## 2. Sasaran

-   Penyimpanan modular.
-   Performa baca/tulis yang baik.
-   Mendukung migrasi skema.
-   Mendukung mode offline.
-   Meminimalkan risiko kehilangan data.

## 3. Prinsip Desain

-   Separation of Concerns
-   Atomic Operations
-   Data Integrity
-   Versioned Storage
-   Extensible Schema

## 4. Kategori Penyimpanan

### Workspace Storage

-   Daftar workspace
-   Multi-root workspace
-   Riwayat workspace

### User Storage

-   Pengaturan pengguna
-   Preferensi UI
-   Shortcut

### Extension Storage

-   Metadata ekstensi
-   Konfigurasi ekstensi
-   Cache ekstensi

### AI Storage

-   Riwayat percakapan (opsional)
-   Prompt template
-   Metadata provider

### Cache

-   Index pencarian
-   Cache ikon
-   Cache language server
-   Cache marketplace

### Logs

-   Main process
-   Renderer
-   Extension Host
-   Error log

## 5. Teknologi Penyimpanan

Disarankan menggunakan kombinasi: - SQLite (metadata terstruktur) - File
JSON (konfigurasi) - File system lokal (workspace & cache)

## 6. Struktur Direktori

``` text
BatikCode/
 ├─ config/
 ├─ storage/
 ├─ cache/
 ├─ logs/
 ├─ extensions/
 └─ workspaces/
```

## 7. Skema Data (Konseptual)

Entity utama: - Workspace - UserSetting - Extension - Theme -
AIProvider - RecentFile - RecentWorkspace

## 8. Migrasi

-   Setiap perubahan skema memiliki nomor versi.
-   Migrasi berjalan otomatis saat aplikasi diperbarui.
-   Backup dibuat sebelum migrasi bila diperlukan.

## 9. Backup & Recovery

-   Ekspor pengaturan.
-   Impor pengaturan.
-   Pemulihan dari backup.
-   Validasi integritas data.

## 10. Keamanan

-   Validasi data sebelum disimpan.
-   Penyimpanan data sensitif mengikuti mekanisme sistem operasi bila
    tersedia.
-   Cache dapat dibersihkan pengguna.

## 11. Acceptance Criteria

-   Data dapat dimigrasikan.
-   Tidak ada kehilangan data pada pembaruan normal.
-   Struktur penyimpanan terdokumentasi.
-   Backup dan restore tersedia sesuai desain.
