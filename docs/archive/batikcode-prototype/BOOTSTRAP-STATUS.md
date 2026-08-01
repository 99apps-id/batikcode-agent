# BatikCode Code - OSS Bootstrap Status

Updated: 2026-07-29

## Active source

- Working tree: `C:\Project\BatikCode`
- Workspace junction: retired after migration to the BatikCode working tree
- Branch: `batikcode/main`
- Upstream tag: `1.130.0`
- Upstream commit: `1b6a188127eeaf9194f945eb6eb89a657e93c54c`
- BatikCode baseline commit: `0353141c`
- Remote: `https://github.com/microsoft/vscode.git`

## Toolchain

- Required Node: `24.18.0`
- Portable Node: `C:\Tools\node-v24.18.0-win-x64`
- Portable archive: `E:\Project\node-v24.18.0-win-x64.zip`
- npm: `11.16.0`
- Visual Studio Build Tools: `18.6.11822.322`
- MSVC toolset: `14.51.36231`
- Spectre libraries: installed and verified
- No global PATH, shell profile, or Node installation was changed.

## Product configuration completed

- Renamed product and storage identities to BatikCode.
- Assigned independent Windows application IDs.
- Assigned independent macOS bundle/profile IDs.
- Changed executable, protocol, server, tunnel, and Linux icon names.
- Pinned Code - OSS license links to tag `1.130.0`.
- Removed default Copilot product configuration and trusted auth access.
- Removed Copilot automatic update enablement.
- Removed Microsoft voice service, agent telemetry name, and webview CDN endpoint.
- Added a BatikCode development launcher that excludes the upstream Copilot extension.
- Made onboarding, default-account, chat status, and agent authentication safe when no default chat agent is configured.
- Preserved open-source debugging built-ins pending license inventory.

## Bootstrap result

- `npm install`: passed
- `@vscode/sqlite3` Electron native rebuild: passed
- `product.json` JSON validation: passed
- banned product endpoint scan: passed
- `npm run typecheck-client`: passed
- isolated client transpile: passed
- built-in extension compile: passed
- extension media and codicons build: passed
- desktop smoke launch: passed
- Copilot load scan through `scripts\batikcode.bat`: no matches

The combined `build-fast` task had one transient `tsgo` failure while three heavy jobs ran concurrently. Each constituent build passed when run in isolation.

The final development smoke retained one nonfatal warning: the local extension host exceeded its 10-second startup threshold under load, then continued running. This is a performance follow-up, not a startup crash.

## Launch

```powershell
$env:PATH='C:\Tools\node-v24.18.0-win-x64;' + $env:PATH
scripts\batikcode.bat
```

The launcher excludes `GitHub.copilot-chat` from the development built-ins while retaining the generic chat and agent framework.

## Remaining gates

1. Add original BatikCode icons and artwork.
2. Remove Copilot from install/build/package scripts, not only the dev launcher.
3. Select an extension registry and update service.
4. Run the full IDE parity smoke suite.
5. Package and sign a Windows development artifact.
