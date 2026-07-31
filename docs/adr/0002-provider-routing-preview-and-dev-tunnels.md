# ADR 0002: Deep provider routing and open development adapters

- Status: Accepted
- Date: 2026-07-29

## Context

BatikCode needs multi-provider credentials, key rotation, fallback, embedded
browser preview, and temporary public dev tunnels without depending on
Microsoft-operated services or copying third-party OAuth identities.

## Decision

1. `ProviderRouter` owns API-key credentials in VS Code SecretStorage.
2. Non-secret endpoint, model, and fallback preferences use extension
   `globalState`.
3. Requests use round-robin key rotation. Authentication, throttling, timeout,
   network, and transient server failures put a key on cooldown and may advance
   to the next configured fallback.
4. Provider protocol differences are hidden behind normalized chat adapters.
5. GitHub and Copilot continue to use their real authentication adapters.
   Other OAuth presets are added only when BatikCode owns or is explicitly
   authorized to use the OAuth application identity.
6. Browser Preview reuses the built-in Simple Browser/integrated browser.
7. Temporary public port sharing uses Cloudflare Quick Tunnels through
   `cloudflared`. BatikCode does not silently install or update the binary.
8. Cloudflare Quick Tunnels are labeled public, development-only, and
   non-production.

## Consequences

- API keys never enter settings files, workspace files, logs, or webview state.
- A provider card reflects stored credentials or a real native session rather
  than mock data.
- Cloudflare public tunnels require explicit confirmation and a locally
  available `cloudflared` executable.
- Microsoft Dev Tunnels can be introduced later as another adapter only with a
  BatikCode-owned service configuration.
