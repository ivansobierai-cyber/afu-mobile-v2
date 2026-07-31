# Plano único — pendências AFU Mobile

**Atualizado:** 2026-07-31  
**Base:** `main` @ `4afc8a3` (PR #25 Eventos mergeado)  
**Uso:** fonte única do que ainda falta. Docs de etapa/release antigos são histórico; não abrir frentes paralelas sem atualizar este arquivo.

---

## Já encerrado (não reabrir)

| Item | Evidência |
|------|-----------|
| Plano Mestre Propriedades 1–10 + dívidas P3 | `docs/PROPRIEDADES_PROGRESSO.md` |
| Plano auxiliar estoque/custos/financeiro + Cultivos V2 + PDF resultado | `docs/RELEASE_PLANO_AUXILIAR_2026-07-23.md`, `docs/ETAPA_CULTIVOS_V2.md` |
| Segurança multitenant etapas 1–10 (base) | `docs/SEGURANCA_CONCLUSAO_GLOBAL.md` |
| Centro de Eventos Etapas 1–10 (UI, filtros, templates, ciclo, IA, views, tags/checklist/comentários/anexos, smoke) | PR [#25](https://github.com/ivansobierai-cyber/afu-mobile-v2/pull/25) |

Docs históricos (`todo.md`, `REVISAO_ETAPAS.md`, vários `SEGURANCA_ETAPA*`, smokes datados em `docs/evidencias/`) **não** são backlog ativo.

---

## Pendências ativas (ordem sugerida)

### P0 — Segurança: writes em prop arquivada / safra histórica

- **PR:** [#19](https://github.com/ivansobierai-cyber/afu-mobile-v2/pull/19) (draft)
- **Gap em main:** falta `requireWritablePropertyInTenant` / bloqueio consistente em escritas de prop arquivada (safra já tem `requireWritableSafra*` em vários pontos).
- **Ação:** rebase em `main` (branch ~58 commits atrás), validar testes `tenant-access` / `safras-entity`, tirar draft, merge.

### P1 — Ops: VPS Oracle + smoke PDF cultivo

- **PR:** [#24](https://github.com/ivansobierai-cyber/afu-mobile-v2/pull/24) (draft)
- **Gap:** acesso SSH do agente / inventário VPS; smoke `resultado_cultivo` em evidência.
- **Ação:** decidir se VPS recebe AFU ou só inventário; rebase; fechar ou merge conforme decisão.

### P2 — Homologação pós-merge Eventos (prod)

- Aplicar migrações `0033`–`0036` no boot Railway (`db:eventos-*:apply` já no `start-api-production.sh`).
- Smoke: `npm run smoke:eventos` contra API prod + UI web (tags/checklist/comentário/anexo).
- Confirmar preview Vercel estável (conta colaborador já desbloqueada).

### P3 — Qualidade / higiene (não bloqueante)

- Lint legado (~100 problemas) — não bloquear features; limpar por módulo quando tocar no arquivo.
- Suites Vitest com mock frágil de `expo-modules-core` (`auth-flow`, `resend-email`) — corrigir mocks ou isolar.
- Deduplicar evidências antigas em `docs/evidencias/` (manter `*-latest.json` + pastas de smoke atuais).
- Fechar branches remotas órfãs já mergeadas quando não houver PR aberto.

### P4 — Produto (backlog consciente, fora do ciclo atual)

Itens que já apareciam como “próximos” em releases — **uma lista**, sem duplicar planos:

1. Offline fino / a11y premium residual em Cultivos (se ainda houver gaps reais na UI).
2. Produtividade amarrada a eventos de colheita/tarefa (além de `producaoReal`).
3. Upload de arquivo privado em anexos de Eventos (hoje: link URL).
4. Assistente Eventos com LLM opcional (hoje: regras + clima).

---

## PRs (estado após limpeza 2026-07-31)

| PR | Tema | Estado |
|----|------|--------|
| #19 | Guards archive/safra | **Aberto (draft)** → rebase + merge (P0) |
| #24 | VPS + smoke PDF | **Aberto (draft)** → decidir escopo (P1) |
| #18 | Docs status | **Fechado** (obsoleto / atrás de main) |
| #26 | Skill deploy-to-vercel | **Mergeado** |
| #25 | Centro de Eventos | **Mergeado** |

---

## Como trabalhar daqui

1. Sempre partir de `main` atualizado (`git pull --ff-only`).
2. Uma frente por vez, preferir reabrir/atualizar PRs #19 ou #24 a criar novo plano.
3. Ao concluir item desta lista, marcar aqui e só então abrir a próxima linha.