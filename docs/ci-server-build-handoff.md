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

## Current state (2026-08-01 audit)

### Push CI on HEAD `096e71f4` (before audit fixes)

| Workflow | Result | Root cause |
|----------|--------|------------|
| Monaco Editor checks | success | — |
| Code OSS (node_modules) | failure | Linux job: `native-keymap` gyp — `pkg-config x11 xkbfile --libs` exit 1 (system `-dev` packages missing on that job) |
| Component Fixtures | failure | `blocks-ci` screenshot hashes drifted after chat CSS motion (`07d97ada`) |
| Build BatikCode Server (REH) | failure (last on `14426852`) | nested postinstall during root `npm ci` |

### Silent regression (critical)

1. `14426852` added `extensions/batikcode-remote-ssh` to `build/npm/dirs.ts` so its runtime deps install during root postinstall (needed for `vsce.listFiles` / ELSPROBLEMS).
2. `07d97ada` (`feat(chat): … motion`) **removed that line again** with no mention in the commit message.
3. Without the dirs entry, phase `compile-non-native-extensions-build` will hit ELSPROBLEMS for missing ssh2/socks/etc.

**Fix in flight:** restore the dirs entry (with a comment so it is not dropped casually) and prefix nested install failures with `[dir]` in `build/npm/postinstall.ts` so concurrent logs are attributable.

### Nested install failure diagnostics (run `30671312529`)

When `batikcode-remote-ssh` was on the dirs list, logs showed only:

```
[extensions/batikcode-remote-ssh] Installing dependencies...
```

then later a bare `Process exited with code: 1` with **no npm stdout/stderr** attributed to that folder (concurrency + empty capture). Do **not** treat interleaved `[extensions/copilot] … added 1128 packages` lines as proof that copilot's postinstall is the culprit — those lines can flush after another task already failed.

How to read the next failure:

```bash
gh run list --repo 99apps-id/batikcode --workflow "Build BatikCode Server (REH)" --limit 3
gh run view --repo 99apps-id/batikcode --job <job-id> --log-failed | rg "Process exited|\\[extensions/|npm error|ELSPROBLEMS|gyp"
```

After the postinstall logging fix, expect:

```
[extensions/<name>] Process exited with code: 1
...
```

### Other open CI issues (not REH-only)

- **pr-node-modules Linux job** lacked apt X11/xkbfile packages and did not run `node build/npm/preinstall.ts` before root `npm ci`. Also used `secrets.VSCODE_OSS` (empty on this fork) instead of `secrets.GITHUB_TOKEN`.
- **Component fixtures**: update `test/componentFixtures/blocks-ci-screenshots.md` only if the chat motion CSS is intentional/final.
- **copilot postinstall** (`Could not find @github/copilot SDK files`) remains a *possible* failure mode on runners without that package, but it is no longer the default diagnosis without a `[extensions/copilot]`-prefixed error.

### Promising directions for REH install failures

Cheapest first, after dirs + logging are restored:

1. If failure is still silent/git-dep related: explicit workflow step  
   `cd extensions/batikcode-remote-ssh && npm ci` with full log + `git config url.https://github.com/.insteadOf git@github.com:`.
2. If copilot postinstall throws: env-guard or non-fatal missing SDK (test-harness only).
3. Last resort: drop `compile-copilot-extension-build` (reintroduces mismatched remote built-ins — avoid).

## What is already fixed — do not re-litigate

| Run | Failed at | Cause | Fix |
|-----|-----------|-------|-----|
| 1 | Checkout | `lfs: true`, but LFS objects were never pushed to this fork | `lfs: false`. All 97 LFS files are copilot simulation-test caches the server package excludes anyway. |
| 2 | `npm ci` | Native modules build against Electron headers even for a server build | Added the same apt packages `pr-linux-test.yml` installs; run `preinstall.ts` before root `npm ci`. |
| 3 | Build server | Runner killed the job during `compile-src` | One phase per process, mangling skipped, heap 8192, swap on `/mnt/batikcode-swapfile`. |
| 4 | `compile-src` TS | `welcomeOnboarding.contribution.ts` + `copilotSessionWrapper.ts` | Fixed in `0726b91e`. |
| 5 | phase 2 ELSPROBLEMS | remote-ssh missing from `dirs.ts` | Added in `14426852` — **must stay**; re-check after any dirs.ts edit. |

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
