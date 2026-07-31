# PRD-005 -- UI/UX Specification

**Produk:** DeskCode IDE\
**Versi:** 0.1 Draft

## 1. Tujuan

Mendefinisikan standar antarmuka dan pengalaman pengguna DeskCode agar
konsisten, efisien, dan mudah dikembangkan.

## 2. Prinsip Desain

-   Developer-first
-   Konsisten
-   Cepat dan responsif
-   Dapat diakses (accessibility)
-   Modular
-   Minim distraksi

## 3. Layout Utama

``` text
+------------------------------------------------------+
| Title Bar                                            |
+-----+---------------+-------------------------------+
| Act | Sidebar       | Editor Area                   |
| Bar |               |                               |
|     |               |                               |
+-----+---------------+-------------------------------+
| Bottom Panel (Terminal / Output / Debug / Problems) |
+------------------------------------------------------+
| Status Bar                                           |
+------------------------------------------------------+
```

## 4. Komponen UI

### Activity Bar

-   Explorer
-   Search
-   Source Control
-   Run & Debug
-   Extensions
-   AI Assistant

### Sidebar

-   Explorer
-   Outline
-   Open Editors
-   Timeline

### Editor

-   Multi-tab
-   Split editor
-   Minimap
-   Breadcrumb
-   Sticky scroll

### Bottom Panel

-   Terminal
-   Output
-   Problems
-   Debug Console

### Status Bar

-   Git branch
-   Encoding
-   Line/Column
-   Language
-   Notification
-   AI status

## 5. Command Palette

-   Shortcut `Ctrl+Shift+P`
-   Pencarian fuzzy
-   Riwayat perintah
-   Dukungan command dari plugin

## 6. Theme System

-   Light
-   Dark
-   High Contrast
-   Custom Theme API

## 7. Design Tokens

-   Warna
-   Tipografi
-   Spasi
-   Radius
-   Ikon
-   Elevasi

## 8. Accessibility

-   Navigasi keyboard penuh
-   Screen reader
-   High contrast
-   Fokus yang jelas

## 9. Responsivitas

-   Mendukung perubahan ukuran jendela
-   Panel dapat diubah ukurannya
-   Layout adaptif

## 10. Empty States

-   Welcome screen
-   Empty workspace
-   Empty search
-   Empty terminal

## 11. Notifications

-   Toast
-   Progress
-   Error
-   Warning
-   Success

## 12. UX Guidelines

-   Maksimal dua klik untuk tindakan umum
-   Undo untuk operasi destruktif bila memungkinkan
-   Konfirmasi sebelum tindakan yang tidak dapat dibatalkan

## 13. Acceptance Criteria

-   Semua komponen mengikuti design system
-   Konsisten pada Windows, Linux, dan macOS
-   Navigasi keyboard tersedia
