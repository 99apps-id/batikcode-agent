# PRD-003 -- Functional Requirements

**Produk:** BatikCode IDE\
**Versi:** 0.1 Draft

## 1. Tujuan

Dokumen ini mendefinisikan kebutuhan fungsional BatikCode sebagai acuan
implementasi.

## 2. Ruang Lingkup

Fitur inti yang termasuk dalam rilis bertahap hingga v1.0: - Workspace -
File Explorer - Monaco Editor - Terminal - Git - Debugger - Search &
Replace - Command Palette - Extension System - Marketplace - AI
Assistant - Settings - Theme Engine

## 3. Functional Requirements

### FR-001 Workspace

-   Membuka folder.
-   Membuka multi-root workspace.
-   Menyimpan workspace.
-   Menampilkan daftar recent workspace.

### FR-002 File Explorer

-   Membuat, menghapus, mengganti nama, memindahkan file/folder.
-   Drag & drop.
-   Sinkron dengan filesystem.

### FR-003 Editor

-   Multi-tab.
-   Split editor.
-   Syntax highlighting.
-   Minimap.
-   Auto save.
-   Multi-cursor.
-   Find & Replace.

### FR-004 Terminal

-   Integrated terminal.
-   Multi terminal.
-   Split terminal.
-   Pemilihan shell.

### FR-005 Search

-   Search project.
-   Replace.
-   Regex.
-   Filter file.

### FR-006 Git

-   Status.
-   Commit.
-   Branch.
-   Merge.
-   Diff viewer.

### FR-007 Debugger

-   Breakpoint.
-   Watch.
-   Variables.
-   Call stack.
-   Debug console.

### FR-008 Extension System

-   Instal.
-   Hapus.
-   Update.
-   Aktif/nonaktif.
-   Dependency management.

### FR-009 Marketplace

-   Cari extension.
-   Instal satu klik.
-   Pembaruan extension.

### FR-010 AI Assistant

-   Chat.
-   Code completion.
-   Explain code.
-   Refactor.
-   Generate tests.

### FR-011 Settings

-   User settings.
-   Workspace settings.
-   JSON editor.
-   Keyboard shortcuts.

### FR-012 Theme

-   Light/Dark.
-   Custom theme.
-   Icon theme.

## 4. Acceptance Criteria

-   Setiap fitur memiliki pengujian.
-   Tidak menyebabkan crash pada alur normal.
-   Terintegrasi dengan sistem IPC dan service layer.

## 5. Dependencies

-   Electron
-   React
-   TypeScript
-   Monaco Editor
-   xterm.js
-   Node.js
-   LSP
-   DAP

## 6. Out of Scope

-   Cloud IDE penuh.
-   Kolaborasi enterprise.
-   Dukungan perangkat seluler.

## 7. Roadmap Keterkaitan

-   PRD-004: Technical Architecture
-   PRD-005: UI/UX Specification
-   PRD-006: Plugin SDK & Marketplace
