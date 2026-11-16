# LGPD — Conformidade mínima operacional (WP-07)

**Status:** implementado no app (stack Express + tRPC + MySQL + Drizzle)  
**Escopo:** consentimento auditável, páginas legais in-app, exportação JSON, exclusão **agendada** (nunca hard-delete imediato), retenção e notas Play Store Data Safety.  
**Aviso:** textos legais são **PLACEHOLDER** — revisão jurídica / DPO obrigatória antes de produção e publicação na Play Store.

## O que foi entregue

| Capacidade | Onde |
|------------|------|
| Versões canônicas Termos / Privacidade | `lib/lgpd/constants.ts` |
| Tabelas `lgpd_consent_records`, `lgpd_deletion_requests` | `drizzle/schema.ts` + `drizzle/0043_lgpd_compliance.sql` |
| Migração supplemental `0043` | `npm run db:lgpd:apply` (via `db:schema:prepare`) |
| APIs tRPC | `auth.lgpd.*` em `server/routers/auth-router.ts` + `server/lgpd.ts` |
| Signup registra consentimento (versão + IP + UA) | `auth.signup` com `acceptedTerms` |
| Páginas PT in-app | `/legal/termos`, `/legal/privacidade` |
| UI titular | `app/mais/perfil.tsx` (exportar / solicitar exclusão / cancelar) |
| UI admin | `app/mais/admin-lgpd.tsx` |
| Auditoria | ações `lgpd.consent`, `lgpd.export`, `lgpd.erase_request`, `lgpd.erase_cancel`, `lgpd.anonymize` |

### Numeração da migration

- PRs abertos usam `0040` (WP-02) e `0041` (WP-03).
- WP-07 usa **`0043_lgpd_compliance`** (pula 0042 de propósito para reduzir colisão).
- Não renomear tags já aplicadas em `afu_supplemental_migrations`.

## Fluxos

### Consentimento

1. Cadastro exige checkbox + envia `acceptedTerms: true` e versões.
2. Servidor grava **dois** registros (`terms` e `privacy`) com `acceptedAt`, `ip`, `userAgent`, `documentVersion`.
3. Titular pode registrar novo aceite via `auth.lgpd.recordConsent`.

### Exportação (portabilidade)

- `auth.lgpd.export` → JSON com user (sem hash/tokens), perfil AFU, produtor, propriedades, cultivos, diagnósticos, consents, solicitações de exclusão e audit logs recentes do ator.
- Auditado como `lgpd.export`.

### Exclusão (direito ao esquecimento — operacional)

1. Titular chama `auth.lgpd.requestErase` (`confirm: true`).
2. Status `scheduled`; `scheduledAnonymizeAt = now + LGPD_DELETION_GRACE_DAYS` (default **30**).
3. Guarda `previousStatusPerfil` e põe perfil AFU em `suspenso`; refresh token revogado.
4. Cancelamento durante a graça:
   - autenticado: `auth.lgpd.cancelErase`
   - **sem sessão / pós WP-06:** `auth.lgpd.cancelEraseWithCredentials` (e-mail+senha)
   - admin: `adminCancelErase`
   - ao cancelar, o perfil volta ao **status anterior** (não força `ativo` se já era suspensão admin)
5. Após a graça, a anonimização é **manual via admin** (`adminAnonymize`) — **não há cron/job automático** neste release. Operação em `db.transaction`; também anonimiza nome da org pessoal e limpa IP/UA em `lgpd_*`.
6. **Nunca** há `DELETE` hard da conta neste fluxo.

### Suspensão × login (coordenação WP-06)

Helper estável: `assertAccountActive(userId, { allowPendingErasure })` em `server/lgpd-account-active.ts`.

- WP-06 deve chamar esse helper em `loginWithEmail` / `authenticateRequest`.
- Com `{ allowPendingErasure: true }`, titular `suspenso` **somente** por exclusão LGPD ativa ainda autentica para cancelar.
- Se o login for bloqueado sem essa flag, use `cancelEraseWithCredentials`.

## Retenção (notas operacionais — PLACEHOLDER jurídico)

| Categoria | Retenção sugerida (operacional) |
|-----------|----------------------------------|
| Conta ativa | Enquanto houver relação contratual/uso |
| Após solicitação de exclusão | Dados preservados durante graça (default 30 dias) |
| Após anonimização | Identificadores pessoais removidos/substituídos; IDs técnicos e vínculos agronômicos podem permanecer para integridade |
| Consentimentos e audit LGPD | Manter para demonstração de conformidade (prazo legal a validar com DPO) |
| Backups | Seguem política de backup da infra (Railway/Hostinger); purge alinhado ao ciclo de backup — PLACEHOLDER |

## Endpoints tRPC

```
auth.lgpd.info                  (público) versões + graça
auth.lgpd.consents              (autenticado)
auth.lgpd.recordConsent         (autenticado)
auth.lgpd.export                (autenticado) → JSON
auth.lgpd.deletionStatus        (autenticado)
auth.lgpd.requestErase          (autenticado)
auth.lgpd.cancelErase           (autenticado)
auth.lgpd.cancelEraseWithCredentials (público: email+senha — pós-bloqueio WP-06)
auth.lgpd.adminListEraseRequests (admin)
auth.lgpd.adminCancelErase      (admin)
auth.lgpd.adminAnonymize        (admin) — manual após graça; sem cron
```

URLs públicas (Play Store / PR #60): `https://afuagro.tech/privacidade` e `/termos` redirecionam para `/legal/privacidade` e `/legal/termos` (`vercel.json` + rotas Expo alias).

Exemplo curl (export):

```bash
curl -X POST localhost:3000/api/trpc/auth.lgpd.export \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"json":null}'
```

## Play Store — Data safety (notas para o dono)

Preencher o formulário Data safety com base no app real. Rascunho operacional:

| Pergunta Play | Resposta sugerida (rascunho) |
|---------------|------------------------------|
| Coleta dados pessoais? | **Sim** |
| Dados coletados | Nome, e-mail, telefone; dados de app (propriedades, cultivos); fotos (diagnóstico); IDs do dispositivo (push); IP em logs de consentimento |
| Finalidade | Funcionalidade do app, gestão de conta, segurança/fraude, analytics internos (se aplicável — PLACEHOLDER) |
| Dados compartilhados com terceiros? | Infra (hosting, e-mail, push, object storage). **Não vender** dados |
| Criptografia em trânsito | **Sim** (HTTPS) |
| Usuários podem solicitar exclusão? | **Sim** — in-app (Perfil → Solicitar exclusão) + este doc |
| Política de privacidade (URL) | Publicar `/legal/privacidade` (web) ou página institucional — **dono deve publicar URL estável** |
| Criptografia em repouso | Depende do provedor MySQL/storage — documentar no painel cloud |

Checklist dono antes do submit Play:

1. Revisar textos PLACEHOLDER com advogado/DPO.
2. Preencher CNPJ, razão social e e-mail do DPO em `/legal/privacidade`.
3. Publicar URL pública da política.
4. Confirmar se imagens de diagnóstico são “fotos” no formulário Data safety.
5. Rodar `npm run db:schema:prepare` em cada ambiente após merge.

## Testes

```bash
npm run test -- tests/lgpd.test.ts
npm run db:schema:prepare   # aplica 0043
```

## Passos do dono (Ivan / AFU Agro)

1. Revisar e aprovar textos de Termos/Privacidade (remover banners PLACEHOLDER só após parecer).
2. Definir e-mail DPO / privacidade e atualizar `app/legal/privacidade.tsx` + este doc.
3. Aplicar schema em staging/prod: `npm run db:schema:prepare`.
4. Smoke: cadastro com aceite → Perfil exporta JSON → solicitar exclusão → ver em Admin LGPD → cancelar ou anonimizar após graça.
5. Preencher Data safety na Play Console com a tabela acima.
6. Não ativar hard-delete; qualquer pedido de “apagar tudo agora” deve seguir o fluxo de graça + anonimização.
