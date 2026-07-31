# Remote Explorer and Telegram remote coding

BatikCode includes a local Remote Explorer and an opt-in Telegram control
channel. Both features are implemented by the built-in
`batikcode-remote-control` extension.

## Remote Explorer

Open **BatikCode: Open Remote Explorer** from the Command Palette or select the
Remote Explorer icon in the activity bar.

The SSH Hosts view reads concrete aliases from:

```text
%USERPROFILE%\.ssh\config
```

Double-clicking a host opens a full editor workspace when a compatible Remote
SSH resolver is installed. Without a resolver, BatikCode offers two real
actions: search Open VSX for open adapters or open the host in an integrated
OpenSSH terminal. BatikCode does not silently install or redistribute a
third-party adapter.

Remote Tools also exposes native port forwarding, Cloudflare Quick Tunnel,
Browser Preview, SSH configuration, and the Open VSX adapter search.

## Configure the Telegram bot

1. Create a private bot with Telegram `@BotFather` and copy its token.
2. In BatikCode, select the Telegram status item or run
   **BatikCode: Telegram Remote Coding**.
3. Choose **Configure BotFather Token**. BatikCode validates the token through
   Telegram `getMe` and stores it in VS Code SecretStorage, backed by the
   operating-system credential vault.
4. Choose **Pair Telegram User**. Send the copied one-time `/pair` command to
   the bot in a private chat within ten minutes.
5. Review the paired user allowlist, then explicitly enable
   **Telegram Workspace Editing** on the local machine.

The status bar and Remote Explorer show Offline, Connecting, Online, Coding,
reconnecting, or conflict states. A conflict means a webhook or another bot
instance is already consuming updates; BatikCode does not delete that webhook
automatically.

## Bot commands

- Plain text (no slash) chats with a BatikCode language model from Provider Hub
  (`vendor: batikcode` preferred).
- `/status` shows the current workspace, selected AI model, editing gate, task,
  and allowlist status.
- `/code <task>` starts one Codex task in the active local workspace.
- `/diff` reports Git status and the unstaged diff summary.
- `/cancel` stops the active coding task.
- `/new` or `/clear` resets the natural-chat history for that Telegram chat.
- `/id` shows the sender's Telegram user ID.
- `/help` lists the available commands.

`/id`, `/pair`, `/start`, and `/help` are accepted before authorization.
Natural chat and `/code` require a paired private-chat user.

### Pairing the bot to BatikCode AI models

Natural chat uses the VS Code Language Model API and prefers models registered
by **BatikCode Provider Hub**. Configure providers/API keys there first. Optional
settings:

- `batikcode.telegram.preferredModelId`
- `batikcode.telegram.preferredModelFamily`

`/status` reports which model is active. Chat can answer questions about the
open workspace; applying edits still goes through `/code` (Codex CLI sandbox)
after workspace editing is enabled locally.

## Execution and security boundaries

Remote coding requires:

- a trusted local file workspace;
- a Git repository opened in BatikCode;
- a signed-in Codex CLI available as `codex`, or a configured executable path;
- a paired numeric Telegram user ID in a private chat;
- explicit local enablement of workspace editing.

The BotFather token never enters settings, workspace files, Telegram messages,
or output logs. Replacing or removing a token resets paired chats, the editing
gate, and the update cursor. Polling is outbound HTTPS long polling, and the
cursor is persisted before executing a received command so a restart cannot
replay a workspace edit. Only one coding task can run at a time, prompts are
capped at 4,000 characters, runtime is bounded, and returned output is capped
and chunked.

Codex runs non-interactively with:

```text
codex exec --sandbox workspace-write \
  --config sandbox_workspace_write.network_access=false <guarded-task>
```

This allows edits inside the workspace but does not grant
`danger-full-access`, write outside the workspace, or outbound network access
to commands inside the sandbox. The local confirmation warns that an
authorized task can still modify or delete files inside the workspace.

## Current scope

The Telegram `/code` path intentionally targets a trusted local workspace.
Remote SSH workspaces can still be explored and opened through Remote
Explorer, but running Codex against a remote extension-host filesystem needs a
future remote execution adapter rather than pretending a local path is remote.
