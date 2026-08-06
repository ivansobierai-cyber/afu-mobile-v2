# MAPA MESTRE ATUAL DO AFU

**Status:** documento oficial de evolução (**aprovado** 2026-08-05)  
**Regularização documental:** 2026-08-05 (autoridade FASE 0); **encerramento formal FASE 0:** 2026-08-06 (somente docs); **encerramento formal FASE 1:** 2026-08-06 (somente docs)
**Fonte da verdade:** código + auditoria de rumo 2026-08-05 + homologação SUBFASE 0A + evidência SUBFASE 0B
**Substitui, como ordem de execução:** planos auxiliares “Etapa N”, correções numeradas avulsas e checklists paralelos.  
**Planos antigos** (`docs/PLANO_UNICO_PENDENCIAS.md`, `docs/PROPRIEDADES_*`, `docs/ETAPA_*`, `SUPERVISOR.md` Etapas 1–10, etc.) permanecem como **histórico / evidência**, não como sequência a seguir.

> Evolução do produto: somente **FASE 0 … FASE 8**.  
> Operação do agente: prepend de [`SUPERVISOR.md`](SUPERVISOR.md) + este mapa.

**Veredito consolidado:** **ALINHADO COM CORREÇÕES — objetivo preservado, execução fragmentada.**

---

## 1. Objetivo oficial do AFU

O **AFU — Analisador Fitotécnico Universal** é um sistema integrado de **análise, diagnóstico, gestão e tomada de decisão agronômica**.

Cada capacidade transversal serve a espinha dorsal abaixo, com multi-tenant por organização, RBAC server-side, rastreabilidade e escopo por propriedade e, quando aplicável, por safra.

---

## 2. Estado atual auditado

| Item | Valor |
|------|--------|
| `origin/main` (remoto) | `e63614eff509024874098ea121193f25e3151b0d` (encerramento formal FASE 0 / PR #35) |
| Commit canônico Correção 1 / homologação 0A | `3aac437c03bf3eaf0636d8b415018fff074d9cee` (integrado via PR #32) |
| Equivalência histórica `8d4ff2c` ↔ `3aac437` | Mesmo conteúdo (`git diff` sem diferenças); **não** são duas correções distintas |
| PR #32 (Correção 1 / schema prepare) | **MERGED** — merge `67f93084bca30d687e91dd46a8e8065efa2c1fae` |
| PR #33 (autoridade FASE 0) | **MERGED** — merge `a8d55273d5046c833987ec0fc64d6510fdee19ac` |
| PR #34 (SUBFASE 0B) | **MERGED** — merge `37a74ff6d59fb4dc64b08caffbda9878d040886c`; commit funcional `7ecd4b3` |
| SUBFASE 0A | **Concluída / homologada** — [`docs/evidencias/FASE_0_SUBFASE_0A_HOMOLOGACAO_MYSQL.md`](docs/evidencias/FASE_0_SUBFASE_0A_HOMOLOGACAO_MYSQL.md) |
| SUBFASE 0B | **Concluída / verificada** — [`docs/evidencias/FASE_0_SUBFASE_0B_DIAGNOSTICS_WRITE.md`](docs/evidencias/FASE_0_SUBFASE_0B_DIAGNOSTICS_WRITE.md) |
| **FASE 0** | **CONCLUÍDA** (critérios §5 satisfeitos; zero P0 aberto em §7) |
| **FASE 1** | **CONCLUÍDA** (critérios §5 satisfeitos; homologação UI 1A + gate 1B) — [`docs/evidencias/FASE_1_ENCERRAMENTO_NUCLEO_CADASTRAL.md`](docs/evidencias/FASE_1_ENCERRAMENTO_NUCLEO_CADASTRAL.md) |
| CI encerramento FASE 1 | GitHub Actions run [31067233542](https://github.com/ivansobierai-cyber/afu-mobile-v2/actions/runs/31067233542) — job `validate`, `headSha` `e63614e`, **SUCCESS** |
| Deploy homologado FASE 1A | GitHub Deployment **Production – afu-mobile-web** @ `e63614e` (`2026-08-06T03:07:59Z`) |
| CI pós-merge #34 | GitHub Actions run [31065903370](https://github.com/ivansobierai-cyber/afu-mobile-v2/actions/runs/31065903370) — job `validate`, `headSha` `37a74ff`, **SUCCESS** |
| Veredito consolidado | **ALINHADO COM CORREÇÕES — FASE 1 encerrada; próximo gate canônico: FASE 2** |

**Regra de leitura:** existência de arquivo/tabela/endpoint ≠ funcionalidade concluída.

---

## 3. Espinha dorsal funcional

```
Organização
  → Propriedade
    → Talhão
      → Safra
        → Cultivo
          → Ocorrência
            → Diagnóstico
              → Recomendação
                → Tarefa
                  → Operação
                    → Consumo
                      → Estoque
                    → Máquina / Equipe
                      → Custo
                        → Resultado
                          → Histórico / KPIs
```

Capacidades transversais (multi-tenant, RBAC, mapas, clima, alertas, anexos, offline/sync, relatórios, IA) servem esta espinha — não a substituem.

---

## 4. Validação da sequência FASE 0–8

A ordem **FASE 0→8** foi validada contra dependências reais do código auditado. **Não inverter fases inteiras.**

| Decisão | Motivo resumido |
|---------|------------------|
| FASE 2 antes da FASE 4 | Calendário × tarefas — um fluxo canônico antes do “coração” |
| FASE 3 antes da FASE 4 (qualidade) | Geometria/área confiável antes de operar diagnóstico em campo |
| FASE 1 vs FASE 3 | FASE 1 fecha talhão como entidade; FASE 3 eleva geometria |
| FASE 5 após FASE 4 | Consumo/custo amarram-se a tarefa/transition |
| FASE 6 após 2–5 | Offline/sync sem modelo estável aumenta conflito |
| FASE 7 por último no núcleo | KPIs exigem dados das fases anteriores |
| FASE 0 sem P0 aberto | **Atendido** — 0A homologada; 0B verificada; Correção 1 em `main` (PR #32) |

---

## 5. Fases 0–8

### FASE 0 — Integridade e bloqueadores

**Status:** **CONCLUÍDA** (encerramento formal documental 2026-08-06).

**Objetivo:** instalação/schema, multi-tenant e RBAC sem P0 aberto antes de evoluir produto — **atingido**.

#### Subfases

| Subfase | Descrição | Status |
|---------|-----------|--------|
| **0A** | Homologação MySQL Correção 1 (`db:schema:prepare`, `db:schema:verify`) — PR #32 / `3aac437` | **Concluída / homologada** — `docs/evidencias/FASE_0_SUBFASE_0A_HOMOLOGACAO_MYSQL.md` |
| **0B** | Enforcement RBAC `diagnostics.write` em mutations de diagnóstico | **Concluída / verificada** — PR #34 / `7ecd4b3`; `docs/evidencias/FASE_0_SUBFASE_0B_DIAGNOSTICS_WRITE.md` |
| **Merge PR #32** | Integrar Correção 1 em `main` | **Concluído** — merge `67f9308` |

**Entregue:** multi-tenant/RBAC base; guards safra/arquivo; `db:schema:prepare` / `verify` em `main`; CI/boot alinhados na Correção 1; matriz `lib/security/org-roles.ts`; `diagnostics.write` nas mutations `diagnostico.salvar` e `diagnostico.analisar`.

**Critério de conclusão FASE 0 (§5):** 0A homologada ✓; 0B implementada e verificada ✓; PR #32 integrada em `main` ✓; zero P0 aberto em §7 ✓.

**Arquivos-chave:** `scripts/lib/schema-prepare-core.ts`, `docs/DB_SCHEMA_PREPARE.md`, `server/routers.ts` (diagnóstico), `lib/security/org-roles.ts`, `.github/workflows/ci.yml`, `scripts/start-api-production.sh`, `tests/diagnostics-rbac.test.ts`.

---

### FASE 1 — Núcleo cadastral

**Status:** **CONCLUÍDA** (encerramento formal documental 2026-08-06).

**Objetivo:** Organização → Propriedade → Talhão → Safra → Cultivo com IDs, escopo tenant e sem órfãos relevantes.

**Dependência:** FASE 0 concluída.

**Critério de conclusão:** fluxo API+UI de cadastro completo no aceite; isolamento cross-tenant; cultivos com safra/talhão no ambiente de teste — **atingido** (CI 31067233542; homologação UI FASE 1A).

**Evidência:** [`docs/evidencias/FASE_1_ENCERRAMENTO_NUCLEO_CADASTRAL.md`](docs/evidencias/FASE_1_ENCERRAMENTO_NUCLEO_CADASTRAL.md). **Ressalva:** inventário operacional de órfãos — PASS PARCIAL / P1 (não reabre a fase).

---

### FASE 2 — Modelo operacional

**Objetivo:** relação canônica evento / calendário / tarefa / operação / apontamento (um significado para “operação agrícola”).

**Dependência:** FASE 1.

---

### FASE 3 — Geoespacial mínimo confiável

**Objetivo:** propriedade → geometria → talhão → polígono → área → uso por safra/cultivo (satélite avançado **fora**).

**Dependência:** FASE 1.

---

### FASE 4 — Coração do AFU

**Objetivo:** Ocorrência → Diagnóstico → Recomendação → Tarefa → Acompanhamento → Resultado (fluxo único).

**Dependências:** FASE 0–2; FASE 3 recomendada para campo real.

---

### FASE 5 — Gestão econômica

**Objetivo:** Tarefa/Operação → Consumo → Estoque → Máquina/Equipe → Custos/Financeiro.

**Dependências:** FASE 2 e FASE 4.

---

### FASE 6 — Operação de campo

**Objetivo:** Hoje na fazenda, alertas acionáveis, offline/sync para uso real.

**Dependências:** FASE 2–5.

---

### FASE 7 — Métricas e inteligência

**Objetivo:** KPIs, histórico, produtividade, custos, IA **sobre dados confiáveis**.

**Dependências:** FASE 1–6.

---

### FASE 8 — Expansões

**Objetivo:** satélite avançado, banco agronômico, capacitação, marketplace, etc., **após** o núcleo.

**Dependências:** FASE 0–7 estáveis no que for P0/P1 do núcleo.

---

## 6. Módulos fora da ordem (reaproveitáveis)

Estoque, máquinas, financeiro, Centro de Eventos/anexos R2, alertas, offline parcial, banco agronômico 30–46, marketplace, telas `app/mais/*` — **reaproveitar e adaptar**, não apagar por antecipação. Detalhe histórico na auditoria de rumo 2026-08-05.

---

## 7. Dívidas P0 / P1 / P2 / P3

### P0 (FASE 0 — todos resolvidos)

- ~~Homologação MySQL Correção 1 (0A)~~ → **fechada** — evidência `docs/evidencias/FASE_0_SUBFASE_0A_HOMOLOGACAO_MYSQL.md`; conteúdo em `main` via PR #32 (`67f9308`).
- ~~`diagnostics.write` sem enforcement nas mutations de diagnóstico (0B)~~ → **fechada** — `requireOrgPermission(tenant, "diagnostics.write")` em `diagnostico.salvar` e `diagnostico.analisar`; PR #34 (`7ecd4b3` / merge `37a74ff`); evidência `docs/evidencias/FASE_0_SUBFASE_0B_DIAGNOSTICS_WRITE.md`.
- ~~Risco de schema/boot legado em `main` sem Correção 1~~ → **fechada** — Correção 1 mergeada (PR #32); CI `validate` em push `37a74ff` (run 31065903370) **SUCCESS**.

**P0 aberto da FASE 0:** nenhum.

### P1 (resumo)

- Recomendação → Tarefa como fluxo; consumo → custo automático; diagnóstico sem `safraId`/mock UI; dualidade calendário × tarefa.

### P2 / P3

- Conforme auditoria de rumo (apontamentos sem `organizationId`, KPIs só por org, lint legado, `app/mais/*` documental).

---

## 8. Correção 1 / PR #32 (registro pós-merge)

| Item | Estado |
|------|--------|
| PR | [#32](https://github.com/ivansobierai-cyber/afu-mobile-v2/pull/32) — **MERGED** |
| Merge commit | `67f93084bca30d687e91dd46a8e8065efa2c1fae` |
| SHA canônico (conteúdo) | `3aac437` |
| Conteúdo | `db:schema:prepare` / `verify`, supplementals 0020/0021…, CI + boot, `docs/DB_SCHEMA_PREPARE.md` |
| Em `origin/main`? | **Sim** (ancestral de `37a74ff`) |
| Homologação MySQL (0A) | **Concluída** — `docs/evidencias/FASE_0_SUBFASE_0A_HOMOLOGACAO_MYSQL.md` |

---

## 9. Fluxo ponta a ponta — onde quebra (resumo)

Cadastro Organização→Cultivo **funciona** em grande parte. Quebra principal após diagnóstico: recomendação não operacional → tarefa; consumo não gera custo automático; elos fracos ocorrência↔diagnóstico. Ver auditoria de rumo para tabela completa.

---

## 10. Ordem definitiva

```
FASE 0  Integridade e bloqueadores
FASE 1  Núcleo cadastral
FASE 2  Modelo operacional
FASE 3  Geoespacial mínimo confiável
FASE 4  Coração do AFU
FASE 5  Gestão econômica
FASE 6  Operação de campo
FASE 7  Métricas e inteligência
FASE 8  Expansões
```

**Não** usar Etapas 1–10 do `SUPERVISOR.md` como ordem vigente de evolução do AFU.

---

## 11. Próximos 5 passos concretos

1. ~~Aprovar mapa~~ — **feito**.
2. ~~SUBFASE 0A homologação MySQL~~ — **feita** (aceite formal).
3. ~~SUBFASE 0B — RBAC `diagnostics.write`~~ — **feita** (PR #34).
4. ~~Merge PR #32 (Correção 1) em `main`~~ — **feito** (`67f9308`).
5. ~~FASE 1 — núcleo cadastral~~ — **concluída** (encerramento formal 2026-08-06; evidência `docs/evidencias/FASE_1_ENCERRAMENTO_NUCLEO_CADASTRAL.md`).

**Próximo gate canônico (quando autorizado):** **FASE 2** — modelo operacional (ver §5 FASE 2). **Não** abrir FASE 4 antes.

---

## 12. Próxima ação quando autorizada

**FASE 2 — Modelo operacional** conforme critérios em §5.
**Não** repetir homologação MySQL da 0A sem nova ordem. FASE 0 e FASE 1 estão **concluídas**; P0 da FASE 0 em §7 está **fechado**.

---

## Histórico de documentos

| Documento | Papel |
|-----------|--------|
| `SUPERVISOR.md` (corpo Etapas 1–10) | Histórico do painel de propriedades + protocolo de tarefa |
| `docs/PLANO_UNICO_PENDENCIAS.md` | Backlog tático legado |
| Auditoria de rumo 2026-08-05 | Evidência que originou este mapa |

**Fim do MAPA MESTRE ATUAL.**
