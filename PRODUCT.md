# Product

## Register

product

## Users

Beginner, student, professional developer, and small teams working in a cross-platform desktop IDE. Their primary job is to open local or remote workspaces, navigate and edit code, search, run terminals, use Git and debugging tools, install extensions, and use AI assistance without leaving the workbench.

## Product Purpose

BatikCode is a branded desktop IDE distribution built from Code - OSS. It preserves the Visual Studio Code workbench mental model while adding a Nusantara identity, provider-neutral AI, secure account and API-key routing, browser preview, development tunnels, remote exploration, and opt-in Telegram remote coding. Success means the core development loop is real rather than simulated and every visible BatikCode feature reaches a functioning service or an honest actionable unavailable state.

The existing PRDs remain a requirements reference rather than a frozen specification. New validated requirements and architecture decisions may extend or supersede them.

## Brand Personality

Developer-first, precise, Nusantara. The product should feel immediately familiar and trustworthy to experienced VS Code users, stay quiet during focused work, and express its identity through original BatikCode artwork rather than unfamiliar interaction patterns.

## Anti-references

- A decorative dashboard or generic AI-generated admin shell presented as an IDE.
- Static mock data, placeholder panels, empty values, or buttons that imply functionality without executing it.
- A loose visual approximation of VS Code that changes its density, hierarchy, iconography, panel behavior, or keyboard model without a workflow reason.
- Duplicate settings entry points, over-styled controls, glass effects, oversized cards, marketing typography, and motion that does not communicate state.

## Design Principles

1. Familiarity is a feature: preserve the Code - OSS workbench mental model and standard IDE affordances.
2. The development loop must be real: workspace, files, editor, search, terminal, Git, debugger, extensions, settings, remote tools, and AI connect to functioning services.
3. Never fake readiness: unavailable dependencies, credentials, entitlements, and connections are explicit and actionable.
4. Dense, quiet, and keyboard-first: prioritize information, speed, resizable regions, and complete keyboard access over decoration.
5. Prefer built-in extensions and stable adapter seams; keep unavoidable upstream patches small, documented, and tested.
6. Progressive parity: ship coherent end-to-end vertical slices with smoke tests rather than broad panels backed by mocks.

## Accessibility & Inclusion

Target WCAG 2.2 AA for applicable desktop-web surfaces, full keyboard navigation, screen-reader semantics, visible focus, high-contrast themes, color-blind-safe state communication, text scaling resilience, and reduced-motion support.
