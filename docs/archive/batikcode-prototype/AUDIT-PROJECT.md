# Audit Proyek DeskCode terhadap PRD

Tanggal audit: 29 Juli 2026  
Ruang lingkup: PRD-001 s.d. PRD-014, source code, konfigurasi build/test/lint, dan preflight arsitektur IDE  
Mode: read-only terhadap kode aplikasi; `PRODUCT.md` ditambahkan sebagai konteks produk wajib untuk audit desain

## Putusan Eksekutif

DeskCode saat ini adalah **prototype workbench yang dapat dibangun**, bukan IDE yang siap dipakai. Struktur visual dasar VS Code sudah dikenali—title bar, activity bar, sidebar, editor, bottom panel, status bar—tetapi banyak affordance menyatakan fitur yang tidak benar-benar tersedia. Sasaran “seperti VS Code 100%” tidak realistis bila DeskCode terus mengimplementasikan ulang workbench dari komponen React kecil. Untuk parity tinggi, fondasi produk perlu dipindahkan ke **fork Code - OSS** atau, bila diferensiasi dan branding lebih penting daripada parity literal, **Eclipse Theia**.

Status rilis: **NO-GO**.

- Build: lulus.
- Unit test: 9 tes lulus, tetapi cakupan hanya 5 package dan sebagian menguji simulasi.
- Lint: gagal dengan 15 error dan 94 warning.
- E2E: tidak berjalan; Playwright tidak menemukan `workbench.e2e.ts` karena tidak ada `testMatch` yang sesuai.
- Security: gagal; Electron menjalankan `sandbox: false` dan `webSecurity: false`, IPC filesystem menerima path bebas, dan preload mengekspos generic `invoke`.
- Core IDE loop: belum lengkap; filesystem, terminal, Git, LSP, debugger, extensions, updater, settings, dan AI memiliki gap nyata atau fallback palsu.

## Skor Kesehatan UI Teknis

| Dimensi | Skor | Temuan utama |
|---|---:|---|
| Accessibility | 1/4 | Banyak tombol ikon tanpa accessible name/ARIA, resize hanya mouse, modal/menu belum terbukti memiliki focus trap dan keyboard model lengkap |
| Performance | 2/4 | Bundle renderer wajar (239.17 kB / 72.45 kB gzip), tetapi log state tumbuh tanpa batas dan workbench monolitik memicu render luas |
| Responsive | 1/4 | Desktop-only dengan minimum window 900×600; layout adaptif, collapse, dan small-window behavior belum ada |
| Theming | 1/4 | Token tersedia, tetapi hard-coded color tersebar luas dan theme settings tidak diterapkan konsisten |
| Anti-pattern | 2/4 | Struktur IDE familier, tetapi inline-style besar, emoji sebagai ikon, browser prompt/alert, dan kontrol yang hanya dekoratif merusak kepercayaan |
| **Total** | **7/20 — Poor** | **Perlu overhaul arsitektur dan workbench, bukan polish visual** |

### Verdict anti-pattern

Tampilannya kemungkinan terbaca sebagai “UI tiruan VS Code” alih-alih VS Code-grade product. Penyebab utama bukan kurang dekorasi, melainkan detail kategori yang salah: emoji menggantikan Codicons, native `prompt`/`alert`, warna One Dark bercampur token VS Code, ukuran/spacing manual, menu palsu, dan panel yang menyimulasikan hasil command.

## Temuan Prioritas

### P0 — Security model Electron bertentangan dengan PRD-008

- Lokasi: `apps/desktop/src/main/index.ts:64-70`, `apps/desktop/src/main/index.ts:101-153`, `apps/desktop/src/main/preload.ts:62-64`.
- Bukti: `sandbox: false`, `webSecurity: false`; IPC read/write/delete menerima path renderer tanpa validasi workspace atau permission; generic `invoke(channel, ...args)` meniadakan allowlist preload.
- Dampak: kompromi renderer atau ekstensi dapat menjadi akses filesystem arbitrer. Ini langsung melanggar secure-by-design, least privilege, IPC validation, dan plugin permission model.
- Rekomendasi: aktifkan sandbox/webSecurity; hapus generic invoke; validasi sender, schema, path canonical, workspace root, operasi, dan permission pada satu IPC seam yang typed.

### P0 — Feature parity diklaim oleh UI, tetapi banyak aksi adalah simulasi/no-op

- Lokasi: `App.tsx:349`, `App.tsx:354`, `TitleBar.tsx:65,79-81,224-232`, `BottomPanel.tsx:54-75`, `packages/updater/src/index.ts:40-77`, `packages/ai/src/index.ts:104-120`.
- Bukti: OAuth handler kosong; toggle plugin kosong; menu Save/Save As/Save All hanya `alert`; terminal UI menghasilkan output hard-coded untuk `node -v`, `npm -v`, dan `git status`; updater selalu mengarang versi 0.2.0; Gemini OAuth membuat token/email palsu.
- Dampak: pengguna tidak dapat membedakan fitur nyata dari demo; risiko kehilangan kerja sangat tinggi ketika Save menu memberi konfirmasi palsu.
- Rekomendasi: hapus/disable semua affordance yang belum terhubung dan bangun vertical slice nyata dengan error state eksplisit. Tidak boleh ada fallback sukses palsu.

### P0 — Quality gate PRD-009/010 tidak berfungsi

- Lokasi: `apps/desktop/playwright.config.ts`, `apps/desktop/tests/e2e/workbench.e2e.ts`, lint seluruh workspace.
- Bukti: runner melaporkan “No tests found”; tiga tes E2E hanya memeriksa teks dan dua shortcut; lint memiliki 15 error/94 warning.
- Dampak: regresi pada open-edit-save, terminal, Git, debugger, dan extension lifecycle tidak terdeteksi; “9 tests passed” memberi rasa aman palsu.
- Rekomendasi: betulkan discovery, jalankan Electron E2E, tambah test matrix sesuai acceptance criteria, lalu jadikan lint/typecheck/unit/integration/E2E/build sebagai blocking CI.

### P1 — Service composition salah dan filesystem tree tidak benar-benar terhubung

- Lokasi: `ServiceContext.tsx:27-37`.
- Bukti: `WorkspaceService` dibuat tanpa `FileSystemService`, padahal constructor menerima adapter tersebut. `buildFileTree()` mengembalikan `[]` ketika adapter tidak ada.
- Dampak: Open Folder dapat berhasil tetapi Explorer tetap kosong; ini memblokir alur paling dasar IDE.
- Rekomendasi: buat composition root tunggal; injeksikan instance filesystem yang sama ke workspace; tes open folder sampai file terbuka di Monaco.

### P1 — File editing berisiko kehilangan data

- Lokasi: `App.tsx:190-218`, `App.tsx:223-235`, `App.tsx:381-389`, `packages/filesystem/src/index.ts:33-43`.
- Bukti: file baru langsung ditulis dengan path string buatan; close tab tidak meminta konfirmasi dirty; perubahan Monaco tidak konsisten menandai dirty; `writeFile()` dapat gagal tanpa melempar sehingga UI dapat menganggap save selesai.
- Dampak: pengguna dapat kehilangan edit atau menulis ke lokasi yang tidak dimaksud.
- Rekomendasi: document model dengan dirty/version/save state, atomic write, Save As dialog, conflict detection, hot-exit/recovery, dan close guard.

### P1 — LSP dan debugger bukan implementasi protokol

- Lokasi: `packages/lsp/src/index.ts:66`, `packages/debugger/src/index.ts:116`.
- Bukti: LSP adalah linter/snippet lokal; debugger mensimulasikan breakpoint/session. Tidak ada language server process, JSON-RPC LSP transport, debug adapter process, atau DAP transport.
- Dampak: syntax intelligence dan debugging tidak bekerja untuk bahasa/proyek nyata.
- Rekomendasi: gunakan client LSP/DAP yang matang atau adopsi fondasi Code - OSS/Theia; jangan memperluas simulator.

### P1 — Extension Host bukan proses terisolasi dan API sangat tipis

- Lokasi: `apps/extension-host/src/index.ts:3-29`, `packages/plugin-api/src/index.ts:29-58`.
- Bukti: host hanya `Map` in-memory dan mendaftarkan callback; tidak memuat extension entrypoint, tidak ada process supervision, permission enforcement, install/update/uninstall, dependency resolution, storage, atau marketplace.
- Dampak: PRD-006, 013, dan 014 sebagian besar belum diimplementasikan.
- Rekomendasi: jangan membangun kompatibilitas VS Code extension dari nol. Pilih Code - OSS fork atau Theia + Open VSX.

### P1 — Terminal bukan xterm.js integration yang benar

- Lokasi: `BottomPanel.tsx:54-75`, `packages/terminal/src/index.ts:100-129`.
- Bukti: input/output dirender manual; command tertentu dipalsukan; fallback PTY adalah echo prompt; resize service tidak terlihat terhubung ke terminal geometry.
- Dampak: ANSI, cursor, readline, full-screen TUI, shell integration, selection, links, tabs/splits, dan accessibility terminal tidak berfungsi benar.
- Rekomendasi: render `xterm`, gunakan fit addon, PTY wajib untuk status “ready”, surface failure, dan tes shell riil.

### P1 — Settings/theme tidak menjadi source of truth

- Lokasi: `packages/settings/src/index.ts`, `packages/ui/src/styles/tokens.css`, komponen renderer.
- Bukti: settings service tidak di-load pada composition/startup; warna hard-coded muncul di banyak komponen; UI theme tidak berlangganan perubahan settings.
- Dampak: light/dark/high-contrast/custom theme dan workspace scope tidak memenuhi PRD.
- Rekomendasi: deep `WorkbenchConfiguration` module dengan user/workspace scopes, schema validation, migration, events, dan theme adapter.

### P1 — Accessibility belum memenuhi PRD-005

- Lokasi: `ActivityBar.tsx`, `TitleBar.tsx`, `Sidebar.tsx`, resize handles di `App.tsx`.
- Bukti: banyak tombol ikon mengandalkan `title` atau emoji; resize handles berupa `div` mouse-only; focus state dan state `aria-selected/expanded/pressed` tidak sistematis.
- Dampak: keyboard dan screen-reader user tidak dapat menjalankan workbench penuh.
- Rekomendasi: workbench roving-tabindex, menu/listbox/tree semantics, focus restoration, accessible separator/resizer, Codicons dengan labels, dan axe/Electron E2E.

### P2 — State terduplikasi dan `App.tsx` terlalu dangkal sebagai module workbench

- Lokasi: `App.tsx` dan `store/useWorkbenchStore.ts`.
- Bukti: Zustand store ada tetapi workbench menyimpan state paralel di banyak `useState`; banyak orchestration dan command registry berada pada satu file.
- Dampak: locality rendah, perubahan fitur menyentuh banyak area, store berpotensi dead code.
- Rekomendasi: pilih satu workbench state model; bentuk deep modules `WorkspaceSession`, `DocumentModel`, `PanelLayout`, dan `CommandRegistry` dengan interface kecil.

### P2 — PRD terlalu luas dan tidak punya traceability

- Lokasi: PRD-001 s.d. PRD-014.
- Bukti: hampir semua PRD berstatus draft; acceptance criteria tidak memiliki ID test, milestone definition-of-done, dependency ordering, atau status implementasi.
- Dampak: mock mudah dianggap selesai karena “panel sudah ada”.
- Rekomendasi: buat requirements traceability matrix; setiap FR mempunyai status, owner, adapter, integration test, E2E test, dan demo evidence.

## Matriks Implementasi PRD

| Area | Status | Realita |
|---|---|---|
| Workbench shell | Partial | Area utama ada, tetapi fidelity dan state model belum VS Code-grade |
| Workspace | Broken partial | Open dialog/recent ada; multi-root/save workspace tidak ada; filesystem adapter tidak diinjeksi |
| Explorer/filesystem | Broken partial | read/write/list/delete IPC ada; create/rename/move/drag-drop/watch/tree recursion/undo tidak lengkap |
| Editor | Partial | Monaco dan tabs ada; split, breadcrumb, sticky scroll, find/replace UX, autosave policy, recovery belum lengkap |
| Search | Missing/mock UI | Tidak ada indexing, ripgrep search, replace preview, regex/filter engine |
| Terminal | Prototype | PTY backend ada, tetapi UI dan fallback memalsukan perilaku; multi/split/shell picker belum lengkap |
| Git | Partial | status/stage/commit/branch dasar; diff/merge/history/conflict UI tidak ada; fallback mengarang state main/clean |
| Debugger | Mock | Lifecycle/breakpoint disimulasikan, bukan DAP adapter |
| LSP | Mock | Snippet/diagnostic lokal, bukan language server |
| Extensions/marketplace | Mock | Dua sample manifest; lifecycle, packaging, isolation, permissions, marketplace tidak ada |
| AI | Partial/mock | OpenAI/Ollama request dasar; Gemini OAuth palsu; privacy consent, secret storage, enable/disable, history management belum ada |
| Settings/theme | Partial/disconnected | Persistence dasar ada; UI, workspace scope, keybindings editor, live theming belum terhubung |
| Security/privacy | Failing | Electron protections dimatikan; permission model tidak enforced; credentials/consent belum aman |
| Storage | Prototype | JSON settings/recent; SQLite, migrations, backup/recovery, extension/AI storage tidak ada |
| Release/updater | Mock | Build lokal lulus; updater palsu; packaging matrix, signing, channels, rollback belum terbukti |
| SDK/API docs | Skeleton | API surface sangat kecil; CLI/templates/testing/packaging/publishing tidak ada |
| QA | Failing | Unit kecil lulus; lint dan E2E gate gagal; integration/performance/security coverage tidak ada |

## Temuan Positif

- Monorepo sudah memisahkan package domain utama sesuai PRD-004.
- Electron `contextIsolation: true` dan `nodeIntegration: false` sudah dipasang, walau manfaatnya dilemahkan konfigurasi lain.
- Monaco Editor, `node-pty`, `simple-git`, xterm packages, Vitest, dan Playwright sudah dipilih.
- Build produksi berhasil dan ukuran bundle renderer awal masih terkendali.
- Core memiliki event/disposable/service primitives yang dapat dipertahankan bila strategi custom masih dipilih.
- FileSystem/Git/Terminal mempunyai sebagian adapter IPC nyata; ini dapat menjadi bahan migrasi, bukan dibuang tanpa evaluasi.

## Keputusan Arsitektur yang Direkomendasikan

### Opsi A — Fork Code - OSS (rekomendasi kuat untuk “VS Code 100%”)

Gunakan upstream `microsoft/vscode` (MIT) sebagai basis, lalu ubah product configuration, branding legal, marketplace endpoint, built-in extensions, AI, telemetry, update service, dan distribusi. Ini satu-satunya jalur yang mendekati parity tampilan, keyboard model, accessibility, workbench, editor groups, extension host, LSP/DAP ecosystem, settings, tasks, terminal, search, SCM, dan remote architecture.

Konsekuensi: tim harus sanggup melakukan upstream merge rutin; tidak boleh memakai merek/aset proprietary Microsoft atau mengasumsikan akses Visual Studio Marketplace.

### Opsi B — Eclipse Theia (rekomendasi kuat bila produk ingin berbeda)

Theia adalah framework desktop/cloud IDE yang matang, Electron-ready, mendukung VS Code extension protocol, dan dapat dikustomisasi lebih dalam. Parity visual tidak akan 100%, tetapi biaya membangun workbench/extension host dari nol jauh lebih rendah.

### Opsi C — Lanjutkan custom DeskCode (tidak direkomendasikan untuk target 100%)

Masuk akal hanya jika tujuan diubah menjadi editor ringan dengan fitur terbatas dan UX sendiri. Monaco bukan VS Code workbench; package editor saja tidak menyediakan seluruh IDE.

## Roadmap yang Disarankan

### Fase 0 — Product reset dan spike (2–3 minggu)

1. Putuskan Code - OSS vs Theia lewat ADR dengan spike Windows/macOS/Linux.
2. Definisikan “100%”: parity upstream, compatible extension API, atau visual familiarity.
3. Buat traceability matrix FR → module → test → evidence.
4. Bekukan penambahan panel mock dan beri badge “prototype” pada fitur belum nyata.

Exit gate: satu fondasi dipilih; open/edit/save/search/terminal/Git/extension install berhasil di spike; legal/licensing review selesai.

### Fase 1 — Core edit-build loop (6–10 minggu)

Workspace multi-root, explorer lengkap, document lifecycle/recovery, search/replace, real terminal, Git status/stage/diff/commit, settings/keybindings/theme, accessibility baseline, crash recovery.

Exit gate: semua workflow memiliki integration + Electron E2E; tidak ada success fallback palsu; lint/typecheck/build hijau.

### Fase 2 — Language and debug platform (6–10 minggu)

LSP process management, language configurations, diagnostics/completion/hover/rename, DAP launch configs, breakpoints, variables/watch/call stack/debug console, tasks/problems integration.

Exit gate: minimal TypeScript dan satu bahasa eksternal berfungsi end-to-end.

### Fase 3 — Extension ecosystem (8–12 minggu)

Extension host isolation, VS Code API compatibility target, Open VSX/registry strategy, VSIX install/update/remove, permission and trust model, extension storage, crash supervision.

Exit gate: compatibility suite dan extension lifecycle E2E lulus.

### Fase 4 — AI yang aman (4–8 minggu)

Provider registry nyata, OS secret storage, explicit context consent, redaction, streaming/cancel, chat persistence controls, inline diff/apply/undo, test/refactor actions.

Exit gate: tidak ada fake OAuth; semua data keluar dapat diaudit dan dikontrol user.

### Fase 5 — Release hardening (berjalan paralel, final 4–6 minggu)

Startup/memory benchmark, workspace besar, signed builds, SBOM, dependency scanning, auto-update verification/rollback, crash reporting opt-in, accessibility audit, release channels.

Exit gate: seluruh PRD quality gates terbukti dalam CI pada tiga OS.

## Top Recommendation

**Hentikan penambahan fitur pada implementasi workbench React saat ini dan lakukan spike fork Code - OSS terlebih dahulu.** Dengan target literal “VS Code 100%”, memperbaiki warna dan menambah handler satu per satu akan menghasilkan biaya tinggi tetapi tetap tidak mencapai parity pada extension host, workbench services, accessibility, keyboard model, search, terminal, tasks, LSP/DAP, remote, dan update lifecycle.

Jika keputusan bisnis menolak fork, ubah positioning menjadi “VS Code-inspired lightweight IDE” dan pilih Theia atau scope custom yang jauh lebih sempit.

## Verifikasi yang Dilakukan

- `npm run build`: lulus.
- `npm test -- --reporter=verbose`: 5 file / 9 tes lulus.
- `npm run lint`: gagal, 109 problem (15 error, 94 warning).
- `npx playwright test`: gagal menemukan tes.
- Browser visual interaktif tidak tersedia pada sesi audit; tidak ada klaim pixel-level berbasis screenshot.
- Preflight membandingkan Code - OSS, arsitektur extension host VS Code, Eclipse Theia, dan OpenVSCode Server.

