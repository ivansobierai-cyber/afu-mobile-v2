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

## Migrations fora do journal (0020, 0021, 0029–0036)

Arquivos SQL em `drizzle/0020_safras.sql`, `0021_property_archive.sql`, `0029_*` … `0036_*` são aplicados por scripts idempotentes e orquestrados por:

```bash
npm run db:schema:prepare
```

Detalhes, rollback e inventário completo: **`docs/DB_SCHEMA_PREPARE.md`**.

Orphan duplicate SQL files (`0005_simple_shadowcat`, `0006_tickets_suporte`) were removed; they were never journaled and duplicated idx 5.
