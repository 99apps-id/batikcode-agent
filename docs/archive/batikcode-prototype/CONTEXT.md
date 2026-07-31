# DeskCode Domain Model

## Product

DeskCode is a branded desktop IDE distribution built from Code - OSS. Its primary promise is high Visual Studio Code workbench compatibility with a distinct DeskCode identity and an optional, privacy-conscious AI experience.

## Domain Language

- **Upstream**: the official `microsoft/vscode` Code - OSS repository and the exact commit from which DeskCode is derived.
- **Distribution**: the runnable DeskCode product assembled from upstream source, DeskCode product configuration, built-in extensions, update configuration, and legal-safe assets.
- **Product configuration**: the `product.json` values that identify DeskCode, configure URLs, select built-in behavior, and define distribution-specific capabilities.
- **Workbench**: the Code - OSS editor shell, commands, views, panels, settings, keybindings, accessibility model, and lifecycle.
- **DeskCode adapter**: an implementation connected at an upstream-supported seam for branding, AI, marketplace, telemetry, updates, authentication, or another product-specific capability.
- **Upstream patch**: a DeskCode change that edits Code - OSS implementation because no stable seam exists. Patches are exceptional, documented, tested, and tracked for rebase risk.
- **Built-in extension**: a separately testable extension shipped with DeskCode for product-specific behavior that does not need a core workbench patch.
- **Parity**: behavioral and visual compatibility inherited from the pinned Code - OSS commit. It does not mean the Microsoft Visual Studio Code trademark, proprietary assets, Marketplace entitlement, or Microsoft-only services.
- **Legacy prototype**: the original React/Electron DeskCode implementation in the workspace root. It is preserved only as a requirements and UX reference during migration.
- **Cutover**: the point at which the Code - OSS distribution passes the agreed quality gates and becomes the primary product source.

## Module Principles

1. Prefer an upstream interface and a DeskCode adapter over editing implementation in place.
2. Prefer a built-in extension over a workbench patch.
3. Keep patches small and give each patch an owner, rationale, upstream commit, test, and removal condition.
4. The interface is the test surface: product configuration, update feeds, marketplace access, AI providers, and authentication each require contract tests.
5. Never represent an unavailable capability as successful; disabled and error states must be explicit.

