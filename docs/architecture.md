# BatikCode Architecture

## Overview

BatikCode is a Code - OSS distribution, not a new editor implementation. It
preserves the upstream workbench and places product features in extensions and
existing platform seams wherever possible.

```text
BatikCode Desktop (Electron / Code - OSS)
├── Upstream workbench
│   ├── editor, Explorer, Search, SCM, debugger, terminal
│   ├── settings, keybindings, themes, accessibility
│   └── extension host and Open VSX client
├── Branding and distribution
│   ├── product.json
│   ├── icons, Welcome, watermark, title bar
│   └── launcher and packaging metadata
├── BatikCode built-in extensions
│   ├── Provider Hub + ProviderRouter + model registry
│   └── Remote Explorer + Telegram remote coding
└── Adapted built-in extensions
    ├── Simple Browser → Browser Preview
    └── Tunnel Forwarding → Cloudflare Quick Tunnel
```

## Preferred implementation order

Product changes use the following order:

1. metadata in `product.json`;
2. a BatikCode built-in extension;
3. an adapter at an existing upstream seam;
4. a small, documented, and tested upstream workbench patch.

This minimizes conflicts when updating the Code - OSS baseline.

## Core modules

### Code - OSS workbench

The workbench provides the editor, layout, terminal, extension host, command
registry, settings, storage, Authentication API, Language Model API, and most
IDE capabilities. BatikCode changes must preserve familiar shortcuts,
accessibility, and information density.

One intentional product behavior differs from upstream: the Primary Side Bar
is always visible. `Ctrl+B` restores or focuses it instead of hiding it,
including in Zen Mode.

### Provider Hub

Location: `extensions/batikcode-provider-hub`.

Responsibilities:

- provide one Account & AI Provider surface;
- inspect real sessions or stored credentials;
- orchestrate GitHub/Copilot sign-in and official-client bootstrap;
- configure API-key providers;
- register models under the `batikcode` Language Model Chat vendor;
- expose truthful state, test actions, and actionable errors.

Provider Hub must never show `Connected` merely because a provider exists in
the catalog.

### ProviderRouter

`ProviderRouter` normalizes chat requests, selects providers, rotates keys
round-robin, places failed keys on cooldown, and advances to fallbacks for
retryable failures.

Secrets remain in `SecretStorage`. Endpoints, models, fallback ordering, and
other non-secret preferences remain in extension `globalState`. Callers never
read API keys directly.

The current implementation focuses on non-streaming text chat. Streaming, tool
calls, multimodal input, embeddings, and provider-specific Responses APIs must
not be represented as complete.

### OAuth bootstrap

OAuth bootstrap starts installed official clients such as GitHub CLI, Codex
CLI, Gemini CLI, and Kiro. BatikCode reads only reliable non-secret status and
does not copy tokens or credential caches owned by those applications.

GitHub currently has a private-development exception: it can fall back to the
public client ID used by the upstream Code - OSS authentication extension.
BatikCode environment and setting overrides take priority. This exception is a
release blocker before broad distribution.

### Browser Preview and Dev Tunnel

Browser Preview adapts the built-in Simple Browser to open HTTP(S) URLs in an
editor tab.

Dev Tunnel starts a local process:

```text
cloudflared tunnel --url http://127.0.0.1:<port> --no-autoupdate
```

BatikCode owns the process lifecycle and parses the actual URL from output. It
does not silently download or update the binary.

### Remote Explorer and Telegram

Remote Explorer reads real aliases from `%USERPROFILE%\.ssh\config`. It can
always open an OpenSSH terminal when the client is available. A full remote
workspace requires a compatible resolver installed from Open VSX.

Telegram uses outbound long polling, a token in `SecretStorage`, one-time
pairing, a chat allowlist, and a local editing gate. `/code` runs one Codex CLI
task at a time in a trusted local Git workspace with `workspace-write` and
sandbox network access disabled.

## Extension registry

`product.json` points to Open VSX as the bootstrap gallery. BatikCode does not
use the Visual Studio Marketplace API or assume redistribution rights for
Marketplace-only extensions.

The long-term target is a BatikCode-owned Open VSX deployment with explicit
publishing, moderation, mirroring, backup, and availability policies.

## State and secret ownership

| Data | Storage |
| --- | --- |
| API keys, BotFather token | VS Code `SecretStorage` / OS credential vault |
| Endpoints, models, fallback order | Extension `globalState` |
| GitHub session | Authentication provider/platform credential storage |
| Codex, Gemini, Kiro sessions | Official client owned storage |
| Telegram allowlist and cursor | Extension state; token remains separate |
| Workspace settings | `.vscode/settings.json`; never for secrets |

## Upstream upgrades

Every Code - OSS upgrade should:

1. record the upstream tag and commit;
2. audit BatikCode workbench patches;
3. compile all custom built-in extensions;
4. run terminal/native-module smoke tests;
5. test Open VSX, Provider Hub, model registration, Welcome, and sidebar;
6. update `BATIKCODE.md`, feature status, and third-party notices.
