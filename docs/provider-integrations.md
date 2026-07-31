# BatikCode provider and developer-tools matrix

BatikCode only reports a connection when a credential or native account
session exists. A visible action must execute a real adapter and must surface a
truthful error when a required dependency is unavailable.

## Available now

| Capability | Authentication | Implementation |
| --- | --- | --- |
| GitHub | Temporary upstream development OAuth client, GitHub CLI bootstrap, or deployment-owned OAuth App | Official GitHub CLI or Code - OSS GitHub authentication |
| GitHub Copilot | GitHub session and Copilot entitlement | Installed Copilot extension |
| OpenAI Codex | ChatGPT or API-key login managed by Codex CLI | Official Codex CLI bootstrap |
| Google Gemini CLI | Google login managed by Gemini CLI | Official Gemini CLI bootstrap |
| AWS Kiro | Builder ID or organization login managed by Kiro | Official Kiro client bootstrap |
| API providers | One or more named accounts in OS credential storage | BatikCode `ProviderAccountPool` and `ProviderRouter` |
| Ollama | No key; local endpoint | BatikCode Ollama chat adapter |
| Custom endpoint | Optional custom header plus one or more keys | OpenAI Chat Completions-compatible adapter |
| Browser Preview | None | Built-in Simple Browser editor |
| Public Dev Tunnel | Explicit confirmation | Cloudflare Quick Tunnel process adapter |

The API preset catalog currently includes OpenAI, Anthropic, Google Gemini,
OpenRouter, xAI, Azure OpenAI, DeepSeek, Groq, Mistral AI, Together AI,
Alibaba DashScope/Qwen, Fireworks AI, Cerebras, NVIDIA NIM, GitHub Models,
Moonshot/Kimi, Zhipu GLM, MiniMax, SiliconFlow, Perplexity, DeepInfra,
SambaNova, Ollama, and a custom endpoint.

NesaRouter itself is deliberately not a BatikCode preset at this stage.

## Routing behavior

`ProviderRouter` is the interface between BatikCode features and provider
implementations:

- named API accounts are stored only through VS Code `SecretStorage`;
- endpoint, ordered model catalog, and fallback preferences are stored in extension
  `globalState`;
- enabled accounts rotate round-robin after successful requests;
- authentication, throttling, timeout, network, and transient server failures
  place a key on cooldown;
- retryable failure advances through the remaining keys and configured fallback
  providers;
- fallback cycles are ignored;
- requests have a 30-second cancellation timeout;
- provider errors are normalized without including key material.

Every configured model ID is registered separately in Chat Models. The first
model is the provider default. Provider identity is generated from the actual
provider, model, and transport. BatikCode Provider Hub models run under the
Local/BatikCode chat target; Copilot CLI rejects them instead of silently
substituting a Copilot model.

The first release normalizes non-streaming text chat. Streaming, tool calling,
embeddings, image/audio payloads, and provider-specific Responses APIs remain
separate future implementations; the UI does not claim they are ready.

## OAuth test bootstrap boundary

Private-development builds can start GitHub, Codex, Gemini, Kiro, and Copilot
sign-in through their installed official clients. This lets a developer test
without registering a separate OAuth application.

For GitHub specifically, private owner builds temporarily fall back to the
public OAuth client ID present in the upstream Code - OSS GitHub authentication
extension. `BATIKCODE_GITHUB_CLIENT_ID` and `batikcode.githubOAuth.clientId`
take precedence. The fallback is a testing bridge, not a BatikCode release
identity, and must be removed before wider distribution.

The bootstrap is deliberately an orchestrator rather than a credential bridge:

- it launches a static command in an integrated terminal;
- it may read a non-secret CLI status command;
- it never reads or copies the client's access token, refresh token, client
  identity, or credential cache;
- it never reports Gemini or Kiro as connected when their CLI cannot provide a
  reliable non-secret status;
- a Gemini connection test requires confirmation because it sends a real
  minimal request.

NesaRouter is a behavioral reference for PKCE, device-code polling, loopback
callbacks, refresh, encrypted persistence, multi-account health, and secret
redaction. Its embedded client identities, secrets, tokens, and product
identity are not copied into BatikCode. Its appropriately attributed provider
artwork is reused for nominative identification; NesaRouter itself remains
absent from the BatikCode provider catalog.

Anthropic Claude subscription, Qwen Code, Grok CLI, and other OAuth adapters
remain gated until an official installed client or deployment-owned,
vendor-authorized client can own the sign-in flow.

## Developer tools

Browser Preview opens an actual integrated editor using the built-in Simple
Browser implementation.

Cloudflare Quick Tunnel starts:

```text
cloudflared tunnel --url http://127.0.0.1:<port> --no-autoupdate
```

The URL is public and intended only for development. BatikCode accepts only a
loopback origin in a trusted workspace, requires confirmation, parses the real
`trycloudflare.com` URL, owns the child-process lifecycle, and stops it when the
tunnel or extension is disposed. BatikCode
does not silently download or update `cloudflared`; the command offers a binary
picker and the official download page when it is unavailable.

## Acceptance gate for each OAuth provider

A provider is complete only when all of the following pass:

- vendor terms and public-client authorization path are documented;
- PKCE/device state is generated cryptographically and expires;
- access and refresh tokens are stored only in `SecretStorage`;
- cancellation, timeout, refresh, revoke, and logout paths work;
- no token, code, verifier, or secret appears in logs or webview messages;
- the model adapter can stream, call tools, cancel, and surface provider errors;
- a smoke test proves sign-in through an actual model response.
