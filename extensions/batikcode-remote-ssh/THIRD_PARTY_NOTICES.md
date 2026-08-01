# Third-Party Notices — BatikCode Remote SSH

This extension vendors runtime dependencies. This file records the license of
each runtime dependency and the rationale for any git-pinned (non-registry)
dependency so the compliance posture is auditable.

Runtime dependencies are resolved with exact versions (`npm ci` / `npm install`
uses the pinned versions below). Two dependencies are pinned to specific git
commits because the upstream registry packages did not expose the fixes BatikCode
Remote SSH needs; the pinned commits are reviewed and intentionally chosen.

## Runtime dependencies

| Package | Version | License | License file shipped in node_modules | Resolved from |
| --- | --- | --- | --- | --- |
| `@zokugun/is-it-type` | 0.8.1 | MIT | `LICENSE` | npm registry |
| `glob` | 13.0.6 | BlueOak-1.0.0 | `LICENSE.md` | npm registry |
| `semver` | 7.8.5 | ISC | `LICENSE` | npm registry |
| `simple-socks` | 2.2.2 | MIT | **missing** | git commit `2ac7393` (fork) |
| `socks` | 2.8.9 | MIT | `LICENSE` | npm registry |
| `ssh-config` | 5.2.0 | MIT | `LICENSE` | npm registry |
| `ssh2` | 1.14.0 | MIT | `LICENSE` | git commit `a169f62` (fork) |

## Git-pinned dependencies

### `simple-socks` — `git+https://github.com/jeanp413/simple-socks#2ac739301a82d6baff04804ed494436a026acb60`

- License: MIT (declared in `package.json`).
- ⚠️ The git-pinned install does **not** ship a `LICENSE` file in
  `node_modules/simple-socks`. The upstream project
  (`github.com/jeanp413/simple-socks`) is MIT-licensed; the MIT license text is
  reproduced below so the notice requirement is satisfied even when the file is
  absent from the installed tree.
- Pinned because the forked package carries proxy/agent fixes used by this
  extension that were not published to the npm registry at the pinned version.

### `ssh2` — `git+https://github.com/jeanp413/ssh2#a169f627213aa663e0aa2fd2f0ef5c8931890c26`

- License: MIT. `package.json` declares the legacy `licenses` array
  (`[{ type: "MIT", url: "http://github.com/mscdex/ssh2/raw/master/LICENSE" }]`),
  and a `LICENSE` file ("Copyright Brian White", MIT) ships in the installed tree.
- Pinned because the fork carries connection fixes not yet published to the npm
  registry at the pinned version.

## MIT license text

The following applies to `simple-socks`, `socks`, `ssh-config`, `ssh2`, and
`@zokugun/is-it-type`:

```
Copyright (c) the respective authors of the packages listed above

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to
deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
```

## BlueOak-1.0.0 (`glob`)

`glob` is licensed under the Blue Oak Model License 1.0.0. The full license text
is available at <https://blueoakcouncil.org/license/1.0.0> and ships with the
package as `LICENSE.md` in `node_modules/glob`.

## ISC (`semver`)

`semver` is licensed under the ISC license. The full license text ships with
the package as `LICENSE` in `node_modules/semver`.
