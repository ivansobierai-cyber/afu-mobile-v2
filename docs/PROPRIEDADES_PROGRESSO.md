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

- Preferências de painel por perfil (4.6)
- Desenho livre de polígono no mapa (import GeoJSON manual / edição por vértices)
- Máquinas, equipe e ações em massa (Etapa 3/8 avançado)
- IA preditiva de alertas (apenas regras determinísticas)
- Sync de transições de status offline (create já na fila)

## Como continuar

1. Desenho/importação avançada de talhões no mapa
2. Preferências de alertas por usuário
3. Consumo de estoque automático ao concluir operação
