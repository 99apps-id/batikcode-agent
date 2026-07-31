# BatikCode Command Reference

Run commands through the Command Palette (`Ctrl+Shift+P`). Standard Code - OSS
commands remain available; this page covers BatikCode-owned capabilities.

## Accounts and AI providers

| Command title | Command ID | Purpose |
| --- | --- | --- |
| Open Account & AI Provider Hub | `batikcode.providerHub.open` | Opens account, OAuth bootstrap, API-key, and provider status management. |
| Connect GitHub | `batikcode.providerHub.connectGitHub` | Starts or selects a real GitHub session. |
| Connect GitHub Copilot | `batikcode.providerHub.connectCopilot` | Checks the GitHub session, extension, and Copilot entitlement. |
| Manage OAuth Test Bootstrap | `batikcode.providerHub.manageOAuthBootstrap` | Runs login or status through an official client. |
| Configure API Provider | `batikcode.providerRouter.configure` | Manages endpoints, models, API keys, and fallbacks. |
| Test Provider Routing | `batikcode.providerRouter.test` | Sends a test through the configured route. |

`batikcode.providerRouter.routeChat` is an internal integration command and is
not intended as a manual action.

## Browser and tunnels

| Command title | Command ID | Purpose |
| --- | --- | --- |
| Open Browser Preview | `batikcode.browserPreview.open` | Opens an HTTP(S) URL in an editor. |
| Start Cloudflare Dev Tunnel | `batikcode.devTunnel.start` | Temporarily publishes one local port. |
| Stop All Cloudflare Dev Tunnels | `batikcode.devTunnel.stopAll` | Stops tunnel processes owned by the extension. |
| Select cloudflared Executable | `batikcode.devTunnel.selectCloudflared` | Stores the local binary path. |
| Open cloudflared Download | `batikcode.devTunnel.openDownload` | Opens the official download page. |

## Remote Explorer

| Command title | Command ID | Purpose |
| --- | --- | --- |
| Open Remote Explorer | `batikcode.remoteExplorer.open` | Focuses Remote Explorer. |
| Refresh Remote Explorer | `batikcode.remoteExplorer.refresh` | Reloads SSH configuration and tool state. |
| Connect in SSH Terminal | `batikcode.remoteExplorer.connectTerminal` | Opens an integrated `ssh <host>` terminal. |
| Open Remote Workspace | `batikcode.remoteExplorer.connectWorkspace` | Asks a compatible resolver to open the remote workspace. |
| Open SSH Configuration | `batikcode.remoteExplorer.openSshConfig` | Opens the user's OpenSSH configuration. |
| Find Open Remote SSH Adapter | `batikcode.remoteExplorer.findSshAdapter` | Searches Open VSX for an adapter. |

## Telegram

| Command title | Command ID | Purpose |
| --- | --- | --- |
| Telegram Remote Coding | `batikcode.telegram.openMenu` | Opens the bot status and action menu. |
| Configure BotFather Token | `batikcode.telegram.configureToken` | Validates with `getMe` and stores the token in SecretStorage. |
| Start Telegram Bot | `batikcode.telegram.start` | Starts outbound long polling. |
| Stop Telegram Bot | `batikcode.telegram.stop` | Stops polling. |
| Pair Telegram User | `batikcode.telegram.pair` | Creates a 192-bit single-use pairing command for a private chat. |
| Manage Allowed Telegram Users | `batikcode.telegram.manageChats` | Reviews or removes allowlisted user IDs. |
| Enable Telegram Workspace Editing | `batikcode.telegram.enableRemoteCoding` | Enables the editing gate after local confirmation. |
| Cancel Telegram Coding Task | `batikcode.telegram.cancelTask` | Cancels the active task. |
| Show Telegram Remote Coding Log | `batikcode.telegram.showLog` | Opens the output channel. |

When a dependency is unavailable, a command must offer configuration,
download/search, or an actionable error. It must not report success unless the
process, session, model, or connection is genuinely available.
