# PRD-013 -- Developer SDK

**Produk:** BatikCode IDE\
**Versi:** 0.1 Draft

## 1. Tujuan

Mendefinisikan Software Development Kit (SDK) BatikCode agar pengembang
dapat membangun, menguji, mendebug, dan mendistribusikan plugin serta
modul secara konsisten.

## 2. Sasaran

-   Menyediakan SDK yang stabil dan terdokumentasi.
-   Mempermudah pembuatan ekstensi baru.
-   Menjaga kompatibilitas antarversi.
-   Mendukung otomatisasi pengembangan.

## 3. Komponen SDK

-   CLI SDK
-   Project Templates
-   Build Tools
-   Testing Utilities
-   Debug Utilities
-   Packaging Tools
-   Documentation Generator

## 4. CLI

Contoh kemampuan CLI: - Membuat proyek plugin baru. - Menjalankan mode
pengembangan. - Membangun paket plugin. - Menjalankan pengujian. -
Memvalidasi manifest.

## 5. Project Template

Template resmi: - Hello World Extension - Theme Extension - Language
Extension - AI Provider Extension - Debug Adapter Extension

## 6. Build System

-   TypeScript
-   Bundling
-   Source Maps
-   Semantic Versioning
-   Packaging

## 7. Testing

-   Unit Test
-   Integration Test
-   Mock API
-   Test Fixtures

## 8. Debugging

-   Menjalankan Extension Host dalam mode debug.
-   Logging SDK.
-   Hot Reload (target roadmap).

## 9. Dokumentasi

SDK harus menyediakan: - Getting Started - API Reference - Tutorials -
Best Practices - Migration Guide

## 10. Coding Standards

-   TypeScript sebagai bahasa utama.
-   ESLint dan formatter resmi.
-   Struktur folder yang konsisten.
-   Penamaan API yang seragam.

## 11. Compatibility Policy

-   Semantic Versioning.
-   API yang deprecated memiliki masa transisi.
-   Panduan migrasi tersedia.

## 12. Publishing

Alur: 1. Validasi. 2. Build. 3. Package. 4. Publish ke Marketplace.

## 13. Acceptance Criteria

-   SDK dapat digunakan untuk membuat plugin baru.
-   Dokumentasi tersedia.
-   Contoh proyek dapat dijalankan.
-   Build dan pengujian berhasil.
