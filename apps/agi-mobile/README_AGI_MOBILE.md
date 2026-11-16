# AFU AGI — Guia de Instalação e Conexão (AFU API + n8n)

## 1. Arquitetura Separada

| Componente | Responsabilidade |
| --- | --- |
| **AGI Mobile (APK)** | Interface Android, entrada multimodal, telemetria local, motor offline e armazenamento cifrado no Android Keystore |
| **AGI Backend** | Roteamento seguro de APIs de IA, autenticação de sessão, banco vetorial e sincronização |
| **n8n** | Orquestração de workflows, delegação entre subagentes e execução de ferramentas |

## 2. Como Conectar ao Servidor AGI e n8n

1. Abra o aplicativo **AGI Mobile** e acesse **Menu > Configurações**.
2. Em **SERVIDOR AGI & N8N**, preencha:
   - **Endereço do AGI Backend (HTTPS)**: ex. `https://agi.seudominio.com`
   - **URL Base do n8n**: ex. `https://n8n.seudominio.com`
   - **Webhook Orquestrador**: `/webhook/agi/orchestrator`
   - **Endpoint de Status**: `/webhook/agi/status`
   - **Webhook Sincronização Memória**: `/webhook/agi/memory-sync`
   - **Webhook API Router**: `/webhook/agi/api-router`
   - **Token Bearer**: token de autenticação configurado no seu backend/n8n (armazenado cifrado com AES-256-GCM no Android Keystore).
3. Toque em **Salvar** e em seguida em **Testar Conexão**.

## 3. Contratos HTTP Esperados

### Status (`GET /webhook/agi/status`)
```json
{
  "orchestratorStatus": "Online",
  "n8nStatus": "Conectado"
}
```

### Orquestrador (`POST /webhook/agi/orchestrator`)
Payload enviado pelo app:
```json
{
  "sessionId": "sess-1234",
  "message": "Objetivo do usuário",
  "mode": "HYBRID",
  "routingStrategy": "AUTO",
  "preferredModel": "qwen-max",
  "contextMemories": ["..."],
  "attachments": ["documento.pdf"],
  "timestamp": 1731630000000
}
```
Resposta JSON (ou stream `text/event-stream` SSE):
```json
{
  "output": "Resposta consolidada pelo Orquestrador",
  "model": "qwen-max",
  "agents": ["Orquestrador", "Pesquisador", "Auditor"],
  "tokensUsed": 420,
  "tasks": [
    {
      "id": "TSK-101",
      "title": "Pesquisa inicial",
      "description": "Resumo de fontes",
      "agent": "Pesquisador",
      "status": "COMPLETED",
      "priority": "HIGH"
    }
  ]
}
```

## 4. Modo Local (Offline) & Modelos GGUF/ONNX

- Acesse **Menu > Intelligence Manager** para alternar entre **LOCAL**, **CLOUD**, **AUTO** e **HYBRID**.
- Você pode importar arquivos `.gguf` ou `.onnx` diretamente do armazenamento do dispositivo usando **Importar Arquivo** (via Android SAF, sem permissões invasivas de armazenamento) ou baixar modelos compatíveis verificados pela telemetria de RAM e armazenamento livre.
