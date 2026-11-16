# FASE 4 P1 / WP-03 — Elo diagnóstico → recomendação → tarefa

**Objetivo:** fechar o coração do AFU após o laudo IA: foto → laudo → tarefa na mesma propriedade/safra.

## Fluxo

1. `diagnostico.analisar` — laudo IA (não persiste).
2. `diagnostico.salvar` — persiste em `diagnosticos_ia` (opcional `safraId`).
3. `diagnostico.criarTarefa` — cria `tarefas_operacionais` com `origem = diagnostico` e `legadoDiagnosticoId`.

## Vínculo canônico

| Campo | Tabela | Papel |
|-------|--------|--------|
| `safraId` | `diagnosticos_ia` | Ciclo produtivo opcional do laudo |
| `legadoDiagnosticoId` (UNIQUE) | `tarefas_operacionais` | Uma tarefa por diagnóstico |
| `origem = diagnostico` | `tarefas_operacionais` | Proveniência |

Idempotente: segunda chamada a `criarTarefa` devolve a tarefa já vinculada.

## RBAC

| Ação | Permissões |
|------|------------|
| `criarTarefa` | `operations.write` **e** `diagnostics.write` |
| `getTarefaVinculada` | `operations.read` + diagnóstico no tenant |
| `salvar` | `diagnostics.write` (inalterado) |

Consultor tem `diagnostics.write` mas **não** `operations.write` → não cria tarefa. Auditor não cria.

## Mapeamentos

Helpers puros em `lib/operacoes/diagnostico-tarefa-map.ts`:

- tipo laudo → `tipoOperacao` (praga/doença → monitoramento, deficiência → adubação, …)
- gravidade → prioridade
- recomendações → `instrucoes` (+ disclaimer de que IA não é certeza absoluta)

## UI

Tela `app/(tabs)/diagnostico.tsx` (Expo + web Metro): após o resultado, botão **Criar tarefa a partir da recomendação** (visível só com RBAC). Não remove Gerar Laudo PDF / Nova Análise.

## Migração

`0041_diagnostico_tarefa_bridge` — supplemental (`npm run db:schema:prepare`).

## Fora de escopo WP-03

- Revisão técnica do laudo (`statusRevisao`) — WP-04.
- Múltiplas tarefas por recomendação (índice só enfatiza texto; vínculo continua 1:1).
