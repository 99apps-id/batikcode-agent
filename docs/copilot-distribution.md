# GitHub Copilot Distribution Gate

BatikCode's private development tree currently contains the upstream
`vscode-copilot-chat` source under `extensions/copilot`. The source license is
MIT, but that alone does not grant BatikCode permission to present GitHub's
marks as its own, bypass service entitlement, redistribute separately licensed
assets or dependencies, or promise that the GitHub-hosted service supports an
independent Code - OSS distribution.

The current integration is therefore approved only for private source builds
and authenticated acceptance testing. GitHub remains the authentication,
entitlement, policy, token, and service authority.

Before any installer is distributed outside the private development team, the
release owner must record evidence for every item below:

- the exact Copilot source revision and every bundled dependency license;
- preservation of `extensions/copilot/LICENSE.txt` and required notices;
- written confirmation that the intended binary redistribution is permitted;
- review of GitHub and GitHub Copilot trademark presentation;
- a real entitled-account sign-in, token refresh, sign-out, and policy test;
- confirmation that BatikCode does not imply sponsorship or affiliation;
- a documented decision to bundle the extension or require users to install an
  authorized compatible build themselves.

If any item is unresolved, the release artifact must exclude the Copilot
extension and describe Copilot as an optional external dependency. Local use by
the current small team does not clear this public-distribution gate.
