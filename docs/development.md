# Development Guide

## Baseline

- Code - OSS: `1.130.0`
- Upstream commit: `1b6a188127eeaf9194f945eb6eb89a657e93c54c`
- Node.js: `24.18.0`
- Electron target: see `.npmrc`
- Current development branch: `batikcode/main`

## Setup

```powershell
Set-Location C:\Project\BatikCode
$env:PATH='C:\Tools\node-v24.18.0-win-x64;' + $env:PATH
npm install
```

The portable Node path is a current-machine convenience, not a product
requirement.

## Primary commands

```powershell
# Type-check the workbench
npm run typecheck-client

# Compile the workbench and built-in extensions
npm run compile-client

# Run the complete compile target defined by the repository
npm run compile

# Watch mode
npm run watch

# Unit tests
npm run test-node

# Static checks
npm run eslint
npm run stylelint
npm run hygiene

# Launch the desktop development build
scripts\batikcode.bat
```

For a single extension, use its local `compile` script or the gulp task listed
in the extension's `package.json`.

## Relevant source layout

```text
product.json
resources/branding/
src/vs/                         # upstream workbench/platform + limited patches
extensions/
  batikcode-provider-hub/
  batikcode-remote-control/
  github-authentication/        # distribution OAuth configuration
  simple-browser/               # Browser Preview adapter
  tunnel-forwarding/            # Cloudflare Quick Tunnel adapter
docs/
  adr/
  archive/batikcode-prototype/
```

## Implementation rules

- Prefer a built-in extension over a workbench patch.
- Do not add cosmetic commands. Every menu must have a working handler,
  a real configuration prompt, or an actionable failure.
- Never store secrets in `settings.json`, source, logs, webview messages, or
  fixtures.
- Do not report a provider as `Connected` merely because its CLI exists.
- Do not assume that Visual Studio Marketplace extensions can be redistributed.
- Keep unavoidable upstream patches small and explain them in an ADR or
  documentation.
- Preserve keyboard access, high contrast, screen-reader semantics, and visible
  focus.

## Change quality gate

At minimum, before committing:

1. compile or type-check the changed target;
2. run the nearest lint or test;
3. prove that every new command is registered and callable;
4. test the empty/error state without its dependency or credential;
5. check that no secret or third-party OAuth identity was introduced;
6. update documentation and feature status;
7. run `git diff --check`.

For terminal/native changes, launch a real terminal process. For providers,
test configure → status → model picker → request → error/retry. For Telegram,
test unauthorized chat, pairing expiry, the editing gate, cancellation, cursor
restart behavior, and token replacement.

## Windows native modules

`node-pty` must match the Electron ABI used by BatikCode. An incorrect ABI or
incomplete build commonly appears as `Cannot find module ... conpty.node`.
Do not reuse a prebuild from another Node/Electron combination. Verify the
toolchain before rebuilding only the affected dependency; see
[Troubleshooting](troubleshooting.md).

## Upstream synchronization

The current `origin` still points to Microsoft's upstream repository. Before
collaboration or pushing, create the correct BatikCode repository remote and
retain Microsoft as a separate upstream remote. Never push a BatikCode branch
to the Microsoft repository.
