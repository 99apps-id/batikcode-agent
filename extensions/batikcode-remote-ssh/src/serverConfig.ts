import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

let vscodeProductJson: Record<string, unknown>;

async function getVSCodeProductJson() {
    if (!vscodeProductJson) {
        const productJsonPath = path.join(vscode.env.appRoot, 'product.json');
        const productJsonStr = await fs.promises.readFile(productJsonPath, 'utf8');
        try {
            vscodeProductJson = JSON.parse(productJsonStr);
        } catch (err) {
            // A malformed product.json otherwise surfaces as an opaque
            // "could not establish connection" — name the real cause instead.
            throw new Error(`Cannot read ${productJsonPath}: ${(err as Error).message}`);
        }
    }

    return vscodeProductJson;
}

export type ServerVersion = 'closest' | 'latest' | 'match' | string;
export type ServerValidation = 'force' | 'skip' | 'strict';

export type IServerConfig = {
    version: string;
    commit: string;
    quality: string;
    release: string;
    serverApplicationName: string;
    serverDataFolderName: string;
    serverDownloadUrlTemplate?: string;
    serverValidation: ServerValidation;
};

export async function getVSCodeServerConfig(): Promise<IServerConfig> {
    const productJson = await getVSCodeProductJson();

    const customServerBinaryName = vscode.workspace.getConfiguration('remote.SSH').get<string>('serverBinaryName', '');
    const serverValidation = vscode.workspace.getConfiguration('remote.SSH').get<ServerValidation>('serverValidation', 'strict');

    // No fabricated fallback: a made-up commit keys the remote install directory
    // ($SERVER_DATA_DIR/bin/$commit) to a constant, so a rebuilt server would be
    // shadowed forever by the first — broken — install. Callers substitute the
    // commit of the server build they actually ship.
    const commit = (productJson.commit as string) || '';
    return {
        version: vscode.version.replace('-insider',''),
        commit,
        quality: (productJson.quality as string) || 'stable',
        release: (productJson.release as string) || '',
        serverApplicationName: customServerBinaryName || (productJson.serverApplicationName as string) || 'batikcode-server',
        serverDataFolderName: (productJson.serverDataFolderName as string) || '.batikcode-server',
        serverDownloadUrlTemplate: productJson.serverDownloadUrlTemplate as string,
        serverValidation: commit ? serverValidation : 'skip',
    };
}
