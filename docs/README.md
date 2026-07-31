# BatikCode Documentation

This documentation describes the implementation in the repository, not only
the intended product. When an older PRD differs from newer code or decisions,
use the following order of authority:

1. behavior validated by code and tests;
2. accepted Architecture Decision Records;
3. `PRODUCT.md` and `CONTEXT.md`;
4. historical PRDs in `docs/archive/batikcode-prototype/`.

## For users and testers

- [Getting Started](getting-started.md) — installation, build, and launch.
- [Feature Status](feature-status.md) — what is validated, conditional, or
  planned.
- [Configuration](configuration.md) — settings, environment variables, and
  secret storage.
- [Command Reference](command-reference.md) — product-owned commands and
  their real effects.
- [Provider Integrations](provider-integrations.md) — OAuth, API keys, models,
  rotation, and fallback.
- [Remote Explorer and Telegram](remote-explorer-telegram.md) — SSH and remote
  coding.
- [Troubleshooting](troubleshooting.md) — terminal, extensions, models, OAuth,
  tunnels, and Telegram.
- [Security Guide](security.md) — trust boundaries and safe operation.

## For developers

- [Architecture](architecture.md) — upstream boundaries, extensions, adapters,
  and patches.
- [Development Guide](development.md) — toolchain, builds, tests, and quality
  gates.
- [Roadmap](roadmap.md) — release gates and development direction.
- [GitHub Copilot distribution gate](copilot-distribution.md) — mandatory
  license, entitlement, and trademark checks before a public installer.
- [ADR Index](adr/README.md) — accepted technical decisions.
- [`PRODUCT.md`](../PRODUCT.md) — purpose, users, and product principles.
- [`CONTEXT.md`](../CONTEXT.md) — domain terminology and invariants.
- [`BATIKCODE.md`](../BATIKCODE.md) — distribution identity and upstream
  baseline.

## Historical documents

`archive/batikcode-prototype/` contains DeskCode PRDs and notes from before the
product was reset onto Code - OSS and renamed BatikCode. These documents retain
useful context, but must not be used to claim that a feature is implemented.
