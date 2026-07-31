---
name: install-vscode-extension
description: 'How to install a BatikCode extension from an extension ID. Useful when the user wants to add new capabilities to their BatikCode environment by installing extensions.'
---

# Installing BatikCode extensions

1. BatikCode extensions are identified by their unique extension ID, which typically follows the format `publisher.extensionName`. For example, the Python extension by Microsoft has the ID `ms-python.python`.
2. To install a BatikCode extension, you need to use the BatikCode command `workbench.extensions.installExtension` and pass in the extension ID. The args are of the format:
```
[extensionId, { enable: true, installPreReleaseVersion: boolean }]
```
> NOTE: install the pre-release version of the extension if the user explicitly mentions it or if the current environment is BatikCode Insiders. Otherwise, install the stable version.
3. Run that command via the `copilot_runVscodeCommand` tool. Make sure to pass the `skipCheck` argument as true to avoid checking if the command exists, as we know it does.