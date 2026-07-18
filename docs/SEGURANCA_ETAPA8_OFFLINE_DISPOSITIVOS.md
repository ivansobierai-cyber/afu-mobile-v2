# Etapa 8 — Offline e dispositivos

**Status:** concluída  
**Branch:** `cursor/security-multitenant-audit-fd64`  
**Fonte:** `AFU_Agro_Prompt_Seguranca_Dados_Multitenant.md` § 10 / Etapa 8

---

## Objetivo

Banco local e filas isolados por usuário + organização + dispositivo; troca de conta sem exibir/enviar dados anteriores; revalidação de permissões na sync; conflitos registrados (não last-write-wins silencioso).

---

## O que foi implementado

| Peça | Detalhe |
|------|---------|
| Escopo | `lib/offline/tenant-scope.ts` — `userId` + `organizationId` + `deviceId` |
| Fila core | `core-mutation-queue.ts` — chave `afu:u{u}:o{o}:d{d}:queue:core`; itens carimbados |
| Banco local | `tenant-local-db.ts` — KV namespaced; mídia opcionalmente cifrada (`secure-blob.ts`) |
| Conflitos locais | `sync-conflicts.ts` — permission/auth/geometry/approved/max_retries |
| Conflitos servidor | tabela `sync_conflicts` (`0018_sync_conflicts.sql`) + `server/sync-conflicts.ts` |
| Geometria | `expectedGeometriaVersao` → `CONFLICT` + audit `sync.conflict` |
| Tarefas | bloqueio de alteração em `aprovada`; `expectedStatus` na transition |
| Estoque | continua via **movimentos** (não sobrescreve saldo) |
| Logout | drena fila (best-effort) → `cleanupOfflineScope(..., "logout")` |
| Troca de org | filas da org anterior permanecem namespaced; RQ clear (Etapa 7) |
| Cart / cards / mídia | chaves por escopo (não globais) |

### Chave local

```text
afu:u{userId}:o{organizationId}:d{deviceId}:{namespace}:{key}
```

A fila global legada `afu_core_mutation_queue` é **descartada** (nunca migrada entre contas).

### Revalidação na sync

Cada item é executado via mutações tRPC (`organizationProcedure` / `orgPermissionProcedure`).  
`FORBIDDEN` / `UNAUTHORIZED` / `NOT_FOUND` / `CONFLICT` → item sai da fila e vira registro de conflito (fila **não** concede autorização permanente).

---

## Aceite

- [x] Login com outra conta no mesmo aparelho não lê nem envia a fila da conta anterior
- [x] Troca de organização troca o escopo da fila/cache
- [x] Logout limpa dados locais do escopo ativo após tentar sync
- [x] Geometria/tarefas aprovadas geram conflito auditável
- [x] Blobs sensíveis podem ser cifrados com AES-GCM (Web Crypto) quando disponível

---

## Migração

```bash
mysql ... < drizzle/0018_sync_conflicts.sql
# ou: aplicar via cliente MySQL local
```

---

## Como validar

```bash
npm run test -- tests/core-mutation-queue.test.ts tests/offline-tenant-scope.test.ts
```

Manual:

1. Conta A offline → criar propriedade (fila pendente).
2. Logout → login conta B → `pending === 0` e dashboard sem dados de A.
3. Conta A de novo na mesma org → fila só se não tiver sido limpa no logout.
4. Duas edições de geometria com versões divergentes → `CONFLICT` + linha em `sync_conflicts`.

---

## Próxima etapa

- Etapa 9: IA, logs e governança
