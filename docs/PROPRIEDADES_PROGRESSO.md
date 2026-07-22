# Progresso — Plano Mestre Propriedades (10 etapas)

**Branch de trabalho:** `cursor/organize-dashboard-nav-fd64`  
**Plano:** `docs/AFU_Agro_Plano_Mestre_Propriedades_10_Etapas.md`  
**Skill:** `.cursor/skills/afu-propriedades-evolution/SKILL.md`

## Status por etapa

| Etapa | Nome | Status | Notas |
|-------|------|--------|-------|
| 1 | Fundação | **feita** | SessionGate, ScreenState, ownership, a11y base |
| 2 | Painel com abas + safra | **feita** | Shell com `?tab=` |
| 3 | Agenda → tarefas/operações | **feita (P0/P1)** | `tarefas_operacionais`, apontamentos, aba Operações |
| 4 | Hoje / Atenção necessária | **feita (P0/P1)** | `alertas-engine`, feed de atividade, Visão com alertas |
| 5 | Mapa polígonos | **feita (P0/P1)** | GeoJSON propriedade/talhão, PropertyMap + gerar perímetro |
| 6 | Ocorrência → diagnóstico → tarefa | **feita (P0/P1)** | `ocorrencias_campo` + criar tarefa a partir da ocorrência |
| 7 | Estoque agrícola | **feita (P0/P1)** | Itens + movimentos (≠ marketplace) |
| 8 | Custos / orçamento | **feita (P0/P1)** | `orcamentos_safra` + `custos_operacao` |
| 9 | Offline / sync | **feita (P0/P1)** | `tarefa` na fila core + `clientMutationId` |
| 10 | Métricas | **feita (P0/P1)** | Catálogo com fórmula/fonte + painel Indicadores |

## Entregue nas Etapas 4–10

- Migration `0014_propriedades_etapas_4_10.sql`
- Schema: geometria, ocorrências, estoque, orçamentos, custos, atividade, `clientMutationId`
- `lib/propriedades/alertas-engine.ts` + `geojson-helpers.ts`
- API `coreData.expansao.*` (`propriedade-expansao-router.ts`)
- UI: alertas na Visão; polígonos no Mapa; Mais → Monitoramento / Estoque / Custos / Indicadores
- Offline: entity `tarefa` em `core-mutation-queue` + create idempotente
- Testes: `tests/alertas-engine.test.ts`

## Adiado / dívida

- Desenho livre de polígono no mapa (edição por vértices)
- Máquinas e equipe operacional (Etapa 3/8 avançado)

## Dívidas Plano Mestre 1–6 — concluídas

- **Dívida 1 — importação de mapa:** aba Mapa importa GeoJSON para propriedade/talhões, valida Polygon/Feature e gera geometria GPS para talhões sem perímetro.
- **Dívida 2 — preferências de alertas:** feed carrega preferências por usuário/organização, filtra por gravidade mínima e permite adiar alertas não críticos.
- **Dívida 3 — auto estoque ao concluir:** transição para concluída aceita consumos idempotentes por tarefa/item e bloqueia saldo insuficiente.
- **Dívida 4 — bulk + responsável:** `responsavelUserId`, migração/apply 0022 e `tarefas.createBulk` para criar uma tarefa por talhão.
- **Dívida 5 — transições offline:** botões de operação usam `queueMutation` com `expectedStatus`, `clientMutationId` e `deviceId`.
- **Dívida 6 — regras preditivas:** alertas estimados para clima em pulverização/adubação e vistoria pendente em cultivo ativo.

## Como continuar

1. Edição visual por vértices no mapa
2. Responsável/equipe com seletor de usuários na UI
3. Seleção detalhada de consumos ao concluir tarefa
