# ADR 0004: Local OAuth test bootstrap

- Status: accepted for private development
- Date: 2026-07-29

## Context

BatikCode is currently used privately by a small team. Registering and deploying a separate OAuth application for every provider would slow down functional testing. NesaRouter demonstrates useful provider adapters, API-key rotation, fallback routing, and provider-specific OAuth flows.

The PRD is a living product reference rather than a fixed compliance checklist. This decision extends the provider integration plan in ADR 0001 and ADR 0002.

## Decision

During private development, BatikCode can start OAuth flows through installed official provider clients:

- GitHub CLI for GitHub
- Codex CLI for OpenAI Codex
- Gemini CLI for Google Gemini
- Kiro desktop client for AWS Builder ID or organization sign-in
- the official GitHub Copilot extension for Copilot entitlement and sign-in

BatikCode checks only non-secret CLI status output. It does not copy provider access tokens, refresh tokens, client identities, `auth.json`, SQLite records, or another application's credential cache.

API keys entered directly in BatikCode remain in VS Code `SecretStorage`. Provider endpoints, model names, and fallback order remain non-secret global state. Rotation and retry cooldowns follow the provider-router behavior adapted from NesaRouter.

There is no provider or route named NesaRouter in BatikCode. NesaRouter remains an implementation reference and upstream source for appropriately attributed provider artwork.

## Consequences

- A developer can test OAuth-backed tools without first registering BatikCode OAuth applications.
- OAuth functionality depends on the corresponding official client being installed.
- Gemini's connection test sends a real minimal request and may consume quota.
- Kiro authentication status cannot be asserted from its launcher CLI, so BatikCode reports client availability rather than a false connected state.
- Before broader distribution, each integration must be reviewed and replaced with a deployment-owned OAuth client where the provider requires it.
- Provider trademarks remain owned by their vendors and logo use must stay nominative and attributed.
