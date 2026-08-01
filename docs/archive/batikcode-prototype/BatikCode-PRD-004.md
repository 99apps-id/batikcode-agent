# PRD-004 -- Technical Architecture

**Produk:** BatikCode IDE\
**Versi:** 0.1 Draft

## 1. Tujuan

Dokumen ini mendefinisikan arsitektur teknis BatikCode sebagai acuan
implementasi seluruh modul aplikasi.

## 2. Prinsip Arsitektur

-   Modular dan mudah diperluas.
-   Pemisahan proses Electron (Main, Preload, Renderer).
-   Dependency Injection untuk service.
-   Event-driven architecture.
-   IPC yang aman.
-   Cross-platform.

## 3. Arsitektur Tingkat Tinggi

``` text
Renderer (React + Monaco)
        │
        ▼
IPC Client
        │
        ▼
IPC Server (Electron Main)
        │
        ▼
Service Layer
        ├── Workspace
        ├── FileSystem
        ├── Terminal
        ├── Git
        ├── Debug
        ├── Settings
        └── Logger
```

## 4. Struktur Proyek

``` text
apps/
  desktop/
  extension-host/
packages/
  core/
  ipc/
  workspace/
  filesystem/
  terminal/
  debugger/
  git/
  settings/
  logger/
  ui/
  plugin-api/
```

## 5. Core Components

### Application Lifecycle

-   Startup
-   Shutdown
-   Recovery

### Dependency Injection

-   ServiceCollection
-   InstantiationService

### Event System

-   Event
-   Emitter
-   Disposable

## 6. IPC Layer

-   Request/Response
-   Channel Registry
-   Event Channel
-   Streaming Channel
-   Permission validation

## 7. Workspace Engine

-   Workspace Manager
-   Multi-root Workspace
-   Recent Workspace
-   Workspace Storage

## 8. File System

-   Read
-   Write
-   Copy
-   Move
-   Delete
-   Watch

## 9. Terminal Engine

-   xterm.js
-   PTY Host
-   Shell Resolver
-   Terminal Manager

## 10. Debug Engine

-   Debug Adapter Protocol (DAP)
-   Breakpoints
-   Variables
-   Watch
-   Call Stack

## 11. Extension Platform

-   Extension Host
-   Plugin API
-   Sandbox
-   Marketplace Integration

## 12. AI Platform

-   Chat Interface
-   Context Service
-   Code Completion
-   Refactoring Service

## 13. Security

-   contextIsolation
-   preload bridge
-   IPC validation
-   Least privilege

## 14. Performance

-   Lazy loading
-   Worker threads
-   Incremental indexing
-   Cache management

## 15. Logging

-   Main log
-   Renderer log
-   Extension log
-   Error log

## 16. Testing Strategy

-   Unit Test
-   Integration Test
-   End-to-End Test
-   Performance Test

## 17. Deployment

-   Windows
-   Linux
-   macOS
-   Auto Update

## 18. Architecture Decision Records

Setiap perubahan besar arsitektur harus didokumentasikan dalam ADR agar
keputusan teknis dapat ditelusuri.
