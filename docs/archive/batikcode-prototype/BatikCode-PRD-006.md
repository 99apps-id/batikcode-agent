# PRD-006 -- Plugin SDK & Marketplace

**Produk:** DeskCode IDE\
**Versi:** 0.1 Draft

## 1. Tujuan

Mendefinisikan arsitektur Plugin SDK dan Marketplace DeskCode agar
pengembang pihak ketiga dapat membuat, mendistribusikan, dan memelihara
ekstensi secara aman dan konsisten.

## 2. Sasaran

-   API plugin yang stabil.
-   Marketplace terintegrasi.
-   Isolasi ekstensi melalui Extension Host.
-   Versioning dan kompatibilitas.

## 3. Arsitektur

``` text
DeskCode
 ├─ Core
 ├─ Extension Host
 ├─ Plugin API
 ├─ Marketplace Client
 └─ Marketplace Service
```

## 4. Extension Host

-   Berjalan pada proses terpisah.
-   IPC dengan aplikasi utama.
-   Restart otomatis saat gagal.
-   Isolasi untuk mengurangi dampak kegagalan ekstensi.

## 5. Plugin Manifest

Contoh atribut:

-   id
-   name
-   version
-   publisher
-   description
-   engines
-   activationEvents
-   contributes
-   permissions

## 6. Lifecycle

-   Install
-   Activate
-   Deactivate
-   Update
-   Uninstall

## 7. Plugin API

Area API:

-   Commands
-   Workspace
-   Window
-   Editor
-   Terminal
-   Debug
-   Configuration
-   Notifications
-   Storage

## 8. Permission Model

Contoh izin:

-   filesystem
-   terminal
-   network
-   clipboard
-   notifications

Setiap izin harus dinyatakan di manifest dan dapat divalidasi saat
instalasi.

## 9. Marketplace

Fitur:

-   Pencarian
-   Kategori
-   Rating
-   Ulasan
-   Instal satu klik
-   Pembaruan
-   Penghapusan
-   Riwayat versi

## 10. Versioning

-   Semantic Versioning
-   Minimum DeskCode Version
-   Maximum Supported Version
-   Dependency Resolution

## 11. Keamanan

-   Validasi manifest.
-   Pemeriksaan integritas paket.
-   Sandboxing Extension Host.
-   Audit izin plugin.

## 12. Publishing Workflow

1.  Login publisher.
2.  Validasi paket.
3.  Unggah.
4.  Pemeriksaan otomatis.
5.  Publikasi.

## 13. Acceptance Criteria

-   Plugin dapat diinstal, diperbarui, dan dihapus.
-   API terdokumentasi.
-   Extension Host terisolasi.
-   Marketplace mendukung pencarian dan versioning.

## 14. Roadmap

-   SDK v1
-   Marketplace Beta
-   Marketplace Stable
-   Analitik publisher
-   Verifikasi publisher
