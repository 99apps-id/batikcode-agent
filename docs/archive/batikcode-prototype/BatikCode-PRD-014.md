# PRD-014 -- Extension API Reference

**Produk:** DeskCode IDE\
**Versi:** 0.1 Draft

## 1. Tujuan

Menyediakan referensi resmi Extension API DeskCode agar pengembang dapat
membangun ekstensi secara konsisten, aman, dan kompatibel.

## 2. Prinsip API

-   Stabil dan terdokumentasi
-   Type-safe (TypeScript)
-   Event-driven
-   Backward compatible
-   Mudah diuji

## 3. Namespace

API utama tersedia melalui namespace:

``` ts
import * as deskcode from "deskcode";
```

## 4. Workspace API

Kemampuan: - Membuka workspace - Mendapatkan workspace aktif - Mengamati
perubahan workspace - Membaca konfigurasi workspace

Contoh:

``` ts
const folders = deskcode.workspace.getFolders();
```

## 5. Editor API

Mendukung: - Dokumen aktif - Editor aktif - Edit dokumen - Selection -
Decoration - Diagnostics

## 6. Window API

Fitur: - Information Message - Warning Message - Error Message -
Progress - Quick Pick - Input Box

## 7. Commands API

Fitur: - Register Command - Execute Command - Dispose Command

Contoh:

``` ts
deskcode.commands.registerCommand(
  "hello.world",
  () => {}
);
```

## 8. Terminal API

Kemampuan: - Membuat terminal - Menulis ke terminal - Menjalankan
perintah - Menghapus terminal

## 9. Debug API

Menyediakan: - Launch Configuration - Breakpoint - Debug Session -
Variables - Events

## 10. Git API

Fitur: - Repository - Branch - Commit - Diff - Status

## 11. AI API

Fitur: - Chat - Completion - Explain Code - Refactor - Generate Tests

## 12. Configuration API

-   Membaca konfigurasi
-   Menulis konfigurasi
-   Scope User
-   Scope Workspace

## 13. Storage API

-   Global Storage
-   Workspace Storage
-   Secret Storage

## 14. Event API

Event utama: - WorkspaceChanged - ActiveEditorChanged - FileSaved -
ExtensionInstalled - ThemeChanged

## 15. Authentication API

Mendukung: - Provider Registry - Token Access - Session Management

## 16. Error Model

Kategori: - ValidationError - PermissionError - NotFoundError -
InternalError

## 17. Version Compatibility

-   Semantic Versioning
-   API Deprecated Policy
-   Migration Guide

## 18. Example Extension

Contoh minimum: - package manifest - activation - command registration -
cleanup

## 19. Acceptance Criteria

-   Seluruh API terdokumentasi.
-   Contoh kode tersedia.
-   API memiliki pengujian.
-   Kompatibilitas versi dijaga.
