# Feature Status

This is the repository baseline as of **July 30, 2026**.

- **Validated**: implementation and relevant targeted validation passed.
- **Implemented — acceptance needed**: code and commands exist, but a real
  environment or provider path still needs end-to-end acceptance.
- **External dependency**: BatikCode can orchestrate the feature, but success
  depends on a third-party client, entitlement, adapter, or service.
- **Planned**: not available and must not be presented as ready.

## Core IDE and distribution

| Capability | Status | Notes |
| --- | --- | --- |
| Editor, Explorer, Search, SCM, Debug | Validated upstream | Provided by Code - OSS 1.130.0. |
| Windows integrated terminal | Validated | Native `node-pty`/ConPTY was rebuilt and its smoke test passed. |
| Extension search and install | Validated | Open VSX search/install was tested with a public extension and dependencies. |
| BatikCode branding | Validated | Product name, protocol, Welcome, watermark, title bar, and application assets are applied. |
| Always-visible Primary Side Bar | Validated | Intentional product behavior; toggle and Zen Mode no longer hide it. |
| Installer, signing, auto-update | Planned | Metadata exists; the release pipeline and signing process are not final. |

## AI and accounts

| Capability | Status | Notes |
| --- | --- | --- |
| Provider Hub | Build-validated | Real command handlers exist; state is not populated from mock data. |
| API-key provider catalog | Implemented — acceptance needed | Credentials, endpoints, models, route tests, and registration exist; each vendor still needs acceptance. |
| DeepSeek custom key/endpoint | Implemented — acceptance needed | Streaming, OpenAI-compatible tool calls, multi-model routing, and image forwarding for vision-capable model IDs are wired; provider acceptance remains. |
| Account rotation, cooldown, fallback | Implementation-validated | Named accounts have stable identity, priority, enablement, health, round-robin selection, and retryable fallback. |
| BatikCode model registry | Implementation-validated | Providers expose ordered multi-model catalogs; NVIDIA identity and Codex/Gemini registration paths passed targeted tests. Real responses remain provider-dependent. |
| GitHub sign-in | External dependency | Private builds use the temporary upstream OAuth fallback or GitHub CLI. |
| GitHub Copilot | Private-development gate | The upstream source is present for private testing. GitHub session and entitlement remain mandatory; public binary redistribution is blocked by the documented legal/trademark review. |
| Codex OAuth bootstrap | External dependency | Codex CLI owns login; final model-response acceptance remains required. |
| Gemini OAuth bootstrap | External dependency | Gemini CLI owns login; a real connection test can consume quota. |
| AWS Kiro bootstrap | External dependency | BatikCode can detect/start the client but will not claim connected without reliable non-secret status. |
| Streaming, tools, multimodal | Implemented — acceptance needed | OpenAI-compatible providers stream SSE and expose tool calling. Image parts are forwarded only for model IDs identified as vision/VL models; actual support remains model-dependent. |

## Developer tools and remote workflows

| Capability | Status | Notes |
| --- | --- | --- |
| Browser Preview | Implementation-validated | Uses the real built-in Simple Browser editor. |
| Cloudflare Quick Tunnel | Implemented — acceptance needed | Loopback-only, trusted-workspace-only adapter validates the executable, asks for confirmation, parses the URL, and owns process shutdown. |
| SSH host discovery and terminal | Implemented — acceptance needed | Reads OpenSSH config and opens a real terminal. |
| Full remote workspace | External dependency | Requires a compatible Remote SSH resolver from Open VSX. |
| Telegram lifecycle and status | Implemented — acceptance needed | Offline, connecting, online, busy, and conflict reflect actual state. |
| Telegram pairing and allowlist | Implemented — acceptance needed | SecretStorage token, 192-bit one-time pairing, user-ID authorization, private-chat enforcement, and local editing gate exist. Legacy chat-ID grants are revoked. |
| Telegram `/code` | External dependency | Requires a trusted local Git workspace and a signed-in Codex CLI. |
| Telegram execution on remote SSH filesystems | Planned | Requires an explicit remote execution adapter; no simulated support. |

## Latest validation evidence

- `npm run typecheck-client` passed.
- `npm run compile-client` passed.
- the GitHub Authentication extension compiled after the repository rename.
- the native ConPTY terminal smoke test exited with code `0`.
- Open VSX installed a public extension and its dependencies.
- the Language Model registry discovered Codex and Gemini models.

This evidence is not a substitute for a release acceptance suite. For AI
providers, `Connected` only has value when a real session or credential exists
and at least one model request succeeds.

## Primary release blockers

- replace the temporary Microsoft/upstream GitHub OAuth client with a
  BatikCode-owned application;
- run provider end-to-end tests for key entry, OAuth, model picker, response,
  refresh, revoke, and logout;
- complete installer signing, update channel, CI artifacts, and rollback;
- complete a threat review and real-device Telegram tests;
- define the extension registry and distribution policy;
- audit trademarks, artwork, extension licenses, and third-party notices.
- complete the [GitHub Copilot distribution gate](copilot-distribution.md) or
  exclude Copilot from release artifacts.
