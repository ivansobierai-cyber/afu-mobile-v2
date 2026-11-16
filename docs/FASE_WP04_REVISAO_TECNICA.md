# WP-04 — Revisão técnica de diagnóstico IA

**Objetivo:** técnico/agrônomo aprova, corrige ou rejeita o laudo IA; o produtor vê o status; a recomendação corrigida alimenta o fluxo WP-03 (criar tarefa).

## Fluxo

1. `diagnostico.salvar` — laudo IA com `statusRevisao = pendente`.
2. `diagnostico.revisar` — técnico aplica `confirmar` | `corrigir` | `descartar` (+ parecer).
3. Produtor consulta `diagnostico.getRevisao` / histórico (badge de status).
4. `diagnostico.criarTarefa` (WP-03) — usa recomendação **corrigida** quando houver; bloqueia se `descartado`.

## Status (`statusRevisao`)

| Valor | Origem | Significado |
|-------|--------|-------------|
| `pendente` | default no save | Aguardando técnico |
| `confirmado` | ação `confirmar` | Laudo IA aprovado |
| `revisado` | ação `corrigir` | Técnico corrigiu recomendação |
| `descartado` | ação `descartar` | Rejeitado (não gera tarefa) |

O laudo original (`recomendacao` / `resultado`) **não é apagado**. Correção fica em `recomendacaoCorrigida`.

## Campos aditivos (migração `0042`)

| Campo | Papel |
|-------|--------|
| `revisadoPorUserId` | `users.id` do revisor |
| `revisadoPorPerfilId` | `usuarios_afu.id` do revisor |
| `revisadoEm` | timestamp da revisão |
| `parecerTecnico` | notas do técnico |
| `recomendacaoCorrigida` | texto corrigido (preserva original) |

Índice: `diagnosticos_org_status_revisao_idx (organizationId, statusRevisao)`.

## RBAC

| Ação | Permissão |
|------|-----------|
| `revisar` / `listarPendentesRevisao` | `diagnostics.review` |
| `getRevisao` | `property.read` (mesmo tenant) |
| `criarTarefa` (após correção) | inalterado WP-03 (`operations.write` + `diagnostics.write`) |

Papéis com `diagnostics.review`: proprietario, administrador, gerente, agronomo.  
**Sem** review: operador, consultor, auditor.

## Auditoria

Cada revisão grava `audit_logs` com action `diagnostico.revisao.<acao>`, `resourceType=diagnostico_ia`, actor e meta (from/to). Push best-effort ao produtor dono do laudo.

## UI

- Card **Revisão técnica** na tela `app/(tabs)/diagnostico.tsx` (resultado) — não remove PDF / Nova Análise / Criar tarefa.
- Badge de status no histórico.
- Fila `app/mais/revisao-diagnosticos.tsx` + atalho no header do Diagnóstico (quem tem review) e item no menu Admin.

## Migração

`0042_diagnostico_revisao_tecnica` — supplemental (`npm run db:diagnostico-revisao-tecnica:apply` / `db:schema:prepare`).

## Testes

- `tests/diagnostico-revisao-map-wp04.test.ts` — mapeamentos + matriz RBAC.
- `tests/diagnostico-revisao-wp04.test.ts` — confirmar/corrigir/descartar, tarefa, tenant, FORBIDDEN.

## Fora de escopo

- Assinatura digital / certificado do laudo.
- Múltiplos revisores em sequência (última revisão vence).
- Next.js admin separado (stack Expo atual).
