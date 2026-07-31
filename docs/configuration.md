# Configuration Reference

## Configuration surfaces

Use the normal Settings editor for persistent non-secret options. Use
**BatikCode: Open Account & AI Provider Hub** for accounts, models, endpoints,
and API credentials. Use Remote Explorer or the Command Palette for tunnels,
SSH, and Telegram.

Do not place API keys, OAuth tokens, BotFather tokens, or client secrets in
user/workspace settings.

## Settings

| Setting | Default | Scope | Purpose |
| --- | --- | --- | --- |
| `batikcode.githubOAuth.clientId` | empty | application | Overrides the temporary upstream GitHub OAuth client. Enable Device Flow on the BatikCode-owned GitHub OAuth App. |
| `batikcode.devTunnel.cloudflaredPath` | empty | application | Absolute path to an executable named `cloudflared`/`cloudflared.exe`; empty resolves the fixed `cloudflared` command from `PATH`. |
| `batikcode.telegram.autoStart` | `true` | application | Starts the Telegram bot when a valid token is already stored. |
| `batikcode.telegram.codexExecutable` | `codex` | application | Fixed `codex` command or an absolute path named `codex`, `codex.exe`, `codex.cmd`, or `codex.bat`. |
| `batikcode.telegram.taskTimeoutMinutes` | `20` | application | Per-task timeout, from 1 to 120 minutes. |

The Browser Preview also honors the upstream Simple Browser setting
`simpleBrowser.focusLockIndicator.enabled`.

## GitHub OAuth override

Client selection priority:

1. `BATIKCODE_GITHUB_CLIENT_ID`;
2. `batikcode.githubOAuth.clientId`;
3. temporary upstream public client in private-development builds.

Example for a single development shell:

```powershell
$env:BATIKCODE_GITHUB_CLIENT_ID='<device-flow-enabled-client-id>'
scripts\batikcode.bat
```

Native desktop device flow does not require a client secret. The codebase can
read `BATIKCODE_GITHUB_CLIENT_SECRET` for controlled development scenarios,
but it must not be committed, written to normal settings, packaged into a
client build, or used as the distribution architecture.

## API-key providers

Run **BatikCode: Configure API Provider**. Provider configuration includes:

- preset/provider identifier;
- endpoint URL;
- one or more model identifiers;
- one or more keys stored in `SecretStorage`;
- optional fallback providers.

The preset catalog includes OpenAI, Anthropic, Google Gemini, OpenRouter, xAI,
Azure OpenAI, DeepSeek, Groq, Mistral, Together AI, Alibaba
DashScope/Qwen, Fireworks AI, Cerebras, NVIDIA NIM, GitHub Models,
Moonshot/Kimi, Zhipu GLM, MiniMax, SiliconFlow, Perplexity, DeepInfra,
SambaNova, Ollama, and a custom OpenAI-compatible endpoint.

NesaRouter is intentionally not a provider preset.

For a custom endpoint, verify whether it expects an OpenAI-compatible
`/chat/completions` URL, authentication header, and model name. Saving a key
does not prove that the endpoint or model is valid; run
**BatikCode: Test Provider Routing**.

For Azure OpenAI, configure the Azure resource endpoint and enter deployment
names as model IDs. BatikCode builds the deployment path and adds
`api-version=2024-10-21` unless the endpoint explicitly supplies another
version.

## Provider state and key rotation

- Keys are selected round-robin.
- Authentication, throttling, network, and transient server failures can place
  a key on cooldown. A local cancellation or timeout does not poison the key.
- A retryable failure advances to another healthy key or configured provider
  fallback.
- Invalid request errors are not retried across providers.
- Fallback cycles are ignored.
- Request errors are normalized and must not include key material.

## Telegram

Use **BatikCode: Configure BotFather Token**. The command validates the token
with Telegram `getMe` and writes it to `SecretStorage`. Replacing or removing
the token clears the allowlist, editing gate, and update cursor.

Pairing and workspace editing are separate:

1. generate a one-time pair command;
2. send it from the intended Telegram user in a private chat within ten
   minutes;
3. explicitly enable workspace editing on the local machine.

## Cloudflare Quick Tunnel

Install `cloudflared` yourself or run **BatikCode: Select cloudflared
Executable**. Starting a tunnel asks for a local port and explicit
confirmation. Only loopback origins in trusted workspaces are accepted. Quick
Tunnel URLs are public and intended only for temporary development.

## SSH

Remote Explorer reads:

```text
%USERPROFILE%\.ssh\config
```

Only concrete host aliases are displayed. Wildcard entries are not useful
connection targets. A full remote workspace requires an installed compatible
Remote SSH resolver; terminal access uses the local OpenSSH client.

## Resetting state

Prefer the provider or Telegram management command that removes a credential
and related state together. Deleting files from application storage manually
can leave model registry, allowlist, or status state inconsistent. Never
publish a user-data directory as a bug reproduction because it can contain
tokens.
