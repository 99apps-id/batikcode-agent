# ADR 0005: Provider model catalog and account pool

- Status: accepted
- Date: 2026-07-29

## Context

The original provider router stored an array of anonymous API-key strings and
one model ID per provider. That allowed rotation but could not expose multiple
models in Chat, identify a failing credential, disable one account, or express
account priority. OAuth CLI bootstraps also have different ownership: their
credentials and active profile belong to the official client.

## Decision

BatikCode separates three responsibilities:

- `ProviderModelCatalog` stores an ordered set of model IDs for each provider.
  The first entry is the primary model and every entry is registered in the
  Chat Models picker.
- `ProviderAccountPool` stores named API accounts in `SecretStorage`, assigns a
  stable identity, and owns enablement, priority, health, cooldown, and
  round-robin selection.
- `ProviderRouter` adapts requests and fallback routes while consuming those
  two interfaces. It does not parse or persist credentials itself.

Existing arrays of key strings are migrated in place to named accounts when
first read. The old single-model configuration remains a fallback when no
catalog has been saved, so upgrades do not discard user configuration.

Model discovery uses the configured provider's read-only models endpoint.
Manual model entry remains available for providers or compatible endpoints
that do not expose discovery.

OAuth CLI bootstraps expose the official client's current active session and
may have multiple configured model IDs. They do not claim multi-account
support. Multi-account OAuth requires a future adapter that can select and
isolate official profiles or a product-owned OAuth implementation.

## Consequences

- API-key providers can expose many models and rotate named accounts.
- Health and cooldown are attached to stable account IDs rather than array
  positions.
- Removing or disabling one account does not change another account's health
  identity.
- Secrets remain inside the credential vault; model IDs and endpoints remain
  non-secret global state.
- Copilot continues to use its official extension and its own entitlement and
  model registry.
- Provider identity is generated from the selected provider, model, and
  transport. Copilot CLI rejects BatikCode Provider Hub models instead of
  silently replacing them with its default Copilot model.
- OAuth multi-account remains an explicit adapter capability and is not
  simulated by copying another client's tokens.
