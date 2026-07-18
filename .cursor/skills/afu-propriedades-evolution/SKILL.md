---
name: afu-propriedades-evolution
description: Evolui o gerenciamento de propriedades do AFU Agro conforme o Plano Mestre em 10 etapas (fundação → painel → operações → mapa → diagnóstico → estoque → custos → offline → métricas). Use when continuing property/farm panel work, talhões, safras, tarefas operacionais, or related migrations in afu-mobile.
---

# AFU — Evolução do Gerenciamento de Propriedades

## Fonte de verdade

- Plano: `docs/AFU_Agro_Plano_Mestre_Propriedades_10_Etapas.md`
- Glossário: `docs/PROPRIEDADES_GLOSSARIO.md`
- Inventário: `docs/PROPRIEDADES_INVENTARIO.md`
- Progresso: `docs/PROPRIEDADES_PROGRESSO.md`

## Stack

Expo Router · tRPC (`coreData.*`) · Drizzle/MySQL · JWT

## Hierarquia obrigatória

```
Organização → Propriedade → Talhão(terreno) → Safra → Cultivo
  → Ocorrência → Diagnóstico → Recomendação → Tarefa → Operação → Custo → Resultado
```

**Terreno = Talhão** (mesma entidade `terrenos`). UI pode dizer "Talhão"; schema mantém `terrenos`.

## Ondas

1. Fundação (Etapas 1–2) — sessão, estados, a11y, painel com abas, safra
2. Operacional (3–4) — tarefas/apontamentos, Hoje/Alertas
3. Espacial/agronômica (5–6) — polígonos, ocorrência→tarefa
4. Recursos (7–8) — estoque agrícola, custos
5. Confiabilidade/IA (9–10) — offline idempotente, métricas

## Regras de execução

1. **Uma etapa por vez.** Não avançar com P0 aberto.
2. Reutilizar `ScreenState`, `ScreenHeader`, `coreData.*`, offline queue.
3. Migrações reversíveis; nunca apagar histórico.
4. Isolamento por produtor em **todo** list/get/update/delete.
5. Mais (admin/plan) ≠ Dashboard (produtor). Features prontas só no Dashboard/propriedade quando autorizadas.
6. Após mudanças: `npm run check` + testes novos/relevantes + evidência visual.

## Arquivos-chave

| Área | Path |
|------|------|
| Lista | `app/(tabs)/propriedades.tsx` |
| Painel | `app/propriedades/[id].tsx` |
| Talhões | `app/propriedades/terrenos.tsx` |
| Cultivos | `app/(tabs)/cultivos.tsx`, `app/cultivos/[id].tsx` |
| API | `server/routers/core-data-router.ts`, `server/routers/tarefas-router.ts`, `server/db.ts` |
| Schema | `drizzle/schema.ts` (`tarefas_operacionais`, `apontamentos_operacao`) |
| Operações UI | `components/propriedade-operacoes-panel.tsx` |
| Estados UI | `components/screen-state.tsx` |
| Status máquina | `lib/propriedades/tarefa-status.ts` |
| Sessão | `app/_layout.tsx` SessionGate, `hooks/use-session.ts` |

## Checklist ao retomar

1. Ler `docs/PROPRIEDADES_PROGRESSO.md` — etapa atual e pendências.
2. Confirmar critérios de aceite da etapa atual.
3. Implementar P0/P1 apenas.
4. Testar + atualizar progresso + commit.
