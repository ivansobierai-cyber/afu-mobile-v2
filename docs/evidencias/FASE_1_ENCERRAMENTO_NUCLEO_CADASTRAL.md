# FASE 1 — Núcleo cadastral — Evidência de encerramento

| Campo | Valor |
|-------|--------|
| **Status** | **CONCLUÍDA** |
| **Base** | `e63614eff509024874098ea121193f25e3151b0d` (`origin/main`) |
| **CI** | [31067233542](https://github.com/ivansobierai-cyber/afu-mobile-v2/actions/runs/31067233542) — **SUCCESS** |
| **Data** | 2026-08-06 |

---

## Escopo

Encerramento **documental** da **FASE 1 — Núcleo cadastral** (MAPA §5), com base nas evidências já aprovadas:

- Aceite técnico (CI autoritativo em MySQL efêmero do workflow).
- Homologação UI **FASE 1A** (APROVADA).
- Gate final de evidências **FASE 1B** (FASE 1 PRONTA PARA ENCERRAMENTO FORMAL).

Nenhum código de produto, schema ou banco foi alterado neste encerramento.

---

## Critérios canônicos (MAPA §5)

| # | Critério | Resultado |
|---|----------|-----------|
| 1 | Fluxo API+UI de cadastro completo no aceite | **PASS** |
| 2 | Isolamento cross-tenant | **PASS** |
| 3 | Cultivos com safra/talhão no ambiente de teste | **PASS** |

### Objetivo comprovado

```
Organização → Propriedade → Talhão → Safra → Cultivo
```

| Aspecto | Resultado |
|---------|-----------|
| IDs / encadeamento cadastral | **PASS** |
| Escopo tenant | **PASS** |

---

## Evidência técnica (CI)

| Campo | Valor |
|-------|--------|
| Workflow | `.github/workflows/ci.yml` — job `validate` |
| Run | **31067233542** |
| `headSha` | `e63614eff509024874098ea121193f25e3151b0d` |
| Conclusão | **SUCCESS** |

**Steps relevantes (todos SUCCESS no run):**

- `npm run check` (typecheck)
- `npm run db:schema:prepare`
- `npm run db:schema:verify`
- `npm run build:web:preview` + `prepare:web-dist`
- `npm run test:ci` (integração com `DATABASE_URL` no job)
- `AFU_RUN_DB_TESTS=1 npm run test:propriedades:etapa2`

**Referências de teste (não exaustivo):** `tests/cross-tenant-attack.test.ts`, `tests/safras-entity.test.ts`, `tests/tenant-db.isolation.test.ts`, `tests/propriedades-etapa2-aceitacao.test.ts`, `tests/helpers/tenant-fixture.ts`.

---

## Evidência UI (FASE 1A)

Homologação manual/funcional no ambiente abaixo (usuário demo autorizado; credenciais não registradas neste documento).

| Etapa | Resultado |
|-------|-----------|
| Autenticação | **PASS** |
| Organização | **PASS** |
| Propriedade | **PASS** |
| Talhão | **PASS** |
| Safra | **PASS** |
| Cultivo | **PASS** |
| Persistência após reload | **PASS** |
| Cadeia completa | **PASS** |

| Item | Valor |
|------|--------|
| Web | https://afu-mobile-web.vercel.app |
| API | https://afu-mobile-v2-production.up.railway.app |

**Artefatos de sessão:** screenshots em ambiente local do agente (`page-2026-08-06T03-*.png` sob diretório temporário Cursor); não versionados no repositório.

**Segurança UI:** smoke visual multi-org **não** executado (demo com uma organização). Isolamento cross-tenant server-side coberto pela evidência CI acima.

---

## Proveniência do deploy homologado

O artefato web exercitado na FASE 1A está associado ao **mesmo SHA** da base de encerramento:

| Campo | Valor |
|-------|--------|
| GitHub Deployment | **Production – afu-mobile-web** |
| SHA | `e63614eff509024874098ea121193f25e3151b0d` |
| `created_at` | **2026-08-06T03:07:59Z** |

---

## Órfãos — ressalva explícita

A expressão **“sem órfãos relevantes”** integra o **objetivo geral** da FASE 1 no MAPA §5, porém **não** consta dos **três critérios explícitos** de conclusão da mesma fase.

- **Não** foi realizado inventário operacional dedicado na FASE 1A/1B.
- **Classificação:** **PASS PARCIAL** / dívida operacional **P1**.
- **Follow-up:** executar inventário **read-only** de órfãos em ambiente seguro e schema alinhado.

Esta dívida **não** reabre a FASE 1 e **não** deve ser tratada como PASS pleno do subitem de órfãos.

---

## Dívidas não bloqueantes

### P1

- Inventário operacional de órfãos (ver seção anterior).

### UX / A11Y

- Botão **+** de nova propriedade pouco evidente no header da listagem.
- Acessibilidade fraca do controle (refs genéricos em automação).
- Comportamento do campo de nome do cultivo ao combinar chip de cultura e texto livre.

### Higiene de ambiente

- Registros **Smoke Prod** no tenant demo (dados de smoke históricos).

### Cobertura opcional (não exigida pelo MAPA §5 para encerramento)

- Criação visual de **nova safra** na UI (safra ativa/seleção foi homologada).
- Smoke visual **multi-org** quando houver segunda organização acessível ao mesmo usuário de teste.

### Ambiente local

- MySQL local antigo/desalinhado permanece **fora** da evidência autoritativa da FASE 1.
- **Não** executar `db:schema:prepare` nesse banco até confirmar que pode ser descartado/recriado.

---

## Conclusão

**FASE 1 — Núcleo cadastral — CONCLUÍDA** (encerramento formal documental 2026-08-06).

**Próximo gate canônico (quando autorizado):** **FASE 2** — modelo operacional (MAPA §5). Não iniciar FASE 2 neste pacote documental.
