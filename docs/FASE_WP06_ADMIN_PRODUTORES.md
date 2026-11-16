# WP-06 — Admin: gestão de produtores

**Owner:** Ivan (AFU Agro)  
**Regra:** nunca apagar conteúdo importante; soft-deactivate apenas. Telas existentes (`admin-usuarios`, `painel-admin`, `admin-dashboard`) permanecem; este pacote **adiciona** cards/páginas.

## Objetivo

Cobrir ETAPA 9 (gestão de produtores) na stack Expo web atual (sem Next.js): listar/buscar/filtrar produtores, ver propriedades e atividade, convidar, desativar (soft), alterar role/plano — com autorização admin no servidor e audit log.

## Escopo entregue

| Capacidade | Onde |
|------------|------|
| Lista / busca / filtros (status, UF, região, plano) | `adminProdutores.listar` + `app/mais/admin-produtores.tsx` |
| Detalhe: propriedades + diagnósticos/análises | `adminProdutores.detalhe` + `app/mais/admin-produtor/[id].tsx` |
| Convite (cria user+perfil+org+linha produtores) | `adminProdutores.convidar` |
| Soft deactivate / reativar | `desativar` / `reativar` (`usuarios_afu.status` + `produtores.cadastroAtivo` + `revokeRefreshToken`); login/`authenticateRequest` bloqueiam via `assertAccountActive` |
| Troca de senha no convite | `users.mustChangePassword`; temp password só em non-prod ou `ADMIN_INVITE_RETURN_TEMP_PASSWORD=1` |
| Role / tipo / plano | `setRole` / `setTipo` / `setPlano` |
| Authz server-side | `adminProcedure` (`users.role === "admin"`) |
| Audit | `admin.producer.*` + auditoria genérica do `adminProcedure` |
| Card no Mais | `app/(tabs)/mais.tsx` → Gestão de Produtores |

## API

Namespace tRPC: **`adminProdutores`** (top-level, **não** em `auth.admin`, para reduzir conflito com PR #61 `cursor/fix-db-email-login-434a`).

Procedures: `stats`, `listar`, `detalhe`, `convidar`, `desativar`, `reativar`, `setPlano`, `setRole`, `setTipo`, `setCadastroAtivo`.

## Migration

- `drizzle/0044_produtor_plano.sql` — `produtores.plano` + `users.mustChangePassword`
- Script: `npm run db:produtor-plano:apply` → `scripts/apply-0044-produtor-plano.ts`
- Registrada em `scripts/lib/schema-prepare-core.ts` (tag `0044_produtor_plano`)

**Renumbering:** `0040` (#59 WP-02), `0041` (#63 WP-03), `0042` (#68 WP-04), `0043` (#69 WP-07) → WP-06 usa **`0044`**. Se a ordem de merge mudar, renumerar o SQL + `apply-0044-*` + tag do manifesto — **não** renomear tags já aplicadas em `afu_supplemental_migrations`.

## Arquivos principais

- `server/db-admin-produtores.ts`
- `server/routers/admin-produtores-router.ts`
- `server/routers.ts` (mount)
- `app/mais/admin-produtores.tsx`
- `app/mais/admin-produtor/[id].tsx`
- `tests/admin-produtores-authz.test.ts`

## O que não foi tocado (de propósito)

- Telas legadas de admin (usuários, culturas, painel mock)
- Núcleo de auth em PR #61: `server/db-auth.ts`, `server/routers/auth-router.ts`, `password-reset.ts`, `email-service.ts` (apenas **imports** de helpers já exportados)
- Hard delete de usuários/produtores/propriedades

## Testes

```bash
npm run test -- tests/admin-produtores-authz.test.ts
```

Cobre: FORBIDDEN para não-admin; detalhe isolado por produtor (sem misturar propriedades de outro tenant); convite + plano + soft-deactivate + linhas de `audit_logs`.

## Passos do owner (Ivan)

1. Revisar e mergear este PR após CI verde.
2. Em cada ambiente (staging/prod): garantir `npm run db:schema:prepare` (ou boot da API) aplica `0044_produtor_plano`.
3. Promover conta admin com `users.role = 'admin'` (já usado pelo `adminProcedure`).
4. Abrir **Mais → Gestão de Produtores** (web ou app autenticado como admin).
5. Opcional: configurar `SENDGRID_API_KEY` + `APP_URL` para o convite enviar e-mail de definição de senha; sem SendGrid a API devolve senha temporária só em ambiente de desenvolvimento do convite.
6. Coordenar merge com #59/#63 se houver conflito de numeração de migration.
7. WP-14 (monetização) pode evoluir `plano` para assinaturas Stripe/MP sem apagar esta coluna.
