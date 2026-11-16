# FASE 2 / WP-02 — Modelo operacional canônico

**Objetivo:** um significado estável para “operação agrícola” entre agenda, tarefa e operação — sem apagar tabelas, telas ou dados existentes.

## Quatro entidades (não são sinônimos)

| Entidade | Tabela | Papel |
|----------|--------|--------|
| **Evento** | `calendario_cuidados` | Agenda / lembrete / acompanhamento. |
| **Tarefa** | `tarefas_operacionais` | Trabalho atribuído com máquina de estados e responsável. |
| **Operação agrícola** | `operacoes_agricolas` | Atividade de campo de registro (planejada → execução → aprovação). |
| **Apontamento** | `operacoes_agricolas_apontamentos` (canônico) / `apontamentos_operacao` (legado de tarefa) | Registro real de execução. |

Código de referência: `lib/operacoes/entidades-operacionais.ts`.

## Ponte evento ↔ tarefa (WP-02)

- Vínculo canônico: `tarefas_operacionais.legadoEventoId` → `calendario_cuidados.id` (UNIQUE desde `0013`).
- Origem da tarefa criada pela ponte: `origem = calendario_legado`.
- **Criar/atualizar** evento com `propriedadeId` → upsert da tarefa vinculada (título, datas, tipo, prioridade, dimensões).
- **Status inicial** na criação da tarefa vem do status do evento; **atualizações de status operacional** passam por `tarefas.transition` (não por write cru do calendário), para preservar apontamentos/estoque/lock de `aprovada`.
- **Transição** de status da tarefa vinculada → espelha status do evento.
- Evento **sem** propriedade (ou sem `organizationId`) não gera tarefa (continua só na agenda).
- Excluir evento **não** apaga a tarefa (preservação de histórico).

### Espelhamento de status

| Evento (`calendario_cuidados.status`) | Tarefa (`tarefas_operacionais.status`) |
|---------------------------------------|----------------------------------------|
| `pendente` | `planejada` |
| `em_andamento` | `em_execucao` |
| `concluido` | `concluida` |
| `cancelado` | `cancelada` |

Direção canônica em runtime: **tarefa → evento** (via `tarefas.transition`).  
Evento → tarefa: mapeamento só no **insert** da ponte; updates de evento não sobrescrevem status da tarefa.

Helpers: `lib/operacoes/evento-tarefa-status.ts`.  
Persistência: `server/db-evento-tarefa-bridge.ts`.

## Evento → operação agrícola

Promoção **explícita** (já FASE 2E): `coreData.operacoes.promoteFromEvento`.

- Cria/reusa `operacoes_agricolas` com `eventoOrigemId` + `origem = evento_calendario`.
- WP-02: ao promover, a ponte garante a tarefa vinculada e preenche `operacoes_agricolas.tarefaId` quando possível.
- Não cria apontamento nem conclui execução.

## UI do painel da propriedade

| Aba | Conteúdo |
|-----|----------|
| **Visão** | Resumo (“trabalho em aberto” = tarefas abertas) + atalho para o workspace Operações. |
| **Operações** | Workspace único com dois segmentos **complementares** (não concorrentes): **Operações agrícolas** e **Tarefas**. |

Agenda global permanece em `app/mais/calendario.tsx` (não removida). Detalhe do evento mostra vínculo da tarefa e promoção para operação.

## Backfill

`0040_evento_tarefa_bridge` (script idempotente em `db:schema:prepare`): cria tarefas faltantes para eventos que já têm `propriedadeId`, sem alterar eventos existentes.

## Fora de escopo WP-02

- Substituir tarefas por operações (não).
- Apagar `apontamentos_operacao` legado (não).
- Elo diagnóstico → recomendação → tarefa — entregue em **WP-03** (`docs/FASE_4_DIAGNOSTICO_TAREFA.md`).
