# AFU Mobile — TODO

## Setup e Configuração
- [x] Atualizar tema de cores (verde agrícola)
- [x] Gerar logo do app
- [x] Configurar app.config.ts com nome e branding
- [x] Configurar icon-symbol.tsx com ícones necessários

## Estrutura de Navegação
- [x] Configurar tab bar com 5 abas (Dashboard, Propriedades, Cultivos, Diagnóstico, Mais)
- [x] Criar stack navigator para telas de detalhe

## Dados e Estado
- [x] Criar tipos TypeScript compartilhados (Propriedade, Cultivo, Diagnóstico, Cultura, Praga, Doença)
- [x] Criar store local com AsyncStorage para dados offline
- [x] Popular banco de dados mock (culturas, pragas, doenças, nutrientes)

## Backend / API
- [x] Rota tRPC para diagnóstico por IA (invokeLLM com imagem)

## Telas Principais
- [x] Dashboard com cards de resumo e alertas
- [x] Tela de Propriedades (lista + formulário CRUD)
- [x] Tela de Cultivos (lista + formulário CRUD)
- [x] Tela de Diagnóstico IA (câmera/galeria + análise)
- [x] Tela "Mais" (menu de módulos)

## Módulos Técnicos
- [x] Banco de Culturas (lista + detalhe)
- [x] Banco de Pragas e Doenças (lista + detalhe)
- [x] Nutrição Vegetal (macro/micronutrientes)
- [x] Calendário Agrícola (CRUD de eventos)
- [x] Clima Agrícola (dados por cultura)
- [x] Irrigação (por cultura e por método)

## Funcionalidades Avançadas
- [x] Histórico de diagnósticos
- [x] Detalhe de propriedade com cultivos associados
- [x] Detalhe de cultivo com linha do tempo fenológica
- [x] Resultado do diagnóstico com recomendações
- [x] Perfil do usuário

## Polish e Entrega
- [x] Testar todos os fluxos principais
- [x] TypeScript sem erros (0 erros)
- [x] Seed de dados demo automático
- [x] Checkpoint final

## Expansão v2 — Especificação Completa

### Perfis e Autenticação
- [x] Expandir perfil com função (produtor/técnico/administrador) e status (ativo/bloqueado)
- [x] Tela de login com e-mail e senha (OAuth existente)
- [x] Proteção de rotas — redirecionar para login quando não autenticado
- [x] Exibir função/perfil no header e na tela de perfil

### Terrenos e Talhões
- [x] Módulo completo de Terrenos vinculados a Propriedades
- [x] Campos: nome, área (ha), tipo de solo, textura, pH, drenagem, irrigação, observações
- [x] Tela de detalhe da Propriedade exibindo lista de Terrenos
- [x] Formulário CRUD de Terrenos dentro da Propriedade

### Cultivos Expandidos
- [x] Vincular Cultivo a Terreno (obrigatório)
- [x] Adicionar fases detalhadas: planejamento, plantio, germinação, muda, crescimento vegetativo, floração, frutificação, maturação, colheita
- [x] Exibir terreno vinculado no card e detalhe do cultivo
- [x] Validar área plantada ≤ área do terreno

### Diagnóstico Melhorado
- [x] Campo de sintomas informados pelo usuário
- [x] Campo de cultivo opcional vinculado
- [x] Status do diagnóstico: pendente, processando, concluído, erro
- [x] Partes da planta expandidas: folha, caule, raiz, flor, fruto, semente, planta inteira
- [x] Melhorar prompt da IA com contexto de sintomas, fase fenológica e histórico

### Calendário Expandido
- [x] Adicionar campo de prioridade: baixa, normal, alta, crítica
- [x] Status: pendente, em_andamento, concluído, cancelado, adiado
- [x] Vincular evento a cultivo específico
- [x] Filtro por prioridade e por cultivo
- [x] Indicador visual de prioridade nos cards

### Banco de Culturas Expandido
- [x] Adicionar mais culturas: trigo, mandioca, batata, cebola, alface, eucalipto, sorgo (total 15 culturas)
- [x] Dados de clima e irrigação por cultura
- [x] Épocas de plantio por cultura

### Administração de Usuários
- [x] Tela de administração (apenas para perfil administrador)
- [x] Listar usuários com função e status
- [x] Alterar função do usuário (produtor → técnico → administrador)
- [x] Bloquear/reativar usuário

### UX e Polish
- [x] Calendário com filtros por status (todos/pendentes/concluídos)
- [x] Confirmação antes de excluir registros
- [x] Indicadores de carregamento em todas as operações assíncronas
- [x] Busca/filtro nas listas de Culturas, Pragas e Doenças
- [x] Perfil com estatísticas do usuário (propriedades, cultivos, diagnósticos, eventos)

## MVP 1.0 — Planta Saudável (Etapa 1)

### Módulo de Análise Fitotécnica
- [x] Tipos TypeScript para AnaliseFitotecnica (solo, água, nutrientes)
- [x] Tela de nova análise com campos: pH solo, pH água, N, P, K, Ca, Mg, matéria orgânica, umidade, condutividade elétrica
- [x] Histórico de análises por propriedade
- [x] Detalhe da análise com interpretação dos valores
- [x] Rota tRPC para interpretação IA dos dados da análise

### Módulo de Relatórios e Laudos
- [x] Tela de Relatórios (lista de laudos gerados)
- [x] Geração de relatório técnico em PDF (via servidor)
- [x] Laudo de análise fitotécnica em PDF
- [x] Histórico da propriedade em PDF
- [x] Certificado de qualidade básico

### Expansão de Perfis
- [x] Adicionar perfis: Parceiro e Comprador nos tipos
- [x] Atualizar tela de Administração com novos perfis
- [x] Tela básica de Parceiros (lista + cadastro)
- [x] Tela básica de Marketplace (produtos disponíveis)

### Melhorias Gerais MVP 1.0
- [x] Melhorar tela de login/cadastro com seleção de perfil
- [x] Painel do produtor com resumo completo (propriedades, cultivos, análises, diagnósticos)
- [x] Adicionar módulo de Análise Fitotécnica ao menu "Mais"
- [x] Adicionar módulo de Relatórios ao menu "Mais"
- [x] Adicionar módulo de Parceiros ao menu "Mais"
- [x] Adicionar módulo de Marketplace ao menu "Mais"
- [x] Dashboard com 6 cards de estatísticas e 8 ações rápidas
- [x] Menu organizado por seções com badges "Novo"
- [x] Ícones adicionais mapeados (doc.fill, building.2.fill, cart.fill, etc.)

## Etapa 2 — Telas e Fluxo do Usuário

### Onboarding e Autenticação
- [x] Tela de Boas-vindas (logo, "Planta Saudável", botões Entrar/Criar conta)
- [x] Tela de Cadastro (nome, telefone, e-mail, senha, tipo de usuário, região, termos)
- [x] Tela de Login (e-mail/telefone, senha, recuperar senha)
- [x] Fluxo de onboarding: Boas-vindas → Cadastro/Login → Painel

### Diagnóstico Expandido
- [x] Resultado com: estado geral, praga, doença, deficiência, gravidade, confiança IA, recomendação, prevenção
- [x] Histórico de análises com foto, cultura, diagnóstico, status e link para relatório
- [x] Fluxo completo: foto → análise → resultado → salvar → relatório PDF

### Novos Módulos
- [x] Módulo de Materiais Didáticos (vídeos, áudios, apostilas, guias, checklists) — `mais/materiais.tsx` via tRPC
- [x] Módulo de Suporte Técnico (chat, abrir chamado, enviar dúvida, agendar visita) — `mais/suporte.tsx` MVP

### Painel Inicial
- [x] Atualizar cards do painel: Analisar Planta, Propriedades, Histórico, Calendário, Materiais, Suporte

## Etapa 4 — Arquitetura Técnica

- [x] Tela de Arquitetura Técnica com 5 abas (Stack, Módulos, Fluxo, Segurança, Deploy)
- [x] Aba Stack: 7 grupos tecnológicos com todas as tecnologias e estrutura do monorepo
- [x] Aba Módulos: 8 módulos NestJS expandíveis com responsabilidades
- [x] Aba Fluxo: diagrama visual de arquitetura + 5 fluxos de comunicação detalhados
- [x] Aba Segurança: 11 medidas com níveis de prioridade + conformidade LGPD
- [x] Aba Deploy: MVP econômico vs. produção escalável + roadmap de 3 fases
- [x] Módulo acessível via menu Administração com badge "Etapa 4"

## Etapa 5 — Backend/API NestJS

- [x] Tela de Documentação da API com 5 abas (Módulos, Endpoints, Perfis, Segurança, Código)
- [x] Aba Módulos: 11 módulos expandíveis com ícone, cor, descrição e lista de endpoints
- [x] Aba Endpoints: todos os endpoints REST agrupados por módulo com método HTTP colorido
- [x] Aba Perfis: 5 perfis RBAC (Admin, Técnico, Produtor, Parceiro, Comprador) com pode/não pode
- [x] Aba Segurança: 12 medidas com filtro por tipo (Autenticação, Validação, Autorização, etc.)
- [x] Aba Código: estrutura de pastas NestJS, variáveis de ambiente e main.ts comentado
- [x] Módulo acessível via menu Administração com badge "Etapa 5"

## Etapa 6 — Schema Prisma PostgreSQL

- [x] Tela de visualização do Schema Prisma com 5 abas (Modelos, Enums, Relações, Comandos, Schema)
- [x] Aba Modelos: 14 modelos expandíveis com campos tipados, badges PK/FK/UQ e modificadores
- [x] Aba Enums: 3 enums (TipoUsuario, StatusGeral, Gravidade) com valores e descrições
- [x] Aba Relações: 16 relações mapeadas (1:1, 1:N, N:1) com descrição de cada vínculo
- [x] Aba Comandos: CLI Prisma com 7 comandos e fluxo de desenvolvimento em 4 etapas
- [x] Aba Schema: schema.prisma resumido + tabela de todos os modelos com contagem de campos/relações
- [x] Módulo acessível via menu Administração com badge "Etapa 6"

## Migração AsyncStorage → tRPC + Banco Real

- [x] Router tRPC: propriedades (CRUD completo)
- [x] Router tRPC: cultivos/culturas por propriedade (CRUD completo)
- [x] Router tRPC: terrenos por propriedade (CRUD completo)
- [x] Router tRPC: calendário de eventos (CRUD completo)
- [x] Router tRPC: relatórios (CRUD + geração PDF)
- [x] Router tRPC: marketplace (CRUD + admin)
- [x] Router tRPC: análise fitotécnica (CRUD)
- [x] Migrar (tabs)/propriedades.tsx para tRPC
- [x] Migrar (tabs)/cultivos.tsx para tRPC
- [x] Migrar (tabs)/index.tsx (Dashboard) para tRPC
- [x] Migrar mais/calendario.tsx para tRPC
- [x] Migrar mais/relatorios.tsx para tRPC
- [x] Migrar mais/marketplace.tsx para tRPC
- [x] Migrar mais/analise-fitotecnica.tsx para tRPC
- [x] Conectar auth/login.tsx ao OAuth real
- [x] Conectar auth/cadastro.tsx ao banco real
- [x] Migrar propriedades/terrenos.tsx para tRPC
- [x] Migrar propriedades/[id].tsx para tRPC
- [x] Migrar cultivos/[id].tsx para tRPC
- [x] Migrar (tabs)/diagnostico.tsx para tRPC (analisar, salvar, historico)
- [x] Migrar mais/perfil.tsx (estatísticas) para tRPC
- [x] Corrigir terrenoId no CRUD de cultivos
- [x] Dashboard: 8 ações rápidas, card Diagnósticos, cards clicáveis
- [x] Diagnóstico: laudo no histórico + deep link ?historico=1
- [x] Relatórios: filtro rápido por tipo (Diagnósticos)
- [x] Auth layout: login-new, cadastro-new, forgot/reset-password
- [x] RouteGuard redireciona para /auth/login-new


## Etapa 7 — Camada 1: Admin Panel Offline — CRUD de Conteúdos de Estudos

### Schemas e Validação
- [x] Criar schemas Zod para Conteúdo (título, descrição, tipo, tags, etc.)
- [x] Implementar validadores: validarConteudo, validarConteudoCreate, validarConteudoUpdate
- [x] Suportar tipos de conteúdo: artigo, guia, pdf, video, imagem

### Hook useConteudoSync
- [x] Criar hook com CRUD offline-first (criar, atualizar, deletar)
- [x] Implementar fila de sincronização com AsyncStorage
- [x] Detecção de conectividade (online/offline)
- [x] Sincronização automática ao reconectar
- [x] Retry automático com backoff exponencial
- [x] Filtrar conteúdos por módulo
- [x] Contar itens pendentes de sincronização

### Tela conteudos-offline.tsx
- [x] Interface CRUD completa com formulário
- [x] Filtro por módulo (horizontal scroll)
- [x] Seleção de tipo de conteúdo
- [x] Validação de campos obrigatórios
- [x] Indicador de status de sincronização
- [x] Lista de conteúdos com cards
- [x] Botões editar/deletar com confirmação
- [x] Suporte a tags e ordem

### Componente MediaUpload
- [x] Upload de imagens (base64)
- [x] Upload de PDFs (base64)
- [x] Upload de vídeos (base64)
- [x] Armazenamento em AsyncStorage
- [x] Indicador de sincronização por arquivo
- [x] Limite configurável de arquivos
- [x] Preview em scroll horizontal
- [x] Botão para remover arquivos

### Testes
- [x] Validação com Zod (8 testes)
- [x] Operações de sincronização (3 testes)
- [x] Tipos de conteúdo (5 testes)
- [x] Filtros e busca (6 testes)
- [x] Ordenação (2 testes)
- [x] Sincronização com fila (3 testes)
- [x] Resolução de conflitos (2 testes)
- [x] Validação de limites (3 testes)
- Total: 32 testes cobrindo CRUD offline completo

### Documentação
- [x] Atualizar ADMIN_OFFLINE_GUIDE.md com seção de conteúdos
- [x] Adicionar exemplos de uso do hook useConteudoSync
- [x] Documentar fluxo de upload de mídia offline
- [x] Adicionar guia de troubleshooting para sincronização de conteúdos

### Integração
- [x] Adicionar rota /admin/conteudos-offline no app router
- [x] Integrar MediaUpload na tela de edição de conteúdo
- [x] Conectar com AdminContext para persistência global
- [x] Testar fluxo offline completo (criar → desconectar → reconectar → sincronizar)


### Integração com AdminContext
- [x] Criar _layout.tsx em app/admin com AdminProvider
- [x] Adicionar rota /admin ao Stack em app/_layout.tsx
- [x] Reescrever conteudos-offline.tsx para usar useAdmin() em vez de useConteudoSync
- [x] Conectar com state.conteudos, state.modulos e state.syncQueue
- [x] Implementar adicionarConteudo, atualizarConteudo, deletarConteudo do AdminContext
- [x] Adicionar item "Conteúdos Educativos" ao menu de administração em app/(tabs)/mais.tsx
- [x] Integrar rota /admin/conteudos-offline no menu admin com requireAdmin: true


## Etapa 7 — Camada 1.5: Editor Visual HTML
- [x] Criar componente HtmlEditor com toolbar de formatação (negrito, itálico, títulos, listas)
- [x] Implementar preview em tempo real com WebView
- [x] Integrar editor na tela conteudos-offline.tsx
- [x] Adicionar testes de editor HTML
- [x] Documentar uso do editor


## Etapa 7 — Camada 1.6: Upload de Imagens no Editor
- [x] Criar hook useImageUpload para seleção e conversão de imagens
- [x] Adicionar botão de upload de imagens na toolbar do HtmlEditor
- [x] Implementar inserção automática de tags img no HTML
- [x] Adicionar validação de tamanho e tipo de arquivo
- [x] Criar testes para upload de imagens
- [x] Documentar suporte a imagens no editor


## Etapa 2 — Fase 1: Login e Cadastro com UI
- [x] Analisar requisitos e design das telas
- [x] Criar componentes reutilizáveis (TextInput, Button, Card)
- [x] Implementar tela de Boas-vindas
- [x] Implementar tela de Login
- [x] Implementar tela de Cadastro com seleção de perfil
- [x] Integrar com OAuth existente
- [x] Integrar com banco de dados real
- [x] Adicionar validação de e-mail e senha
- [x] Adicionar fluxo de onboarding completo
- [x] Testes de autenticação

## Etapa 2 — Fase 2: Proteção de Rotas
- [x] Implementar middleware de autenticação
- [x] Proteger rotas de dashboard
- [x] Redirecionar usuários não autenticados
- [x] Redirecionar usuários autenticados de auth
- [x] Documentar fluxo de autenticação


## Etapa 2 — Fase 3: Backend de Autenticação com E-mail/Senha
- [x] Adicionar campos passwordHash e emailVerified ao schema users
- [x] Criar migração do Drizzle
- [x] Implementar hashPassword() com PBKDF2
- [x] Implementar verifyPassword()
- [x] Implementar createUserWithEmail()
- [x] Implementar loginWithEmail()
- [x] Implementar emailExists()
- [x] Criar endpoint POST /api/auth/login
- [x] Criar endpoint POST /api/auth/signup
- [x] Adicionar schemas Zod para validação
- [x] Integrar endpoints com frontend
- [x] Testar fluxo completo de autenticação
- [x] Adicionar testes de backend (auth-flow, auth-integration, jwt-validation)


## Etapa 2 — Fase 4: Integração Frontend com Endpoints tRPC
- [x] Criar hook useAuthAPI para chamar endpoints
- [x] Integrar login-new.tsx com /api/auth/login
- [x] Integrar cadastro-new.tsx com /api/auth/signup
- [x] Adicionar feedback visual (loading, erros, sucesso)
- [x] Testar fluxo completo de autenticação
- [x] Armazenar informações de usuário após login


## Etapa 2 — Fase 5: Recuperação de Senha
- [x] Adicionar campos de reset de senha ao schema users
- [x] Criar funções de geração e validação de token
- [x] Implementar endpoints tRPC (forgotPassword, validateResetToken, resetPassword)
- [x] Criar tela forgot-password.tsx
- [x] Criar tela reset-password.tsx
- [x] Integrar link de recuperação no login-new.tsx
- [x] Documentar fluxo de recuperação de senha


## Etapa 2 — Fase 6: Integração SendGrid
- [x] Instalar dependência SendGrid
- [x] Configurar variáveis de ambiente (SENDGRID_API_KEY, FROM_EMAIL)
- [x] Criar serviço de envio de e-mail
- [x] Criar templates HTML para e-mails
- [x] Integrar SendGrid em requestPasswordReset
- [x] Adicionar tratamento de erros e retry
- [x] Testar envio de e-mails
- [x] Documentar configuração SendGrid


## Etapa 2 — Fase 7: Reenvio de E-mail com Cooldown
- [x] Criar hook useResendEmail com lógica de cooldown
- [x] Adicionar endpoint tRPC para reenvio de e-mail
- [x] Integrar botão de reenvio em forgot-password.tsx
- [x] Implementar contador visual de tempo
- [x] Adicionar testes de reenvio e cooldown
- [x] Documentar funcionalidade de reenvio


## Etapa 3 — Validação de Área Plantada
- [x] Analisar estrutura de Cultivos e Terrenos
- [x] Criar funções de validação de área (lib/validation/area-validation.ts)
- [x] Criar hook useAreaValidation com estado reativo
- [x] Criar componente AreaValidationAlert com feedback visual
- [x] Criar componente AreaValidationInput com validação em tempo real
- [x] Criar 60+ testes de validação (tests/area-validation.test.ts)
- [x] Documentar sistema de validação (AREA_VALIDATION_GUIDE.md)


## Etapa 3 — Integração de Validação de Área em Cultivos
- [x] Adicionar imports de validação ao formulário de cultivos
- [x] Adicionar estado de validação (isAreaValid, selectedTerreno)
- [x] Buscar terrenos da propriedade selecionada
- [x] Calcular área já plantada no terreno
- [x] Integrar seleção de terreno no formulário
- [x] Integrar validação de área em tempo real
- [x] Exibir alerta de validação quando inválido
- [x] Bloquear botão de salvar quando área é inválida
- [x] Adicionar feedback visual (border vermelha no input)


## Revisão Crítica — Correções de Autenticação e UI
- [x] Revisar dimensionamento de telas de login e cadastro
- [x] Corrigir responsividade em diferentes tamanhos de tela
- [x] Testar fluxo de autenticação completo (login → dashboard)
- [x] Verificar proteção de rotas (redirecionar não autenticados)
- [x] Validar validação de e-mail e senha
- [x] Testar fluxo de onboarding (welcome → cadastro → dashboard)
- [x] Verificar validação de área plantada no formulário
- [x] Executar suite de testes automatizados
- [x] Corrigir erros de UI/UX identificados


## Correções Críticas de Autenticação (26/06/2026)
- [x] CORREÇÃO P1: useAuthAPI chama Api.establishSession() após login/signup em web/iframe
- [x] CORREÇÃO P2: Remover useAuthMiddleware() do AuthGuard — eliminar conflito de fontes de auth
- [x] CORREÇÃO P3: Logout limpa refreshToken + invalida cache tRPC (auth.session)
- [x] Invalidar queryClient após login/signup para forçar re-fetch de auth.session


## MVP 1.0 — Planta Saudável — ENTREGA FINAL (03/07/2026)

### Escopo concluído
- [x] Dashboard: 7 stat cards + 9 ações rápidas + WeatherCard
- [x] Diagnóstico IA: foto → análise → salvar → laudo PDF → histórico com deep link `?historico=1`
- [x] CRUD Propriedades / Terrenos / Cultivos via tRPC + MySQL (validação de área plantada)
- [x] Calendário agrícola (CRUD eventos)
- [x] Relatórios e laudos PDF (filtro por tipo diagnóstico)
- [x] Análise fitotécnica
- [x] Materiais didáticos (lista pública tRPC)
- [x] Suporte técnico (MVP com chat/chamado/dúvida/visita)
- [x] Autenticação: welcome → login / cadastro → onboarding → tabs
- [x] AuthGuard + RouteGuard protegendo rotas
- [x] Recuperação de senha (forgot/reset)
- [x] TypeScript 0 erros (`npm run check`)
- [x] 248 testes Vitest passando

### Fora do escopo MVP (v2) — concluído 03/07/2026 Sessão 4
- [x] Filtro de calendário por prioridade e cultivo
- [x] Suporte técnico com backend real (tickets + chat via tRPC)
- [x] ~~Migração `mais/administracao.tsx` de lib/store para tRPC~~ (concluído 03/07)
- [x] Documentação ADMIN_OFFLINE_GUIDE (seção conteúdos + core sync)
- [x] Push notifications locais (lembretes de calendário)
- [x] Sync offline core (fila de mutações propriedades/cultivos/terrenos/eventos)

## Revisão Geral MVP — Auth + Limpeza (03/07/2026)

### Plano executado
1. [x] Auth reativada por padrão (`isAuthDisabled` só com `DEV_SKIP_AUTH=1`)
2. [x] Telas legadas `login.tsx` / `cadastro.tsx` → redirect para `-new`
3. [x] Removidos hooks mortos: `use-sign-up`, `use-token-refresh`, `auth-middleware`
4. [x] `perfil.tsx` salva via `trpc.auth.perfil.upsert` (não mais AsyncStorage)
5. [x] Removido `.npmrc` com `node-linker` (aviso npm; usar `pnpm install`)
6. [x] `use-auth.ts` marcado como deprecated

### Auth canônico (único fluxo)
`welcome` → `login` / `cadastro` → `useAuthAPI` → `useSession` → `onboarding` (se sem perfil) → `(tabs)` → logout → `welcome`

## Correções de Integridade Auth (03/07/2026 — Sessão 3)
- [x] Race pós-login: `refetch` de `auth.session` + AuthGuard como único redirect
- [x] Refresh token: interceptor corrigido (URL absoluta, JWT decode RN-safe) + `TokenRefreshManager`
- [x] `apiCall` envia Bearer no web e nativo quando há token
- [x] Rotas canônicas: `login.tsx` / `cadastro.tsx` (redirects `-new` mantidos)
- [x] Logout unificado: `clearLocalAuth()` + destino `/auth/welcome`
- [x] UX pós-login/cadastro: tela de loading até AuthGuard redirecionar
- [x] Skill `.cursor/skills/afu-mvp-finalize/SKILL.md` para verificação MVP
- [x] Docs: PROJECT_REVIEW e REVISAO_ETAPAS atualizados

### Dev sem login (opcional)
```bash
EXPO_PUBLIC_DEV_SKIP_AUTH=1 DEV_SKIP_AUTH=1 pnpm dev
```

### Concluído (03/07/2026 — Sessão 2)
- [x] `reset-password.tsx` migrado de `apiCall` REST para tRPC (`auth.validateResetToken` + `auth.resetPassword`)
- [x] Removido `hooks/use-auth.ts` (zero consumidores restantes)
- [x] `mais/administracao.tsx` → redirect para `admin-usuarios.tsx` (tRPC)
- [x] Removido `lib/store.ts` (zero consumidores; dados migrados para tRPC)
- [x] `PROJECT_REVIEW.md` reescrito com stack real (MySQL/Drizzle), auth canônico, e status correto

## v2 — Sessão 4 (03/07/2026)
- [x] Calendário: filtros status + prioridade + cultivo; vínculo no formulário; badge de prioridade
- [x] Suporte: tabelas `tickets_suporte` / `mensagens_suporte` + `secondaryData.suporte.*`
- [x] Push local: `lib/notifications.ts` (expo-notifications) nos eventos do calendário
- [x] Offline core: `lib/offline/core-mutation-queue.ts` + `useCoreOfflineSync` + `CoreOfflineSyncManager`
- [x] Docs: ADMIN_OFFLINE_GUIDE (conteúdos, mídia, troubleshooting, core sync)
- [x] Testes: `tests/core-mutation-queue.test.ts` (252 testes passando)

### Aplicar schema de suporte no banco
```bash
npm run db:push
```

## Próximos passos — v3 / roadmap (atualizado 08/07/2026)

### Concluído no código (verificado)
- [x] **Geolocalização** — GPS em propriedades, mapa geral (`app/propriedades/mapa.tsx`)
- [x] **Clima** — Open-Meteo por propriedade, WeatherCard no dashboard, alertas automáticos
- [x] **Push remoto** — register/unregister FCM, notificações de pedido marketplace
- [x] **Marketplace P4.1** — catálogo, carrinho, checkout, pedidos, painel vendedor, PIX demo
- [x] **Staging Railway** — API Docker, seeds, login 4G validado
- [x] **Auth Android + staging** — layout login, Bearer token (`sdk.ts`), profiles EAS `apk`/`preview`
- [x] **Home marketplace** — stat card + ação rápida

### Parcial
- [~] **Marketplace pagamento** — PIX demo apenas; Mercado Pago / PIX real pendente
- [~] **Offline queueMutation** — em propriedades, cultivos, terrenos, calendário; faltam outros formulários
- [~] **Testes Vitest** — 220 passando; 2 suites falham import (`auth-flow`, `resend-email`)

### Pendente para usuários finais
- [ ] Homologação beta completa no APK staging (marketplace + cadastro + diagnóstico)
- [ ] API produção (`api.afuagro.com.br`) + MySQL dedicado
- [ ] Domínio CNAME `api-staging.afuagro.com.br`
- [ ] Credenciais prod: FCM (Expo), SendGrid, OAuth (opcional)
- [ ] Build `eas:android:prod` + Play Store (track internal → beta → production)
- [ ] Remover/ocultar login demo em build `production` (já condicional via `isDemoLoginEnabled`)
- [ ] Corrigir 2 suites de teste com falha de import
