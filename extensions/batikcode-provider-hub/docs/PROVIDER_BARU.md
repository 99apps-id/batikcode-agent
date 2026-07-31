# Provider Baru

## Deskripsi
Provider Baru adalah protokol untuk menghubungkan model-model AI.

## Konfigurasi
- **Endpoint**: `https://api.provider-baru.com/v1`
- **Model Default**: `provider-baru-default-model`
- **Autentikasi**: `bearer`

## Contoh Penggunaan
```typescript
// Contoh penggunaan Provider Baru
const response = await providerRouter.routeChat({
    providerId: 'provider-baru',
    model: 'provider-baru-default-model',
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
- **Error Handling**: Error handling untuk Provider Baru informatif dan actionable

## Testing
- **Testing**: Testing untuk Provider Baru berjalan dengan baik
