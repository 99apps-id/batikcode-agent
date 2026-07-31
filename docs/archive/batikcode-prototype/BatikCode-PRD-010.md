# PRD-010 -- Release Engineering & Distribution

**Produk:** DeskCode IDE\
**Versi:** 0.1 Draft

## 1. Tujuan

Menetapkan proses build, packaging, distribusi, pembaruan, dan rilis
DeskCode agar setiap versi dapat diterbitkan secara konsisten dan dapat
ditelusuri.

## 2. Sasaran

-   Proses rilis yang dapat diulang.
-   Build lintas platform.
-   Semantic Versioning.
-   Otomasi pipeline CI/CD.
-   Mekanisme pembaruan yang aman.

## 3. Versioning

Menggunakan Semantic Versioning:

-   MAJOR: perubahan yang tidak kompatibel.
-   MINOR: fitur baru yang kompatibel.
-   PATCH: perbaikan bug.

Contoh: - 0.2.0-alpha.1 - 0.2.0-beta.1 - 0.2.0 - 1.0.0

## 4. Release Channels

-   Nightly
-   Alpha
-   Beta
-   Release Candidate (RC)
-   Stable

## 5. Build Pipeline

1.  Install dependencies
2.  Lint
3.  Unit Test
4.  Integration Test
5.  End-to-End Test
6.  Build aplikasi
7.  Packaging
8.  Publish artefak

## 6. Packaging

Target: - Windows (Installer) - Linux (AppImage, deb, rpm) - macOS (DMG)

## 7. Code Signing

-   Penandatanganan aplikasi sesuai platform.
-   Verifikasi integritas artefak sebelum distribusi.

## 8. Auto Update

-   Pemeriksaan pembaruan.
-   Unduh di latar belakang.
-   Verifikasi paket.
-   Instalasi setelah persetujuan pengguna.

## 9. Distribusi

Saluran distribusi: - Situs resmi - GitHub Releases - Repository paket
(sesuai platform)

## 10. Rollback Strategy

-   Menyediakan rollback ke versi stabil terakhir.
-   Menyimpan changelog dan artefak rilis.

## 11. Release Checklist

-   Semua quality gate lulus.
-   Dokumentasi diperbarui.
-   Changelog tersedia.
-   Paket telah diverifikasi.
-   Tag Git dibuat.

## 12. Monitoring

-   Crash reporting (opsional).
-   Statistik pembaruan (opsional).
-   Telemetri hanya jika diaktifkan pengguna.

## 13. Acceptance Criteria

-   Build berhasil di semua platform target.
-   Installer dapat dijalankan.
-   Auto update berfungsi sesuai desain.
-   Changelog dan artefak tersedia untuk setiap rilis.
