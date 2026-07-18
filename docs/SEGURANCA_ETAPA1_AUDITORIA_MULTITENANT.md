# Etapa 1 — Auditoria da arquitetura e ameaças (multi-tenant)

**Status:** concluída (somente leitura — **nenhuma migração de banco**)  
**Data:** 2026-07-18  
**Commit base:** `a0c0759` (`main`)  
**Fonte:** `AFU_Agro_Prompt_Seguranca_Dados_Multitenant.md`  
**Branch de trabalho:** `cursor/security-multitenant-audit-fd64`

---

## Decisão desta etapa

| Item | Resultado |
|------|-----------|
| Banco modificado? | **Não** |
| Código de autorização alterado? | **Não** |
| Próxima etapa liberada? | **Sim — Etapa 2 (organizations + membership)**, após revisão deste relatório |
| Bloqueio hard? | Não bloqueia Etapa 2; **bloqueia Etapa 3 (migração)** até fechar IDORs P0 listados abaixo ou tratá-los em paralelo na Etapa 4 |

---

## 1. Arquitetura atual encontrada

### 1.1 Identidade e “tenant” de hoje

Não existe modelo de organização/equipe. O isolamento real é **1 usuário → 1 perfil AFU → 1 produtor → N propriedades**:

```text
users (JWT, role: user|admin)
  └── usuarios_afu (1:1 via userId)
        ├── tipoUsuario: administrador | tecnico | produtor | parceiro | comprador
        └── produtores (1:1 via usuarioId)
              └── propriedades (produtorId)
                    ├── terrenos / culturas
                    ├── tarefas_operacionais / ocorrencias / estoque / custos
                    └── (calendário / diagnósticos / relatórios frequentemente por usuarios_afu.id)
```

**Lacuna conceitual vs. alvo do prompt:** o dono lógico deveria ser a **organização**, com `createdByUserId`. Hoje o dono é o produtor individual; membros de equipe não compartilham a mesma fazenda sem compartilhar a mesma conta.

### 1.2 Autenticação

| Camada | Local | Comportamento |
|--------|-------|---------------|
| JWT Bearer | `server/_core/sdk.ts`, `token-service.ts` | Access ~15 min; `ctx.user` |
| Cookie | SDK session | Web legacy/OAuth |
| `publicProcedure` | `server/_core/trpc.ts` | Sem auth |
| `protectedProcedure` | idem | Exige `ctx.user` |
| `adminProcedure` | idem | Exige `users.role === "admin"` |
| Dev bypass | `DEV_SKIP_AUTH=1` | Usuário admin injetado |

**Não existem** `organizationProcedure`, `roleProcedure` (papel org) nem `propertyProcedure` reutilizáveis.

### 1.3 Autorização operacional (padrão atual)

Helpers espalhados por router:

- `getUsuarioAfuByUserId(ctx.user.id)`
- `getProdutorId` (cria produtor se faltar)
- `propriedadeBelongsToProdutor(propriedadeId, produtorId)` — `server/db.ts`
- `assertOwns` / `assertOwnsPropriedade` / `assertOwnsTarefa` — core / tarefas / expansão / weather

**Boas práticas locais:** `coreData.propriedades`, `tarefas`, `expansao` e `weather.byPropriedade` validam ownership no servidor.

### 1.4 Stack de dados / arquivos / offline

| Área | Situação |
|------|----------|
| Banco | MySQL 8 + Drizzle — **sem RLS** (MySQL não oferece RLS como Postgres) |
| Cache servidor | Sem Redis tenant; React Query keys **sem** `userId`/`orgId` |
| Offline | `afu_core_mutation_queue` global no dispositivo (`lib/offline/core-mutation-queue.ts`) |
| Arquivos | `GET /manus-storage/*` **sem autenticação** → redirect para URL assinada (`storageProxy.ts`) |
| Relatórios | Tabela `relatorios` por `usuarioId`; PDF via `analise.gerarPDF` (**publicProcedure**) |
| Auditoria | **Sem** tabela `audit_logs` / trilha de download |
| IA | `diagnostico.analisar` / `analise.interpretar` são **públicos** |

### 1.5 Fluxo alvo de relatório (prompt) vs. real

```text
ALVO:
sessão → organização → propriedade/safra → consulta filtrada → geração
  → arquivo privado → link temporário → auditoria

ATUAL:
sessão (às vezes nem isso no PDF)
  → getById sem filtro de dono (IDOR)
  → HTML gerado no cliente/servidor sem persistência privada garantida
  → sem link temporário escopado
  → sem auditoria de download
```

---

## 2. Vulnerabilidades e lacunas encontradas

### P0 — Crítico (acesso cruzado / escalada)

| ID | Ameaça | Evidência |
|----|--------|-----------|
| P0-1 | **IDOR relatórios** get/update/delete | `secondary-data-router.ts` ~99–132: filtro só por `id` |
| P0-2 | **IDOR análises fitotécnicas** get/delete | idem ~143–184 |
| P0-3 | **Enumeração de cultivos de todos os tenants** | `culturasPragas.culturas.list/get` → `listarCulturasAdmin` / `getCulturaById` sem ownership |
| P0-4 | **Auto-promoção a admin de plataforma** | `auth.signup` aceita `profile: "administrador"` → `users.role = admin` |
| P0-5 | **Storage proxy sem auth** | `/manus-storage/*` — quem conhece a key baixa |

### P1 — Alto

| ID | Ameaça | Evidência |
|----|--------|-----------|
| P1-1 | NOC / métricas de plataforma para qualquer login | `bancoAgronomico.noc.*` = `protectedProcedure`, não admin |
| P1-2 | Piloto: listagens PII para qualquer autenticado | `piloto-router.ts` |
| P1-3 | Offline queue sem namespace user/org; logout não limpa fila | `afu_core_mutation_queue` |
| P1-4 | Calendário `create` aceita `propriedadeId`/`culturaId` sem assert | `core-data-router.ts` |
| P1-5 | Terreno `update` pode mudar `propriedadeId` sem validar destino | `core-data-router.ts` |
| P1-6 | Cultivo `create` não valida `terrenoId` ∈ propriedade | `core-data-router.ts` |
| P1-7 | IA/PDF públicos (`diagnostico.analisar`, `analise.interpretar`, `gerarPDF`) | abuso + vazamento se payload cruzado |
| P1-8 | React Query keys sem tenant; logout em `use-auth.ts` pode não limpar cache | race na troca de conta |

### P2 — Médio / estrutural

| ID | Lacuna |
|----|--------|
| P2-1 | Sem `organizations` / `organization_memberships` |
| P2-2 | Sem `organizationId` nas tabelas operacionais |
| P2-3 | Sem entidade `seasons` (safra só como label de UI) |
| P2-4 | Sem matriz de papéis org (gerente/agronômo/operador) |
| P2-5 | Sem audit log |
| P2-6 | Relatório sem `propriedadeId` / filtros persistidos / URL temporária |
| P2-7 | Admin de marketplace pode editar produto de qualquer vendedor (explícito) |
| P2-8 | `clientMutationId` de tarefas é global (colisão pode retornar id alheio) |

### O que está razoavelmente isolado (baseline)

- `coreData.propriedades` list/get/update/delete por `produtorId`
- `coreData.tarefas.*` e `coreData.expansao.*` com `assertOwns`
- `diagnostico.historico` / `salvar` amarrados a `perfil.id` (salvar não valida propriedade)
- Marketplace pedidos buyer/seller na maioria dos paths
- Suporte tickets por `perfil.id`

---

## 3. Modelo de tenant proposto (alvo — não implementado nesta etapa)

```text
Usuário
  → organization_memberships (role, status)
  → Organização (tenant)
       → Propriedade
            → Talhão (terreno)
            → Safra (season)
            → Cultivo / Ocorrência / Tarefa / Estoque / Custo / Arquivo / Relatório
```

Regras:

1. Dono lógico dos dados operacionais = **organização**.
2. `createdByUserId` registra autor; não isola sozinho.
3. Sessão carrega **organização ativa**; troca de org troca escopo completo (cache, offline, IA).
4. Cliente pode sugerir `organizationId`/`propertyId`; servidor **nunca confia** — valida membership + ownership.
5. Relatórios: fluxo completo do prompt (filtro servidor → privado → URL temporária → auditoria).

---

## 4. Tabelas e APIs afetadas

### 4.1 Inventário de tabelas (classificação)

#### Pessoais

`users`, `usuarios_afu`, `push_tokens`, `tickets_suporte`, `mensagens_suporte`

#### Tenant / org-scoped (precisam de `organizationId` na migração futura)

| Tabela | Escopo atual |
|--------|--------------|
| `produtores` | `usuarioId` |
| `propriedades` | `produtorId` |
| `terrenos` | `propriedadeId` |
| `culturas` | `propriedadeId` |
| `diagnosticos_ia` | `usuarioId` (+ opc. propriedade) |
| `analises_fitotecnicas` | `usuarioId` |
| `relatorios` | `usuarioId` |
| `calendario_cuidados` | `usuarioId` |
| `tarefas_operacionais` | `usuarioId` + `propriedadeId` |
| `apontamentos_operacao` | via tarefa |
| `ocorrencias_campo` | `propriedadeId` |
| `estoque_itens` / `estoque_movimentos` | propriedade / item |
| `orcamentos_safra` / `custos_operacao` | `propriedadeId` |
| `atividade_propriedade` | `propriedadeId` |
| `sensores` / `leituras_sensores` | propriedade / sensor |
| `produtos_marketplace` / `pedidos` | vendedor/comprador |

#### Catálogo global (OK compartilhado)

`pragas_doencas`, `materiais_didaticos`, `parceiros`, `culturas_catalogo` e satélites, `zonas_climaticas`, `tipos_solo`, `lab_modulos`, `economia_cultura`, `camadas_geo`

#### Plataforma / admin

`noc_alertas`, `arquitetura_componentes`, `piloto_*`

#### Ausentes (alvo)

`organizations`, `organization_memberships`, `seasons`, `audit_logs`, `files`/`report_artifacts`

### 4.2 Inventário de rotas privadas (APIs)

| Router | Auth | Isolamento |
|--------|------|------------|
| `auth.*` (exceto login/signup/refresh) | protected/admin | Parcial (signup admin) |
| `coreData.propriedades` | protected | OK |
| `coreData.terrenos` | protected | Parcial |
| `coreData.cultivos` | protected | Parcial |
| `coreData.calendario` | protected | Parcial (create) |
| `coreData.tarefas` | protected | OK |
| `coreData.expansao` | protected | OK |
| `diagnostico.historico/salvar` | protected | OK / parcial |
| `diagnostico.analisar` | **public** | N/A tenant |
| `analise.interpretar/gerarPDF` | **public** | N/A tenant |
| `secondaryData.relatorios` | protected | **MISSING** get/update/delete |
| `secondaryData.analises` | protected | **MISSING** get/delete |
| `secondaryData.marketplace` | protected | Parcial (+ admin bypass) |
| `culturasPragas.culturas` read | protected | **MISSING** |
| `weather.byPropriedade` | protected | OK |
| `push.*` | protected | Parcial unregister |
| `bancoAgronomico.noc` | protected | **MISSING** (deve ser admin) |
| `piloto.*` list | protected | **MISSING** |
| `GET /manus-storage/*` | **nenhuma** | **MISSING** |

---

## 5. Migração planejada (somente plano — Etapas 2–3)

1. Backup verificável do MySQL staging/prod.  
2. Criar `organizations` + `organization_memberships` (Etapa 2).  
3. Backfill: 1 org pessoal por `produtores`/`usuarios_afu` existente; membership `proprietario`.  
4. Adicionar `organizationId` **nullable** nas tabelas tenant; preencher via `propriedades.produtorId` → org.  
5. Relatório de órfãos/ambíguos; corrigir antes de NOT NULL.  
6. Índices `(organizationId, id)`, `(organizationId, propriedadeId)`, …  
7. Código tenant-aware (Etapa 4) antes de tornar NOT NULL.  
8. Defesa equivalente a RLS: repositórios únicos + lint (MySQL).  
9. Rollback: manter colunas antigas; não dropar no mesmo release.

**Esta etapa não executa nenhum dos passos acima.**

---

## 6. Estratégia de RLS / autorização (proposta)

| Camada | Ação |
|--------|------|
| UI | Esconder ações; **nunca** como barreira única |
| API | `authenticated` → `organization` → `role` → `property` procedures |
| Repositório | Toda query privada com `organizationId` do contexto autorizado |
| Banco | MySQL: CHECK/triggers opcionais + índices; **sem RLS nativo** — compensar com repositório único |
| Arquivos | Bucket privado; key opaca; URL assinada curta; auth no proxy |
| Relatórios | Fluxo completo do prompt + `audit_logs` |
| Offline | Queue key `userId+organizationId+deviceId`; limpar/criptografar no logout |
| Admin plataforma | Break-glass com motivo + auditoria; sem bypass silencioso |

---

## 7. Testes que serão criados (Etapas seguintes)

### Leitura cruzada

- A abre propriedade/relatório/análise/foto de B por ID → 404/FORBIDDEN sem vazar existência quando política definir.  
- A lista cultivos admin-style → vazio / forbidden.  
- URL `/manus-storage/...` sem sessão → 401.  
- Membership removido + URL antiga → falha.

### Escrita cruzada

- A edita propriedade/tarefa/estoque de B.  
- A cria tarefa com `terrenoId` de B.  
- Operador tenta orçamento; leitor tenta mutação.

### Cache / offline / relatório / IA

- Dashboard A → B sem vazamento.  
- Fila offline de A não sync sob sessão B.  
- Relatório consolidado nunca mistura orgs.  
- Troca de org limpa contexto de IA.

---

## 8. Riscos e rollback

| Risco | Mitigação |
|-------|-----------|
| Backfill atribui org errada a propriedade compartilhada informalmente | Relatório de órfãos + revisão humana antes de NOT NULL |
| Quebra de clientes que usam só `produtorId` | Dual-read período; feature flag |
| Admin signup já explorado em staging | Rotacionar admins; invalidar sessões; fechar P0-4 cedo |
| Offline queues em campo | Namespace + clear no logout antes de rollout amplo |
| MySQL sem RLS | Revisão obrigatória de PRs que tocam `db*.ts` fora do repositório tenant |

**Rollback desta etapa:** N/A (somente documentação).  
**Rollback futuro da migração:** restaurar backup; reverter código tenant; colunas `organizationId` permanecem nullable.

---

## 9. Modelo de ameaças (STRIDE resumido)

| Ameaça | Vetor atual | Impacto | Controlo alvo |
|-------|-------------|---------|---------------|
| **IDOR** | `relatorios.get`, `analises.get`, IDs na URL | Alto — dados agronômicos/financeiros | Query `id + organizationId` / ownership |
| **Escalada** | signup `administrador` | Crítico — adminProcedure | Remover do signup público |
| **Enumeração** | `culturasPragas.culturas.list` | Alto — mapa de cultivos alheios | Admin-only ou filtro tenant |
| **Arquivo público** | `/manus-storage/*` | Alto — fotos/laudos | Auth + signed URL + ACL |
| **Cache cruzado** | React Query / AsyncStorage keys | Médio — vazamento na troca de conta | Namespace + clear |
| **Sync errada** | fila offline global | Alto — mutações sob outra sessão | Namespace + revalidar no server |
| **IA cross-tenant** | analisar/interpretar públicos + contexto | Médio/Alto | Auth + ownership antes do prompt |
| **Admin silencioso** | NOC/piloto qualquer login | Médio — telemetria/PII | adminProcedure + audit |
| **Relatório sem trilha** | PDF público / get sem audit | Médio — compliance | Fluxo privado + audit_logs |

---

## 10. Aceite da Etapa 1

| Critério | Status |
|----------|--------|
| Todas as rotas privadas inventariadas | **Sim** (secção 4.2) |
| Locais que acessam dados privados identificados | **Sim** (secções 2 e 4) |
| Modelo de ameaças documentado | **Sim** (secção 9) |
| Relatório entregue **antes** de modificar o banco | **Sim** |

---

## 11. Próximo passo recomendado

1. **Etapa 2** — `organizations` + membership + organização ativa na sessão + matriz de papéis (ainda sem forçar NOT NULL nas tabelas operacionais).  
2. Em paralelo ou imediatamente na **Etapa 4**, corrigir **P0-1…P0-5** (IDORs e signup admin) — baixo risco de schema, alto ganho de segurança.  
3. **Não iniciar Etapa 3 (migração massiva)** até haver revisão deste relatório e plano de backfill aprovado.

---

## Apêndice A — Mapa mental do fluxo de relatório (gap)

```text
Sessão autenticada          ✅ parcial (JWT)
→ organização autorizada    ❌ inexistente
→ propriedade autorizada    ⚠️ só em alguns routers
→ safra selecionada         ❌ label UI, sem entidade
→ consulta filtrada no srv  ❌ IDOR em relatorios.get
→ geração do relatório      ⚠️ HTML/PDF sem escopo forte
→ arquivo privado           ❌ storage proxy aberto
→ link temporário           ❌ não há política de expiração por tenant
→ registro de auditoria     ❌ ausente
```

## Apêndice B — Arquivos-chave inspecionados

- `drizzle/schema.ts`
- `server/_core/trpc.ts`, `context.ts`, `sdk.ts`, `storageProxy.ts`
- `server/routers.ts`, `core-data-router.ts`, `tarefas-router.ts`, `propriedade-expansao-router.ts`
- `server/routers/secondary-data-router.ts`, `culturas-pragas-router.ts`, `auth-router.ts`
- `server/routers/banco-agronomico-router.ts`, `piloto-router.ts`, `weather-router.ts`
- `lib/offline/core-mutation-queue.ts`, `hooks/use-core-offline-sync.ts`, `hooks/use-auth*.ts`
