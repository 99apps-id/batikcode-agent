# Server (REH) build on CI — where it stands

Working notes for `.github/workflows/build-server.yml`, which publishes the
remote extension host that Remote-SSH installs on a server. Written as a handoff
so the next session does not re-derive what is already known.

## Why this workflow exists

Without a published server build, `product.json`'s
`serverDownloadUrlTemplate` has nothing of ours to point at, and Remote-SSH
falls back to a foreign build (VSCodium). That connects, but the remote window
then carries *that* project's built-in extensions instead of BatikCode's —
which is why the remote chat panel asked for a Copilot sign-in that could never
succeed.

Cursor solves this the same way: its `anysphere.remote-ssh` bundle downloads
`vscode-reh-*.tar.gz` from `cursor.blob.core.windows.net/remote-releases/`.
The technique is not exotic — it just needs a published build.

The build runs on CI rather than a developer machine because it holds the whole
compile in one Node heap. On a 13 GB laptop it either OOMs or takes the machine
down; measured peaks were past 3.4 GB during mangling alone.

## Current state: fails at `Install dependencies`

Both `linux-x64` and `linux-arm64` fail at the same step. Note this step
**previously passed** — it is a regression, not an unsolved original problem.

The failure is inside the nested install that `build/npm/postinstall.ts` fans
out to:

```
[extensions/copilot] > tsx ./script/postinstall.ts
[extensions/copilot] Creating symlinks for Claude session storage and instructions...
[extensions/copilot] added 1128 packages
Process exited with code: 1
```

So the failing script is `extensions/copilot/script/postinstall.ts`, run by
that extension's own `postinstall` hook.

### Leading suspect

`extensions/copilot/script/postinstall.ts:120` throws hard:

```ts
throw new Error(`Could not find @github/copilot SDK files. Tried: ${...}`);
```

`@github/copilot` is a GitHub-scoped package. If it does not resolve on the
runner — auth, platform, or optional-dependency reasons — this throw fails the
whole root `npm ci`.

A second, weaker suspect is the symlink step around line 263. It already guards
Windows explicitly, so Linux CI is less likely to be the problem, but the log
line prints immediately before the failure and should be ruled out.

**Do not assume — read the full step log first:**

```bash
gh run list --repo 99apps-id/batikcode --workflow "Build BatikCode Server (REH)" --limit 3
gh run view <run-id> --repo 99apps-id/batikcode --json jobs \
  --jq '.jobs[] | "\(.name): \(.conclusion)"'
gh run view --repo 99apps-id/batikcode --job <job-id> --log | grep -n "npm error" | head
```

### Promising direction

The server package does not need copilot's SDK symlinks or its Claude session
storage — it needs the compiled bundle. Options, cheapest first:

1. Skip that extension's postinstall for the server build (an env guard the
   script already respects, or `--ignore-scripts` scoped to it).
2. Make the throw at line 120 non-fatal when the SDK is absent, since the
   pieces it wires up are test-harness conveniences.
3. Drop `compile-copilot-extension-build` from the phase list and accept a
   server without the bundled copilot extension.

Option 3 is the least desirable: it would reintroduce the original problem of a
server whose built-ins do not match the client.

## What is already fixed — do not re-litigate

| Run | Failed at | Cause | Fix |
|-----|-----------|-------|-----|
| 1 | Checkout | `lfs: true`, but LFS objects were never pushed to this fork | `lfs: false`. All 97 LFS files are copilot simulation-test caches the server package excludes anyway. |
| 2 | `npm ci` | Native modules build against Electron headers even for a server build | Added the same apt packages `pr-linux-test.yml` installs. |
| 3 | Build server | Runner killed the job during `compile-src` | One phase per process, mangling skipped, swap added. |

The phase list in the workflow replaces the all-in-one `vscode-reh-*` task:

```
compile-build-without-mangling
compile-non-native-extensions-build
compile-copilot-extension-build
compile-extension-media-build
bundle-vscode-reh
vscode-reh-<platform>-<arch>-ci
```

`bundle-vscode-reh` had to be registered with `task.task()` in
`build/gulpfile.reh.ts` — upstream only used it inside a series, so it was not
runnable on its own.

Mangling is skipped deliberately: it only shortens symbol names, and it holds
12k classes at once, which is the single largest memory peak in the build.

## Naming contract

The asset name and tag must match `product.json` exactly, or the client will
404 while the release looks fine:

```
serverDownloadUrlTemplate:
  https://github.com/99apps-id/batikcode/releases/download/v${version}/batikcode-server-${os}-${arch}.tar.gz

workflow produces:
  tag   v1.130.0
  asset batikcode-server-linux-x64.tar.gz
```

`server-setup.sh` extracts with `--strip-components 1`, so the archive must
contain exactly one top-level directory.

## Verifying a green build actually works

A green workflow is not the goal; a usable server is. After a release exists:

1. `ssh <host> 'rm -rf ~/.batikcode-server'` — a stale install is served forever
   otherwise, because the install directory is keyed on the commit.
2. Connect from BatikCode using the SSH config **alias**, never a bare IP.
   A bare IP does not match the `Host` block, so ssh falls back to the local
   username and fail2ban bans the address after three tries.
3. On the remote, confirm the server is ours rather than the fallback:

```bash
head -c 120 ~/.batikcode-server/bin/*/product.json   # expect BatikCode, not VSCodium
```
