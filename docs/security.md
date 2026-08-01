# Security Guide

## Security posture

BatikCode is a private-development technical preview, not a hardened
multi-tenant service. It can execute terminals, extensions, Git operations,
provider requests, SSH commands, tunnel processes, and remotely requested
Codex tasks. Use it only on systems and repositories whose trust boundary you
understand.

## Credential handling

- API keys and BotFather tokens use VS Code `SecretStorage`, backed by the
  operating-system credential vault when available.
- GitHub authentication uses the platform authentication provider.
- Codex, Gemini, and Kiro credentials remain owned by their official clients.
- BatikCode does not copy access tokens, refresh tokens, `auth.json`, SQLite
  credential records, or another application's cache.
- Endpoints, model names, and fallback order are non-secret global state.
- Logs and webview messages must never contain keys, tokens, OAuth codes,
  verifiers, or client secrets.

SecretStorage protects credentials at rest from casual file disclosure; it
does not protect against malicious code already running as the same OS user or
an untrusted extension with sufficient capability.

## Workspace trust and extensions

Treat source repositories and extensions as executable content. Review
workspace trust prompts, tasks, debug configurations, hooks, and installed
extensions. Open VSX availability does not constitute a BatikCode security
review or endorsement.

Marketplace-only packages must not be copied into a BatikCode distribution
without explicit permission and license review.

## GitHub OAuth

BatikCode signs in through its own GitHub OAuth App, so the consent screen a
user sees names BatikCode rather than another product. The client ID ships in
the source: it travels to GitHub from every user's machine, so it is public by
design.

No client secret is packaged. Desktop sign-in uses GitHub's device flow, which
does not take one, and a secret shipped to a user's machine would not stay
secret. The OAuth App therefore has Device Flow enabled and no live secret; if
a secret is ever generated on it, delete it rather than leave it unused.

Should the client ID need to be rotated — a new app, a transfer to an
organization — the environment variable and the user setting both override the
built-in default, so a build can move before the source does.

## API providers

Provider requests send source prompts and context to the selected external
service. Users must review the provider's data retention, training, region,
quota, and organization policies. Fallback can move a request to a different
configured provider, so every fallback target must be acceptable for the same
data classification.

Key rotation is an availability mechanism, not an authorization boundary.
Use keys with minimal permissions, independent quotas, and revocation paths.

## Cloudflare Quick Tunnels

A Quick Tunnel exposes a local port on a public `trycloudflare.com` URL.

- Never expose an unauthenticated admin interface, database, debugger, or
  production secret.
- Confirm the exact local port and service before starting.
- BatikCode accepts loopback origins only (`127.0.0.1`, `localhost`, or `::1`)
  and disables this extension in untrusted workspaces.
- Assume anyone with the URL can access the service.
- Stop the tunnel immediately after testing.
- Do not treat the random URL as authentication.

## Telegram remote coding

Telegram remote coding is disabled from workspace editing until local
confirmation. Its protections include token validation, a cryptographically
random one-time pairing token, a numeric Telegram user-ID allowlist, private
chat enforcement, a persisted update cursor, one active task, bounded
input/output, a timeout, and Codex `workspace-write` sandboxing with outbound
network disabled.

Residual risk remains: an authorized Telegram user can modify or delete files
inside the active workspace. Use a clean Git worktree, review diffs, avoid
high-value credentials in the repository, and stop the bot when it is not
needed.

Do not enable Telegram editing in an untrusted workspace. Do not share the
BotFather token or pairing command. If a token may have leaked, revoke it
through BotFather and configure a new token; this also resets BatikCode's
allowlist and cursor.

## Remote SSH

SSH terminal access inherits the user's OpenSSH configuration, keys, agent,
known-host policy, and shell permissions. BatikCode does not add a separate
authorization layer. Inspect aliases and host-key prompts before connecting.

## Logs and bug reports

Before sharing logs:

- remove home-directory/user names when not relevant;
- redact URLs containing credentials or signed query strings;
- redact authorization headers, keys, tokens, email addresses, chat IDs, and
  repository secrets;
- do not attach the BatikCode user-data directory or credential vault;
- reproduce with a disposable provider key where possible.

Follow the private reporting process in the root
[`SECURITY.md`](../SECURITY.md).
