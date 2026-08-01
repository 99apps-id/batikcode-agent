# BatikCode Product Reset Plan

## Chosen foundation

Code - OSS, pinned from stable tag `1.130.0` of `microsoft/vscode`.

## Workspace layout

```text
C:\Project\BatikCode\
├── docs\adr\                                 # BatikCode decisions
├── docs\archive\batikcode-prototype\         # archived prototype references
├── CONTEXT.md                                # shared domain language
├── PRODUCT.md                                # product intent
├── BatikCode-PRD-*.md                        # requirements source
└── src\, extensions\                         # active Code - OSS distribution

E:\Project\
├── BatikCode-CodeOSS\                        # preserved upstream object/partial mirror
└── node-v24.18.0-win-x64.zip                 # portable toolchain archive
```

## Reset rules

- No new features are added to the legacy prototype.
- No legacy module is copied into Code - OSS without a deletion test and a clear reason.
- BatikCode changes must prefer product configuration or a built-in extension.
- Upstream patches are reviewed as maintenance liabilities.
- Unsupported capabilities are disabled visibly; mock success is forbidden.

## Spike backlog

### S0 — Bootstrap

- [x] Pin stable tag `1.130.0` in the active local repository.
- [x] Record upstream commit `1b6a188127eeaf9194f945eb6eb89a657e93c54c`.
- [x] Install project-scoped Node `24.18.0` and npm `11.16.0`.
- [x] Install the Visual C++ Spectre-mitigated libraries required by native modules.
- [x] Complete dependency installation without exhausting drive space.
- [x] Run and smoke-test the upstream desktop development build.

### S1 — Legal-safe product identity

- [ ] Create original BatikCode icons and product artwork.
- [x] Configure application name, data folder, protocol, and executable names.
- [x] Remove Microsoft product names and default proprietary service endpoints from product configuration.
- [x] Make core startup safe without a default Copilot agent.
- [ ] Remove Copilot from dependency install and distribution packaging.
- [ ] Add BatikCode About and license attribution.

### S2 — Service adapters

- [ ] Select extension registry strategy.
- [ ] Configure telemetry as off by default.
- [ ] Configure BatikCode update feed and signature verification.
- [ ] Define authentication and OS secret-storage policy.
- [ ] Implement BatikCode AI as a built-in extension before considering core patches.

### S3 — Parity smoke suite

- [x] Launch desktop app.
- [ ] Open a local folder.
- [ ] Edit/save/reopen a file.
- [ ] Search and replace across files.
- [ ] Run a real integrated terminal.
- [ ] Use Git status, diff, stage, and commit.
- [ ] Install, enable, disable, update, and remove an extension.
- [ ] Run a language server and debug adapter.
- [ ] Exercise keyboard-only navigation and high-contrast theme.

## Cutover

Cutover is authorized only after all ADR-0001 gates pass. Archiving or removing the legacy prototype is a separate destructive action and requires explicit confirmation.
