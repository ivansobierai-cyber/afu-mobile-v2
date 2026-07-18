# Etapa 1 — Aceite: isolamento e segurança dos dados (+ correções de sessão/a11y)

**Branch:** `cursor/security-multitenant-audit-fd64`  
**Decisão:** critérios de isolamento **atendidos por API**; correções imediatas de sessão/a11y/login **aplicadas**.

---

## 1. Checklist de isolamento (obrigatório)

| Critério | Status | Evidência |
|----------|--------|-----------|
| Criar Organização A e B | OK | `tests/helpers/tenant-fixture.ts` → `createIsolatedTenantPair` |
| Usuário produtor por org | OK | `createUserWithEmail` + `ensurePersonalOrganization` |
| Propriedades, talhões, cultivos e tarefas diferentes | OK | Fixture cria propriedade, terreno, cultivo, tarefa por org |
| Autenticar como A e tentar CRUD em B | OK | `tests/cross-tenant-attack.test.ts` |
| Retorno 403 / 404 / lista vazia | OK | Preferência `NOT_FOUND` (404-class); listas sem registro de B |
| Testes por API (não só UI) | OK | Vitest + `appRouter.createCaller` |
| Tabelas privadas com `organizationId` | OK | `TENANT_PRIVATE_TABLES` + schema Etapa 3 |
| RLS ou autorização equivalente | OK | `server/tenant-db.ts` + `organizationProcedure` |
| Auditoria de tentativas bloqueadas | OK | `access.denied` via `auditAccessDenied` / `requirePropertyInTenant` |
| Auditoria de acessos permitidos | OK | `file.download`, `report.*`, `ai.invoke`, `admin.*` |

### Como executar o teste cruzado A × B

```bash
sudo service mysql start   # ambiente cloud
npm run test:security:etapa10
# ou foco:
npx vitest run tests/cross-tenant-attack.test.ts tests/storage-proxy.test.ts
```

---

## 2. Correções imediatas (sessão / a11y / login)

| Correção | Status | Onde |
|----------|--------|------|
| Tela pública imediata; sessão em background | OK | `app/_layout.tsx` — gate só em rotas protegidas |
| Timeout ~1–2s na verificação | OK | `SESSION_VERIFY_TIMEOUT_MS = 2000` em `hooks/use-session.ts` |
| Controles clicáveis com role button/link | OK | `AuthButton`, `Pressable` no login |
| Label associado aos campos | OK | `AuthTextInput` (`accessibilityLabel` + `nativeID`) |
| `autocomplete="email"` e `current-password` | OK | Login + remoção de bloqueio de autofill |
| `h1` em “AFU Agro” e “Bem-vindo de volta” | OK | Welcome + `AuthCard` header/h1 |
| Formulário login 480–560px | OK | `maxWidth: 520` em `app/auth/login.tsx` |
| Ocultar demos em produção | OK | `isDemoLoginEnabled()` + `EXPO_PUBLIC_SHOW_DEMO_LOGIN` (doc em `.env.example`) |
| Desmontar protegidos se desautenticado | OK | `ProtectedStack` + `RouteGuard` → `null` |
| Testes automatizados A×B | OK | Suite Etapa 10 / cross-tenant |

---

## 3. Riscos / follow-ups

- Colunas `organizationId` ainda nullable em algumas tabelas (legado Etapa 3) — endurecer `NOT NULL` após orphans=0.
- Tabelas filhas (`apontamentos_operacao`, etc.) escopadas via pai — documentado em Etapa 5.
- Revisor de segurança humano independente permanece gate de produto.

---

## 4. Decisão

**Aceitar Etapa 1 (isolamento)** e avançar para Etapa 2 do plano de propriedades, desde que:

1. `npm run test:security:etapa10` passe no ambiente alvo  
2. Produção **não** defina `EXPO_PUBLIC_SHOW_DEMO_LOGIN=1`  
3. Migrações `0015`–`0019` aplicadas no deploy
