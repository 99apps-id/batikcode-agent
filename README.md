# BatikCode

<p align="center">
  <img src="resources/branding/BatikCode-source.png" alt="BatikCode logo" width="220">
</p>

BatikCode is a desktop IDE distribution built from **Code - OSS 1.130.0**. It
combines a Nusantara identity with a familiar editor workflow, provider-neutral
AI, Browser Preview, Cloudflare Quick Tunnels, Remote Explorer, and opt-in
remote coding through Telegram.

The project is currently a **private-development technical preview**. The
editor, terminal, extension gallery, branding, and major integration surfaces
are implemented and have received targeted validation. Several AI and OAuth
flows still depend on official third-party clients and require end-to-end
acceptance testing before BatikCode is ready for broad distribution. See the
[feature status](docs/feature-status.md) for the exact boundaries.

## Product principles

- Preserve the familiar Code - OSS/VS Code workbench mental model.
- Every visible menu must perform a real action or return an honest,
  actionable failure.
- Never use mock connection states, models, hosts, or results.
- Store credentials through `SecretStorage` and the operating-system
  credential vault.
- Treat the PRD as a living reference. Validated requirements and architecture
  decisions may extend or supersede it.

## Major capabilities

- Code - OSS editor, Explorer, Search, Source Control, debugger, terminal,
  settings, keyboard shortcuts, themes, and extension management.
- Provider Hub for GitHub, Copilot, official-client OAuth bootstrap, API-key
  providers, local models, custom endpoints, key rotation, cooldown, and
  provider fallback.
- BatikCode models exposed through the Language Model Chat Provider API.
- Integrated Browser Preview.
- Cloudflare Quick Tunnels for temporary public development URLs.
- Remote Explorer backed by the local OpenSSH configuration.
- Telegram bot control with pairing, an allowlist, a local editing gate, and a
  constrained Codex CLI execution path.
- BatikCode branding across Welcome, title bar, watermark, installer metadata,
  and application icons.

## Quick start on Windows

Core prerequisites:

- Git;
- Node.js `24.18.0`, as pinned by `.nvmrc`;
- Python and Visual Studio Build Tools with a compatible C++ toolchain for
  Electron native modules;
- sufficient disk space for dependencies and build artifacts.

```powershell
git clone <batikcode-repository> C:\Project\BatikCode
Set-Location C:\Project\BatikCode
npm install
npm run compile-client
scripts\batikcode.bat
```

The current development machine can use its portable Node installation without
changing the global Node version:

```powershell
$env:PATH='C:\Tools\node-v24.18.0-win-x64;' + $env:PATH
scripts\batikcode.bat
```

See [Getting Started](docs/getting-started.md) and the
[Development Guide](docs/development.md) for complete instructions.

## Documentation map

- [Documentation index](docs/README.md)
- [Architecture](docs/architecture.md)
- [Feature status and validation evidence](docs/feature-status.md)
- [Configuration and credentials](docs/configuration.md)
- [Command reference](docs/command-reference.md)
- [Providers, OAuth, API keys, rotation, and fallback](docs/provider-integrations.md)
- [Remote Explorer and Telegram](docs/remote-explorer-telegram.md)
- [Security](docs/security.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Roadmap](docs/roadmap.md)
- [Architecture Decision Records](docs/adr/README.md)

## Contributions and security

Read [CONTRIBUTING.md](CONTRIBUTING.md) for build requirements, quality gates,
and change rules. Never commit API keys, OAuth tokens, BotFather tokens, client
secrets, or credential caches. Report security vulnerabilities using
[SECURITY.md](SECURITY.md), not a public issue.

## Upstream, license, and trademarks

BatikCode is derived from
[Code - OSS](https://github.com/microsoft/vscode) commit
`1b6a188127eeaf9194f945eb6eb89a657e93c54c`, version `1.130.0`.
The source is distributed under the [MIT License](LICENSE.txt) together with
the [Third Party Notices](ThirdPartyNotices.txt).

Visual Studio Code, GitHub, GitHub Copilot, OpenAI, Gemini, AWS, Cloudflare,
Telegram, and other provider names and logos are trademarks of their
respective owners. Their use is nominative and describes interoperability; it
does not imply affiliation or endorsement. BatikCode does not use the Visual
Studio Marketplace as its default registry. The current bootstrap registry is
Open VSX.
