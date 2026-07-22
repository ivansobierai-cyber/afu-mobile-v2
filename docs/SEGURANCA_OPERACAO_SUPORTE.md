# Operação e suporte — isolamento multi-tenant

**Fonte:** Etapa 10 / § 14–16 do prompt mestre  
**Suite:** `npm run test:security:etapa10` → `docs/evidencias/etapa10-security-latest.json`

---

## 1. Deploy (staging → produção)

1. Backup do MySQL.
2. Aplicar migrações na ordem:
   - `drizzle/0015_organizations.sql`
   - `drizzle/0016_organization_id_backfill.sql`
   - `drizzle/0017_private_files_audit.sql`
   - `drizzle/0018_sync_conflicts.sql`
   - `drizzle/0019_ai_org_policy.sql`
3. Subir API e rodar `npm run test:security:etapa10` contra o ambiente (ou CI com DB de staging).
4. Feature flags:
   - `AI_ALLOW_TRAINING=false` (padrão seguro).
   - Não publicar seeds demo em staging compartilhado.

### Variáveis críticas

| Var | Uso |
|-----|-----|
| `JWT_SECRET` | Sessão + tokens de download |
| `DATABASE_URL` | MySQL |
| `BUILT_IN_FORGE_API_URL` / `KEY` | Storage (sem isso, proxy retorna 503 após ACL) |

---

## 2. Monitoramento

| Sinal | Interpretação |
|-------|----------------|
| Pico de `NOT_FOUND` em rotas core | Possível enumeração / ataque cross-tenant (esperado em baixo volume) |
| Pico de `FORBIDDEN` pós-login | Memberships inconsistentes / org ativa órfã |
| `audit_logs.action = sync.conflict` + `permission_denied` | Usuário removido ainda com fila offline |
| `ai.invoke_failed` | Falha IA; checar se há tentativa com `propriedadeId` alheio |
| `admin.*` fora do horário | Revisar acessos admin |

Consultas úteis (MySQL):

```sql
-- Últimos downloads / AI / admin
SELECT createdAt, action, organizationId, actorUserId, resourceType, storageKey
FROM audit_logs
ORDER BY id DESC
LIMIT 50;

-- Memberships removidos ainda com activeOrganizationId apontando para a org
SELECT u.id AS perfilId, u.userId, u.activeOrganizationId, m.status
FROM usuarios_afu u
JOIN organization_memberships m
  ON m.userId = u.userId AND m.organizationId = u.activeOrganizationId
WHERE m.status IN ('removido', 'suspenso');
```

(Após Etapa 10, `setMembershipStatus` já zera `activeOrganizationId`; a query acima deve retornar vazio.)

---

## 3. Plano de incidente (acesso cruzado ou vazamento)

1. **Conter:** suspender memberships suspeitos (`status = suspenso` / `removido`).
2. **Sessões:** forçar logout; se token de download/sessão vazou, rotacionar `JWT_SECRET` (invalida JWTs).
3. **Arquivos:** revogar acesso Forge se necessário; URLs temporárias expiram em ~5 min.
4. **Offline:** orientar logout nos dispositivos; filas namespaced não devem syncar após remoção (`permission_denied` → conflito).
5. **Auditar:** exportar `audit_logs` do período; correlacionar `actorUserId` × `organizationId`.
6. **Comunicar:** escopo afetado (orgs), janela temporal, ações tomadas.
7. **Pós-mortem:** gap no checklist de `SEGURANCA_GUIA_NOVA_FUNCAO.md`? Abrir teste em `cross-tenant-attack.test.ts`.

---

## 4. Suporte — perguntas frequentes

| Sintoma | Causa provável | Ação |
|---------|----------------|------|
| “Recurso não encontrado” em dado que o usuário cria | Org ativa errada / membership removido | Verificar `activeOrganizationId` e memberships ativos |
| Dashboard vazio após trocar conta no mesmo aparelho | Cache limpo (esperado) | Aguardar refetch; se dados da conta anterior aparecerem → bug de cache |
| Download de laudo 401/403 | Token expirado ou sem membership | Gerar nova URL; checar papel `reports.read` |
| Fila offline não sobe | Membership removido / conflito | Ver `sync_conflicts`; limpar item ou restaurar membership |
| Admin vê conteúdos de outra conta | Chaves legadas pré-namespace | Logout; legado `admin_*` é descartado no load |

Demo local (não staging compartilhado): `demo@afuagro.com.br` / `Demo@1234`.

---

## 5. Rollback (ensaio)

Documentado em `SEGURANCA_ETAPA10_TESTES_IMPLANTACAO.md` §4 e `tests/etapa10-rollback-rehearsal.test.ts`.

- **Não** dropar `organizationId` nem tabelas `organizations` / `private_files` / `audit_logs` em produção sem backup e plano.
- Rollback pontual seguro: colunas de política IA (`0019`) e tabela `sync_conflicts` (`0018`) se necessário.

---

## 6. Contatos / handoff

- Evidências de suite: `docs/evidencias/etapa10-security-latest.json`
- Guia para novos endpoints: `docs/SEGURANCA_GUIA_NOVA_FUNCAO.md`
- Conclusão global §16: `docs/SEGURANCA_CONCLUSAO_GLOBAL.md`
