# BatikCode Private Open VSX Registry

Reference deployment for a BatikCode-controlled Open VSX extension registry
(ADR 0001, decision 7; roadmap Phase 2). The editor reads the gallery endpoint
from `product.json`, so switching the registry is a configuration change, not a
code change.

## Why a private registry

BatikCode is an independent Code - OSS distribution:

- it must not depend on Microsoft's Visual Studio Marketplace entitlement;
- it should control which extensions are visible, installable, and updated for
  its users (allow/deny, mirroring, moderation, security response);
- the public Open VSX service is the bootstrap gallery today, but the long-term
  registry is self-hosted.

## Deploy

1. Create a `.env` file in this folder:

   ```dotenv
   OPENVSX_DB_PASSWORD=change-me-db
   OPENVSX_PUBLISH_PASSWORD=change-me-publish
   OPENVSX_BASE_URL=http://registry.example.com
   ```

2. Start the stack:

   ```powershell
   docker compose up -d
   ```

3. Verify: `http://localhost:8081` serves the Open VSX web UI.

This is a single-node reference deployment. Before production use, add:

- TLS termination (reverse proxy, e.g. Caddy/nginx with a real certificate);
- database backups and storage volume backups;
- monitoring and alerting;
- restricted network exposure for the publishing endpoint;
- a pinned image tag instead of `latest`.

## Point BatikCode at the registry

The public Open VSX is the default in `product.json`:

```json
"extensionsGallery": {
    "serviceUrl": "https://open-vsx.org/vscode/gallery",
    "itemUrl": "https://open-vsx.org/vscode/item",
    "publisherUrl": "https://open-vsx.org/namespace",
    "controlUrl": "https://raw.githubusercontent.com/EclipseFdn/publish-extensions/refs/heads/master/extension-control/extensions.json"
}
```

To switch to the private registry, change the four URLs to your deployment,
e.g.:

```json
"extensionsGallery": {
    "serviceUrl": "https://registry.example.com/vscode/gallery",
    "itemUrl": "https://registry.example.com/vscode/item",
    "publisherUrl": "https://registry.example.com/namespace",
    "controlUrl": "https://registry.example.com/extension-control/extensions.json"
}
```

Do not ship a private-registry URL in released builds until the deployment is
hardened; keep the public Open VSX as the bootstrap otherwise.

## Publish an extension

Use the Open VSX CLI with the publish password set above:

```powershell
npm install -g ovsx
ovsx publish --pat $env:OPENVSX_PUBLISH_PASSWORD path\to\extension.vsix
```

See the [Open VSX publishing docs](https://github.com/eclipse-openvsx/openvsx)
for namespace creation and access rules.

## Security notes

- The publish password grants publishing rights; keep it out of source control
  and rotate it.
- Enable moderation and review published extensions before making the registry
  public to BatikCode users.
- Mirror only extensions whose licenses permit redistribution (see
  `docs/security.md` and ADR 0001 decision 8: no Marketplace-only packages).
