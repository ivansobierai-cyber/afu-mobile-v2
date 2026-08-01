# Plano único — pendências AFU Mobile

**Atualizado:** 2026-07-31 (noite)  
**Base:** `main` @ `f2970e0` (pós-PR #27 — anexos privados Eventos)  
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
| Inventário VPS Oracle + smoke PDF cultivo | PR [#24](https://github.com/ivansobierai-cyber/afu-mobile-v2/pull/24) |
| Homologação Eventos em produção (API) | `docs/evidencias/smoke-eventos-centro-latest.json` (**AVANÇAR**, Railway) |
| Anexos Eventos — upload arquivo privado | PR [#27](https://github.com/ivansobierai-cyber/afu-mobile-v2/pull/27), `lib/eventos/anexo-upload.ts` |

Decisão VPS: **não** hospedar AFU na Oracle por agora (disco apertado; Ollama/n8n) — Railway/Vercel.

---

## Pendências ativas

### P3 — Qualidade / higiene (não bloqueante)

- Lint legado (~100 problemas) — limpar por módulo ao tocar no arquivo.
- Suites Vitest com mock frágil de `expo-modules-core` (`auth-flow`, `resend-email`).
- Deduplicar evidências antigas em `docs/evidencias/` (manter `*-latest.json` + pastas atuais).
- Smoke UI Eventos no web (tags/checklist/comentário/anexo arquivo) — API em prod; validar upload/download manual após deploy Railway/Vercel.

### P4 — Produto (backlog consciente)

1. Offline fino / a11y premium residual em Cultivos.
2. Produtividade amarrada a eventos de colheita/tarefa (além de `producaoReal`).
3. Assistente Eventos com LLM opcional (hoje: regras + clima).
4. Deploy AFU na VPS só após expandir disco OCI (ver `docs/VPS_ORACLE.md`).

---

## PRs

Nenhum PR aberto. #18 fechado; #19/#24/#25/#26/#27 mergeados.

**CI:** GitHub `validate` verde no merge #27. Previews Vercel na branch podem falhar por colaboração/conta (não bloqueia `main`).

---

## Próximo passo sugerido

Escolher uma linha de **P4** (produto) ou higiene **P3**. Preferência sugerida: produtividade ↔ colheita/tarefa **ou** mocks Vitest frágeis.
