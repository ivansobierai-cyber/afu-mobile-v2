# Data safety (Play Console) — respostas derivadas do código

Baseado em: `drizzle/schema.ts`, `expo-image-picker` / `expo-location` / `expo-notifications`, `lib/push-notifications.ts`, `lib/offline/*`, `hooks/use-device-location.ts`, `app/(tabs)/diagnostico.tsx`, auth e-mail/senha.

## Visão geral

| Pergunta | Resposta |
|----------|----------|
| O app coleta ou compartilha dados do usuário? | **Sim** (coleta) |
| Todos os dados são criptografados em trânsito? | **Sim** (HTTPS em produção; profile production não usa cleartext) |
| Os usuários podem solicitar exclusão? | **Sim** — via suporte (`suporte@afuagro.com.br`); documentado na política. Não há fluxo self-service completo no app ainda. |
| Dados são vendidos? | **Não** |
| Dados usados para publicidade / remarketing? | **Não** (sem SDKs de ads/analytics de marketing no código) |
| Dados usados para personalização de anúncios? | **Não** |

## Dados coletados

### Informações pessoais

| Tipo Play | Coletado? | Evidência | Obrigatório? | Propósito |
|-----------|-----------|-----------|--------------|-----------|
| Nome | Sim | `users.name`, `usuarios_afu.nome` | Sim (conta) | Funcionalidade do app |
| E-mail | Sim | `users.email` | Sim | Conta / comunicação |
| Telefone | Sim (opcional no cadastro) | `usuarios_afu.telefone` | Não | Conta / suporte |
| ID do usuário | Sim | IDs internos / `openId` | Sim | Conta |
| Endereço | Parcial | cidade/estado/região do produtor; não endereço residencial completo | Não | Funcionalidade |

### Localização

| Tipo | Coletado? | Notas |
|------|-----------|-------|
| Localização aproximada | Sim | Pode derivar de GPS balanceado |
| Localização precisa | Sim | `latitude`/`longitude` em propriedades (`expo-location`, permissão when-in-use) |
| Em segundo plano? | **Não** | Só foreground / sob demanda |

### Fotos e vídeos

| Tipo | Coletado? | Notas |
|------|-----------|-------|
| Fotos | Sim | Diagnóstico IA + anexos de eventos (`expo-image-picker`) |
| Vídeos | Não no fluxo principal | Upload de vídeo é simulado em UI demo; permissão de vídeo bloqueada no manifesto |
| Permissão storage legado | `READ_EXTERNAL_STORAGE` mantida para API ≤32 (galeria); `WRITE_EXTERNAL_STORAGE` bloqueada |

### Dados do app

| Tipo | Coletado? | Notas |
|------|-----------|-------|
| Interações no app | Sim (operacionais) | Cultivos, estoque, custos, pedidos, tickets — dados do serviço, não analytics de ads |
| Logs de diagnóstico in-app | Sim | Diagnósticos IA associados ao usuário/org |
| Outros | Push token | `push_tokens.expoPushToken` |

### Identificadores do dispositivo

| Tipo | Coletado? | Notas |
|------|-----------|-------|
| ID do dispositivo | Sim (app-gerado) | ID local de sync offline (`lib/offline/tenant-scope.ts`); não é GAID/AAID de ads |

### Informações financeiras

| Tipo | Coletado? | Notas |
|------|-----------|-------|
| Infos de pagamento Play | Não | Sem billing Google Play no código |
| Infos financeiras do usuário | Dados de **custos/lançamentos agrícolas** da fazenda | Uso interno do produtor na org; não cartão de crédito |

### Mensagens

| Tipo | Coletado? | Notas |
|------|-----------|-------|
| E-mails | Só se o usuário usar fluxos de suporte/reset | SendGrid opcional no servidor |
| Outras mensagens in-app | Tickets de suporte | `tickets_suporte` / `mensagens_suporte` |

## Compartilhamento com terceiros

Marcar compartilhamento apenas se o processador for “terceiro” no sentido Play (não processador de serviço). Na prática:

- Hospedagem API / DB / object storage: **processadores do serviço** (tratar conforme orientação atual do Play; tipicamente “não compartilhado para outros fins”).
- Modelo de IA (Forge/OpenAI-compat), quando configurado: fotos de diagnóstico são enviadas ao provedor de inferência — declarar como processamento necessário à funcionalidade / processador de serviço.
- **Não** há Firebase Analytics, Facebook SDK, AdMob etc. no repositório.

## Segurança

- Criptografia em trânsito: sim (produção).
- Usuários podem solicitar exclusão: sim (e-mail).
- Dados sensíveis: fotos de plantas e documento do produtor (quando informado) — declarar categorias correspondentes e finalidade “App functionality”.
