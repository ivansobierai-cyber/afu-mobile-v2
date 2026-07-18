# Progresso — Plano Mestre Propriedades (10 etapas)

**Branch de trabalho:** `cursor/organize-dashboard-nav-fd64`  
**Plano:** `docs/AFU_Agro_Plano_Mestre_Propriedades_10_Etapas.md`  
**Skill:** `.cursor/skills/afu-propriedades-evolution/SKILL.md`

## Status por etapa

| Etapa | Nome | Status | Notas |
|-------|------|--------|-------|
| 1 | Fundação (sessão, estados, a11y, glossário, isolamento) | **feita (P0/P1)** | SessionGate, ScreenState, ownership DB/API, a11y painel, glossário/inventário, testes |
| 2 | Painel propriedade com abas + safra | **feita (P1 shell)** | Abas Visão/Mapa/Talhões/Cultivos/Mais; rótulo de safra; `?tab=` |
| 3 | Agenda → tarefas/operações | pendente | Próxima onda operacional |
| 4 | Hoje / Atenção necessária | pendente | Placeholder “Hoje na fazenda” na Visão |
| 5 | Mapa polígonos | pendente | Mapa ainda é marcador GPS |
| 6 | Ocorrência → diagnóstico → tarefa | pendente | |
| 7 | Estoque agrícola | pendente | |
| 8 | Custos / máquinas / equipe | pendente | |
| 9 | Offline / sync | parcial | Core offline já existe; evoluir na etapa |
| 10 | Métricas / escala / IA | pendente | |

## Entregue nesta onda

- `components/screen-state.tsx`
- `app/_layout.tsx` SessionGate
- Isolamento `getPropriedades` / `getCulturas` + ownership em mutate
- Cultivo persiste `terrenoId`
- Painel `app/propriedades/[id].tsx` com abas
- Docs + skill de continuidade
- Testes: `screen-state`, `propriedades-ownership`, `session-gate`

## Pendências / riscos

- Tabela `safras` ainda não criada (rótulo derivado por calendário)
- Sem API agregadora única da visão geral (queries paralelas)
- A11y completa em lista/modais ainda parcial
- Polígonos e tarefas operacionais não iniciados

## Como continuar

1. Ler skill `afu-propriedades-evolution`
2. Iniciar **Etapa 3** (modelo tarefa/operação/apontamento a partir de `calendario_cuidados`)
3. Não pular para IA/custos antes da onda operacional
