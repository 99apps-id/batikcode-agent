# Architecture Decision Records

ADRs record decisions that materially affect BatikCode architecture, security,
distribution, or product behavior.

| ADR | Status | Decision |
| --- | --- | --- |
| [0001](0001-oauth-and-extension-registry.md) | Accepted with temporary exception | Product-owned OAuth and Open VSX registry strategy |
| [0002](0002-provider-routing-preview-and-dev-tunnels.md) | Accepted | Provider routing, Browser Preview, and Cloudflare Quick Tunnels |
| [0003](0003-remote-explorer-and-telegram-control.md) | Accepted | Remote Explorer and paired Telegram control |
| [0004](0004-local-oauth-test-bootstrap.md) | Accepted for private development | Official-client OAuth bootstrap without copying credentials |
| [0005](0005-provider-model-catalog-and-account-pool.md) | Accepted | Multi-model catalog and named provider account pool |

## Adding an ADR

Use the next four-digit number and include:

- status and date;
- context and constraints;
- the decision;
- consequences and known release gates.

When a decision changes, add a new ADR that supersedes the old one instead of
rewriting history.
