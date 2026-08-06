# SUBFASE 0A — Homologação MySQL da Correção 1

**Data da homologação (sessão cloud):** 2026-08-05  
**Escopo:** `db:schema:prepare` / `db:schema:verify` (Correção 1)  
**PR:** [#32](https://github.com/ivansobierai-cyber/afu-mobile-v2/pull/32) (draft, **merge não autorizado**)  
**SHA canônico (remoto / PR / homologação):** `3aac437c03bf3eaf0636d8b415018fff074d9cee`  
**SHA local equivalente em `main`:** `8d4ff2c82bc0a3408addb5bcce8fab4672ea61e7` — mesmo conteúdo (`git diff 3aac437 8d4ff2c` sem diferenças); **não** são duas correções distintas.

**Aceite formal:** usuário aceitou o resultado **CORREÇÃO 1 HOMOLOGADA** em 2026-08-05 (sem reexecução MySQL nesta regularização).

---

## Escopo deste documento

| Fonte | O que registra |
|--------|----------------|
| **Resultados formalmente aceitos** | Relatório da homologação executada na sessão cloud (ambiente Linux, MySQL isolado). |
| **Workspace Windows (regularização)** | Este arquivo e os demais docs da FASE 0; **sem** nova homologação MySQL. |
| **Logs `/tmp/homolog-0a/`** | **Não** disponíveis neste workspace; **não** foram reinspecionados aqui. |

---

## Ambiente MySQL isolado (sessão cloud aceita)

| Item | Valor |
|------|--------|
| Instância | Dedicada a homologação (não produção; não `afu_mobile` de dados de dev importantes) |
| Datadir | `/tmp/mysql-homolog` |
| Socket | `/tmp/mysql-homolog.sock` |
| Porta | **3307** |
| Usuário | `afu` / `afu_local_dev` |
| MySQL de sistema (`/var/lib/mysql`) | **Não utilizado** (falha InnoDB errno 22 no datadir antigo) |
| Docker | Indisponível no ambiente da homologação |

### Bancos de homologação

- `afu_homolog_empty`
- `afu_homolog_legacy`
- `afu_homolog_0030_bad`

---

## Cenários e resultados (sessão cloud — aceitos)

### 1. Banco vazio (`afu_homolog_empty`)

| Verificação | Resultado |
|-------------|-----------|
| `npm run db:schema:prepare` | **PASS** (exit 0) |
| `npm run db:schema:verify` | **PASS** |
| `__drizzle_migrations` | **27** linhas |
| `afu_supplemental_migrations` | **18** tags (incl. `0020_safras`, `0021_property_archive`, `0030`…`0036`) |
| Tabela `safras` | Presente |
| Archive em `propriedades` (`archivedAt`, `archivedByUserId`, `archiveMotivo` + índice) | Presente |
| Migration `0030` em banco vazio | **Aplicou** (`safraId` / `terrenoId` NOT NULL) |
| Erros silenciosos | Não observados no relatório aceito |

### 2. Idempotência / reaplicação (mesmo banco vazio)

| Verificação | Resultado |
|-------------|-----------|
| Tabela marker `homolog_marker` com linha descartável | **Preservada** após 2º `prepare` |
| Contagem supplemental | **18** antes e depois |
| Tags duplicadas | **Nenhuma** (`GROUP BY tag HAVING c>1` vazio) |
| 2º `prepare` + `verify` | **PASS** |
| 0030 na reaplicação | Comportamento `already NOT NULL` (não destrutivo) |

### 3. Banco legado (`afu_homolog_legacy`)

Simulação: `drizzle-kit migrate` + apenas `db:safras:apply` e `db:archive:apply`, **sem** tabela `afu_supplemental_migrations` (removida antes do prepare completo).

| Verificação | Resultado |
|-------------|-----------|
| Schema 0020/0021 já presente antes do prepare | Sim |
| `db:schema:prepare` | **PASS** |
| `db:schema:verify` | **PASS** |
| Backfill de registros supplementals | Sim; estado final **18** tags; consistente |

### 4. Migration 0030 — cenários explícitos

| Cenário | Comportamento (relatório aceito) |
|---------|----------------------------------|
| Banco vazio após prepare | **Aplica** NOT NULL e registra tag |
| Reaplicação | **Não** reaplica destrutivamente |
| Cultivo órfão (`safraId`/`terrenoId` NULL) + `db:cultivos-not-null:apply` isolado | **FAIL** (exit 1; recusa NOT NULL) |
| Mesmo órfão via `db:schema:prepare` | **Warning permitido**; passo opcional ignorado; **tag 0030 não registrada**; coluna permanece nullable; `verify` ok com obrigatórios = 17 |
| Schema parcial sem apply bem-sucedido | Tag 0030 **não** registrada |

---

## Testes executados (sessão cloud — aceitos)

| Comando | Classificação |
|---------|----------------|
| `npm run check` | **PASS** |
| `npm run build` | **PASS** |
| `npx vitest run tests/db-schema-prepare-manifest.test.ts tests/db-schema-prepare.test.ts` | **PASS** (7/7) |
| `AFU_RUN_DB_TESTS=1 npm run test:propriedades:etapa2` | **PASS** (`AVANCAR`, exit 0) |
| `npx vitest run tests/safras-entity.test.ts` | **PASS** (12/12) |

### Neste workspace Windows (regularização documental)

| Item | Classificação |
|------|----------------|
| Reexecução da homologação MySQL | **NÃO EXECUTADO** (por decisão explícita) |
| Inspeção dos logs `/tmp/homolog-0a/` | **NÃO EXECUTADO** (logs indisponíveis aqui) |

---

## Problemas ambientais (não atribuídos à Correção 1)

- Datadir MySQL padrão do ambiente cloud com InnoDB errno 22 — contornado com instância em `/tmp`.
- Alguns scripts de apply logam criação mesmo com `IF NOT EXISTS` (ruído; não destrutivo no relatório aceito).

---

## Conclusão

**CORREÇÃO 1 HOMOLOGADA** (referência técnica **`3aac437`** / PR #32).

- **SUBFASE 0B** (`diagnostics.write`): **não iniciada**.
- **Merge da PR #32:** **não autorizado** neste estágio.
- **Homologação MySQL:** **não repetir** até nova autorização.
