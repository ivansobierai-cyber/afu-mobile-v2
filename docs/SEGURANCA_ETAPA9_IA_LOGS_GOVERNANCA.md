# Etapa 9 — IA, logs e governança

**Status:** concluída  
**Branch:** `cursor/security-multitenant-audit-fd64`  
**Fonte:** `AFU_Agro_Prompt_Seguranca_Dados_Multitenant.md` § 11–12 / Etapa 9

---

## Objetivo

Contexto de IA separado por organização; memória limpa ao trocar propriedade; dados mínimos ao modelo; sem treinamento com dados privados sem autorização; logs sem senhas/tokens/documentos; auditoria de acessos administrativos.

---

## O que foi implementado

| Peça | Detalhe |
|------|---------|
| IA autenticada | `diagnostico.analisar` e `analise.interpretar` → `organizationProcedure` |
| Escopo | Valida `propriedadeId`/`culturaId` no tenant; prompt com ids internos, sem nome de fazenda |
| Mínimo necessário | `server/ai-governance.ts` — allowlists + prompts enxutos; imagem truncada |
| Sem treinamento | `store: false` no invoke; `AI_ALLOW_TRAINING` + `organizations.aiAllowModelImprovement` (default false) |
| Memória cliente | `lib/ai/ai-context-store.ts` + `useAiContext` — limpa na troca de org/propriedade/logout |
| Auditoria IA | `ai.invoke` / `ai.invoke_failed` em `audit_logs` (modelo, campos, propósito) |
| Logs | `server/_core/safe-logger.ts`; password-reset sem token; LLM errors redigidos |
| Admin | `adminProcedure` registra `admin.access` / `admin.mutation`; break-glass em arquivos |
| Política org | `organizations.aiPolicy` / `setAiPolicy` + migração `0019_ai_org_policy.sql` |

### Política de treinamento

```text
effective = AI_ALLOW_TRAINING(env) AND organization.aiAllowModelImprovement
```

Default de ambos: **false**. Mesmo com opt-in, o cliente LLM envia `store: false`.

### Disclaimer de saída

Toda resposta de IA inclui `disclaimer` orientando revisão humana.

---

## Aceite

- [x] Contexto/memória de IA não atravessam tenants nem propriedades
- [x] Endpoints de IA exigem organização ativa
- [x] Logs não contêm credenciais, tokens ou base64 de documentos/imagens
- [x] Ações admin e break-glass geram `audit_logs`
- [x] Melhoria de modelo exige autorização explícita

---

## Migração

```bash
mysql ... < drizzle/0019_ai_org_policy.sql
```

---

## Como validar

```bash
npm run test -- tests/ai-governance.test.ts
```

Manual:

1. Sem login → `diagnostico.analisar` → UNAUTHORIZED.
2. Org A analisa → audit `ai.invoke` com `organizationId` A.
3. Trocar propriedade no app → memória AI da propriedade anterior limpa.
4. Solicitar reset de senha → logs sem token em claro.
5. Admin `setRole` → linha `admin.mutation` em `audit_logs`.

---

## Próxima etapa

- Etapa 10: testes de isolamento, rollout e monitoramento
