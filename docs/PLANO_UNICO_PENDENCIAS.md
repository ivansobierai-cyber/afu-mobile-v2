# Plano único — pendências AFU Mobile

**Atualizado:** 2026-11-15  
**Base:** `main` — site canônico `https://afuagro.tech`, API `https://api.afuagro.tech` (rewrite Vercel → Railway)  
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
| Storage R2/S3 + health/probe (sem Manus) | PR [#31](https://github.com/ivansobierai-cyber/afu-mobile-v2/pull/31), `docs/RAILWAY_STORAGE_EVENTOS.md`, `npm run probe:storage` |
| R2 produção + smoke anexos (upload/download) | `railway-storage-probe-latest.json`, `smoke-eventos-anexos-latest.json` (**AVANCAR**, 2026-08-02) |
| Site canônico afuagro.tech | `docs/evidencias/smoke-mvp-site-afuagro-latest.json` — login, painel, CRUD, laudos, logout. `www` e `app` redirecionam para o apex. |
| Login sem demo na web | PR [#47](https://github.com/ivansobierai-cyber/afu-mobile-v2/pull/47) — botões demo removidos; `EXPO_PUBLIC_SHOW_DEMO_LOGIN=0` no build. |
| Diagnóstico IA (Alibaba MaaS) | PRs [#50](https://github.com/ivansobierai-cyber/afu-mobile-v2/pull/50)/[#51](https://github.com/ivansobierai-cyber/afu-mobile-v2/pull/51) — `/compatible-mode` + `BUILT_IN_FORGE_MODEL=qwen3-vl-plus`; `diagnostico.analisar` HTTP 200 em produção. |

---

## Pendências ativas

### P3 — Qualidade / higiene (não bloqueante)

- Lint legado (~100 problemas) — limpar por módulo ao tocar no arquivo.
- ~~Smoke API anexos Eventos~~ — `npm run smoke:eventos-anexos` em produção (**AVANCAR**, 2026-11-12) → `docs/evidencias/smoke-eventos-anexos-latest.json`.
- Smoke UI anexos Eventos (web) — checklist `docs/evidencias/SMOKE_EVENTOS_ANEXOS_UI.md` (API **AVANCAR**; UI bloqueada no web porque filtros+IA comiam a altura da Agenda — fix de layout em andamento).

### P4 — Produto (backlog consciente)

- ~~Cultivos offline/a11y lista + detalhe~~ — `app/(tabs)/cultivos.tsx`, `app/cultivos/[id].tsx`.
- ~~Assistente Eventos LLM opcional~~ — `sugestoesIA` + Forge.
- ~~Diagnóstico IA no site~~ — Forge/MaaS configurado; laudo fecha em `afuagro.tech` / `api.afuagro.tech`.
- Fora do MVP do site, de propósito: Play Store, PIX real, piloto com produtores (etapa 29).

---

## PRs

#44–#51 mergeados (site, login sem demo, smoke, Forge URL/model MaaS). Nenhum PR aberto nesta frente.

---

## Próximo passo sugerido

1. Merge do layout web do Centro de Eventos (Agenda/Kanban visíveis) e repetir checklist UI anexos.
2. Lint por módulo ao editar arquivos.
3. ~~Rotacionar `JWT_SECRET` placeholder no Railway~~ — feito 2026-11-15.
