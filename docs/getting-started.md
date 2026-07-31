# Getting Started

This guide covers building BatikCode from source on Windows. Installer
packaging and automatic updates are not yet a stable release path.

## 1. Prerequisites

- Windows 10 or 11 x64.
- Git with long-path support.
- Node.js `24.18.0`, as pinned by `.nvmrc`.
- Python available to `node-gyp`.
- Visual Studio Build Tools with Desktop development with C++ and a Windows
  SDK. Native dependencies such as `node-pty` must be built for the Electron
  target in `.npmrc`.
- Internet access for dependencies and built-in extensions.

Optional tools:

- `gh` for GitHub account bootstrap;
- `codex` for Codex OAuth and Telegram remote coding;
- Gemini CLI for Gemini bootstrap;
- Kiro client for AWS Kiro bootstrap;
- `cloudflared` for public development tunnels;
- OpenSSH and `%USERPROFILE%\.ssh\config` for Remote Explorer.

## 2. Install dependencies

```powershell
Set-Location C:\Project\BatikCode
$env:PATH='C:\Tools\node-v24.18.0-win-x64;' + $env:PATH
node --version
npm install
```

Installation can take significant time and disk space because the repository
contains Electron, native modules, and built-in extensions. Do not reuse a
`node_modules` directory built for a different Node/Electron combination.

## 3. Compile

```powershell
npm run typecheck-client
npm run compile-client
```

To run the complete compile target defined by this checkout:

```powershell
npm run compile
```

## 4. Launch BatikCode

```powershell
scripts\batikcode.bat
```

The launcher runs the Code - OSS prelaunch process, prepares built-in
extensions, and opens the desktop development build with BatikCode identity.

## 5. Initial smoke test

After the workbench opens:

1. confirm that BatikCode artwork appears in the title bar and Welcome;
2. open a Git folder and check Explorer, Search, Source Control, and Problems;
3. open a PowerShell terminal and run a simple command;
4. open Extensions and search Open VSX;
5. run `BatikCode: Open Account & AI Provider Hub`;
6. run `BatikCode: Open Browser Preview`;
7. open Remote Explorer and confirm that local SSH hosts appear or that its
   empty state provides actionable instructions.

Use [Feature Status](feature-status.md) to identify unfinished acceptance tests
and [Troubleshooting](troubleshooting.md) if a smoke test fails.

## 6. Configure a provider

For an API-key provider:

1. run `BatikCode: Configure API Provider`;
2. select a preset;
3. enter the endpoint and model when requested;
4. enter one or more API keys;
5. run `BatikCode: Test Provider Routing`;
6. open the Chat model picker and choose a model from **BatikCode Providers**.

For official-client OAuth bootstrap:

1. run `BatikCode: Manage OAuth Test Bootstrap`;
2. select GitHub, Codex, Gemini, Kiro, or Copilot;
3. complete sign-in in the official application;
4. return to Provider Hub and refresh its status.

The bootstrap never copies tokens from another application's credential cache.
See [Provider Integrations](provider-integrations.md) for the exact boundary.
