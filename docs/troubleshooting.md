# Troubleshooting

## Terminal fails to load `conpty.node`

Typical error:

```text
Failed to load native module: conpty.node
Cannot find module './prebuilds/win32-x64/conpty.node'
```

Cause: `node-pty` was not built for the Electron target/ABI, its build was
interrupted, or `node_modules` came from another environment.

Checks:

```powershell
node --version
Get-Content .nvmrc
Get-Content .npmrc
Test-Path node_modules\node-pty\build\Release\conpty.node
Test-Path node_modules\node-pty\prebuilds\win32-x64\conpty.node
```

Use Node `24.18.0`, verify Visual Studio C++ Build Tools and the Windows SDK,
then reinstall/rebuild dependencies for the repository's Electron target.
Do not download an arbitrary native binary. Close running BatikCode processes
before replacing a native module.

## Pty Host is unresponsive or the terminal has no prompt

Do not run a clean client rebuild while a BatikCode development window is using
the same `out` directory. The clean phase temporarily removes the Pty Host
runtime and can interrupt open terminals. Finish the build, run **Developer:
Reload Window**, and open a new terminal. BatikCode also discards a dead Pty
Host proxy after its retry budget is exhausted, allowing a later terminal
request to start a fresh host.

## Extension search or install fails

1. confirm that the machine can reach `https://open-vsx.org`;
2. open **Help: Toggle Developer Tools** and inspect network/extension errors;
3. check proxy, TLS inspection, DNS, and firewall settings;
4. retry with a known public Open VSX extension;
5. remember that Marketplace-only extensions may not exist on Open VSX.

The configured bootstrap registry is Open VSX, not the Visual Studio
Marketplace.

## A configured API provider is missing from the model picker

1. open **BatikCode: Open Account & AI Provider Hub**;
2. confirm that at least one enabled API account or a supported local endpoint is stored;
3. open provider management and verify the ordered model catalog;
4. run **BatikCode: Test Provider Routing**;
5. reload the window to force Language Model provider discovery;
6. inspect **Output → BatikCode Provider Hub** for a redacted error.

The provider catalog alone does not create a selectable model. A configuration
must be routable. Older encrypted profiles created before a router schema fix
may need to be re-entered.

## Provider status remains `Checking`

An official client can be installed without being authenticated. Run the
provider's own status/login command in a terminal, complete any browser/device
flow, then refresh Provider Hub.

- GitHub: verify `gh auth status` or complete BatikCode GitHub sign-in.
- Codex: verify the official Codex CLI is signed in.
- Gemini: use its official login/status flow; a real test may consume quota.
- Kiro: client availability is not proof of an authenticated session.

If status polling never completes, open the Provider Hub output channel and
check whether the executable is missing, blocked, or waiting for interactive
input.

## OAuth succeeds in a terminal but no model appears

OAuth connection and chat-model availability are separate capabilities. The
official CLI may own the session while BatikCode still lacks a discovered model
or working adapter response. Refresh Provider Hub, reload the window, verify
the CLI's model access, then run the provider route test. Do not interpret
terminal login success alone as model acceptance.

## A provider model identifies itself as Copilot CLI

Check the session target at the bottom of Chat. Models registered by BatikCode
Provider Hub must use **Local/BatikCode**, not **Copilot CLI**. The model picker
selects a model, while the session target selects the execution runtime.

Current builds reject a `batikcode` model inside Copilot CLI rather than
silently replacing it with the Copilot default. Provider Hub also injects an
identity containing the actual provider, model ID, and transport.

## Codex CLI says the complete command is not recognized

On Windows, Codex installed through npm is commonly a `codex.cmd` shim.
BatikCode launches command scripts through `cmd.exe /d /c call` and passes
every argument separately. It also normalizes source-build working directories
from `.build/electron` back to the repository root. Reload BatikCode after
updating Provider Hub, then verify `codex --version` and `codex login status`
in a normal terminal.

## GitHub sign-in fails

Client ID priority is:

1. `BATIKCODE_GITHUB_CLIENT_ID`;
2. `batikcode.githubOAuth.clientId`;
3. temporary upstream client for private testing.

For a BatikCode-owned GitHub OAuth App, enable Device Flow. Do not enter a
client secret in normal settings. Clear a stale GitHub session through the
Accounts menu and retry. The temporary upstream identity is not a release
solution and may stop working if provider policy changes.

## GitHub Copilot shows sign-in or is unavailable

GitHub sign-in alone does not guarantee Copilot:

- the account needs an active Copilot entitlement;
- a compatible official extension must be installed and permitted by its
  license;
- the extension may depend on Microsoft VS Code product APIs or versions not
  available in BatikCode.

BatikCode must report this as an external dependency, not a successful built-in
feature.

## Cloudflare tunnel does not start

```powershell
cloudflared --version
```

If unavailable, use **BatikCode: Select cloudflared Executable**. Confirm that
the local service is listening on `127.0.0.1:<port>`, then inspect the Tunnel
Forwarding output channel. Corporate networks may block Cloudflare. Quick
Tunnel is public and development-only.

## Browser Preview is blank

- enter a complete `http://` or `https://` URL;
- confirm the local development server is running;
- use `127.0.0.1` if name resolution for `localhost` is unusual;
- inspect the embedded page's Content Security Policy and frame restrictions;
- open the same URL in an external browser to isolate the service from the
  preview.

Sites that prohibit embedding cannot be forced into the integrated webview.

## Remote Explorer has no SSH hosts

Confirm that `%USERPROFILE%\.ssh\config` exists and contains concrete `Host`
aliases rather than only `Host *`. Test the same alias with:

```powershell
ssh <alias>
```

Opening a full remote workspace additionally requires a compatible Remote SSH
resolver from Open VSX. Terminal SSH access can still work without one.

## Telegram bot remains offline

1. configure the token again and allow `getMe` validation;
2. check outbound HTTPS access to Telegram;
3. ensure another process is not consuming the same bot token;
4. inspect **BatikCode: Show Telegram Remote Coding Log**;
5. verify `batikcode.telegram.autoStart` if startup behavior is unexpected.

On start, BatikCode clears a leftover Telegram webhook so long polling can
receive messages. A hard `409 conflict` still means another live `getUpdates`
client is using the same token — stop the other BatikCode window/instance.

## Telegram log shows `polling error: fetch failed`

This is a network failure reaching `https://api.telegram.org` from the BatikCode
extension host (not an auth/pairing bug). Typical causes:

1. **broken IPv6 path** while IPv4 still works (PowerShell 200, Electron fetch fails);
2. intermittent Wi-Fi/VPN/firewall resetting long-poll HTTPS;
3. corporate TLS inspection / proxy without Electron proxy settings;
4. DNS failure for `api.telegram.org`;
5. another client racing the same bot token.

`api.telegram.org` often resolves to both AAAA (IPv6) and A (IPv4). BatikCode now
prefers **Node HTTPS over IPv4** for bot API calls for this reason.

Checks:

```powershell
# Should return HTTP 200
Invoke-WebRequest https://api.telegram.org -UseBasicParsing
```

Then in BatikCode:

1. **Developer: Reload Window**;
2. run **BatikCode: Test Telegram Connectivity** (or Telegram menu → Test);
3. Telegram menu → **Start Bot**;
4. watch for `poll loop started` and later `poll ok` heartbeats;
5. if errors persist, note the fuller log line (`code=` / `syscall=` / `host=`);
6. try without VPN, or fix/disable broken IPv6 on the NIC;
7. use **Reset Inbox Cursor** only after connectivity is stable.

## Telegram bot is online but does not answer

1. send `/id` in a private chat — if this fails, the bot process is not
   receiving updates;
2. pair with **Pair Telegram User** and send `/pair <code>` from that private
   chat (group chats are rejected);
3. send `/status` and confirm an AI model line appears;
4. open **Account & AI Provider Hub** and ensure at least one model is
   configured (natural chat prefers `vendor: batikcode`);
5. set `batikcode.telegram.preferredModelId` / `preferredModelFamily` if the
   wrong model is selected;
6. inspect the Telegram log for `send failed` or `AI chat error`.

Natural chat replies are sent as plain text so markdown/code cannot break
Telegram HTML parsing. Workspace edits still require `/code` plus the local
editing gate — chat alone does not mutate files.

## Telegram `/code` is rejected

The following must all be true:

- the chat completed pairing and remains on the allowlist;
- workspace editing was explicitly enabled locally;
- a trusted local Git workspace is open;
- Codex CLI exists at `batikcode.telegram.codexExecutable`;
- Codex CLI is signed in;
- no other Telegram coding task is active.

Remote SSH filesystems are not supported by the current execution adapter.

## Welcome still shows VS Code artwork or text

Close all development windows, compile again, and relaunch through
`scripts\batikcode.bat`. A stale Electron process or old build output can keep
previous resources loaded. If only an installed extension shows VS Code
branding, that artwork may belong to the extension rather than BatikCode.

## Chat setup tries to install `GitHub.copilot-chat`

BatikCode bundles the Copilot Chat extension. Its sign-in flow must authenticate
GitHub and activate that bundled extension; it must not request the
Marketplace-only package from Open VSX. If an older window still displays
`cannot be installed because it was not found`, run **Developer: Reload Window**
after compiling the latest client output.

## Collecting useful diagnostics

Include:

- BatikCode/Code - OSS version and commit;
- Windows version and architecture;
- Node version used for the build;
- exact command and reproducible steps;
- relevant redacted Output channel and Developer Tools error;
- whether the problem occurs with third-party extensions disabled.

Never attach tokens, API keys, credential caches, or an entire user-data
directory.
