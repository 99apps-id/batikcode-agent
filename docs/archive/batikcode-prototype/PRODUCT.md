# Product

## Register

product

## Users

Beginner, student, professional developer, enterprise developer, and open-source contributor working in a cross-platform desktop IDE. Their primary job is to open a local or multi-root workspace, navigate and edit code, search, run terminals, use Git and debugging tools, install extensions, and use AI assistance without leaving the workbench.

## Product Purpose

DeskCode is a fast, modular, extensible, offline-first desktop IDE. Its intended interaction model and visual fidelity are explicitly aligned with Visual Studio Code, while its differentiators are a stable plugin platform, integrated AI, secure process isolation, and a maintainable modular architecture. Success means the core development loop is real rather than simulated, startup remains below three seconds, normal workflows do not crash, and every shipped feature is connected through IPC and tested.

## Brand Personality

Developer-first, precise, quiet. The product should feel immediately familiar and trustworthy to experienced VS Code users, stay out of the way during focused work, and communicate state with dense but consistent native IDE conventions.

## Anti-references

- A decorative dashboard or generic AI-generated admin shell presented as an IDE.
- Static mock data, placeholder panels, or buttons that imply functionality without executing it.
- A loose visual approximation of VS Code that changes its density, hierarchy, iconography, interaction states, panel behavior, or keyboard model.
- Over-styled controls, glass effects, oversized cards, marketing typography, and motion that does not communicate state.

## Design Principles

1. Familiarity is a feature: preserve the VS Code workbench mental model and interaction vocabulary.
2. The development loop must be real: workspace, files, editor, search, terminal, Git, debugger, extensions, settings, and AI connect to functioning services.
3. Dense, quiet, and keyboard-first: prioritize information, speed, resizable regions, and complete keyboard access over decoration.
4. Deep modules behind stable seams: keep Electron process separation, IPC validation, and replaceable adapters without pass-through abstractions.
5. Progressive parity: ship coherent end-to-end vertical slices with tests rather than broad panels backed by mocks.

## Accessibility & Inclusion

Target WCAG 2.2 AA for applicable desktop-web surfaces, full keyboard navigation, screen-reader semantics, visible focus, high-contrast themes, color-blind-safe state communication, text scaling resilience, and reduced-motion support.
