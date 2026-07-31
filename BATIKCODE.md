# BatikCode Distribution

This branch builds BatikCode IDE from Code - OSS tag `1.130.0`.

## Upstream

- Repository: `https://github.com/microsoft/vscode.git`
- Commit: `1b6a188127eeaf9194f945eb6eb89a657e93c54c`
- BatikCode branch: `batikcode/main`

## Distribution policy

BatikCode product changes should use this order:

1. `product.json`
2. Built-in BatikCode extension
3. Adapter at an existing upstream seam
4. Documented upstream patch

Microsoft trademarks, product artwork, Marketplace entitlement, update services, telemetry, voice services, and Copilot defaults are not part of BatikCode.

## Development toolchain

Use Node `24.18.0`, as pinned by `.nvmrc`. The current Windows workspace uses a portable installation at:

```text
C:\Tools\node-v24.18.0-win-x64
```

Prepend that directory to `PATH` only for the active shell. Do not change the global Node installation for BatikCode.

## Bootstrap status

Dependency installation, client typecheck, isolated builds, and desktop smoke launch pass on Windows with Visual Studio 18 Build Tools and the MSVC 14.51 Spectre libraries.

Use the BatikCode launcher for development:

```powershell
$env:PATH='C:\Tools\node-v24.18.0-win-x64;' + $env:PATH
scripts\batikcode.bat
```

The development launcher uses the Code - OSS built-ins plus BatikCode's provider hub. Copilot is enabled only when its extension is available and the user completes GitHub sign-in.

## Known follow-ups

- Complete the remaining audit for upstream-owned labels/artwork that appear on
  product-owned surfaces.
- Deploy a private Open VSX instance and switch the configured registry endpoint from the public bootstrap registry.
- Register BatikCode's GitHub OAuth App and remove the temporary upstream OAuth
  client fallback before broader distribution.
- Select an update feed and signing process.
- Investigate the development extension host occasionally exceeding its 10-second startup threshold.

See [`docs/README.md`](docs/README.md) for the current documentation index and
`docs/archive/batikcode-prototype/` for historical DeskCode PRDs and reset notes.
