# Drizzle migrations

Linear history used by `drizzle-kit migrate` (see `meta/_journal.json`):

| idx | Tag | Contents |
|-----|-----|----------|
| 0–4 | `0000`…`0004_*` | Core app schema |
| 5 | `0005_cooing_wilson_fisk` | `tickets_suporte` + `mensagens_suporte` |
| 6 | `0007_push_tokens` | `push_tokens` *(filename keeps historical `0007_` prefix)* |
| 7 | `0007_talented_deathbird` | Banco agronômico (`culturas_catalogo`, …) |
| 8–11 | `0008`…`0011_*` | Expansão 35–46 (zonas/solos, lab/economia, camadas_geo, noc/arch) |
| 12 | `0012_confused_mojo` | Unique `economia_cultura.culturaCatalogoId` |
| 13–19 | `0013`…`0019_*` | Tarefas, propriedades, organizations, audit, sync, AI policy |
| 20–26 | `0022`…`0028_*` | Tarefas bulk, máquinas, estoque, financeiro, equipe *(journal pula 0020/0021)* |

**Do not rename applied tags** — `__drizzle_migrations` already records them.

## Migrations fora do journal (0020, 0021, 0029–0044)

Arquivos SQL em `drizzle/0020_safras.sql`, `0021_property_archive.sql`, `0029_*` … `0044_*` são aplicados por scripts idempotentes e orquestrados por:

```bash
npm run db:schema:prepare
```

Detalhes, rollback e inventário completo: **`docs/DB_SCHEMA_PREPARE.md`**.

**Numeração:** WP-02…WP-04 → `0040`…`0042`; WP-07/WP-06 → `0043`/`0044`. Se a ordem de merge mudar, renumerar o SQL + script `apply-*` + tag em `schema-prepare-core.ts` (não renomear tags já aplicadas em `__drizzle_migrations` / `afu_supplemental_migrations`).

Orphan duplicate SQL files (`0005_simple_shadowcat`, `0006_tickets_suporte`) were removed; they were never journaled and duplicated idx 5.
