# MAPA MESTRE ATUAL DO AFU

**Status:** documento oficial de evolução (**aprovado** 2026-08-05)  
**Regularização documental:** 2026-08-05 (sem alteração de código de produto)  
**Fonte da verdade:** código + auditoria de rumo 2026-08-05 + homologação SUBFASE 0A  
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
| Branch local | `main` @ `8d4ff2c82bc0a3408addb5bcce8fab4672ea61e7` |
| Commit canônico Correção 1 / homologação / PR #32 | `3aac437c03bf3eaf0636d8b415018fff074d9cee` |
| Equivalência `8d4ff2c` ↔ `3aac437` | Mesmo conteúdo (`git diff` sem diferenças); **não** são duas correções distintas |
| `origin/main` (remoto) | `4ef523a` — Correção 1 **ainda não** mergeada |
| PR Correção 1 | [#32](https://github.com/ivansobierai-cyber/afu-mobile-v2/pull/32) — **draft**, **merge não autorizado** |
| Branch da PR | `cursor/db-schema-prepare-aa74` |
| SUBFASE 0A | **Homologada** — ver [`docs/evidencias/FASE_0_SUBFASE_0A_HOMOLOGACAO_MYSQL.md`](docs/evidencias/FASE_0_SUBFASE_0A_HOMOLOGACAO_MYSQL.md) |
| SUBFASE 0B | **Pendente, não iniciada** — RBAC `diagnostics.write` |
| Veredito consolidado | **ALINHADO COM CORREÇÕES — objetivo preservado, execução fragmentada** |

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
| FASE 0 sem P0 aberto | Schema prepare homologado (0A); `diagnostics.write` ainda aberto (0B) |

---

## 5. Fases 0–8

### FASE 0 — Integridade e bloqueadores

**Objetivo:** instalação/schema, multi-tenant e RBAC sem P0 aberto antes de evoluir produto.

#### Subfases

| Subfase | Descrição | Status |
|---------|-----------|--------|
| **0A** | Homologação MySQL Correção 1 (`db:schema:prepare`, `db:schema:verify`) — PR #32 / `3aac437` | **Homologada** (evidência durável em `docs/evidencias/FASE_0_SUBFASE_0A_HOMOLOGACAO_MYSQL.md`) |
| **0B** | Enforcement RBAC `diagnostics.write` em mutations de diagnóstico | **Pendente — não iniciada** |
| **Merge PR #32** | Integrar Correção 1 em `main` | **Não autorizado** até P0 da FASE 0 fechado (incl. 0B) |

**O que já existe:** multi-tenant/RBAC base; guards safra/arquivo; `db:schema:prepare` / `verify`; CI/boot alinhados na Correção 1; matriz `lib/security/org-roles.ts`.

**O que falta:** SUBFASE 0B; merge #32 somente após critérios; reconciliação git local `8d4ff2c` vs remoto (fora do escopo da homologação).

**Critério de conclusão FASE 0:** 0A homologada ✓; 0B implementada e verificada; PR #32 mergeável **com autorização**; zero P0 em §7.

**Arquivos-chave:** `scripts/lib/schema-prepare-core.ts`, `docs/DB_SCHEMA_PREPARE.md`, `server/routers.ts` (diagnóstico), `lib/security/org-roles.ts`, `.github/workflows/ci.yml`, `scripts/start-api-production.sh`.

---

### FASE 1 — Núcleo cadastral

**Objetivo:** Organização → Propriedade → Talhão → Safra → Cultivo com IDs, escopo tenant e sem órfãos relevantes.

**Dependência:** FASE 0 concluída.

**Critério de conclusão:** fluxo API+UI de cadastro completo no aceite; isolamento cross-tenant; cultivos com safra/talhão no ambiente de teste.

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

### P0

- ~~Homologação MySQL Correção 1 (0A)~~ → **fechada** (homologada).
- **`diagnostics.write`** declarado na matriz RBAC **sem** enforcement nas mutations de diagnóstico → **aberto** (0B).
- Em `origin/main` (pré-merge #32): risco de schema/boot legado — **mitigado na Correção 1**, merge **ainda não autorizado**.

### P1 (resumo)

- Recomendação → Tarefa como fluxo; consumo → custo automático; diagnóstico sem `safraId`/mock UI; dualidade calendário × tarefa.

### P2 / P3

- Conforme auditoria de rumo (apontamentos sem `organizationId`, KPIs só por org, lint legado, `app/mais/*` documental).

---

## 8. Estado da PR #32 / Correção 1

| Item | Estado |
|------|--------|
| PR | [#32](https://github.com/ivansobierai-cyber/afu-mobile-v2/pull/32) — **draft**, **OPEN** |
| SHA canônico | `3aac437` |
| Conteúdo | `db:schema:prepare` / `verify`, supplementals 0020/0021…, CI + boot, `docs/DB_SCHEMA_PREPARE.md` |
| Em `origin/main`? | **Não** |
| Homologação MySQL (0A) | **Concluída** — evidência durável em `docs/evidencias/FASE_0_SUBFASE_0A_HOMOLOGACAO_MYSQL.md` |
| **Merge** | **Não autorizado** neste estágio |

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
3. **Autorizar e executar SUBFASE 0B** — RBAC `diagnostics.write`.
4. **Somente então** avaliar merge da PR #32 em `main` (**com autorização explícita**).
5. Iniciar **FASE 1** com aceite Organização→…→Cultivo (sem abrir FASE 4 antes).

---

## 12. Próxima ação quando autorizada

**SUBFASE 0B — RBAC `diagnostics.write`** nas mutations de diagnóstico (server-side).  
**Não** repetir homologação MySQL. **Não** merge PR #32 sem autorização. **Não** iniciar FASE 1 até FASE 0 P0 fechado.

---

## Histórico de documentos

| Documento | Papel |
|-----------|--------|
| `SUPERVISOR.md` (corpo Etapas 1–10) | Histórico do painel de propriedades + protocolo de tarefa |
| `docs/PLANO_UNICO_PENDENCIAS.md` | Backlog tático legado |
| Auditoria de rumo 2026-08-05 | Evidência que originou este mapa |

**Fim do MAPA MESTRE ATUAL.**
