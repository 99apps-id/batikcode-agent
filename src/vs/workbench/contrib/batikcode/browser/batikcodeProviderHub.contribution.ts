/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Codicon } from '../../../../base/common/codicons.js';
import { localize2 } from '../../../../nls.js';
import { Action2, MenuId, registerAction2 } from '../../../../platform/actions/common/actions.js';
import { ServicesAccessor } from '../../../../platform/instantiation/common/instantiation.js';
import { ICommandService } from '../../../../platform/commands/common/commands.js';

const OPEN_PROVIDER_HUB_ACTION = 'batikcode.action.openProviderHub';
const OPEN_PROVIDER_HUB_COMMAND = 'batikcode.providerHub.open';

registerAction2(class OpenBatikCodeProviderHubAction extends Action2 {
	constructor() {
		super({
			id: OPEN_PROVIDER_HUB_ACTION,
			title: localize2('batikcode.providerHub.open', "Accounts & AI Providers"),
			category: localize2('batikcode.category', "BatikCode"),
			icon: Codicon.circuitBoard,
			f1: true,
			menu: [{
				id: MenuId.TitleBar,
				group: 'navigation',
				order: 9000
			}]
		});
	}

	override async run(accessor: ServicesAccessor): Promise<void> {
		await accessor.get(ICommandService).executeCommand(OPEN_PROVIDER_HUB_COMMAND);
	}
});
