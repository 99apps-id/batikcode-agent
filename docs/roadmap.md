# BatikCode Roadmap

The PRD is a living reference. This roadmap prioritizes coherent, testable
vertical slices rather than cosmetic breadth. Dates are intentionally omitted
until build and release ownership are established.

## Phase 0 — Private technical preview

- keep the Code - OSS core development loop stable;
- complete BatikCode branding and remove stale DeskCode/VS Code product-facing
  artwork;
- keep Primary Side Bar and settings behavior consistent;
- validate Windows terminal, Open VSX, Browser Preview, Provider Hub, Remote
  Explorer, tunnels, and Telegram empty/error states;
- maintain honest feature status and troubleshooting documentation.

Exit criteria: repeatable clean build and smoke suite on the owner's Windows
machine.

## Phase 1 — Provider acceptance

- complete configure → connect → status → model picker → response tests for
  DeepSeek and representative OpenAI-, Anthropic-, and Gemini-compatible
  providers;
- verify rotation, cooldown, fallback, cancellation, quota, and redaction;
- complete Codex and Gemini OAuth model-response acceptance;
- implement reliable logout/revoke/refresh state;
- add automated router tests and fixtures that contain no real secrets;
- define streaming and tool-call abstractions before enabling them in UI.

Exit criteria: every provider marked available has a reproducible real-response
test and a truthful disconnected/error path.

## Phase 2 — Product-owned identity and registry

- register a BatikCode-owned GitHub OAuth App with Device Flow;
- remove the temporary upstream OAuth fallback;
- review GitHub Copilot compatibility, entitlement, and redistribution terms;
- deploy or select a BatikCode-controlled Open VSX registry strategy;
- define extension allow/deny, mirroring, moderation, and security response;
- audit all provider artwork and trademark attribution.

Exit criteria: no release authentication or registry identity depends on an
upstream product identity.

## Phase 3 — Remote development hardening

- acceptance-test OpenSSH hosts and a compatible Remote SSH resolver;
- add an explicit execution adapter before Telegram can operate on a remote
  filesystem;
- complete real-device Telegram threat tests, pairing recovery, audit events,
  and bot lifecycle diagnostics;
- add managed tunnel adapters only when service ownership and authentication
  are clear;
- preserve Cloudflare Quick Tunnel as an explicit development-only option.

Exit criteria: local and remote execution boundaries are visible, tested, and
cannot be confused.

## Phase 4 — Release engineering

- create BatikCode-owned Git hosting and rename the historical branch;
- establish CI for compile, lint, unit, integration, native terminal, and UI
  smoke tests;
- build Windows installer artifacts with BatikCode icons and metadata;
- select code-signing, update feed, rollback, crash reporting, and telemetry
  policies;
- produce SBOM, license inventory, third-party notices, and reproducible build
  documentation;
- define supported OS versions and upgrade policy.

Exit criteria: signed, reproducible artifacts can be installed, updated, and
rolled back without using a developer checkout.

## Phase 5 — Small-team beta

- onboard 2–5 trusted users with isolated credentials;
- collect structured reliability and UX feedback;
- track startup, terminal, extension, provider, and remote workflow failures;
- complete accessibility checks for custom surfaces;
- publish support, privacy, data-processing, and vulnerability-reporting
  policies.

Exit criteria: no critical data-loss/security issue and agreed reliability
targets across the supported workflows.

## Long-term direction

If BatikCode grows beyond private/small-team use, evaluate:

- a fully BatikCode-owned OAuth and extension ecosystem;
- cross-platform signed releases;
- managed team policy and settings sync;
- remote workspace infrastructure;
- extension compatibility certification;
- provider governance, usage budgets, and organization-level secret control.

Growth does not change the core rule: visible capabilities must be real,
measurable, and honest about external dependencies.
