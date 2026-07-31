# ADR 0003: Remote Explorer and paired Telegram control

- Status: Accepted
- Date: 2026-07-29

## Context

BatikCode needs usable remote-host discovery and a small-team remote coding
channel without presenting cosmetic connections or granting a public chat
unrestricted access to a developer machine.

## Decision

1. Remote Explorer reads concrete host aliases from the user's standard SSH
   configuration and can always open a real OpenSSH terminal.
2. A full remote editor workspace is delegated to an installed compatible
   Open VSX Remote SSH resolver. BatikCode does not bundle an unreviewed
   third-party resolver.
3. Telegram uses the official HTTP Bot API through outbound long polling.
   Webhooks are not silently removed.
4. The BotFather token is validated with `getMe` and stored only in
   SecretStorage.
5. Chat authorization uses a locally generated, single-use, ten-minute pairing
   code plus a persistent numeric chat-ID allowlist.
6. Workspace editing is disabled by default and requires a separate local,
   modal confirmation in a trusted workspace.
7. Telegram's update cursor is persisted before command execution. Replacing
   or removing the bot token resets the cursor, allowlist, and editing gate.
8. `/code` invokes the signed-in Codex CLI non-interactively with
   `workspace-write`, sandbox network disabled, one active task, a bounded
   prompt, timeout, and output size.
9. The first version supports trusted local Git workspaces only. A remote
   filesystem requires a future explicit execution adapter.

## Consequences

- Offline, connecting, online, busy, retry, and conflict states reflect the
  actual bot lifecycle.
- Unauthorized chats cannot inspect or modify the workspace.
- An authorized chat can still change or delete files inside the workspace,
  so pairing and editing remain local security decisions.
- Bot transport can be tested without a real token, while a real end-to-end
  online test requires the owner's private BotFather credential.
- Remote Explorer remains useful without an SSH resolver and reports the
  missing capability truthfully.
