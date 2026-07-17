# Drizzle migrations

Linear history used by `drizzle-kit migrate` (see `meta/_journal.json`):

| idx | Tag | Contents |
|-----|-----|----------|
| 0–4 | `0000`…`0004_*` | Core app schema |
| 5 | `0005_cooing_wilson_fisk` | `tickets_suporte` + `mensagens_suporte` |
| 6 | `0007_push_tokens` | `push_tokens` *(filename keeps historical `0007_` prefix)* |
| 7 | `0007_talented_deathbird` | Banco agronômico (`culturas_catalogo`, …) |
| 8–11 | `0008`…`0011_*` | Expansão 35–46 (zonas/solos, lab/economia, camadas_geo, noc/arch) |

**Do not rename applied tags** — `__drizzle_migrations` already records them.

Orphan duplicate SQL files (`0005_simple_shadowcat`, `0006_tickets_suporte`) were removed; they were never journaled and duplicated idx 5.
