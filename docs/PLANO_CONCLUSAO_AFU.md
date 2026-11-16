# Plano de Conclusão — AFU (Analisador Fitotécnico Universal)

**Data da auditoria:** 2026-11-16  
**Base:** `origin/main` @ `606a44d`  
**Stack real (vence sobre specs NestJS/Prisma/PostgreSQL):** Expo SDK 54 · Express · tRPC · MySQL 8 · Drizzle · JWT · Railway (API) · Vercel (web) · Hostinger (build unificado opcional) · EAS (mobile)

**Fontes reconciliadas**

| Fonte | Papel |
|-------|--------|
| Specs do dono (uploads): ETAPAs 1–9, 19, planos de correção, monetização, descrições de produto | Intenção de produto / escopo |
| `MAPA_MESTRE_ATUAL_AFU.md` | Ordem canônica de evolução FASE 0–8 |
| `SUPERVISOR.md`, `docs/PROPRIEDADES_*` | Histórico do painel de propriedades (já entregue P0/P1) |
| `docs/PLANO_UNICO_PENDENCIAS.md`, `PROJECT_REVIEW.md`, `todo.md` | Backlog tático e evidências de MVP |
| Zip **AGI Mobile** (Kotlin/Compose) | Interface nativa do assistente multiagente (auditoria neste plano) |

**Regra:** existência de tela/tabela/endpoint ≠ funcionalidade concluída. Specs que pedem NestJS/Prisma/PostgreSQL/Next.js admin separado mapeiam para a stack já implantada; **não reescrever o stack**.

---

## 1. Saúde do repositório (evidência 2026-11-16)

| Verificação | Resultado | Evidência |
|-------------|-----------|-----------|
| Typecheck `npm run check` | **PASS** (0 erros) | log local |
| Schema `db:schema:prepare` + `db:schema:verify` | **PASS** | MySQL local `afu_mobile` |
| Testes `npm run test:ci` | **PASS** — 96 arquivos · 739 testes · 4 skipped | MySQL efêmero/local |
| Build web `npm run build:web:preview` | **PASS** | export Expo → `dist/` |
| Suites historicamente quebradas (`auth-flow`, `resend-email`) | **PASS** (50 testes) | corrigidas no `main` atual |
| Lint legado | Dívida P3 (~100 issues) — não bloqueia | `AGENTS.md` / `PLANO_UNICO_PENDENCIAS` |

**Nada trivialmente quebrado em typecheck/build/test no momento desta auditoria.** CI (`.github/workflows/ci.yml`) já sobe MySQL 8 e roda o mesmo pipeline.

---

## 2. Mapeamento stack: spec → real

| Spec do dono | Implementação atual | Evidência |
|--------------|---------------------|-----------|
| NestJS + Prisma + PostgreSQL | Express + tRPC + Drizzle + MySQL | `server/`, `drizzle/schema.ts` |
| Next.js admin separado | Admin MVP no mesmo app Expo web (`app/mais/admin-*.tsx`, `app/admin/*`) | `app/mais/web-admin.tsx` banner de stack |
| Monorepo `apps/mobile|web-admin` | Repo único Expo + `server/` | raiz do repo |
| AWS S3 / Firebase Storage | Cloudflare R2 / S3-compat + proxy privado | `docs/RAILWAY_STORAGE_EVENTOS.md` |
| Hostinger / Vercel / Railway | `scripts/build-hostinger.mjs`, `vercel.json`, `railway.toml` | deploy canônico `afuagro.tech` → API Railway |

---

## 3. Matriz de status — ETAPAs do dono (1–9, 19)

Legenda: **feito** · **parcial** · **faltando**

### ETAPA 1 — Fundação / MVP Planta Saudável

| Item | Status | Evidência |
|------|--------|-----------|
| Identidade, módulos, perfis, MVP | **feito** | `app/(tabs)/*`, `hooks/use-auth-api.ts`, seeds |
| Cadastro usuários (produtor/técnico/admin/parceiro/comprador) | **feito** | `drizzle/schema.ts` (`users`, `usuarios_afu`), `auth.signup` |
| Propriedades + culturas/cultivos | **feito** | `coreData.propriedades`, `coreData.culturas`, UI tabs |
| Diagnóstico por imagem (IA) | **feito** | `diagnostico.analisar` / `salvar` em `server/routers.ts`, `app/(tabs)/diagnostico.tsx` |
| Análise fitotécnica | **feito** | `analises_fitotecnicas`, `app/mais/analise-fitotecnica.tsx` |
| Relatórios / PDF | **parcial** | geração HTML/PDF existe (`server/report-html.ts`, `secondaryData.relatorios`); certificado/assinatura digital **faltando** |

### ETAPA 2 — Telas e fluxos

| Item | Status | Evidência |
|------|--------|-----------|
| Welcome → login/cadastro → painel | **feito** | `app/auth/welcome.tsx`, `login.tsx`, `cadastro.tsx` |
| Propriedade / cultura / diagnóstico / histórico | **feito** | tabs + detalhe |
| Calendário, materiais, suporte | **feito** | `app/mais/calendario.tsx`, `materiais*.tsx`, `suporte` via `secondaryData` |
| Idioma na welcome | **faltando** | UI sem seletor de idioma |
| Painel admin web (gestão produtores, revisão IA, etc.) | **parcial** | admin embutido; revisão técnica de diagnóstico **faltando** na API/UI |

### ETAPA 3 — Banco de dados (intenção)

| Item | Status | Evidência |
|------|--------|-----------|
| Tabelas core (usuários, produtores, propriedades, cultivos, diagnósticos, análises, relatórios, pragas, materiais, calendário, marketplace, pedidos) | **feito** | `drizzle/schema.ts` (~67 tabelas) |
| Sensores + leituras | **parcial** | tabelas + `server/db-geo-iot.ts` / seeds; UI/API operacional de campo limitada |
| Extensões (orgs, tarefas, estoque, custos, safras, ocorrências, audit) | **feito** (além da spec) | migrations `0013+`, `organizations`, etc. |
| PostgreSQL | **N/A — stack MySQL** | não migrar |

### ETAPA 4 — Arquitetura / stack

| Item | Status | Evidência |
|------|--------|-----------|
| Mobile Expo + API + DB + storage + IA + PDF | **feito** | stack real documentada em `constants/afu-etapas.ts` (`AFU_STACK_REAL`) |
| Web admin Next.js / MFA / IoT service dedicado | **faltando** / **parcial** | admin Expo; MFA ausente; IoT catalogado |

### ETAPA 5 — Backend / API

| Item | Status | Evidência |
|------|--------|-----------|
| Auth, propriedades, cultivos, diagnóstico, análises, relatórios, materiais, marketplace | **feito** | `server/routers/*.ts`, `server/routers.ts` |
| Sensores CRUD/leituras de produção | **parcial** | dados + seed; contratos REST da spec não espelhados 1:1 (tRPC) |
| Pagamento real marketplace | **parcial** | `pagarPix` demo (`secondaryData.marketplace.pedidos.pagarPix`) |
| Revisão técnica de diagnóstico | **faltando** | coluna `statusRevisao` existe; sem mutation/UI de técnico |

### ETAPA 6 — Schema ORM

| Item | Status | Evidência |
|------|--------|-----------|
| Modelo equivalente ao Prisma da spec | **feito** (Drizzle/MySQL) | `drizzle/schema.ts` |
| Prisma/PostgreSQL | **N/A** | não reimplementar |

### ETAPA 7 — Auth / permissões

| Item | Status | Evidência |
|------|--------|-----------|
| JWT + refresh + bcrypt + login/cadastro/logout/forgot/reset | **feito** | `server/routers/auth-router.ts` |
| RBAC por organização | **feito** | `lib/security/org-roles.ts`, `organizationProcedure` |
| Perfis globais admin/técnico/produtor… | **feito** | `usuarios_afu.tipo`, `auth.admin.*` |
| MFA admin/técnico | **faltando** | nenhum endpoint/UI MFA |
| Controle de sessão (dispositivos, encerrar remoto) | **parcial** | refresh tokens; sem painel de dispositivos |
| LGPD (consentimento auditável, exportação, exclusão) | **parcial** | aceite de termos no cadastro; audit logs; **sem** export/delete de titular |
| Logs de auditoria | **feito** (base) | `auditLogs`, `writeAuditLog` |

### ETAPA 8 — Frontend mobile Planta Saudável

| Item | Status | Evidência |
|------|--------|-----------|
| App Expo (Android/iOS/web) com tabs core | **feito** | `app/(tabs)/*` |
| Diagnóstico, propriedades, cultivos, calendário, relatórios, materiais, perfil, push, offline parcial | **feito** / **parcial** | ver `PROJECT_REVIEW.md`; offline não cobre todos os formulários |
| EAS / Play Store produção | **parcial** | profiles EAS; submit loja pendente |
| Design system Inter/cores da spec | **parcial** | NativeWind + tema agrícola; não é o DS da spec ao pé da letra |

### ETAPA 9 — Frontend web administrativo

| Item | Status | Evidência |
|------|--------|-----------|
| Dashboard admin, usuários, culturas, pragas, materiais, parceiros | **parcial** | `app/mais/admin-dashboard.tsx`, `admin-usuarios.tsx`, etc. |
| Next.js separado + MFA + revisão diagnósticos + sensores + assinatura digital | **faltando** | documentado como referência em `app/mais/web-admin.tsx` |
| Conteúdos offline admin | **feito** | `app/admin/conteudos-offline.tsx` |

### ETAPA 19 — Governança / LGPD / DevOps

| Item | Status | Evidência |
|------|--------|-----------|
| Multi-tenant + RBAC + arquivos privados + CI | **feito** | `docs/SEGURANCA_CONCLUSAO_GLOBAL.md`, `.github/workflows/ci.yml` |
| Ambientes DEV/STAGING/PROD documentados | **parcial** | `docs/STAGING.md`; API prod `api.afuagro.com.br` ainda pendente em docs |
| Observabilidade / backup RPO-RTO / ISO | **parcial** / **faltando** | docs de intenção em `app/mais/governanca-devops.tsx`; operação cloud incompleta |
| LGPD operacional (export/erase/DPO) | **faltando** | sem endpoints de titular |

---

## 4. Status MAPA MESTRE (FASE 0–8) — ordem vigente

| Fase | Status | Notas |
|------|--------|-------|
| **0** Integridade / RBAC bloqueadores | **feita** | evidências em `docs/evidencias/FASE_0_*` |
| **1** Núcleo cadastral Org→Prop→Talhão→Safra→Cultivo | **feita** | `docs/evidencias/FASE_1_ENCERRAMENTO_NUCLEO_CADASTRAL.md` |
| **2** Modelo operacional (calendário × tarefa × operação) | **parcial / próximo gate** | dualidade calendário/tarefa ainda P1 no MAPA |
| **3** Geoespacial mínimo | **parcial** | polígonos/GeoJSON entregues no plano propriedades; satélite fora |
| **4** Coração AFU (ocorrência→diagnóstico→recomendação→tarefa→resultado) | **parcial** | ocorrência→tarefa existe (`coreData.expansao.criarTarefa`); elo recomendação→tarefa e `safraId` em diagnóstico fracos |
| **5** Gestão econômica | **parcial** | estoque/custos/financeiro no código; consumo→custo automático incompleto |
| **6** Operação de campo (Hoje/alertas/offline) | **parcial** | alertas-engine + offline core; cobertura incompleta |
| **7** Métricas / inteligência | **parcial** | indicadores/painel; KPIs sobre dados confiáveis ainda dependem de 2–6 |
| **8** Expansões (marketplace avançado, banco 30–46, satélite…) | **parcial** | muito código/catálogo; pagamentos/piloto real abertos |

Plano Mestre Propriedades 1–10 (histórico): **P0/P1 feitos** — `docs/PROPRIEDADES_PROGRESSO.md`.

---

## 5. AGI Mobile (assistente nativo) — auditoria do zip

### 5.1 O que é

App **Android nativo (Kotlin + Jetpack Compose)** gerado via AI Studio, descrito como central de comando AGI: chat multimodal, API router, subagentes, memória persistente, tarefas, monitoramento, cloud via **n8n**. Inclui tela **Planta Saudável** (`PlantHealthyScreen`) para análise de imagem/telemetria agrícola.

### 5.2 Estado observado

| Área | Status | Evidência (zip) |
|------|--------|-----------------|
| UI Compose (Home, Chat, Agents, Tasks, Memory, Dashboard, Settings, ApiRouter, Intelligence, PlantHealthy) | **parcial / protótipo avançado** | `ui/screens/*`, `AgiRoutes.kt` |
| Rede n8n (orchestrator, status, memory-sync, api-router, SSE) | **feito no cliente** | `N8nWebhookService.kt`, `AgiApiClient.kt`, `README_AGI_MOBILE.md` |
| Cliente “Planta Saudável” REST | **feito no cliente; contratos ≠ AFU** | `PlantHealthyService.kt` paths `/api/plant_healthy/*` |
| Persistência Room + prefs + token cifrado | **feito** | `AgiDatabase`, `CryptoManager`, `AgiPreferencesRepository` |
| Modos LOCAL/CLOUD/AUTO/HYBRID + telemetria device | **feito (cliente)** | `AgiModels.kt`, `HybridIntelligenceRouter`, `DeviceTelemetryMonitor` |
| Inferência local GGUF/ONNX | **parcial / stub de produto** | docs + UI Intelligence Manager; runtime local não validado nesta auditoria |
| Auth AFU (JWT tRPC) | **faltando** | Bearer genérico para n8n; package `com.example` |
| Testes unitários | **parcial** | 8 classes em `app/src/test` |
| Segredos no zip | **apenas `.env.example`** (`GEMINI_API_KEY` comentada) — **não há `.env` com chave** |

### 5.3 Como deve conectar ao backend AFU deste repo

O AFU **não** expõe hoje `/api/plant_healthy/analyze_image`. O caminho canônico é **tRPC**:

- `POST /api/trpc/diagnostico.analisar` com body superjson `{"json":{"imageBase64":"...","culturaId":?, ...}}`
- Auth: `Authorization: Bearer <accessToken>` (JWT AFU)
- Persistência: `diagnostico.salvar` + RBAC `diagnostics.write`

**Integração recomendada (camadas):**

```
AGI Mobile (Compose)
  ├─ n8n  → orquestração multiagente / subagentes / memória cloud
  │         (fora deste repo; workflows dono)
  └─ AFU API (Railway / api.afuagro.tech)
        ├─ auth.login / auth.refresh          → JWT
        ├─ diagnostico.analisar | salvar     → Planta Saudável
        ├─ coreData.* / organizations.*      → contexto fazenda (opcional fase 2)
        └─ (opcional) gateway REST fino em Express
              que adapta /api/plant_healthy/* → tRPC interno
              OU adapter no app que fala tRPC/superjson direto
```

**Não** misturar chave Gemini no cliente AFU/produção: IA de diagnóstico já passa pelo Forge/MaaS no servidor AFU.

### 5.4 Onde o código deve viver (recomendação)

| Opção | Prós | Contras | Recomendação |
|-------|------|---------|--------------|
| **A. Repo separado** `afu-agi-mobile` | Gradle isolado; CI Android própria; sem poluir Expo | Dois remotes; versionar contratos | **Preferida** para o APK AGI |
| **B. Subpasta** `apps/agi-mobile/` neste monorepo | Um lugar; PRs cruzados fáceis | CI/Node vs Gradle; builds lentos | Aceitável se o dono quiser monorepo |
| **C. Dentro de `afu-mobile-v2` misturado na raiz** | — | Conflito com Expo | **Evitar** |

Neste plano: **recomendação A**, com pacote de contratos compartilhados (OpenAPI/JSON Schema dos webhooks n8n + adapter AFU) versionado ou publicado a partir do AFU. Até a decisão, **não importar o zip inteiro neste PR** (só documentar). Em PRs futuros: copiar **somente** código + `.env.example` (nunca `.env`, keystores, `google-services.json` com segredos).

---

## 6. Backlog priorizado — pacotes de trabalho (1 agente / 1 PR)

Ordem: (1) quebras / higiene bloqueante → (2) fluxos MVP core → (3) admin web → (4) AGI Mobile → (5) monetização / governança.

### WP-01 — Higiene CI e lint por módulo tocado

- **Objetivo:** Manter `check` + `test:ci` verdes; reduzir lint só nos arquivos editados.
- **Escopo:** Não abrir PR só de lint massivo; ao tocar módulo, limpar ESLint local.
- **Aceite:** CI `validate` verde; zero novos erros tsc.
- **Deps:** nenhuma.
- **Deploy:** nenhum (CI).

### WP-02 — Unificar modelo operacional (FASE 2) — calendário × tarefa × operação

- **Objetivo:** Um significado canônico para “operação agrícola” entre `calendario_cuidados`, `tarefas_operacionais` e `operacoes_agricolas`.
- **Escopo:** Documentar + implementar ponte (criar tarefa a partir de evento; status espelhados); UI única no painel da propriedade; testes de transição.
- **Aceite:** Criar/atualizar evento gera/atualiza tarefa (ou link explícito); sem dualidade contraditória na UI Visão/Operações; testes Vitest.
- **Deps:** FASE 1 (ok).
- **Deploy:** API Railway + web Vercel/Hostinger.

### WP-03 — Elo diagnóstico → recomendação → tarefa (FASE 4 P1)

- **Objetivo:** Fechar o coração do AFU após o laudo IA.
- **Escopo:** Ação “criar tarefa a partir da recomendação”; opcional `safraId` em `diagnosticos_ia`; UI resultado diagnóstico; RBAC `operations.write` + `diagnostics.write`.
- **Aceite:** Fluxo foto→laudo→tarefa na mesma propriedade/safra; isolamento tenant; teste.
- **Deps:** WP-02 recomendado.
- **Deploy:** API + web/app Expo.

### WP-04 — Revisar diagnóstico (técnico) — schema já tem `statusRevisao`

- **Objetivo:** Técnico/admin aprova/corrige laudo IA.
- **Escopo:** Mutations tRPC `diagnostico.revisar` (parecer, status); tela admin lista pendentes; notificação produtor (push se disponível).
- **Aceite:** Fluxo pendente→confirmado/descartado auditado; produtor vê status.
- **Deps:** auth admin/técnico existente.
- **Deploy:** API + web admin Expo.

### WP-05 — Offline core nos formulários restantes

- **Objetivo:** Completar `useRunCoreMutation` / fila onde ainda falta.
- **Escopo:** Inventariar forms sem queue; alinhar `clientMutationId`; banner sync.
- **Aceite:** Propriedades/cultivos/terrenos/calendário/tarefas enfileiram offline; teste de fila.
- **Deps:** nenhuma crítica.
- **Deploy:** app (EAS) + web.

### WP-06 — Admin web: gestão de produtores e histórico

- **Objetivo:** Cobrir ETAPA 9 (gestão produtores) na stack Expo atual (sem Next.js).
- **Escopo:** Lista/busca/filtro região; detalhe com propriedades e diagnósticos; reutilizar `auth.admin.*` + `coreData`.
- **Aceite:** Admin autentica e navega produtor→propriedades→histórico sem vazamento cross-tenant.
- **Deps:** WP-04 útil mas não bloqueante.
- **Deploy:** Vercel/Hostinger web.

### WP-07 — LGPD mínimo operacional (exportar / excluir / consentimento)

- **Objetivo:** Fechar gaps ETAPA 7/19 sem ISO completo.
- **Escopo:** Registrar versão do termo + IP no signup; endpoints `auth.lgpd.export` e `auth.lgpd.erase` (soft); UI perfil.
- **Aceite:** Titular exporta JSON dos dados; solicita exclusão auditada; testes.
- **Deps:** `auditLogs`.
- **Deploy:** API + web.

### WP-08 — MFA para admin/técnico

- **Objetivo:** Atender ETAPA 7 (MFA).
- **Escopo:** TOTP (app autenticador) primeiro; e-mail depois; enforcement em `adminProcedure`.
- **Aceite:** Login admin exige MFA; recovery codes; testes.
- **Deps:** WP-07 desejável.
- **Deploy:** API + web/app.

### WP-09 — Gateway REST fino Planta Saudável (adapter AFU ↔ AGI)

- **Objetivo:** Compatibilizar `PlantHealthyService` do AGI com o backend real.
- **Escopo:** Rotas Express `/api/plant_healthy/analyze_image|telemetry|alerts` que traduzem para tRPC/serviços internos **ou** documentar adapter Kotlin tRPC; JWT AFU; sem chave LLM no cliente.
- **Aceite:** Chamada do cliente AGI (ou teste curl) retorna diagnóstico persistível; smoke em staging.
- **Deps:** auth JWT.
- **Deploy:** API Railway (e Hostinger se API unificada).

### WP-10 — Importar AGI Mobile no destino escolhido + branding

- **Objetivo:** Versionar o código AGI sem segredos.
- **Escopo:** Repo `afu-agi-mobile` **(recomendado)** ou `apps/agi-mobile/`; renomear `namespace`/`applicationId` para marca AFU; copiar `.env.example` apenas; CI Gradle smoke (unit tests).
- **Aceite:** Build debug local; testes unitários; README de conexão apontando API AFU + n8n; zero secrets commitados.
- **Deps:** decisão A vs B (§5.4); WP-09 para E2E.
- **Deploy:** EAS/Play separado do app Expo (APK AGI).

### WP-11 — Workflows n8n de referência (orquestrador AFU)

- **Objetivo:** Contratos HTTP do `README_AGI_MOBILE.md` implementados de ponta a ponta.
- **Escopo:** Workflows status/orchestrator/memory-sync/api-router; chamar AFU (`diagnostico.*`, opcional `coreData`) com service token; docs em `docs/agi/`.
- **Aceite:** AGI “Testar Conexão” + mensagem orquestrada em staging; evidência JSON.
- **Deps:** WP-09–10; instância n8n do dono.
- **Deploy:** n8n cloud/VPS (fora Vercel).

### WP-12 — AGI ↔ contexto fazenda (organização/propriedade)

- **Objetivo:** Assistente usa tenant AFU real (não só chat genérico).
- **Escopo:** Login AFU no AGI; selecionar org/propriedade; injetar contexto nas memórias/orchestrator; respeitar RBAC.
- **Aceite:** Mensagem AGI só enxerga dados do tenant; teste cross-tenant negativo.
- **Deps:** WP-10–11.
- **Deploy:** API + APK AGI.

### WP-13 — Marketplace: pagamento real (PIX / Mercado Pago)

- **Objetivo:** Substituir `Pagar com PIX (demo)`.
- **Escopo:** Integração gateway; webhooks; estados de pedido; sem inventar features fora da spec de monetização/marketplace.
- **Aceite:** Pagamento sandbox→aprovado atualiza pedido; teste webhook.
- **Deps:** credenciais dono.
- **Deploy:** API + web.

### WP-14 — Monetização SaaS — fundação comercial

- **Objetivo:** FASE 1 do plano de monetização (landing + planos), sem overbuild.
- **Escopo:** Landing (benefícios, planos Free/Produtor/Pro/Enterprise, CTA WhatsApp); tabela `planos`/`assinaturas` mínima **ou** Stripe/MP customer portal; limites enforced server-side (1 fazenda / 3 talhões no Free).
- **Aceite:** Visitante vê planos; conta Free limitada na API; upgrade documentado.
- **Deps:** WP-13 se pagamento MP; senão Stripe.
- **Deploy:** Vercel/Hostinger web + API.

### WP-15 — Produção API / DNS / EAS loja

- **Objetivo:** Fechar pendências de liberação (`PROJECT_REVIEW` / STAGING).
- **Escopo:** API prod sem `SEED_ON_START`; DNS `api.afuagro.com.br` se ainda pendente; build EAS `production`; SendGrid/FCM prod.
- **Aceite:** Health + login 4G em domínio prod; checklist smoke MVP.
- **Deps:** credenciais/infra dono.
- **Deploy:** Railway + Vercel/Hostinger + Play Store.

### WP-16 — Piloto com produtores reais (Etapa 29)

- **Objetivo:** Tirar piloto de `partial` → uso real.
- **Escopo:** Usar `piloto_*` APIs/UI; recrutamento; feedback; métricas.
- **Aceite:** N≥ combinado de produtores com feedback registrado.
- **Deps:** WP-15.
- **Deploy:** produção.

---

## 7. Ordem sugerida de execução (síntese)

```
WP-02 FASE 2 operacional
  → WP-03 diagnóstico→tarefa
  → WP-04 revisão técnica
  → WP-05 offline
  → WP-06 admin produtores
  → WP-07 LGPD → WP-08 MFA
  → WP-09 gateway Planta Saudável
  → WP-10 import AGI → WP-11 n8n → WP-12 contexto fazenda
  → WP-13 pagamento → WP-14 SaaS
  → WP-15 produção → WP-16 piloto
```

WP-01 é contínuo (toda PR).

---

## 8. Fora de escopo imediato (specs pedem, mas depois do núcleo)

- Next.js admin greenfield (preferir evoluir Expo web admin).
- Migração para PostgreSQL/Prisma/NestJS.
- MFA SMS; ISO 27001/9001 completos; RPO 1h com infra enterprise.
- Satélite avançado / IoT irrigação automática / white-label / API pública OpenAPI completa.
- Inferência on-device GGUF como requisito de MVP (manter cloud AFU + n8n).

---

## 9. Referências rápidas de arquivos

| Tema | Paths |
|------|-------|
| Auth | `server/routers/auth-router.ts`, `hooks/use-auth-api.ts`, `hooks/use-session.ts`, `app/auth/*` |
| Core fazenda | `server/routers/core-data-router.ts`, `tarefas-router.ts`, `propriedade-expansao-router.ts` |
| Diagnóstico | `server/routers.ts`, `app/(tabs)/diagnostico.tsx` |
| Schema | `drizzle/schema.ts` |
| RBAC | `lib/security/org-roles.ts` |
| Deploy | `vercel.json`, `railway.toml`, `Dockerfile`, `scripts/build-hostinger.mjs` |
| Mapa | `MAPA_MESTRE_ATUAL_AFU.md` |
| AGI (zip auditado) | `PlantHealthyService.kt`, `AgiApiClient.kt`, `README_AGI_MOBILE.md`, `.env.example` |

---

**Fim do plano.** Próximo passo operacional: abrir WP-02 (FASE 2) quando autorizado; em paralelo, decidir destino do AGI Mobile (repo separado vs `apps/agi-mobile/`) antes do WP-10.
