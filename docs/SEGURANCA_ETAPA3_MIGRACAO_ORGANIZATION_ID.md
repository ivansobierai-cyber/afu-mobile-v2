# Etapa 3 — Migração `organizationId`

**Status:** implementada  
**Branch:** `cursor/security-multitenant-audit-fd64`  
**Pré-requisitos:** Etapas 1–2

## Objetivo

Adicionar e preencher `organizationId` nos registros privados, sem perda de dados e sem tornar a coluna NOT NULL neste release (rollback simples).

## Entregas

| Item | Arquivo |
|------|---------|
| Migration colunas + índices | `drizzle/0016_organization_id_backfill.sql` |
| Schema Drizzle | `drizzle/schema.ts` |
| Backfill + órfãos + validação | `scripts/backfill-organization-id.ts` |
| Relatório gerado | `docs/SEGURANCA_ETAPA3_ORFAOS_REPORT.json` |
| Stamp em creates | `server/db.ts` (`createPropriedade/Terreno/Cultura/Diagnostico/Tarefa`) |

## Tabelas com `organizationId`

`propriedades`, `terrenos`, `culturas`, `diagnosticos_ia`, `analises_fitotecnicas`, `relatorios`, `calendario_cuidados`, `tarefas_operacionais`, `sensores`, `ocorrencias_campo`, `estoque_itens`, `orcamentos_safra`, `custos_operacao`, `atividade_propriedade`

Índices: `(organizationId)` e compostos `(organizationId, propriedadeId)` / `(organizationId, id)` onde aplicável.

## Cadeia de backfill

1. Garante org pessoal (Etapa 2)  
2. `propriedades` ← `produtores.organizationId`  
3. Filhos com `propriedadeId` ← `propriedades.organizationId`  
4. Diagnósticos/análises/calendário/relatórios sem propriedade ← org do produtor do `usuarioId`  
5. Relatório de órfãos (`organizationId IS NULL`)  
6. Compara contagens BEFORE/AFTER — falha se alguma tabela perder linhas  

## Aceite (local 2026-07-18)

- Contagens BEFORE = AFTER em todas as tabelas  
- `totalOrphans = 0`  
- `dataLoss = false`  
- Organizações: 1 por proprietário atual (3 orgs / 3 produtores)

## Como aplicar (staging/prod)

```bash
# 1) migration
sed 's/--> statement-breakpoint//g' drizzle/0016_organization_id_backfill.sql | mysql … afu_mobile
# ou drizzle-kit migrate no start da API

# 2) backfill
npx tsx scripts/backfill-organization-id.ts

# 3) revisar
cat docs/SEGURANCA_ETAPA3_ORFAOS_REPORT.json
```

## Rollback

1. Não há DROP de dados — apenas colunas novas.  
2. Reverter código que filtra por `organizationId`.  
3. Opcional: `ALTER TABLE … DROP COLUMN organizationId` + drop índices.  
4. Restaurar backup se necessário antes de qualquer NOT NULL futuro.

## Fora do escopo (Etapa 4+)

- Tornar `organizationId` NOT NULL  
- Filtrar todas as APIs por `organizationId` (Etapa 4)  
- Corrigir IDORs P0 restantes  
- FK rígida para `organizations.id` (avaliar após estabilidade)
