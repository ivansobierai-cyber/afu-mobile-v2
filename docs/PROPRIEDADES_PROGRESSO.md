# Progresso — Plano Mestre Propriedades (10 etapas)

**Branch de trabalho:** `cursor/organize-dashboard-nav-fd64`  
**Plano:** `docs/AFU_Agro_Plano_Mestre_Propriedades_10_Etapas.md`  
**Skill:** `.cursor/skills/afu-propriedades-evolution/SKILL.md`

## Status por etapa

| Etapa | Nome | Status | Notas |
|-------|------|--------|-------|
| 1 | Fundação | **feita** | SessionGate, ScreenState, ownership, a11y base |
| 2 | Painel com abas + safra | **feita** | Shell com `?tab=` |
| 3 | Agenda → tarefas/operações | **feita (P0/P1)** | `tarefas_operacionais`, apontamentos, migração legado, aba Operações, máquina de estados |
| 4 | Hoje / Atenção necessária | **parcial** | Cards na Visão via `resumoHoje`; motor de regras completo ainda pendente |
| 5 | Mapa polígonos | pendente | |
| 6 | Ocorrência → diagnóstico → tarefa | pendente | |
| 7 | Estoque agrícola | pendente | |
| 8 | Custos / máquinas / equipe | pendente | |
| 9 | Offline / sync | parcial | Core offline; tarefas ainda não na fila offline |
| 10 | Métricas / escala / IA | pendente | |

## Entregue na Etapa 3

- Migration `0013_tarefas_operacionais.sql` (+ backfill de `calendario_cuidados` com propriedade)
- `lib/propriedades/tarefa-status.ts` — transições
- `server/routers/tarefas-router.ts` → `coreData.tarefas.*`
- `components/propriedade-operacoes-panel.tsx`
- Aba **Operações** no painel; Visão com Hoje + Atenção
- Ownership no update/delete do calendário
- Testes `tarefa-status`

## Como continuar

1. Completar Etapa 4: motor de alertas determinísticos + preferências
2. Offline para mutações de tarefas
3. Etapa 5: GeoJSON / polígonos
