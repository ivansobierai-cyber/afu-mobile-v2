# Progresso — Plano Mestre Propriedades (10 etapas)

**Status geral (2026-07-23):** **CONCLUÍDO em `main` e em produção**  
**Commit de referência:** `6b05e5f`  
**API:** `https://afu-mobile-v2-production.up.railway.app` (health OK · `SEED_ON_START=0`)  
**Web:** `https://afu-mobile-web.vercel.app`  
**Plano:** `docs/AFU_Agro_Plano_Mestre_Propriedades_10_Etapas.md`  
**Skill:** `.cursor/skills/afu-propriedades-evolution/SKILL.md`

## Resumo executivo

| Frente | Status | PRs |
|--------|--------|-----|
| Segurança multi-tenant (Etapas 1–10) | **Feito + prod** | #12 |
| Plano Mestre dívidas 1–6 + P3 (mapa/máquinas) | **Feito + prod** | #13 |
| Fix schema máquinas (`tipo`/`status`) | **Feito + prod** | #14 |
| Follow-up: responsável ∈ membership | **Feito + prod** | #15 |
| Follow-up: GeoJSON validado no server | **Feito + prod** | #16 |
| Follow-up: `createBulk` transacional | **Feito + prod** | #17 |

Nenhuma PR de produto aberta para estas frentes.

## Status por etapa

| Etapa | Nome                              | Status            | Notas                                                     |
| ----- | --------------------------------- | ----------------- | --------------------------------------------------------- |
| 1     | Fundação                          | **feita**         | SessionGate, ScreenState, ownership, a11y base            |
| 2     | Painel com abas + safra           | **feita**         | Shell com `?tab=`                                         |
| 3     | Agenda → tarefas/operações        | **feita (P0/P1)** | `tarefas_operacionais`, apontamentos, aba Operações       |
| 4     | Hoje / Atenção necessária         | **feita (P0/P1)** | `alertas-engine`, feed de atividade, Visão com alertas    |
| 5     | Mapa polígonos                    | **feita (P0/P1)** | GeoJSON propriedade/talhão, PropertyMap + gerar perímetro |
| 6     | Ocorrência → diagnóstico → tarefa | **feita (P0/P1)** | `ocorrencias_campo` + criar tarefa a partir da ocorrência |
| 7     | Estoque agrícola                  | **feita (P0/P1)** | Itens + movimentos (≠ marketplace)                        |
| 8     | Custos / orçamento                | **feita (P0/P1)** | `orcamentos_safra` + `custos_operacao`                    |
| 9     | Offline / sync                    | **feita (P0/P1)** | `tarefa` na fila core + `clientMutationId`                |
| 10    | Métricas                          | **feita (P0/P1)** | Catálogo com fórmula/fonte + painel Indicadores           |

## Entregue nas Etapas 4–10

- Migration `0014_propriedades_etapas_4_10.sql` (+ applies 0020–0023 em boot)
- Schema: geometria, ocorrências, estoque, orçamentos, custos, atividade, `clientMutationId`, máquinas
- `lib/propriedades/alertas-engine.ts` + `geojson-helpers.ts` + `alerta-preferencias.ts`
- API `coreData.expansao.*` (`propriedade-expansao-router.ts`) + `coreData.tarefas.*`
- UI: alertas na Visão; polígonos no Mapa; Mais → Monitoramento / Estoque / Custos / Indicadores / Máquinas
- Offline: entity `tarefa` em `core-mutation-queue` + create/transition idempotentes
- Testes: `alertas-engine`, `alerta-preferencias`, `geojson-helpers`, `tarefas-createbulk`, cross-tenant

## Dívidas Plano Mestre 1–6 — concluídas (PR #13)

- **Dívida 1 — importação de mapa:** GeoJSON + GPS + editor de vértices + desenho livre (`PolygonDrawPad`).
- **Dívida 2 — preferências de alertas:** AsyncStorage por usuário/org; crítico nunca oculto.
- **Dívida 3 — auto estoque ao concluir:** consumos idempotentes por tarefa/item.
- **Dívida 4 — bulk + responsável:** `createBulk`, `responsavelUserId` (migração 0022).
- **Dívida 5 — transições offline:** `queueMutation` + `expectedStatus` / conflitos.
- **Dívida 6 — regras preditivas:** clima × pulverização/adubação; vistoria atrasada (sem LLM).

## P3 — concluído (PR #13)

- Desenho livre de perímetro no mapa (web).
- Cadastro de máquinas/equipamentos (`maquinas_operacionais`, migração 0023) — colunas enum alinhadas no PR #14.

## Follow-ups de segurança pós-revisão — concluídos (prod)

| PR | Entrega | Smoke prod |
|----|---------|------------|
| #15 | `requireOrgMemberUserId` em create/createBulk | `responsavelUserId` inválido → `NOT_FOUND` |
| #16 | `validatePolygonGeoJson` + limite 200k no server | anel aberto / JSON inválido → `BAD_REQUEST` |
| #17 | `createTarefasInTransaction` + pré-validação | falha cross-tenant não cria parciais |

## Produção (ops)

- Railway: builder `DOCKERFILE` via `railway.toml`; deploy pós-#17 `563c7fdc` SUCCESS.
- Boot aplica `db:safras` / archive / `0022` / `0023` de forma idempotente.
- Demo: `demo@afuagro.com.br` / `Demo@1234`
- Ops histórico PR #12: `docs/MERGE_PR12_RAILWAY.md` · aceite: `docs/ETAPA10_PROPRIEDADES_ACEITE.md`

## Residual (não bloqueia)

- Polimento fino de UX após testes de campo.
- Aprovação formal por revisor de segurança humano (gate de produto; ver `docs/SEGURANCA_CONCLUSAO_GLOBAL.md`).
