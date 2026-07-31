# BatikCode domain model

## Provider connection

A provider connection is a usable account, subscription, API-key service, or
local model runtime. A catalog entry is not considered connected until its
adapter can obtain a real session, model, endpoint, or stored credential.

## ProviderRouter

`ProviderRouter` is the deep module that owns endpoint configuration, account
selection, retry cooldowns, protocol adaptation, model resolution, and
fallback ordering. Its interface accepts a normalized chat request and returns
a normalized response. Callers do not read secrets or implement provider
retry logic.

## Provider account pool

A provider account is a named API credential with a stable identity, enabled
state, priority, and runtime health. `ProviderAccountPool` owns secret storage,
legacy key migration, round-robin selection, and cooldown state. Account names
and health may be shown to users; secret values never leave the pool/router
boundary.

The official-client OAuth bootstrap currently represents the one active
session owned by that client. It must not claim multi-account support until an
OAuth adapter can select and isolate multiple official profiles.

## Provider model catalog

`ProviderModelCatalog` owns the ordered model IDs available for each provider.
The first model is the primary model. A provider can expose many configured or
discovered models in the Chat Models picker. The legacy single `model` field
is retained as a read-only migration fallback.

## Provider identity

Provider identity is derived from the selected provider, model ID, and
transport. Requests routed through Provider Hub receive a system identity that
names that provider and model. Codex CLI and Gemini CLI identify their actual
official-client transport. A BatikCode Provider Hub model must never be
silently substituted with a Copilot CLI model; users must switch to the
Local/BatikCode chat target for those models.

## Rotation

Rotation selects the next healthy account for the same provider. Accounts that receive
authentication, throttling, transient server, timeout, or network failures are
placed on a bounded cooldown before they can be selected again.

## Fallback

Fallback moves a normalized request to another configured provider after all
eligible keys for the current provider have failed with a retryable error.
Malformed requests are not retried across providers.

## Browser Preview

Browser Preview is the built-in editor browser surface used to open local or
remote HTTP(S) URLs. It must be reachable from the desktop command palette.

## Dev tunnel

A dev tunnel publishes a local HTTP(S) port for temporary development use.
The bootstrap adapter is Cloudflare Quick Tunnel through the user-installed
`cloudflared` binary. Quick Tunnel URLs are public and are not production
deployments.

## Remote Explorer

Remote Explorer is the BatikCode activity-bar surface for concrete aliases
from the local SSH configuration and related remote-development tools. A
terminal connection uses the local OpenSSH client. Opening an editor workspace
requires an installed, compatible Remote SSH resolver and must fail truthfully
when none is available.

## Telegram remote coding

Telegram remote coding is an opt-in local control channel. A BotFather token
is stored in SecretStorage, chats must pass one-time local pairing and remain
on an allowlist, and workspace editing needs a separate local confirmation.
`/code` runs one Codex CLI task at a time against the first trusted local
workspace with `workspace-write` and outbound sandbox network disabled.

## Functional menu

A functional menu entry resolves to a registered command and produces a real
result, an actionable configuration prompt, or a truthful error. BatikCode
does not show success for an unavailable adapter.
