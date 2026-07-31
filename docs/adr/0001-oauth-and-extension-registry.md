# ADR 0001: Product-owned OAuth and an Open VSX registry

- Status: Accepted with a temporary private-development exception
- Date: 2026-07-29

## Context

BatikCode is an independent Code - OSS distribution. Its release architecture
must not depend on Microsoft's Visual Studio Marketplace entitlement or VS
Code's GitHub OAuth application identity.

The application also needs one account and model surface for GitHub, Copilot,
OAuth subscriptions, API-key providers, and local endpoints.

## Decision

1. BatikCode owns every OAuth application registration used under the
   BatikCode name.
2. GitHub authentication prefers `BATIKCODE_GITHUB_CLIENT_ID`, then
   `batikcode.githubOAuth.clientId`.
3. During private owner testing only, BatikCode temporarily falls back to the
   public client ID used by the upstream Code - OSS GitHub authentication
   extension. This exception must be removed before wider distribution.
4. Native desktop GitHub authentication prefers device flow. A client secret
   is not stored in the source tree or normal user settings.
5. Tokens and provider API keys use the operating-system credential vault
   through VS Code SecretStorage/provider configuration.
6. The public Open VSX service is the bootstrap extension gallery.
7. The long-term BatikCode registry is a self-hosted Open VSX deployment. The
   editor keeps the gallery endpoint behind `product.json`, so deployment can
   switch without rewriting extension-management features.
8. BatikCode does not use the Visual Studio Marketplace API or redistribute
   Marketplace-only VSIX packages.

## Consequences

- GitHub sign-in is available for private testing through the temporary
  upstream client. A BatikCode-owned GitHub OAuth App with Device Flow remains
  a release gate.
- Setting a BatikCode client ID or environment override immediately replaces
  the temporary fallback without another source change.
- Public Open VSX gives BatikCode a working open registry immediately; private
  publishing, moderation, mirroring, backups, and availability remain
  deployment work.
- Provider names identify compatible upstream services. They do not imply
  affiliation.
