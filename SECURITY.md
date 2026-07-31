# Security Policy

BatikCode is currently a private-development technical preview. It has not yet
completed the security, signing, update, and incident-response gates required
for a public production release.

## Reporting a vulnerability

Do not disclose a suspected vulnerability through a public issue, discussion,
Telegram chat, or shared build log.

Report it directly to the BatikCode repository owner through the team's private
communication channel. Include:

- the affected commit or build;
- impact and prerequisites;
- minimal reproduction steps;
- redacted logs or a proof of concept;
- whether credentials, remote execution, tunnels, extensions, or workspace
  modification are involved.

Do not include real API keys, OAuth tokens, BotFather tokens, credential
caches, personal chat IDs, or production source code. Use disposable test
credentials where possible.

When a BatikCode-owned public repository is established, enable GitHub Private
Vulnerability Reporting and update this file with the canonical reporting
URL, response targets, supported versions, and disclosure policy before a
public release.

## Supported versions

Only the current private development branch is maintained. There is no
supported public binary release yet.

## Security boundaries

Read [docs/security.md](docs/security.md) before using API providers,
Cloudflare Quick Tunnels, Remote SSH, third-party extensions, or Telegram remote
coding. The document explains credential ownership, public tunnel exposure,
workspace trust, OAuth limitations, and residual remote-editing risk.

## Upstream vulnerabilities

If a vulnerability reproduces in unmodified Code - OSS, follow the upstream
Microsoft/VS Code reporting policy. If it is caused by BatikCode branding,
provider routing, OAuth configuration, tunneling, Remote Explorer, or Telegram
control, report it privately to BatikCode first.
