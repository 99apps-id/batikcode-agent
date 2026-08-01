# Contributing to BatikCode

BatikCode is currently developed privately by a small team. Contributions
should preserve Code - OSS compatibility while making every BatikCode surface
functional, secure, and testable.

## Contributor onboarding

New contributors should work through this checklist on their first change.

1. **Set up** — Install Node.js `24.18.0` (see `.nvmrc`), run `npm install`,
   and confirm `npm run typecheck-client` passes before touching code.
   See [docs/development.md](docs/development.md) for the full dev loop.
2. **Read the essentials** — skim [PRODUCT.md](PRODUCT.md),
   [CONTEXT.md](CONTEXT.md), [docs/architecture.md](docs/architecture.md), and
   [docs/feature-status.md](docs/feature-status.md). Most BatikCode-specific
   surfaces live in built-in extensions under `extensions/` — look for an
   existing extension or adapter seam before modifying the upstream workbench.
3. **Scope a small task** — pick one self-contained problem, ideally one that
   is already tracked in an issue. If none exists, open one first and reference
   it in the PR description.
4. **Follow the change rules** — the rules below apply to every change,
   including branding, provider routing, remote tools, and distribution.
5. **Add or update tests** — behavior changes ship with tests. Existing suites
   use `node:test` (`extensions/*/src/test/*.test.ts`, run via
   `npm test` inside each extension after compiling). Prefer extracting pure
   functions for testability over mocking vscode APIs.
6. **Run validation** — run the checks in the Validation section below,
   including `git diff --check`, before opening the PR.
7. **Open the PR** — keep the diff focused, describe the change and the issue
   it fixes, and wait for review. BatikCode commits are gated by the pre-commit
   and commit-msg hooks; never bypass them. Branches that target
   `release/msrc/*` must contain exactly one commit carrying a numeric
   `Msrc-Case-Id:` trailer (enforced by CI).

The small-team context means every contributor should be able to pick up any
area. If you notice an area only you understand, document it in the relevant
extension folder or in `docs/` rather than keeping it in your head.

## Before changing code

Read:

- [Product principles](PRODUCT.md);
- [domain model](CONTEXT.md);
- [architecture](docs/architecture.md);
- [feature status](docs/feature-status.md);
- relevant [Architecture Decision Records](docs/adr/README.md).

Historical PRDs under `docs/archive/batikcode-prototype/` are references, not a
fixed compliance checklist.

## Development setup

Use Node.js `24.18.0` from `.nvmrc` and follow the
[Development Guide](docs/development.md).

```powershell
npm install
npm run typecheck-client
npm run compile-client
scripts\batikcode.bat
```

## Change rules

- Prefer `product.json`, a BatikCode built-in extension, or an existing adapter
  seam before patching the upstream workbench.
- Keep unavoidable upstream patches small and documented.
- Register a real command handler for every visible menu item.
- Provide actionable unavailable/error states; never use mock success.
- Store credentials only in `SecretStorage` or the owning official client.
- Do not copy OAuth identities, tokens, credential caches, or proprietary
  extension packages from another product.
- Preserve keyboard navigation, screen-reader semantics, high contrast, and
  visible focus.
- Update current documentation and the feature-status matrix when behavior
  changes.

## Validation

Run checks proportional to the change. The minimum is:

```powershell
npm run typecheck-client
npm run compile-client
git diff --check
```

Also run the nearest unit/lint targets. Changes involving terminals must spawn
a real terminal process. Provider changes must cover configuration, status,
model discovery, a real or controlled adapter response, retry/fallback, and
secret redaction. Telegram changes must cover authorization and editing gates.

## Issues

A useful issue contains:

- BatikCode commit/build and Windows version;
- exact reproduction steps;
- expected and actual behavior;
- relevant redacted Output/Developer Tools errors;
- whether third-party extensions were disabled.

Search for an existing issue first. Report one problem per issue. Security
issues follow [SECURITY.md](SECURITY.md), never the public issue tracker.

## Upstream contributions

Changes that reproduce in unmodified Code - OSS may belong upstream. Follow
the [VS Code contribution guide](https://github.com/microsoft/vscode/wiki/How-to-Contribute)
and Microsoft's policies for those changes. BatikCode-specific branding,
provider routing, remote tools, and distribution decisions remain in this
repository.

## License and attribution

By contributing, you agree that your contribution can be distributed under
the repository's [MIT License](LICENSE.txt). Preserve copyright notices and
update [ThirdPartyNotices.txt](ThirdPartyNotices.txt) when introducing third-
party code or assets.
