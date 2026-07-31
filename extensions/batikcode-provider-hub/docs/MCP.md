# Model Context Protocol (MCP)

## Deskripsi
Model Context Protocol (MCP) adalah protokol untuk menghubungkan model-model AI.

## Konfigurasi
- **Endpoint**: `https://api.mcp.com/v1`
- **Model Default**: `mcp-default-model`
- **Autentikasi**: `bearer`

## Contoh Penggunaan
```typescript
// Contoh penggunaan MCP
const response = await providerRouter.routeChat({
    providerId: 'mcp',
    model: 'mcp-default-model',
    messages: messagesWithIdentity,
    tools: options.tools?.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema ?? { type: 'object', properties: {} }
    })),
    toolMode: options.toolMode === vscode.LanguageModelChatToolMode.Required ? 'required' : 'auto',
    onText: chunk => {
        streamedText = true;
        progress.report(new vscode.LanguageModelTextPart(chunk));
    },
    signal: cancellationSignal(token)
});
```

## Dukungan Fitur
- **Tool Calling**: Didukung
- **Vision**: Didukung untuk model-model vision

## Error Handling
- **Error Handling**: Error handling untuk MCP informatif dan actionable

## Testing
- **Testing**: Testing untuk MCP berjalan dengan baik
