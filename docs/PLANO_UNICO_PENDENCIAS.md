# Plano único — pendências AFU Mobile

**Atualizado:** 2026-07-31  
**Base:** `main` @ `4a9b609` (PR #24 VPS + smoke PDF mergeado)  
**Uso:** fonte única do que ainda falta. Docs de etapa/release antigos são histórico; não abrir frentes paralelas sem atualizar este arquivo.

---

## Já encerrado (não reabrir)

| Item | Evidência |
|------|-----------|
| Plano Mestre Propriedades 1–10 + dívidas P3 | `docs/PROPRIEDADES_PROGRESSO.md` |
| Plano auxiliar estoque/custos/financeiro + Cultivos V2 + PDF resultado | `docs/RELEASE_PLANO_AUXILIAR_2026-07-23.md`, `docs/ETAPA_CULTIVOS_V2.md` |
| Segurança multitenant etapas 1–10 (base) | `docs/SEGURANCA_CONCLUSAO_GLOBAL.md` |
| Centro de Eventos Etapas 1–10 | PR [#25](https://github.com/ivansobierai-cyber/afu-mobile-v2/pull/25) |
| Guards prop arquivada / safra histórica | PR [#19](https://github.com/ivansobierai-cyber/afu-mobile-v2/pull/19) |
| Inventário VPS Oracle + smoke PDF `resultado_cultivo` | PR [#24](https://github.com/ivansobierai-cyber/afu-mobile-v2/pull/24); `docs/VPS_ORACLE.md`; evidência **AVANÇAR** |

Docs históricos (`todo.md`, `REVISAO_ETAPAS.md`, vários `SEGURANCA_ETAPA*`, smokes datados em `docs/evidencias/`) **não** são backlog ativo.

---

## Pendências ativas (ordem sugerida)

### P2 — Homologação pós-merge Eventos (prod)

- Confirmar migrações `0033`–`0036` aplicadas no boot Railway (`db:eventos-*:apply` no `start-api-production.sh`).
- Smoke: `npm run smoke:eventos` contra API prod + UI web (tags/checklist/comentário/anexo).
- Decisão de produto VPS: **não** hospedar AFU na Oracle por enquanto (disco apertado; Ollama/n8n já ocupam) — manter Railway/Vercel.

### P3 — Qualidade / higiene (não bloqueante)

- Lint legado (~100 problemas) — limpar por módulo ao tocar no arquivo.
- Suites Vitest com mock frágil de `expo-modules-core` (`auth-flow`, `resend-email`).
- Deduplicar evidências antigas em `docs/evidencias/` (manter `*-latest.json` + pastas atuais).
- Remover branches remotas órfãs já mergeadas sem PR aberto.

### P4 — Produto (backlog consciente)

1. Offline fino / a11y premium residual em Cultivos (se ainda houver gaps reais).
2. Produtividade amarrada a eventos de colheita/tarefa (além de `producaoReal`).
3. Upload de arquivo privado em anexos de Eventos (hoje: link URL).
4. Assistente Eventos com LLM opcional (hoje: regras + clima).
5. Se um dia deployar AFU na VPS: expandir boot volume OCI ou Docker em `/var/oled` (ver `docs/VPS_ORACLE.md`).

---

## PRs

| PR | Tema | Estado |
|----|------|--------|
| #24 | VPS + smoke PDF | **Mergeado** |
| #19 | Guards archive/safra | **Mergeado** |
| #18 | Docs status | **Fechado** |
| #26 | Skill deploy-to-vercel | **Mergeado** |
| #25 | Centro de Eventos | **Mergeado** |

Nenhum PR aberto após esta limpeza.

---

## Como trabalhar daqui

1. Sempre partir de `main` atualizado (`git pull --ff-only`).
2. Próxima frente recomendada: **P2** smoke Eventos em produção.
3. Ao concluir item desta lista, marcar aqui e só então abrir a próxima linha.
