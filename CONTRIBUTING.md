# Contributing to BatikCode

BatikCode is currently developed privately by a small team. Contributions
should preserve Code - OSS compatibility while making every BatikCode surface
functional, secure, and testable.

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
