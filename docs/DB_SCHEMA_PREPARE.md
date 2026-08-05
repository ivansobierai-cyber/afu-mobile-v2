# Preparação determinística do schema (Correção 1)

## Problema

Algumas migrations existem como SQL + scripts idempotentes (`apply-0020-safras.ts`, etc.) mas **não** estão no `drizzle/meta/_journal.json` (ex.: `0020_safras`, `0021_property_archive` entre `0019` e `0022`). Sem orquestração única, instalações novas dependiam de memorizar vários `npm run db:*:apply`.

## Entrada única

```bash
npm run db:schema:prepare
```

Fluxo:

1. `drizzle-kit migrate` — histórico journalizado (`0000` … `0028` no journal atual).
2. Manifesto ordenado em `scripts/lib/schema-prepare-core.ts` — scripts idempotentes (reparo + supplemental).
3. Verificação de invariantes por passo (falha explícita, sem ignorar erro).
4. Registro em `afu_supplemental_migrations` (tag estável por passo).

Verificação sem aplicar:

```bash
npm run db:schema:verify
```

CI e boot de produção (`scripts/start-api-production.sh`) usam `db:schema:prepare`.

## Instalação limpa (desenvolvimento)

```bash
npm run db:up          # ou MySQL local
cp .env.example .env
npm run db:schema:prepare
npm run seed           # opcional
```

Alternativa legada: `npm run db:push` (generate + migrate) **ainda não** aplica supplemental; prefira `db:schema:prepare`.

## Bancos que já usaram apply scripts

- Scripts continuam idempotentes (`db:safras:apply`, `db:archive:apply`, …).
- `db:schema:prepare` reaplica com segurança e preenche `afu_supplemental_migrations`.
- `backfillSupplementalRecordsFromSchema()` (usado em testes) registra passos cujo schema já existe sem reexecutar DDL destrutivo.

## Rollback / recuperação

**Não há rollback automático de DDL** nesta camada (por design — sem DROP de tabelas).

| Situação | Ação |
|----------|------|
| Prepare falhou no meio | Corrigir causa (log do passo `tag`), rodar `npm run db:schema:prepare` de novo (idempotente). |
| Registro ausente mas schema OK | `npm run db:schema:prepare` ou backfill em código de manutenção. |
| Reverter coluna/tabela (staging) | Restaurar backup MySQL ou SQL manual documentado em `docs/SEGURANCA_ETAPA3_MIGRACAO_ORGANIZATION_ID.md` / ensaio `tests/etapa10-rollback-rehearsal.test.ts` — **nunca** em produção sem backup. |
| Journal Drizzle | Não renomear tags em `__drizzle_migrations`; não inserir retroativamente `0020`/`0021` no journal em bancos já migrados. |

## Inventário 0019–0036 (resumo)

| ID | Journal `drizzle-kit migrate` | Script apply | Registro supplemental |
|----|------------------------------|--------------|------------------------|
| 0019 | sim | repair `db:sync-ai:apply` | `0018_0019_sync_ai_repair` |
| 0020 | **não** | `db:safras:apply` | `0020_safras` |
| 0021 | **não** | `db:archive:apply` | `0021_property_archive` |
| 0022–0028 | sim | repair idempotente | `0022_*_repair` … `0028_*` |
| 0029–0036 | **não** | `db:*:apply` | tags `0029_*` … `0036_*` |

`0030` (NOT NULL em culturas) é **opcional** no verify (`required: false`) — falha se houver cultivos sem safra/talhão; em banco vazio aplica normalmente.

## Por que não editar o journal retroativamente

Inserir `0020`/`0021` no `_journal.json` após deploys que já gravaram `__drizzle_migrations` até `0022+` pode confundir ordem/percepção do Drizzle e não reflete o que produção já executou via scripts. A camada supplemental + tabela de registro é aditiva e compatível com ambos os caminhos.
