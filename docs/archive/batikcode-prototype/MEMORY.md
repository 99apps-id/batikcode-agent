# DeskCode Long-Term Memory

## Product direction

- DeskCode is being reset onto Code - OSS, not rebuilt as a custom approximation of VS Code.
- The active base is Code - OSS `1.130.0`; downstream changes should prefer product configuration, built-in extensions, adapters at existing seams, and only then core patches.
- Mock success is forbidden. Unsupported capabilities must be visibly disabled until a real implementation exists.
- Microsoft trademarks, Marketplace entitlement, update services, telemetry, voice services, and Copilot defaults are not part of the DeskCode distribution.

## Workspace

- Active source: `C:\Project\BatikCode`
- Workspace link: retired after the BatikCode migration
- Branch: `batikcode/main`
- Baseline commit: `0353141c`
- Portable Node: `C:\Tools\node-v24.18.0-win-x64`
- Larger archives and preserved mirrors belong on drive `E:`; the active working tree remains on local `C:` for performance.

## Current roadmap

1. Original DeskCode branding and artwork.
2. Remove Copilot from dependency install and distribution packaging.
3. Select extension registry, update feed, signing, and telemetry policy.
4. Build DeskCode AI through generic chat/agent seams or a built-in provider extension.
5. Complete parity smoke tests for editing, search, terminal, Git, extensions, language servers, debugging, accessibility, and packaging.
