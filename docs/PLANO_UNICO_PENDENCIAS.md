# Plano único — pendências AFU Mobile

**Atualizado:** 2026-08-01  
**Base:** `main` — Railway/Vercel  
**Uso:** fonte única do que ainda falta. Docs de etapa/release antigos são histórico.

---

## Já encerrado (não reabrir)

| Item | Evidência |
|------|-----------|
| Plano Mestre Propriedades 1–10 + dívidas P3 | `docs/PROPRIEDADES_PROGRESSO.md` |
| Plano auxiliar + Cultivos V2 + PDF resultado | `docs/RELEASE_PLANO_AUXILIAR_2026-07-23.md`, `docs/ETAPA_CULTIVOS_V2.md` |
| Segurança multitenant base | `docs/SEGURANCA_CONCLUSAO_GLOBAL.md` |
| Centro de Eventos Etapas 1–10 | PR [#25](https://github.com/ivansobierai-cyber/afu-mobile-v2/pull/25) |
| Guards prop arquivada / safra histórica | PR [#19](https://github.com/ivansobierai-cyber/afu-mobile-v2/pull/19) |
| Smoke PDF resultado cultivo (Railway) | PR [#24](https://github.com/ivansobierai-cyber/afu-mobile-v2/pull/24), `npm run smoke:resultado-cultivo` |
| Homologação Eventos em produção (API) | `docs/evidencias/smoke-eventos-centro-latest.json` (**AVANÇAR**, Railway) |
| Anexos Eventos — upload arquivo privado | PR [#27](https://github.com/ivansobierai-cyber/afu-mobile-v2/pull/27) |
| Produtividade ↔ colheita (evento + tarefa) | `lib/eventos/produtividade-colheita.ts`, sync em `calendario.update` / `tarefas.transition` |
| P3 parcial — Vitest auth/resend + dedupe evidências | `vitest.setup.ts`, `lib/_core/auth.ts`, só `*-latest.json` em `docs/evidencias/` |
| Cultivos — banner offline/sync + a11y lista | `app/(tabs)/cultivos.tsx` |
| Node 24 (CI, Docker, `.nvmrc`) | PR [#28](https://github.com/ivansobierai-cyber/afu-mobile-v2/pull/28) |
| Assistente Eventos LLM + banner cultivos detalhe | PR [#29](https://github.com/ivansobierai-cyber/afu-mobile-v2/pull/29) |
| Smoke API anexos Eventos | `npm run smoke:eventos-anexos`, `docs/evidencias/smoke-eventos-anexos-latest.json` |

---

## Pendências ativas

### P3 — Qualidade / higiene (não bloqueante)

- Lint legado (~100 problemas) — limpar por módulo ao tocar no arquivo.
- Smoke UI anexos Eventos (web) — checklist `docs/evidencias/SMOKE_EVENTOS_ANEXOS_UI.md` após deploy.

### P4 — Produto (backlog consciente)

- ~~Cultivos offline/a11y lista + detalhe~~ — `app/(tabs)/cultivos.tsx`, `app/cultivos/[id].tsx`.
- ~~Assistente Eventos LLM opcional~~ — `sugestoesIA` + Forge.

---

## PRs

Nenhum PR aberto. #29 mergeado; histórico #18–#28.

---

## Próximo passo sugerido

Lint por módulo ao editar; checklist manual de anexos no web quando houver release visível.
