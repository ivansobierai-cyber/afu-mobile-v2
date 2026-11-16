# WP-08 — MFA TOTP (admin/técnico)

**Status:** implementado (Express + tRPC + MySQL + Drizzle + Expo)  
**Escopo:** TOTP (app autenticador), desafio no login, recovery codes, admin reset, enforcement em `adminProcedure`.  
**Fora de escopo neste pacote:** MFA por e-mail/SMS (planejado depois).

## O que foi entregue

| Capacidade | Onde |
|------------|------|
| Tabela `user_mfa` (secret AES-GCM, recovery hashes) | `drizzle/schema.ts` + `drizzle/0045_mfa_totp.sql` |
| Migração supplemental `0045` | `npm run db:mfa:apply` (via `db:schema:prepare`) |
| TOTP RFC 6238 (sem lib OTP externa) | `server/mfa-totp.ts` |
| Challenge JWT pós-senha | `server/mfa-challenge.ts` + `auth.verifyMfa` |
| APIs tRPC | `auth.mfa.*` + `auth.verifyMfa` em `auth-router.ts` |
| Gate admin | `adminProcedure` → `assertAdminMfaSatisfied` |
| UI enroll / recovery | `app/mais/seguranca-mfa.tsx` |
| UI admin reset | `app/mais/admin-mfa.tsx` |
| Login 2º fator | `app/auth/login.tsx` + `hooks/use-auth-api.ts` |

### Numeração

- WP-08 usa **`0045_mfa_totp`** (0040–0044 já reservados / mergeados).
- Não renomear tags já aplicadas em `afu_supplemental_migrations`.

## Fluxos

### Login com MFA ativo

1. `auth.login` valida e-mail/senha.
2. Se `user_mfa.totpEnabled`, retorna `{ mfaRequired, mfaToken }` **sem** access/refresh.
3. Cliente chama `auth.verifyMfa` com TOTP ou recovery code.
4. Sessão completa é emitida; recovery code consumido é removido.

### Enrollment

1. `auth.mfa.setup` → secret + otpauth + QR data URL (pending).
2. `auth.mfa.confirm` com 1º código → ativa MFA e devolve recovery codes **uma vez**.
3. Admin/técnico vê `mfaSetupRequired` no login até enrollar.

### Admin reset

- `auth.mfa.adminReset({ userId })` limpa secret/recovery (audit `mfa.admin_reset`).
- Quem reseta precisa ser admin (e, em produção, ter MFA próprio — ver enforcement).

## Enforcement

- **Login:** sempre exige 2º fator se MFA estiver ativo.
- **`adminProcedure`:** bloqueia se o admin ainda não enrollou (`MFA_SETUP_REQUIRED`), salvo `MFA_ADMIN_ENFORCE=0` (Vitest / break-glass).
- Produção: **não** definir `MFA_ADMIN_ENFORCE=0`.

## Endpoints

```
auth.login                         → pode retornar mfaRequired + mfaToken
auth.verifyMfa                     (público: mfaToken + code)
auth.mfa.status                    (autenticado)
auth.mfa.setup                     (autenticado)
auth.mfa.confirm                   (autenticado)
auth.mfa.disable                   (autenticado: TOTP ou recovery)
auth.mfa.regenerateRecoveryCodes   (autenticado: TOTP)
auth.mfa.adminStatus               (admin)
auth.mfa.adminReset                (admin)
```

## Deploy

```bash
npm run db:schema:prepare   # aplica 0045
```

Secrets: TOTP é cifrado com chave derivada de `JWT_SECRET`. Nunca logar/commitar secrets ou recovery codes em claro.
