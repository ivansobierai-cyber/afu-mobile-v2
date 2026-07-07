# 📊 Relatório Técnico: Schema de Banco de Dados AFU v2

**Projeto:** AFU Mobile (Analisador Fitotécnico Universal)  
**Data:** Julho 2026  
**Versão:** 2.0  
**Banco de Dados:** MySQL 8.0+  
**ORM:** Drizzle ORM  
**Arquivo Schema:** `/drizzle/schema.ts`

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Diagrama de Relacionamentos](#diagrama-de-relacionamentos)
3. [Descrição Detalhada das Tabelas](#descrição-detalhada-das-tabelas)
4. [Relacionamentos e Constraints](#relacionamentos-e-constraints)
5. [Fluxo de Dados](#fluxo-de-dados)
6. [Etapas de Implementação](#etapas-de-implementação)

---

## 🎯 Visão Geral

O schema AFU v2 é composto por **17 tabelas** organizadas em **5 camadas funcionais**:

| Camada | Tabelas | Propósito |
|--------|---------|----------|
| **Autenticação** | `users` | Gerenciamento de sessões e credenciais |
| **Usuários & Perfis** | `usuarios_afu`, `produtores`, `parceiros` | Identidade e papéis no sistema |
| **Operações Agrícolas** | `propriedades`, `terrenos`, `culturas` | Estrutura de propriedades e cultivos |
| **Análises & Diagnósticos** | `diagnosticos_ia`, `analises_fitotecnicas`, `relatorios` | Processamento de dados agrícolas |
| **IoT & Marketplace** | `sensores`, `leituras_sensores`, `materiais_didaticos`, `calendario_cuidados`, `pragas_doencas`, `produtos_marketplace`, `pedidos` | Monitoramento e comércio |

---

## 🔗 Diagrama de Relacionamentos

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CAMADA DE AUTENTICAÇÃO                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  users (PK: id)                                                      │
│  ├─ id (INT, AUTO_INCREMENT, PRIMARY KEY)                           │
│  ├─ openId (VARCHAR, UNIQUE) → OAuth identifier                     │
│  ├─ email (VARCHAR, UNIQUE) → Email/senha login                     │
│  ├─ passwordHash (VARCHAR) → Bcrypt hash                            │
│  ├─ loginMethod (VARCHAR) → 'oauth' | 'email' | 'email_oauth'      │
│  ├─ role (ENUM) → 'user' | 'admin'                                  │
│  ├─ refreshToken (VARCHAR) → JWT para renovação                     │
│  └─ timestamps (createdAt, updatedAt, lastSignedIn)                 │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 1:1
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CAMADA DE USUÁRIOS & PERFIS                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  usuarios_afu (PK: id, FK: userId → users.id)                       │
│  ├─ id (INT, AUTO_INCREMENT, PRIMARY KEY)                           │
│  ├─ userId (INT, UNIQUE, NOT NULL) → FK users.id [1:1]             │
│  ├─ nome (VARCHAR) → Nome completo                                  │
│  ├─ tipoUsuario (ENUM) → 'administrador'|'tecnico'|'produtor'|etc   │
│  ├─ status (ENUM) → 'ativo'|'inativo'|'suspenso'                    │
│  └─ timestamps (createdAt, updatedAt)                               │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │ usuarios_afu (1) ──────────────────┐                   │        │
│  │                                    │                   │        │
│  │                                 1:1│                   │        │
│  │                                    ▼                   │        │
│  │  produtores (PK: id, FK: usuarioId → usuarios_afu.id) │        │
│  │  ├─ id (INT, AUTO_INCREMENT, PRIMARY KEY)             │        │
│  │  ├─ usuarioId (INT, UNIQUE) → FK usuarios_afu.id      │        │
│  │  ├─ documento (VARCHAR) → CPF/CNPJ                    │        │
│  │  ├─ cidade, estado, pais (VARCHAR)                    │        │
│  │  ├─ tipoProdutor (ENUM) → 'familiar'|'comercial'|etc  │        │
│  │  └─ cadastroAtivo (BOOLEAN)                           │        │
│  │                                                        │        │
│  │  ┌──────────────────────────────────────────────────┐ │        │
│  │  │ produtores (1) ──────────────────┐               │ │        │
│  │  │                                  │               │ │        │
│  │  │                               1:N│               │ │        │
│  │  │                                  ▼               │ │        │
│  │  │  propriedades (FK: produtorId → produtores.id)  │ │        │
│  │  │  ├─ id (INT, PRIMARY KEY)                       │ │        │
│  │  │  ├─ produtorId (INT, NOT NULL) → FK             │ │        │
│  │  │  ├─ nome (VARCHAR)                              │ │        │
│  │  │  ├─ localização (lat, long, cidade, estado)     │ │        │
│  │  │  ├─ tamanhoArea (DECIMAL)                       │ │        │
│  │  │  ├─ tipoProducao (ENUM)                         │ │        │
│  │  │  └─ timestamps                                  │ │        │
│  │  │                                                 │ │        │
│  │  │  ┌────────────────────────────────────────────┐ │ │        │
│  │  │  │ propriedades (1) ────────────────┐         │ │ │        │
│  │  │  │                                  │         │ │ │        │
│  │  │  │                               1:N│         │ │ │        │
│  │  │  │                                  ▼         │ │ │        │
│  │  │  │  terrenos (FK: propriedadeId)   │         │ │ │        │
│  │  │  │  ├─ id (INT, PRIMARY KEY)       │         │ │ │        │
│  │  │  │  ├─ propriedadeId (INT, FK)     │         │ │ │        │
│  │  │  │  ├─ nome (VARCHAR)              │         │ │ │        │
│  │  │  │  ├─ area (DECIMAL)              │         │ │ │        │
│  │  │  │  └─ observacoes (TEXT)          │         │ │ │        │
│  │  │  │                                 │         │ │ │        │
│  │  │  │  ┌──────────────────────────────┘         │ │ │        │
│  │  │  │  │                                        │ │ │        │
│  │  │  │  │  propriedades (1) ──────────────┐     │ │ │        │
│  │  │  │  │                                 │     │ │ │        │
│  │  │  │  │                              1:N│     │ │ │        │
│  │  │  │  │                                 ▼     │ │ │        │
│  │  │  │  │  culturas (FK: propriedadeId, terrenoId) │ │        │
│  │  │  │  │  ├─ id (INT, PRIMARY KEY)      │     │ │ │        │
│  │  │  │  │  ├─ propriedadeId (INT, FK)    │     │ │ │        │
│  │  │  │  │  ├─ terrenoId (INT, FK, OPT)   │     │ │ │        │
│  │  │  │  │  ├─ nomeCultura (VARCHAR)      │     │ │ │        │
│  │  │  │  │  ├─ dataPlantio (DATE)         │     │ │ │        │
│  │  │  │  │  ├─ status (ENUM)              │     │ │ │        │
│  │  │  │  │  └─ timestamps                 │     │ │ │        │
│  │  │  │  │                                │     │ │ │        │
│  │  │  │  └────────────────────────────────┘     │ │ │        │
│  │  │  │                                         │ │ │        │
│  │  │  └─────────────────────────────────────────┘ │ │        │
│  │  │                                              │ │        │
│  │  │  propriedades (1) ──────────────┐           │ │        │
│  │  │                                 │           │ │        │
│  │  │                              1:N│           │ │        │
│  │  │                                 ▼           │ │        │
│  │  │  sensores (FK: propriedadeId)   │           │ │        │
│  │  │  ├─ id (INT, PRIMARY KEY)       │           │ │        │
│  │  │  ├─ propriedadeId (INT, FK)     │           │ │        │
│  │  │  ├─ tipoSensor (ENUM)           │           │ │        │
│  │  │  ├─ status (ENUM)               │           │ │        │
│  │  │  ├─ ultimaLeitura (DECIMAL)     │           │ │        │
│  │  │  └─ dataInstalacao (DATE)       │           │ │        │
│  │  │                                 │           │ │        │
│  │  │  ┌─────────────────────────────┘            │ │        │
│  │  │  │                                          │ │        │
│  │  │  │  sensores (1) ──────────────┐            │ │        │
│  │  │  │                             │            │ │        │
│  │  │  │                          1:N│            │ │        │
│  │  │  │                             ▼            │ │        │
│  │  │  │  leituras_sensores (FK: sensorId)       │ │        │
│  │  │  │  ├─ id (INT, PRIMARY KEY)   │            │ │        │
│  │  │  │  ├─ sensorId (INT, FK)      │            │ │        │
│  │  │  │  ├─ valor (DECIMAL)         │            │ │        │
│  │  │  │  ├─ dataLeitura (TIMESTAMP) │            │ │        │
│  │  │  │  └─ alertaGerado (BOOLEAN)  │            │ │        │
│  │  │  │                             │            │ │        │
│  │  │  └─────────────────────────────┘            │ │        │
│  │  │                                             │ │        │
│  │  └─────────────────────────────────────────────┘ │        │
│  │                                                  │        │
│  └──────────────────────────────────────────────────┘        │
│                                                               │
│  parceiros (PK: id)                                          │
│  ├─ id (INT, AUTO_INCREMENT, PRIMARY KEY)                   │
│  ├─ nome (VARCHAR)                                          │
│  ├─ tipo (ENUM) → 'laboratorio'|'cooperativa'|etc           │
│  ├─ localização (cidade, estado, telefone, email)           │
│  └─ status (ENUM) → 'ativo'|'inativo'                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                                    │
                                    │ N:1
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                 CAMADA DE ANÁLISES & DIAGNÓSTICOS                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  diagnosticos_ia (PK: id)                                           │
│  ├─ id (INT, PRIMARY KEY)                                           │
│  ├─ usuarioId (INT, FK → usuarios_afu.id)                           │
│  ├─ propriedadeId (INT, FK → propriedades.id)                       │
│  ├─ culturaId (INT, FK → culturas.id)                               │
│  ├─ imagemUrl (TEXT) → URL da imagem analisada                      │
│  ├─ pragaProvavel (VARCHAR) → Resultado da análise IA               │
│  ├─ doencaProvavel (VARCHAR)                                        │
│  ├─ deficienciaNutricional (VARCHAR)                                │
│  ├─ gravidade (ENUM) → 'saudavel'|'leve'|'moderada'|'grave'|'critica' │
│  ├─ confiancaIa (INT) → 0-100%                                      │
│  ├─ recomendacao (TEXT) → Ações sugeridas                           │
│  ├─ statusRevisao (ENUM) → 'pendente'|'revisado'|'confirmado'|'descartado' │
│  └─ dataDiagnostico (TIMESTAMP)                                     │
│                                                                       │
│  analises_fitotecnicas (PK: id)                                     │
│  ├─ id (INT, PRIMARY KEY)                                           │
│  ├─ usuarioId (INT, FK → usuarios_afu.id)                           │
│  ├─ propriedadeId (INT, FK → propriedades.id)                       │
│  ├─ culturaId (INT, FK → culturas.id)                               │
│  ├─ tipoAnalise (ENUM) → 'solo'|'agua'|'foliar'|'completa'          │
│  ├─ parâmetros (pH, N, P, K, Ca, Mg, matéria orgânica, umidade)    │
│  ├─ resultadoTecnico (TEXT) → JSON com interpretação IA             │
│  ├─ recomendacao (TEXT) → Recomendações técnicas                    │
│  └─ dataAnalise (TIMESTAMP)                                         │
│                                                                       │
│  relatorios (PK: id)                                                │
│  ├─ id (INT, PRIMARY KEY)                                           │
│  ├─ usuarioId (INT, FK → usuarios_afu.id)                           │
│  ├─ diagnosticoId (INT, FK → diagnosticos_ia.id, OPTIONAL)          │
│  ├─ analiseId (INT, FK → analises_fitotecnicas.id, OPTIONAL)        │
│  ├─ titulo (VARCHAR)                                                │
│  ├─ tipoRelatorio (ENUM) → 'diagnostico'|'analise_solo'|etc         │
│  ├─ arquivoPdfUrl (TEXT) → URL do PDF gerado                        │
│  ├─ status (ENUM) → 'rascunho'|'emitido'|'assinado'|'cancelado'     │
│  ├─ tecnicoResponsavelId (INT, FK → usuarios_afu.id)                │
│  ├─ conteudo (TEXT) → JSON com dados do relatório                   │
│  └─ dataEmissao (TIMESTAMP)                                         │
│                                                                       │
│  pragas_doencas (PK: id) ← Banco de Conhecimento                    │
│  ├─ id (INT, PRIMARY KEY)                                           │
│  ├─ nome (VARCHAR)                                                  │
│  ├─ nomeCientifico (VARCHAR)                                        │
│  ├─ tipo (ENUM) → 'praga'|'doenca'|'deficiencia'                    │
│  ├─ culturaAfetada (VARCHAR)                                        │
│  ├─ sintomas (TEXT)                                                 │
│  ├─ tratamento (TEXT)                                               │
│  ├─ prevencao (TEXT)                                                │
│  ├─ imagensReferencia (TEXT) → JSON array de URLs                   │
│  ├─ nivelRisco (ENUM) → 'baixo'|'medio'|'alto'|'critico'            │
│  └─ createdAt (TIMESTAMP)                                           │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ N:1
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│              CAMADA DE EDUCAÇÃO & AGENDAMENTO                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  materiais_didaticos (PK: id) ← Conteúdo educativo                  │
│  ├─ id (INT, PRIMARY KEY)                                           │
│  ├─ titulo (VARCHAR)                                                │
│  ├─ tipoMaterial (ENUM) → 'video'|'audio'|'apostila'|'guia'|etc     │
│  ├─ tema (VARCHAR)                                                  │
│  ├─ descricao (TEXT)                                                │
│  ├─ arquivoUrl (TEXT)                                               │
│  ├─ videoUrl (TEXT)                                                 │
│  ├─ idioma (VARCHAR) → pt-BR, en-US, etc                            │
│  ├─ publicoAlvo (ENUM) → 'produtor'|'tecnico'|'todos'               │
│  ├─ nivel (ENUM) → 'iniciante'|'intermediario'|'avancado'           │
│  ├─ status (ENUM) → 'ativo'|'inativo'|'rascunho'                    │
│  └─ createdAt (TIMESTAMP)                                           │
│                                                                       │
│  calendario_cuidados (PK: id)                                       │
│  ├─ id (INT, PRIMARY KEY)                                           │
│  ├─ usuarioId (INT, FK → usuarios_afu.id)                           │
│  ├─ propriedadeId (INT, FK → propriedades.id)                       │
│  ├─ culturaId (INT, FK → culturas.id)                               │
│  ├─ tipoAtividade (ENUM) → 'plantio'|'irrigacao'|'adubacao'|etc     │
│  ├─ titulo (VARCHAR)                                                │
│  ├─ descricao (TEXT)                                                │
│  ├─ dataProgramada (TIMESTAMP)                                      │
│  ├─ recorrencia (ENUM) → 'nenhuma'|'diaria'|'semanal'|'mensal'      │
│  ├─ prioridade (ENUM) → 'baixa'|'normal'|'alta'|'critica'           │
│  ├─ status (ENUM) → 'pendente'|'em_andamento'|'concluido'|'cancelado' │
│  ├─ lembreteAtivo (BOOLEAN)                                         │
│  └─ timestamps (createdAt, updatedAt)                               │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ N:1
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CAMADA DE MARKETPLACE                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  produtos_marketplace (PK: id)                                      │
│  ├─ id (INT, PRIMARY KEY)                                           │
│  ├─ vendedorId (INT, FK → usuarios_afu.id)                          │
│  ├─ nomeProduto (VARCHAR)                                           │
│  ├─ categoria (ENUM) → 'sementes'|'fertilizantes'|'defensivos'|etc  │
│  ├─ descricao (TEXT)                                                │
│  ├─ preco (DECIMAL)                                                 │
│  ├─ estoque (DECIMAL)                                               │
│  ├─ unidade (VARCHAR)                                               │
│  ├─ imagemUrl (TEXT)                                                │
│  ├─ status (ENUM) → 'disponivel'|'indisponivel'|'pausado'           │
│  └─ timestamps (createdAt, updatedAt)                               │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ produtos_marketplace (1) ──────────────┐                    │   │
│  │                                        │                    │   │
│  │                                     1:N│                    │   │
│  │                                        ▼                    │   │
│  │  pedidos (FK: produtoId, compradorId, vendedorId)          │   │
│  │  ├─ id (INT, PRIMARY KEY)              │                   │   │
│  │  ├─ compradorId (INT, FK)              │                   │   │
│  │  ├─ vendedorId (INT, FK)               │                   │   │
│  │  ├─ produtoId (INT, FK)                │                   │   │
│  │  ├─ quantidade (DECIMAL)               │                   │   │
│  │  ├─ valorUnitario (DECIMAL)            │                   │   │
│  │  ├─ valorTotal (DECIMAL)               │                   │   │
│  │  ├─ statusPedido (ENUM)                │                   │   │
│  │  ├─ statusPagamento (ENUM)             │                   │   │
│  │  ├─ enderecoEntrega (TEXT)             │                   │   │
│  │  ├─ dataPedido (TIMESTAMP)             │                   │   │
│  │  └─ dataEntrega (TIMESTAMP)            │                   │   │
│  │                                        │                   │   │
│  │  └────────────────────────────────────┘                    │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📝 Descrição Detalhada das Tabelas

### **Camada 1: Autenticação**

#### `users` (Tabela Raiz)
**Localização:** `/drizzle/schema.ts` (linhas 16-32)  
**Propósito:** Gerenciar autenticação OAuth e e-mail/senha  
**Chave Primária:** `id` (INT, AUTO_INCREMENT)  
**Índices Únicos:** `openId`, `email`, `resetToken`

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | INT | PK, AUTO_INCREMENT | Identificador único |
| `openId` | VARCHAR(64) | UNIQUE, NULL | Identificador OAuth (Google, GitHub, etc) |
| `name` | TEXT | NULL | Nome do usuário |
| `email` | VARCHAR(320) | UNIQUE, NULL | Email (login alternativo) |
| `passwordHash` | VARCHAR(255) | NULL | Hash bcrypt da senha |
| `loginMethod` | VARCHAR(64) | NULL | 'oauth' \| 'email' \| 'email_oauth' |
| `role` | ENUM | DEFAULT 'user' | 'user' \| 'admin' |
| `emailVerified` | BOOLEAN | DEFAULT FALSE | Email confirmado? |
| `resetToken` | VARCHAR(255) | UNIQUE, NULL | Token para reset de senha |
| `resetTokenExpiry` | TIMESTAMP | NULL | Expiração do token |
| `refreshToken` | VARCHAR(512) | NULL | JWT para renovação de sessão |
| `refreshTokenExpiry` | TIMESTAMP | NULL | Expiração do refresh token |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Data de criação |
| `updatedAt` | TIMESTAMP | DEFAULT NOW() | Última atualização |
| `lastSignedIn` | TIMESTAMP | DEFAULT NOW() | Último login |

**Fluxo de Autenticação:**
```
1. Usuário faz login (OAuth ou e-mail/senha)
2. Sistema valida credenciais
3. Gera accessToken (15 min) + refreshToken (30 dias)
4. Armazena refreshToken em users.refreshToken
5. Retorna tokens ao cliente
6. Cliente usa accessToken para requisições
7. Quando accessToken expira, usa refreshToken para renovar
```

---

### **Camada 2: Usuários & Perfis**

#### `usuarios_afu` (Perfil do Sistema)
**Localização:** `/drizzle/schema.ts` (linhas 65-87)  
**Propósito:** Estender dados de usuário com informações do sistema AFU  
**Chave Primária:** `id` (INT, AUTO_INCREMENT)  
**Chave Estrangeira:** `userId` → `users.id` (1:1, UNIQUE)

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | INT | PK, AUTO_INCREMENT | Identificador único |
| `userId` | INT | FK UNIQUE NOT NULL | Referência a users.id (relação 1:1) |
| `nome` | VARCHAR(150) | NOT NULL | Nome completo |
| `email` | VARCHAR(150) | NULL | Email (cópia de users.email) |
| `telefone` | VARCHAR(30) | NULL | Telefone de contato |
| `tipoUsuario` | ENUM | DEFAULT 'produtor' | 'administrador' \| 'tecnico' \| 'produtor' \| 'parceiro' \| 'comprador' |
| `status` | ENUM | DEFAULT 'ativo' | 'ativo' \| 'inativo' \| 'suspenso' |
| `registroProfissional` | VARCHAR(50) | NULL | CREA, CRBio, etc |
| `cargo` | VARCHAR(100) | NULL | Cargo/função |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Data de criação |
| `updatedAt` | TIMESTAMP | DEFAULT NOW() | Última atualização |

**Relacionamentos:**
- **1:1 com `users`** — Um usuário tem um perfil AFU
- **1:1 com `produtores`** — Se tipoUsuario='produtor'
- **1:N com `diagnosticos_ia`** — Um usuário faz múltiplos diagnósticos
- **1:N com `analises_fitotecnicas`** — Um usuário faz múltiplas análises
- **1:N com `relatorios`** — Um usuário gera múltiplos relatórios
- **1:N com `calendario_cuidados`** — Um usuário cria múltiplos eventos
- **1:N com `produtos_marketplace`** — Um usuário vende múltiplos produtos (se vendedor)
- **1:N com `pedidos`** — Um usuário faz múltiplos pedidos (como comprador)

---

#### `produtores` (Dados Específicos de Produtor)
**Localização:** `/drizzle/schema.ts` (linhas 98-118)  
**Propósito:** Armazenar dados específicos de produtores rurais  
**Chave Primária:** `id` (INT, AUTO_INCREMENT)  
**Chave Estrangeira:** `usuarioId` → `usuarios_afu.id` (1:1, UNIQUE)

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | INT | PK, AUTO_INCREMENT | Identificador único |
| `usuarioId` | INT | FK UNIQUE NOT NULL | Referência a usuarios_afu.id |
| `documento` | VARCHAR(50) | NULL | CPF ou CNPJ |
| `cidade` | VARCHAR(100) | NULL | Cidade |
| `estado` | VARCHAR(100) | NULL | Estado (UF) |
| `pais` | VARCHAR(100) | DEFAULT 'Brasil' | País |
| `regiao` | VARCHAR(100) | NULL | Região geográfica |
| `tipoProdutor` | ENUM | DEFAULT 'comercial' | 'familiar' \| 'comercial' \| 'organico' \| 'cooperado' \| 'empresarial' |
| `cadastroAtivo` | BOOLEAN | DEFAULT TRUE | Cadastro ativo? |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Data de criação |

**Relacionamentos:**
- **1:1 com `usuarios_afu`** — Um usuário produtor tem um registro
- **1:N com `propriedades`** — Um produtor tem múltiplas propriedades

---

#### `propriedades` (Fazendas/Propriedades Rurais)
**Localização:** `/drizzle/schema.ts` (linhas 123-152)  
**Propósito:** Representar fazendas/propriedades do produtor  
**Chave Primária:** `id` (INT, AUTO_INCREMENT)  
**Chave Estrangeira:** `produtorId` → `produtores.id` (N:1)

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | INT | PK, AUTO_INCREMENT | Identificador único |
| `produtorId` | INT | FK NOT NULL | Referência a produtores.id |
| `nome` | VARCHAR(150) | NOT NULL | Nome da propriedade |
| `cidade` | VARCHAR(100) | NULL | Localização |
| `estado` | VARCHAR(100) | NULL | UF |
| `pais` | VARCHAR(100) | DEFAULT 'Brasil' | País |
| `latitude` | DECIMAL(10,8) | NULL | Coordenada GPS |
| `longitude` | DECIMAL(11,8) | NULL | Coordenada GPS |
| `tamanhoArea` | DECIMAL(12,2) | NULL | Tamanho total |
| `unidadeArea` | ENUM | DEFAULT 'ha' | 'ha' \| 'alqueire' \| 'm2' |
| `tipoSolo` | VARCHAR(100) | NULL | Classificação do solo |
| `fonteAgua` | VARCHAR(100) | NULL | Fonte de água |
| `sistemaIrrigacao` | VARCHAR(100) | NULL | Sistema de irrigação |
| `tipoProducao` | ENUM | DEFAULT 'graos' | 'graos' \| 'hortifruti' \| 'fruticultura' \| 'cana' \| 'cafe' \| 'pecuaria' \| 'misto' \| 'outro' |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Data de criação |
| `updatedAt` | TIMESTAMP | DEFAULT NOW() | Última atualização |

**Relacionamentos:**
- **N:1 com `produtores`** — Múltiplas propriedades por produtor
- **1:N com `terrenos`** — Uma propriedade tem múltiplos talhões
- **1:N com `culturas`** — Uma propriedade tem múltiplos cultivos
- **1:N com `sensores`** — Uma propriedade tem múltiplos sensores
- **1:N com `diagnosticos_ia`** — Múltiplos diagnósticos por propriedade
- **1:N com `analises_fitotecnicas`** — Múltiplas análises por propriedade
- **1:N com `calendario_cuidados`** — Múltiplos eventos de calendário

---

#### `terrenos` (Talhões)
**Localização:** `/drizzle/schema.ts` (linhas 157-169)  
**Propósito:** Representar talhões/parcelas dentro de propriedades  
**Chave Primária:** `id` (INT, AUTO_INCREMENT)  
**Chave Estrangeira:** `propriedadeId` → `propriedades.id` (N:1)

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | INT | PK, AUTO_INCREMENT | Identificador único |
| `propriedadeId` | INT | FK NOT NULL | Referência a propriedades.id |
| `nome` | VARCHAR(100) | NOT NULL | Nome do talhão (ex: "Talhão A") |
| `area` | DECIMAL(10,2) | NULL | Área do talhão (hectares) |
| `tipoSolo` | VARCHAR(100) | NULL | Classificação do solo |
| `sistemaIrrigacao` | VARCHAR(100) | NULL | Sistema de irrigação |
| `observacoes` | TEXT | NULL | Observações adicionais |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Data de criação |

**Relacionamentos:**
- **N:1 com `propriedades`** — Múltiplos talhões por propriedade
- **1:N com `culturas`** — Um talhão pode ter múltiplos cultivos (opcional)

---

#### `culturas` (Cultivos/Plantações)
**Localização:** `/drizzle/schema.ts` (linhas 174-198)  
**Propósito:** Rastrear cultivos em propriedades/talhões  
**Chave Primária:** `id` (INT, AUTO_INCREMENT)  
**Chaves Estrangeiras:** `propriedadeId` → `propriedades.id`, `terrenoId` → `terrenos.id` (OPTIONAL)

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | INT | PK, AUTO_INCREMENT | Identificador único |
| `propriedadeId` | INT | FK NOT NULL | Referência a propriedades.id |
| `terrenoId` | INT | FK NULL | Referência a terrenos.id (opcional) |
| `nomeCultura` | VARCHAR(100) | NOT NULL | Nome da cultura (ex: "Soja", "Milho") |
| `variedade` | VARCHAR(100) | NULL | Variedade específica |
| `dataPlantio` | DATE | NULL | Data de plantio |
| `faseAtual` | VARCHAR(100) | NULL | Fase fenológica |
| `areaPlantada` | DECIMAL(12,2) | NULL | Área plantada (hectares) |
| `previsaoColheita` | DATE | NULL | Data prevista de colheita |
| `producaoEstimada` | DECIMAL(12,2) | NULL | Produção estimada |
| `unidadeProducao` | VARCHAR(30) | NULL | Unidade (sacas, toneladas, etc) |
| `status` | ENUM | DEFAULT 'em_andamento' | 'planejado' \| 'em_andamento' \| 'colhido' \| 'perdido' |
| `observacoes` | TEXT | NULL | Observações |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Data de criação |
| `updatedAt` | TIMESTAMP | DEFAULT NOW() | Última atualização |

**Relacionamentos:**
- **N:1 com `propriedades`** — Múltiplos cultivos por propriedade
- **N:1 com `terrenos`** — Cultivo pode estar em um talhão específico
- **1:N com `diagnosticos_ia`** — Múltiplos diagnósticos por cultivo
- **1:N com `analises_fitotecnicas`** — Múltiplas análises por cultivo
- **1:N com `calendario_cuidados`** — Múltiplos eventos de calendário

---

#### `parceiros` (Banco de Parceiros)
**Localização:** `/drizzle/schema.ts` (linhas 534-557)  
**Propósito:** Catálogo de laboratórios, cooperativas, consultores, etc  
**Chave Primária:** `id` (INT, AUTO_INCREMENT)

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | INT | PK, AUTO_INCREMENT | Identificador único |
| `nome` | VARCHAR(200) | NOT NULL | Nome da organização |
| `tipo` | ENUM | NOT NULL | 'laboratorio' \| 'cooperativa' \| 'consultoria' \| 'revendedor' \| 'instituicao' \| 'outro' |
| `descricao` | TEXT | NULL | Descrição dos serviços |
| `cidade` | VARCHAR(100) | NULL | Localização |
| `estado` | VARCHAR(100) | NULL | UF |
| `telefone` | VARCHAR(30) | NULL | Contato |
| `email` | VARCHAR(150) | NULL | Email |
| `website` | VARCHAR(255) | NULL | Site |
| `servicosOferecidos` | TEXT | NULL | Descrição dos serviços |
| `status` | ENUM | DEFAULT 'ativo' | 'ativo' \| 'inativo' |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Data de criação |

---

### **Camada 3: Análises & Diagnósticos**

#### `diagnosticos_ia` (Diagnósticos por IA)
**Localização:** `/drizzle/schema.ts` (linhas 203-234)  
**Propósito:** Armazenar resultados de análises de imagens por IA  
**Chave Primária:** `id` (INT, AUTO_INCREMENT)  
**Chaves Estrangeiras:** `usuarioId`, `propriedadeId`, `culturaId`

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | INT | PK, AUTO_INCREMENT | Identificador único |
| `usuarioId` | INT | FK NULL | Usuário que fez o diagnóstico |
| `propriedadeId` | INT | FK NULL | Propriedade analisada |
| `culturaId` | INT | FK NULL | Cultura analisada |
| `imagemUrl` | TEXT | NULL | URL da imagem enviada |
| `partePlanta` | VARCHAR(50) | NULL | Parte analisada (folha, fruto, etc) |
| `sintomasInformados` | TEXT | NULL | Sintomas descritos pelo usuário |
| `resultado` | TEXT | NULL | JSON com análise completa |
| `pragaProvavel` | VARCHAR(150) | NULL | Praga identificada |
| `doencaProvavel` | VARCHAR(150) | NULL | Doença identificada |
| `deficienciaNutricional` | VARCHAR(150) | NULL | Deficiência identificada |
| `gravidade` | ENUM | DEFAULT 'saudavel' | 'saudavel' \| 'leve' \| 'moderada' \| 'grave' \| 'critica' |
| `confiancaIa` | INT | NULL | Confiança da IA (0-100%) |
| `recomendacao` | TEXT | NULL | Recomendações de ação |
| `statusRevisao` | ENUM | DEFAULT 'pendente' | 'pendente' \| 'revisado' \| 'confirmado' \| 'descartado' |
| `dataDiagnostico` | TIMESTAMP | DEFAULT NOW() | Data do diagnóstico |

**Fluxo:**
```
1. Usuário captura imagem de planta
2. Envia para análise IA
3. IA processa imagem e identifica:
   - Praga
   - Doença
   - Deficiência nutricional
   - Gravidade
   - Confiança (%)
4. Resultado armazenado em diagnosticos_ia
5. Usuário pode revisar e confirmar/descartar
6. Técnico pode revisar diagnóstico
```

---

#### `analises_fitotecnicas` (Análises de Solo/Água)
**Localização:** `/drizzle/schema.ts` (linhas 239-270)  
**Propósito:** Armazenar resultados de análises laboratoriais  
**Chave Primária:** `id` (INT, AUTO_INCREMENT)

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | INT | PK, AUTO_INCREMENT | Identificador único |
| `usuarioId` | INT | FK NULL | Usuário responsável |
| `propriedadeId` | INT | FK NULL | Propriedade analisada |
| `culturaId` | INT | FK NULL | Cultura analisada |
| `tipoAnalise` | ENUM | DEFAULT 'solo' | 'solo' \| 'agua' \| 'foliar' \| 'completa' |
| `phSolo` | DECIMAL(4,2) | NULL | pH do solo |
| `phAgua` | DECIMAL(4,2) | NULL | pH da água |
| `nitrogenio` | DECIMAL(8,3) | NULL | N (mg/kg) |
| `fosforo` | DECIMAL(8,3) | NULL | P (mg/kg) |
| `potassio` | DECIMAL(8,3) | NULL | K (mg/kg) |
| `calcio` | DECIMAL(8,3) | NULL | Ca (mg/kg) |
| `magnesio` | DECIMAL(8,3) | NULL | Mg (mg/kg) |
| `materiaOrganica` | DECIMAL(6,2) | NULL | Matéria orgânica (%) |
| `umidade` | DECIMAL(6,2) | NULL | Umidade (%) |
| `condutividadeEletrica` | DECIMAL(8,4) | NULL | CE (dS/m) |
| `resultadoTecnico` | TEXT | NULL | JSON com interpretação IA |
| `recomendacao` | TEXT | NULL | Recomendações técnicas |
| `dataAnalise` | TIMESTAMP | DEFAULT NOW() | Data da análise |

---

#### `relatorios` (Relatórios Gerados)
**Localização:** `/drizzle/schema.ts` (linhas 275-301)  
**Propósito:** Armazenar relatórios PDF/digitais gerados  
**Chave Primária:** `id` (INT, AUTO_INCREMENT)

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | INT | PK, AUTO_INCREMENT | Identificador único |
| `usuarioId` | INT | FK NULL | Usuário que gerou |
| `diagnosticoId` | INT | FK NULL | Referência a diagnosticos_ia |
| `analiseId` | INT | FK NULL | Referência a analises_fitotecnicas |
| `titulo` | VARCHAR(255) | NOT NULL | Título do relatório |
| `tipoRelatorio` | ENUM | DEFAULT 'diagnostico' | 'diagnostico' \| 'analise_solo' \| 'historico' \| 'certificado' \| 'recomendacao' |
| `arquivoPdfUrl` | TEXT | NULL | URL do PDF armazenado |
| `status` | ENUM | DEFAULT 'emitido' | 'rascunho' \| 'emitido' \| 'assinado' \| 'cancelado' |
| `tecnicoResponsavelId` | INT | FK NULL | Técnico responsável |
| `conteudo` | TEXT | NULL | JSON com dados do relatório |
| `dataEmissao` | TIMESTAMP | DEFAULT NOW() | Data de emissão |

---

#### `pragas_doencas` (Banco de Conhecimento)
**Localização:** `/drizzle/schema.ts` (linhas 306-324)  
**Propósito:** Catálogo de pragas, doenças e deficiências  
**Chave Primária:** `id` (INT, AUTO_INCREMENT)

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | INT | PK, AUTO_INCREMENT | Identificador único |
| `nome` | VARCHAR(150) | NOT NULL | Nome comum |
| `nomeCientifico` | VARCHAR(200) | NULL | Nome científico |
| `tipo` | ENUM | NOT NULL | 'praga' \| 'doenca' \| 'deficiencia' |
| `culturaAfetada` | VARCHAR(200) | NULL | Culturas afetadas |
| `sintomas` | TEXT | NULL | Descrição de sintomas |
| `causas` | TEXT | NULL | Causas |
| `tratamento` | TEXT | NULL | Opções de tratamento |
| `prevencao` | TEXT | NULL | Medidas preventivas |
| `imagensReferencia` | TEXT | NULL | JSON array de URLs de imagens |
| `nivelRisco` | ENUM | DEFAULT 'medio' | 'baixo' \| 'medio' \| 'alto' \| 'critico' |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Data de criação |

---

### **Camada 4: IoT & Monitoramento**

#### `sensores` (Sensores IoT)
**Localização:** `/drizzle/schema.ts` (linhas 416-446)  
**Propósito:** Registrar sensores instalados em propriedades  
**Chave Primária:** `id` (INT, AUTO_INCREMENT)  
**Chave Estrangeira:** `propriedadeId` → `propriedades.id`

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | INT | PK, AUTO_INCREMENT | Identificador único |
| `propriedadeId` | INT | FK NOT NULL | Propriedade onde está instalado |
| `tipoSensor` | ENUM | NOT NULL | 'temperatura' \| 'umidade_solo' \| 'umidade_ar' \| 'ph' \| 'condutividade' \| 'chuva' \| 'vento' \| 'luminosidade' \| 'co2' \| 'outro' |
| `codigoSensor` | VARCHAR(100) | NULL | ID do dispositivo (MAC, serial) |
| `localInstalacao` | VARCHAR(200) | NULL | Localização (GPS ou descrição) |
| `status` | ENUM | DEFAULT 'ativo' | 'ativo' \| 'inativo' \| 'manutencao' \| 'falha' |
| `ultimaLeitura` | DECIMAL(10,4) | NULL | Último valor lido |
| `unidadeLeitura` | VARCHAR(20) | NULL | Unidade (°C, %, ppm, etc) |
| `dataInstalacao` | DATE | NULL | Data de instalação |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Data de criação |

**Relacionamentos:**
- **N:1 com `propriedades`** — Múltiplos sensores por propriedade
- **1:N com `leituras_sensores`** — Múltiplas leituras por sensor

---

#### `leituras_sensores` (Dados de Sensores)
**Localização:** `/drizzle/schema.ts` (linhas 451-462)  
**Propósito:** Armazenar série temporal de leituras de sensores  
**Chave Primária:** `id` (INT, AUTO_INCREMENT)  
**Chave Estrangeira:** `sensorId` → `sensores.id`

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | INT | PK, AUTO_INCREMENT | Identificador único |
| `sensorId` | INT | FK NOT NULL | Referência a sensores.id |
| `valor` | DECIMAL(10,4) | NOT NULL | Valor lido |
| `unidade` | VARCHAR(20) | NULL | Unidade do valor |
| `dataLeitura` | TIMESTAMP | DEFAULT NOW() | Timestamp da leitura |
| `alertaGerado` | BOOLEAN | DEFAULT FALSE | Alerta gerado? |
| `alertaMensagem` | VARCHAR(255) | NULL | Mensagem de alerta |

**Padrão de Armazenamento:**
```
- Sensores enviam leituras a cada 5-15 minutos
- Cada leitura é armazenada em leituras_sensores
- Se valor sai de limites normais, alertaGerado=TRUE
- Alertas podem disparar notificações ao usuário
- Dados históricos usados para gráficos e análises
```

---

### **Camada 5: Educação & Marketplace**

#### `materiais_didaticos` (Conteúdo Educativo)
**Localização:** `/drizzle/schema.ts` (linhas 329-362)  
**Propósito:** Catálogo de materiais educativos (vídeos, apostilas, etc)  
**Chave Primária:** `id` (INT, AUTO_INCREMENT)

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | INT | PK, AUTO_INCREMENT | Identificador único |
| `titulo` | VARCHAR(255) | NOT NULL | Título do material |
| `tipoMaterial` | ENUM | NOT NULL | 'video' \| 'audio' \| 'apostila' \| 'guia' \| 'checklist' \| 'infografico' |
| `tema` | VARCHAR(100) | NULL | Tema (ex: "Adubação", "Pragas") |
| `descricao` | TEXT | NULL | Descrição |
| `arquivoUrl` | TEXT | NULL | URL do arquivo |
| `videoUrl` | TEXT | NULL | URL do vídeo (YouTube, Vimeo) |
| `idioma` | VARCHAR(20) | DEFAULT 'pt-BR' | Idioma |
| `publicoAlvo` | ENUM | DEFAULT 'todos' | 'produtor' \| 'tecnico' \| 'todos' |
| `nivel` | ENUM | DEFAULT 'iniciante' | 'iniciante' \| 'intermediario' \| 'avancado' |
| `status` | ENUM | DEFAULT 'ativo' | 'ativo' \| 'inativo' \| 'rascunho' |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Data de criação |

---

#### `calendario_cuidados` (Calendário de Atividades)
**Localização:** `/drizzle/schema.ts` (linhas 367-411)  
**Propósito:** Agendar atividades agrícolas (plantio, irrigação, colheita, etc)  
**Chave Primária:** `id` (INT, AUTO_INCREMENT)

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | INT | PK, AUTO_INCREMENT | Identificador único |
| `usuarioId` | INT | FK NULL | Usuário responsável |
| `propriedadeId` | INT | FK NULL | Propriedade |
| `culturaId` | INT | FK NULL | Cultura |
| `tipoAtividade` | ENUM | NOT NULL | 'plantio' \| 'irrigacao' \| 'adubacao' \| 'pulverizacao' \| 'monitoramento' \| 'colheita' \| 'analise' \| 'manutencao' \| 'outro' |
| `titulo` | VARCHAR(200) | NOT NULL | Título da atividade |
| `descricao` | TEXT | NULL | Descrição detalhada |
| `dataProgramada` | TIMESTAMP | NOT NULL | Data/hora programada |
| `recorrencia` | ENUM | DEFAULT 'nenhuma' | 'nenhuma' \| 'diaria' \| 'semanal' \| 'quinzenal' \| 'mensal' |
| `prioridade` | ENUM | DEFAULT 'normal' | 'baixa' \| 'normal' \| 'alta' \| 'critica' |
| `status` | ENUM | DEFAULT 'pendente' | 'pendente' \| 'em_andamento' \| 'concluido' \| 'cancelado' |
| `lembreteAtivo` | BOOLEAN | DEFAULT FALSE | Ativar lembrete? |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Data de criação |
| `updatedAt` | TIMESTAMP | DEFAULT NOW() | Última atualização |

---

#### `produtos_marketplace` (Produtos para Venda)
**Localização:** `/drizzle/schema.ts` (linhas 467-495)  
**Propósito:** Catálogo de produtos do marketplace  
**Chave Primária:** `id` (INT, AUTO_INCREMENT)  
**Chave Estrangeira:** `vendedorId` → `usuarios_afu.id`

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | INT | PK, AUTO_INCREMENT | Identificador único |
| `vendedorId` | INT | FK NOT NULL | Vendedor (usuário) |
| `nomeProduto` | VARCHAR(200) | NOT NULL | Nome do produto |
| `categoria` | ENUM | NOT NULL | 'sementes' \| 'fertilizantes' \| 'defensivos' \| 'equipamentos' \| 'servicos' \| 'producao_propria' \| 'outro' |
| `descricao` | TEXT | NULL | Descrição detalhada |
| `preco` | DECIMAL(12,2) | NULL | Preço unitário |
| `estoque` | DECIMAL(12,2) | NULL | Quantidade em estoque |
| `unidade` | VARCHAR(30) | NULL | Unidade (kg, litros, unidades) |
| `imagemUrl` | TEXT | NULL | URL da imagem |
| `status` | ENUM | DEFAULT 'disponivel' | 'disponivel' \| 'indisponivel' \| 'pausado' |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Data de criação |
| `updatedAt` | TIMESTAMP | DEFAULT NOW() | Última atualização |

---

#### `pedidos` (Pedidos do Marketplace)
**Localização:** `/drizzle/schema.ts` (linhas 500-529)  
**Propósito:** Registrar transações de compra/venda  
**Chave Primária:** `id` (INT, AUTO_INCREMENT)  
**Chaves Estrangeiras:** `compradorId`, `vendedorId`, `produtoId`

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | INT | PK, AUTO_INCREMENT | Identificador único |
| `compradorId` | INT | FK NOT NULL | Comprador (usuário) |
| `vendedorId` | INT | FK NOT NULL | Vendedor (usuário) |
| `produtoId` | INT | FK NOT NULL | Produto comprado |
| `quantidade` | DECIMAL(10,2) | NOT NULL | Quantidade |
| `valorUnitario` | DECIMAL(12,2) | NULL | Preço unitário |
| `valorTotal` | DECIMAL(12,2) | NULL | Valor total (quantidade × preço) |
| `statusPedido` | ENUM | DEFAULT 'aguardando' | 'aguardando' \| 'confirmado' \| 'em_preparo' \| 'enviado' \| 'entregue' \| 'cancelado' |
| `statusPagamento` | ENUM | DEFAULT 'pendente' | 'pendente' \| 'pago' \| 'estornado' \| 'cancelado' |
| `enderecoEntrega` | TEXT | NULL | Endereço de entrega |
| `observacoes` | TEXT | NULL | Observações do pedido |
| `dataPedido` | TIMESTAMP | DEFAULT NOW() | Data do pedido |
| `dataEntrega` | TIMESTAMP | NULL | Data de entrega |

**Fluxo de Pedido:**
```
1. Comprador vê produto em marketplace
2. Cria pedido com status='aguardando'
3. Vendedor recebe notificação
4. Vendedor confirma: status='confirmado'
5. Vendedor prepara: status='em_preparo'
6. Vendedor envia: status='enviado'
7. Comprador recebe: status='entregue'
8. Pagamento: pendente → pago
```

---

## 🔗 Relacionamentos e Constraints

### **Matriz de Relacionamentos**

| Tabela A | Tipo | Tabela B | Descrição |
|----------|------|----------|-----------|
| `users` | 1:1 | `usuarios_afu` | Um usuário tem um perfil AFU |
| `usuarios_afu` | 1:1 | `produtores` | Um usuário produtor tem um registro |
| `produtores` | 1:N | `propriedades` | Um produtor tem múltiplas propriedades |
| `propriedades` | 1:N | `terrenos` | Uma propriedade tem múltiplos talhões |
| `propriedades` | 1:N | `culturas` | Uma propriedade tem múltiplos cultivos |
| `propriedades` | 1:N | `sensores` | Uma propriedade tem múltiplos sensores |
| `propriedades` | 1:N | `diagnosticos_ia` | Múltiplos diagnósticos por propriedade |
| `propriedades` | 1:N | `analises_fitotecnicas` | Múltiplas análises por propriedade |
| `propriedades` | 1:N | `calendario_cuidados` | Múltiplos eventos por propriedade |
| `terrenos` | 1:N | `culturas` | Um talhão pode ter múltiplos cultivos |
| `culturas` | 1:N | `diagnosticos_ia` | Múltiplos diagnósticos por cultura |
| `culturas` | 1:N | `analises_fitotecnicas` | Múltiplas análises por cultura |
| `culturas` | 1:N | `calendario_cuidados` | Múltiplos eventos por cultura |
| `usuarios_afu` | 1:N | `diagnosticos_ia` | Um usuário faz múltiplos diagnósticos |
| `usuarios_afu` | 1:N | `analises_fitotecnicas` | Um usuário faz múltiplas análises |
| `usuarios_afu` | 1:N | `relatorios` | Um usuário gera múltiplos relatórios |
| `usuarios_afu` | 1:N | `calendario_cuidados` | Um usuário cria múltiplos eventos |
| `usuarios_afu` | 1:N | `produtos_marketplace` | Um usuário vende múltiplos produtos |
| `usuarios_afu` | 1:N | `pedidos` (comprador) | Um usuário faz múltiplos pedidos |
| `usuarios_afu` | 1:N | `pedidos` (vendedor) | Um usuário recebe múltiplos pedidos |
| `diagnosticos_ia` | 1:N | `relatorios` | Um diagnóstico pode gerar múltiplos relatórios |
| `analises_fitotecnicas` | 1:N | `relatorios` | Uma análise pode gerar múltiplos relatórios |
| `sensores` | 1:N | `leituras_sensores` | Um sensor tem múltiplas leituras |
| `produtos_marketplace` | 1:N | `pedidos` | Um produto pode ter múltiplos pedidos |

### **Constraints de Integridade**

```sql
-- Foreign Keys com CASCADE DELETE (dados dependentes)
ALTER TABLE usuarios_afu ADD CONSTRAINT fk_usuarios_afu_users 
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE produtores ADD CONSTRAINT fk_produtores_usuarios_afu 
  FOREIGN KEY (usuarioId) REFERENCES usuarios_afu(id) ON DELETE CASCADE;

ALTER TABLE propriedades ADD CONSTRAINT fk_propriedades_produtores 
  FOREIGN KEY (produtorId) REFERENCES produtores(id) ON DELETE CASCADE;

ALTER TABLE terrenos ADD CONSTRAINT fk_terrenos_propriedades 
  FOREIGN KEY (propriedadeId) REFERENCES propriedades(id) ON DELETE CASCADE;

ALTER TABLE culturas ADD CONSTRAINT fk_culturas_propriedades 
  FOREIGN KEY (propriedadeId) REFERENCES propriedades(id) ON DELETE CASCADE;

ALTER TABLE culturas ADD CONSTRAINT fk_culturas_terrenos 
  FOREIGN KEY (terrenoId) REFERENCES terrenos(id) ON DELETE SET NULL;

ALTER TABLE sensores ADD CONSTRAINT fk_sensores_propriedades 
  FOREIGN KEY (propriedadeId) REFERENCES propriedades(id) ON DELETE CASCADE;

ALTER TABLE leituras_sensores ADD CONSTRAINT fk_leituras_sensores 
  FOREIGN KEY (sensorId) REFERENCES sensores(id) ON DELETE CASCADE;

-- Foreign Keys com RESTRICT (dados independentes)
ALTER TABLE diagnosticos_ia ADD CONSTRAINT fk_diagnosticos_usuarios 
  FOREIGN KEY (usuarioId) REFERENCES usuarios_afu(id) ON DELETE RESTRICT;

ALTER TABLE diagnosticos_ia ADD CONSTRAINT fk_diagnosticos_propriedades 
  FOREIGN KEY (propriedadeId) REFERENCES propriedades(id) ON DELETE RESTRICT;

ALTER TABLE diagnosticos_ia ADD CONSTRAINT fk_diagnosticos_culturas 
  FOREIGN KEY (culturaId) REFERENCES culturas(id) ON DELETE RESTRICT;

-- Índices para performance
CREATE INDEX idx_usuarios_afu_userId ON usuarios_afu(userId);
CREATE INDEX idx_produtores_usuarioId ON produtores(usuarioId);
CREATE INDEX idx_propriedades_produtorId ON propriedades(produtorId);
CREATE INDEX idx_terrenos_propriedadeId ON terrenos(propriedadeId);
CREATE INDEX idx_culturas_propriedadeId ON culturas(propriedadeId);
CREATE INDEX idx_culturas_terrenoId ON culturas(terrenoId);
CREATE INDEX idx_sensores_propriedadeId ON sensores(propriedadeId);
CREATE INDEX idx_leituras_sensores_sensorId ON leituras_sensores(sensorId);
CREATE INDEX idx_leituras_sensores_dataLeitura ON leituras_sensores(dataLeitura);
CREATE INDEX idx_diagnosticos_usuarioId ON diagnosticos_ia(usuarioId);
CREATE INDEX idx_diagnosticos_propriedadeId ON diagnosticos_ia(propriedadeId);
CREATE INDEX idx_diagnosticos_culturaId ON diagnosticos_ia(culturaId);
CREATE INDEX idx_calendario_usuarioId ON calendario_cuidados(usuarioId);
CREATE INDEX idx_calendario_propriedadeId ON calendario_cuidados(propriedadeId);
CREATE INDEX idx_calendario_culturaId ON calendario_cuidados(culturaId);
CREATE INDEX idx_produtos_vendedorId ON produtos_marketplace(vendedorId);
CREATE INDEX idx_pedidos_compradorId ON pedidos(compradorId);
CREATE INDEX idx_pedidos_vendedorId ON pedidos(vendedorId);
CREATE INDEX idx_pedidos_produtoId ON pedidos(produtoId);
```

---

## 📊 Fluxo de Dados

### **Fluxo 1: Autenticação e Onboarding**

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. NOVO USUÁRIO                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Usuário clica "Cadastrar"                                      │
│         ↓                                                        │
│  Escolhe: OAuth (Google/GitHub) ou E-mail/Senha                │
│         ↓                                                        │
│  Sistema cria registro em `users`                               │
│  ├─ openId (se OAuth) ou email + passwordHash (se e-mail)      │
│  ├─ loginMethod = 'oauth' | 'email' | 'email_oauth'            │
│  ├─ role = 'user'                                               │
│  ├─ emailVerified = FALSE (se e-mail)                           │
│  └─ timestamps (createdAt, updatedAt, lastSignedIn)             │
│         ↓                                                        │
│  Sistema cria registro em `usuarios_afu`                        │
│  ├─ userId = users.id                                           │
│  ├─ tipoUsuario = 'produtor' (padrão)                           │
│  ├─ status = 'ativo'                                            │
│  └─ timestamps                                                  │
│         ↓                                                        │
│  SE tipoUsuario = 'produtor':                                   │
│    Sistema cria registro em `produtores`                        │
│    ├─ usuarioId = usuarios_afu.id                               │
│    ├─ cadastroAtivo = TRUE                                      │
│    └─ timestamps                                                │
│         ↓                                                        │
│  Sistema gera JWT tokens:                                       │
│  ├─ accessToken (15 min)                                        │
│  ├─ refreshToken (30 dias)                                      │
│  └─ Armazena refreshToken em users.refreshToken                │
│         ↓                                                        │
│  Retorna ao cliente:                                            │
│  ├─ accessToken (em memória)                                    │
│  ├─ refreshToken (em SecureStore)                               │
│  └─ user (UserPublic)                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### **Fluxo 2: Cadastro de Propriedade**

```
┌─────────────────────────────────────────────────────────────────┐
│ 2. CADASTRO DE PROPRIEDADE                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Usuário (produtor) clica "Adicionar Propriedade"               │
│         ↓                                                        │
│  Preenche formulário:                                           │
│  ├─ Nome da propriedade                                         │
│  ├─ Localização (GPS, cidade, estado)                           │
│  ├─ Tamanho da área (hectares)                                  │
│  ├─ Tipo de solo                                                │
│  ├─ Sistema de irrigação                                        │
│  └─ Tipo de produção (grãos, hortifruti, etc)                   │
│         ↓                                                        │
│  Sistema cria registro em `propriedades`                        │
│  ├─ produtorId = produtores.id                                  │
│  ├─ Todos os dados preenchidos                                  │
│  └─ timestamps                                                  │
│         ↓                                                        │
│  Usuário pode adicionar talhões (terrenos)                      │
│         ↓                                                        │
│  Sistema cria registros em `terrenos`                           │
│  ├─ propriedadeId = propriedades.id                             │
│  ├─ Nome do talhão (ex: "Talhão A")                             │
│  └─ Dados específicos do talhão                                 │
│         ↓                                                        │
│  Usuário pode adicionar cultivos                                │
│         ↓                                                        │
│  Sistema cria registros em `culturas`                           │
│  ├─ propriedadeId = propriedades.id                             │
│  ├─ terrenoId = terrenos.id (opcional)                          │
│  ├─ Nome da cultura (Soja, Milho, etc)                          │
│  ├─ Data de plantio                                             │
│  ├─ Status = 'em_andamento'                                     │
│  └─ timestamps                                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### **Fluxo 3: Diagnóstico por IA**

```
┌─────────────────────────────────────────────────────────────────┐
│ 3. DIAGNÓSTICO POR IA                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Usuário abre câmera e captura imagem de planta                 │
│         ↓                                                        │
│  Seleciona:                                                     │
│  ├─ Propriedade                                                 │
│  ├─ Cultura                                                     │
│  ├─ Parte da planta (folha, fruto, raiz)                        │
│  └─ Sintomas observados (opcional)                              │
│         ↓                                                        │
│  Envia imagem para análise IA                                   │
│         ↓                                                        │
│  IA processa:                                                   │
│  ├─ Identifica praga/doença/deficiência                         │
│  ├─ Calcula gravidade (saudavel, leve, moderada, grave, critica)│
│  ├─ Calcula confiança (0-100%)                                  │
│  ├─ Gera recomendações de ação                                  │
│  └─ Retorna resultado                                           │
│         ↓                                                        │
│  Sistema cria registro em `diagnosticos_ia`                     │
│  ├─ usuarioId = usuarios_afu.id                                 │
│  ├─ propriedadeId = propriedades.id                             │
│  ├─ culturaId = culturas.id                                     │
│  ├─ imagemUrl = URL da imagem armazenada                        │
│  ├─ pragaProvavel / doencaProvavel / deficienciaNutricional     │
│  ├─ gravidade                                                   │
│  ├─ confiancaIa                                                 │
│  ├─ recomendacao                                                │
│  ├─ statusRevisao = 'pendente'                                  │
│  └─ dataDiagnostico = NOW()                                     │
│         ↓                                                        │
│  Sistema retorna resultado ao usuário                           │
│         ↓                                                        │
│  Usuário pode:                                                  │
│  ├─ Confirmar diagnóstico (statusRevisao = 'confirmado')        │
│  ├─ Descartar diagnóstico (statusRevisao = 'descartado')        │
│  ├─ Gerar relatório (cria registro em `relatorios`)             │
│  └─ Compartilhar com técnico                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### **Fluxo 4: Monitoramento com Sensores IoT**

```
┌─────────────────────────────────────────────────────────────────┐
│ 4. MONITORAMENTO COM SENSORES IoT                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Usuário instala sensores na propriedade                        │
│         ↓                                                        │
│  Sistema cria registros em `sensores`                           │
│  ├─ propriedadeId = propriedades.id                             │
│  ├─ tipoSensor = 'temperatura', 'umidade_solo', etc             │
│  ├─ codigoSensor = ID do dispositivo                            │
│  ├─ localInstalacao = GPS ou descrição                          │
│  ├─ status = 'ativo'                                            │
│  └─ dataInstalacao = NOW()                                      │
│         ↓                                                        │
│  Sensores enviam leituras a cada 5-15 minutos                   │
│         ↓                                                        │
│  Sistema recebe leitura via API/MQTT                            │
│         ↓                                                        │
│  Sistema cria registro em `leituras_sensores`                   │
│  ├─ sensorId = sensores.id                                      │
│  ├─ valor = valor lido                                          │
│  ├─ unidade = unidade do valor                                  │
│  ├─ dataLeitura = timestamp da leitura                          │
│  ├─ alertaGerado = FALSE (padrão)                               │
│  └─ alertaMensagem = NULL                                       │
│         ↓                                                        │
│  Sistema valida valor contra limites normais:                   │
│  ├─ SE valor < min OU valor > max:                              │
│  │  ├─ alertaGerado = TRUE                                      │
│  │  ├─ alertaMensagem = "Temperatura acima do normal"           │
│  │  └─ Envia notificação ao usuário                             │
│  └─ Atualiza sensores.ultimaLeitura                             │
│         ↓                                                        │
│  Usuário visualiza:                                             │
│  ├─ Gráficos de série temporal                                  │
│  ├─ Alertas ativos                                              │
│  ├─ Recomendações baseadas em dados                             │
│  └─ Histórico de leituras                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### **Fluxo 5: Marketplace**

```
┌─────────────────────────────────────────────────────────────────┐
│ 5. MARKETPLACE                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  VENDEDOR: Cadastra produto                                     │
│         ↓                                                        │
│  Sistema cria registro em `produtos_marketplace`                │
│  ├─ vendedorId = usuarios_afu.id                                │
│  ├─ nomeProduto, categoria, preço, estoque                      │
│  ├─ status = 'disponivel'                                       │
│  └─ timestamps                                                  │
│         ↓                                                        │
│  COMPRADOR: Navega marketplace                                  │
│         ↓                                                        │
│  Comprador vê produto e clica "Comprar"                         │
│         ↓                                                        │
│  Sistema cria registro em `pedidos`                             │
│  ├─ compradorId = usuarios_afu.id (comprador)                   │
│  ├─ vendedorId = usuarios_afu.id (vendedor)                     │
│  ├─ produtoId = produtos_marketplace.id                         │
│  ├─ quantidade = quantidade solicitada                          │
│  ├─ valorUnitario = preço do produto                            │
│  ├─ valorTotal = quantidade × preço                             │
│  ├─ statusPedido = 'aguardando'                                 │
│  ├─ statusPagamento = 'pendente'                                │
│  └─ dataPedido = NOW()                                          │
│         ↓                                                        │
│  Sistema notifica vendedor                                      │
│         ↓                                                        │
│  VENDEDOR: Confirma pedido                                      │
│         ↓                                                        │
│  Atualiza pedidos:                                              │
│  ├─ statusPedido = 'confirmado'                                 │
│  └─ statusPagamento = 'pago' (após confirmação de pagamento)    │
│         ↓                                                        │
│  VENDEDOR: Prepara e envia                                      │
│         ↓                                                        │
│  Atualiza pedidos:                                              │
│  ├─ statusPedido = 'em_preparo' → 'enviado'                     │
│  └─ Notifica comprador com rastreamento                         │
│         ↓                                                        │
│  COMPRADOR: Recebe produto                                      │
│         ↓                                                        │
│  Atualiza pedidos:                                              │
│  ├─ statusPedido = 'entregue'                                   │
│  ├─ dataEntrega = NOW()                                         │
│  └─ Pode deixar avaliação                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Etapas de Implementação

### **Fase 1: Preparação do Ambiente**

**Etapa 1.1: Configurar Conexão MySQL**
```bash
# Criar arquivo .env na raiz do projeto
DATABASE_URL=mysql://usuario:senha@localhost:3306/afu_mobile

# Instalar driver MySQL
npm install mysql2

# Verificar conexão
npm run db:test
```

**Etapa 1.2: Atualizar Drizzle Config**
```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  driver: "mysql2",
  dbCredentials: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "afu_mobile",
  },
});
```

---

### **Fase 2: Criação de Tabelas**

**Etapa 2.1: Gerar Migrações**
```bash
npm run db:generate
# Gera: drizzle/0001_*.sql com CREATE TABLE statements
```

**Etapa 2.2: Executar Migrações**
```bash
npm run db:migrate
# Executa SQL e cria todas as 17 tabelas
```

**Etapa 2.3: Verificar Criação**
```sql
-- Conectar ao MySQL
mysql -u root -p afu_mobile

-- Listar tabelas
SHOW TABLES;

-- Verificar estrutura
DESCRIBE users;
DESCRIBE usuarios_afu;
-- ... etc para todas as 17 tabelas
```

---

### **Fase 3: Seed de Dados (Opcional)**

**Etapa 3.1: Criar Script de Seed**
```typescript
// scripts/seed.ts
import { db } from "@/server/db";
import { users, usuariosAfu, produtores, propriedades, pragasDoencas } from "@/drizzle/schema";

async function seed() {
  // Inserir usuário de teste
  await db.insert(users).values({
    openId: "test-user-001",
    name: "Produtor Teste",
    email: "produtor@test.com",
    loginMethod: "oauth",
    role: "user",
  });

  // Inserir banco de conhecimento (pragas/doenças)
  await db.insert(pragasDoencas).values([
    {
      nome: "Ferrugem da Soja",
      nomeCientifico: "Phakopsora meibomiae",
      tipo: "doenca",
      culturaAfetada: "Soja",
      sintomas: "Manchas avermelhadas nas folhas...",
      nivelRisco: "alto",
    },
    // ... mais pragas/doenças
  ]);
}

seed().catch(console.error);
```

**Etapa 3.2: Executar Seed**
```bash
npm run seed
```

---

### **Fase 4: Testes de Integração**

**Etapa 4.1: Criar Testes**
```typescript
// tests/database.test.ts
import { describe, it, expect } from "vitest";
import { db } from "@/server/db";
import { users, usuariosAfu } from "@/drizzle/schema";

describe("Database Integration", () => {
  it("should create user and usuario_afu", async () => {
    const result = await db.insert(users).values({
      name: "Test User",
      email: "test@example.com",
      loginMethod: "email",
    });

    expect(result).toBeDefined();
  });

  it("should retrieve user with relationships", async () => {
    const user = await db.query.users.findFirst();
    expect(user).toBeDefined();
  });
});
```

**Etapa 4.2: Executar Testes**
```bash
npm test -- tests/database.test.ts
```

---

### **Fase 5: Implementação de APIs**

**Etapa 5.1: Criar Routers tRPC**
```typescript
// server/routers/propriedades.ts
import { router, publicProcedure, protectedProcedure } from "@/server/_core/trpc";
import { db } from "@/server/db";
import { propriedades } from "@/drizzle/schema";
import { z } from "zod";

export const propriedadesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.query.propriedades.findMany({
      where: (props, { eq }) => eq(props.produtorId, ctx.user.id),
    });
  }),

  create: protectedProcedure
    .input(z.object({
      nome: z.string(),
      tamanhoArea: z.number(),
      tipoProducao: z.enum(["graos", "hortifruti", ...]),
    }))
    .mutation(async ({ ctx, input }) => {
      return db.insert(propriedades).values({
        ...input,
        produtorId: ctx.user.id,
      });
    }),
});
```

---

### **Fase 6: Deployment**

**Etapa 6.1: Backup de Dados**
```bash
mysqldump -u root -p afu_mobile > backup_$(date +%Y%m%d).sql
```

**Etapa 6.2: Deploy em Produção**
```bash
# Atualizar .env com credenciais de produção
DATABASE_URL=mysql://prod_user:prod_pass@prod_host:3306/afu_mobile_prod

# Executar migrações em produção
npm run db:migrate

# Iniciar aplicação
npm start
```

---

## 📝 Prompt para Próximas Etapas

```
CONTEXTO:
Você está trabalhando com o projeto AFU Mobile (Analisador Fitotécnico Universal),
que possui um banco de dados MySQL com 17 tabelas relacionadas em 5 camadas funcionais:
1. Autenticação (users)
2. Usuários & Perfis (usuarios_afu, produtores, parceiros)
3. Operações Agrícolas (propriedades, terrenos, culturas)
4. Análises & Diagnósticos (diagnosticos_ia, analises_fitotecnicas, relatorios, pragas_doencas)
5. IoT & Marketplace (sensores, leituras_sensores, materiais_didaticos, calendario_cuidados, produtos_marketplace, pedidos)

TAREFA:
[Descreva o que você precisa fazer, ex: "Criar API para listar propriedades de um produtor"]

REQUISITOS:
- Usar Drizzle ORM para queries
- Implementar autenticação JWT (accessToken + refreshToken)
- Incluir validação com Zod
- Retornar tipos TypeScript corretos
- Adicionar testes com Vitest

ENTREGA ESPERADA:
[Descreva o que você quer receber, ex: "Router tRPC com procedures list, create, update, delete"]
```

---

**Fim do Relatório Técnico**

*Documento preparado para implementação do banco de dados AFU v2 em MySQL*  
*Versão: 2.0 | Data: Julho 2026 | Status: Pronto para Implementação*
