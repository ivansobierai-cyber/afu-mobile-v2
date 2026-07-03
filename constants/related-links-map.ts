import type { RelatedLink } from "@/components/related-links";

/**
 * Mapa central de navegação cruzada do AFU.
 * Cada chave é a rota da tela atual, e o valor é a lista
 * de telas relacionadas que devem aparecer na seção "Ver também".
 *
 * Critérios de relacionamento:
 * - Dependência técnica direta (ex: BD ↔ API)
 * - Mesma fase do projeto
 * - Complementaridade de conteúdo
 */
export const RELATED_LINKS_MAP: Record<string, RelatedLink[]> = {

  // ─── Etapa 1 — Visão Geral ────────────────────────────────────────────────
  "/mais/visao-geral": [
    { etapa: 2,  title: "Análise de Mercado",        subtitle: "TAM, SAM, SOM e concorrência",       route: "/mais/analise-mercado",        color: "#1565C0", emoji: "📊" },
    { etapa: 3,  title: "Modelo de Negócio",          subtitle: "Canvas e fontes de receita",         route: "/mais/modelo-negocio",          color: "#E65100", emoji: "💼" },
    { etapa: 4,  title: "Estratégia de Produto",      subtitle: "Roadmap e OKRs",                     route: "/mais/estrategia-produto",      color: "#7B1FA2", emoji: "🗺️" },
    { etapa: 6,  title: "Captação e Investimento",    subtitle: "Valuation e pitch deck",             route: "/mais/captacao-investimento",   color: "#2E7D32", emoji: "💰" },
  ],

  // ─── Etapa 2 — Análise de Mercado ─────────────────────────────────────────
  "/mais/analise-mercado": [
    { etapa: 1,  title: "Visão Geral do AFU",         subtitle: "Missão, visão e proposta de valor",  route: "/mais/visao-geral",             color: "#1B5E20", emoji: "🌱" },
    { etapa: 3,  title: "Modelo de Negócio",          subtitle: "Canvas e monetização",               route: "/mais/modelo-negocio",          color: "#E65100", emoji: "💼" },
    { etapa: 5,  title: "Plano de Marketing",         subtitle: "Go-to-Market e canais",              route: "/mais/plano-marketing",         color: "#C62828", emoji: "📣" },
    { etapa: 6,  title: "Captação e Investimento",    subtitle: "Projeções e rodadas",                route: "/mais/captacao-investimento",   color: "#2E7D32", emoji: "💰" },
  ],

  // ─── Etapa 3 — Modelo de Negócio ──────────────────────────────────────────
  "/mais/modelo-negocio": [
    { etapa: 1,  title: "Visão Geral do AFU",         subtitle: "Proposta de valor central",          route: "/mais/visao-geral",             color: "#1B5E20", emoji: "🌱" },
    { etapa: 2,  title: "Análise de Mercado",         subtitle: "Público-alvo e segmentos",           route: "/mais/analise-mercado",         color: "#1565C0", emoji: "📊" },
    { etapa: 5,  title: "Plano de Marketing",         subtitle: "Aquisição e funil de vendas",        route: "/mais/plano-marketing",         color: "#C62828", emoji: "📣" },
    { etapa: 6,  title: "Captação e Investimento",    subtitle: "Valuation e projeções",              route: "/mais/captacao-investimento",   color: "#2E7D32", emoji: "💰" },
  ],

  // ─── Etapa 4 — Estratégia de Produto ──────────────────────────────────────
  "/mais/estrategia-produto": [
    { etapa: 1,  title: "Visão Geral do AFU",         subtitle: "Missão e proposta de valor",         route: "/mais/visao-geral",             color: "#1B5E20", emoji: "🌱" },
    { etapa: 7,  title: "Arquitetura de Sistema",     subtitle: "Stack e componentes técnicos",       route: "/mais/arquitetura-sistema",     color: "#004D40", emoji: "🏗️" },
    { etapa: 13, title: "Design System Base",         subtitle: "Cores, tipografia e tokens",         route: "/mais/design-system-base",      color: "#AD1457", emoji: "🎨" },
    { etapa: 14, title: "Wireframes",                 subtitle: "Telas e fluxos visuais",             route: "/mais/wireframes",              color: "#4527A0", emoji: "📐" },
  ],

  // ─── Etapa 5 — Plano de Marketing ─────────────────────────────────────────
  "/mais/plano-marketing": [
    { etapa: 2,  title: "Análise de Mercado",         subtitle: "Segmentos e público-alvo",           route: "/mais/analise-mercado",         color: "#1565C0", emoji: "📊" },
    { etapa: 3,  title: "Modelo de Negócio",          subtitle: "Fontes de receita e parceiros",      route: "/mais/modelo-negocio",          color: "#E65100", emoji: "💼" },
    { etapa: 6,  title: "Captação e Investimento",    subtitle: "Budget de marketing e ROI",          route: "/mais/captacao-investimento",   color: "#2E7D32", emoji: "💰" },
    { etapa: 15, title: "Fluxos de Usuário",          subtitle: "Jornada e onboarding",               route: "/mais/fluxos-usuario",          color: "#00838F", emoji: "🗺️" },
  ],

  // ─── Etapa 6 — Captação e Investimento ────────────────────────────────────
  "/mais/captacao-investimento": [
    { etapa: 1,  title: "Visão Geral do AFU",         subtitle: "Proposta de valor para investidores",route: "/mais/visao-geral",             color: "#1B5E20", emoji: "🌱" },
    { etapa: 2,  title: "Análise de Mercado",         subtitle: "TAM e oportunidade de mercado",      route: "/mais/analise-mercado",         color: "#1565C0", emoji: "📊" },
    { etapa: 3,  title: "Modelo de Negócio",          subtitle: "Receitas e projeções financeiras",   route: "/mais/modelo-negocio",          color: "#E65100", emoji: "💼" },
    { etapa: 5,  title: "Plano de Marketing",         subtitle: "CAC e LTV dos clientes",             route: "/mais/plano-marketing",         color: "#C62828", emoji: "📣" },
  ],

  // ─── Etapa 7 — Arquitetura de Sistema ─────────────────────────────────────
  "/mais/arquitetura-sistema": [
    { etapa: 8,  title: "Banco de Dados e Schema",    subtitle: "PostgreSQL, Drizzle e tabelas",      route: "/mais/banco-dados-schema",      color: "#004D40", emoji: "🗄️" },
    { etapa: 9,  title: "API Design",                 subtitle: "REST, JWT e WebSocket",              route: "/mais/api-design",              color: "#311B92", emoji: "🔌" },
    { etapa: 11, title: "Infraestrutura Técnica",     subtitle: "AWS, Docker e SLA",                  route: "/mais/infraestrutura-tecnica",  color: "#37474F", emoji: "☁️" },
    { etapa: 12, title: "Integrações Técnicas",       subtitle: "IA, IoT e pagamentos",               route: "/mais/integracoes-tecnicas",    color: "#1B5E20", emoji: "🔗" },
  ],

  // ─── Etapa 8 — Banco de Dados e Schema ────────────────────────────────────
  "/mais/banco-dados-schema": [
    { etapa: 7,  title: "Arquitetura de Sistema",     subtitle: "Stack e diagrama geral",             route: "/mais/arquitetura-sistema",     color: "#004D40", emoji: "🏗️" },
    { etapa: 9,  title: "API Design",                 subtitle: "Endpoints que consomem o BD",        route: "/mais/api-design",              color: "#311B92", emoji: "🔌" },
    { etapa: 10, title: "Segurança Técnica",          subtitle: "RBAC, LGPD e criptografia",          route: "/mais/seguranca-tecnica",       color: "#B71C1C", emoji: "🔒" },
    { etapa: 11, title: "Infraestrutura Técnica",     subtitle: "RDS, Redis e backups",               route: "/mais/infraestrutura-tecnica",  color: "#37474F", emoji: "☁️" },
  ],

  // ─── Etapa 9 — API Design ─────────────────────────────────────────────────
  "/mais/api-design": [
    { etapa: 7,  title: "Arquitetura de Sistema",     subtitle: "Contexto e stack tecnológico",       route: "/mais/arquitetura-sistema",     color: "#004D40", emoji: "🏗️" },
    { etapa: 8,  title: "Banco de Dados e Schema",    subtitle: "Tabelas que a API acessa",           route: "/mais/banco-dados-schema",      color: "#004D40", emoji: "🗄️" },
    { etapa: 10, title: "Segurança Técnica",          subtitle: "JWT, RBAC e rate limiting",          route: "/mais/seguranca-tecnica",       color: "#B71C1C", emoji: "🔒" },
    { etapa: 12, title: "Integrações Técnicas",       subtitle: "APIs externas e webhooks",           route: "/mais/integracoes-tecnicas",    color: "#1B5E20", emoji: "🔗" },
  ],

  // ─── Etapa 10 — Segurança Técnica ─────────────────────────────────────────
  "/mais/seguranca-tecnica": [
    { etapa: 8,  title: "Banco de Dados e Schema",    subtitle: "Criptografia em repouso",            route: "/mais/banco-dados-schema",      color: "#004D40", emoji: "🗄️" },
    { etapa: 9,  title: "API Design",                 subtitle: "Autenticação JWT e RBAC",            route: "/mais/api-design",              color: "#311B92", emoji: "🔌" },
    { etapa: 11, title: "Infraestrutura Técnica",     subtitle: "WAF, VPC e secrets management",      route: "/mais/infraestrutura-tecnica",  color: "#37474F", emoji: "☁️" },
    { etapa: 7,  title: "Arquitetura de Sistema",     subtitle: "Visão geral do sistema",             route: "/mais/arquitetura-sistema",     color: "#004D40", emoji: "🏗️" },
  ],

  // ─── Etapa 11 — Infraestrutura Técnica ────────────────────────────────────
  "/mais/infraestrutura-tecnica": [
    { etapa: 7,  title: "Arquitetura de Sistema",     subtitle: "Stack e componentes",                route: "/mais/arquitetura-sistema",     color: "#004D40", emoji: "🏗️" },
    { etapa: 8,  title: "Banco de Dados e Schema",    subtitle: "RDS e TimescaleDB",                  route: "/mais/banco-dados-schema",      color: "#004D40", emoji: "🗄️" },
    { etapa: 10, title: "Segurança Técnica",          subtitle: "WAF, TLS e conformidade",            route: "/mais/seguranca-tecnica",       color: "#B71C1C", emoji: "🔒" },
    { etapa: 12, title: "Integrações Técnicas",       subtitle: "AWS IoT Core e serviços externos",   route: "/mais/integracoes-tecnicas",    color: "#1B5E20", emoji: "🔗" },
  ],

  // ─── Etapa 12 — Integrações Técnicas ──────────────────────────────────────
  "/mais/integracoes-tecnicas": [
    { etapa: 7,  title: "Arquitetura de Sistema",     subtitle: "Contexto de integração",             route: "/mais/arquitetura-sistema",     color: "#004D40", emoji: "🏗️" },
    { etapa: 9,  title: "API Design",                 subtitle: "Contratos e webhooks",               route: "/mais/api-design",              color: "#311B92", emoji: "🔌" },
    { etapa: 10, title: "Segurança Técnica",          subtitle: "API Keys e OAuth 2.0",               route: "/mais/seguranca-tecnica",       color: "#B71C1C", emoji: "🔒" },
    { etapa: 11, title: "Infraestrutura Técnica",     subtitle: "AWS SQS, SNS e IoT Core",            route: "/mais/infraestrutura-tecnica",  color: "#37474F", emoji: "☁️" },
  ],

  // ─── Etapa 13 — Design System Base ────────────────────────────────────────
  "/mais/design-system-base": [
    { etapa: 14, title: "Wireframes",                 subtitle: "Aplicação do design system",         route: "/mais/wireframes",              color: "#4527A0", emoji: "📐" },
    { etapa: 15, title: "Fluxos de Usuário",          subtitle: "Jornadas e navegação",               route: "/mais/fluxos-usuario",          color: "#00838F", emoji: "🗺️" },
    { etapa: 16, title: "Guia de Componentes",        subtitle: "Atoms, molecules e organisms",       route: "/mais/guia-componentes",        color: "#E65100", emoji: "🧩" },
    { etapa: 4,  title: "Estratégia de Produto",      subtitle: "Visão de produto e UX",              route: "/mais/estrategia-produto",      color: "#7B1FA2", emoji: "🗺️" },
  ],

  // ─── Etapa 14 — Wireframes ────────────────────────────────────────────────
  "/mais/wireframes": [
    { etapa: 13, title: "Design System Base",         subtitle: "Tokens e paleta de cores",           route: "/mais/design-system-base",      color: "#AD1457", emoji: "🎨" },
    { etapa: 15, title: "Fluxos de Usuário",          subtitle: "Jornadas e edge cases",              route: "/mais/fluxos-usuario",          color: "#00838F", emoji: "🗺️" },
    { etapa: 16, title: "Guia de Componentes",        subtitle: "Componentes usados nos wireframes",  route: "/mais/guia-componentes",        color: "#E65100", emoji: "🧩" },
    { etapa: 9,  title: "API Design",                 subtitle: "Endpoints consumidos pelas telas",   route: "/mais/api-design",              color: "#311B92", emoji: "🔌" },
  ],

  // ─── Etapa 15 — Fluxos de Usuário ─────────────────────────────────────────
  "/mais/fluxos-usuario": [
    { etapa: 13, title: "Design System Base",         subtitle: "Identidade visual dos fluxos",       route: "/mais/design-system-base",      color: "#AD1457", emoji: "🎨" },
    { etapa: 14, title: "Wireframes",                 subtitle: "Representação visual dos fluxos",    route: "/mais/wireframes",              color: "#4527A0", emoji: "📐" },
    { etapa: 16, title: "Guia de Componentes",        subtitle: "Componentes em cada tela",           route: "/mais/guia-componentes",        color: "#E65100", emoji: "🧩" },
    { etapa: 5,  title: "Plano de Marketing",         subtitle: "Funil de aquisição e onboarding",    route: "/mais/plano-marketing",         color: "#C62828", emoji: "📣" },
  ],

  // ─── Etapa 16 — Guia de Componentes ───────────────────────────────────────
  "/mais/guia-componentes": [
    { etapa: 13, title: "Design System Base",         subtitle: "Tokens que os componentes usam",     route: "/mais/design-system-base",      color: "#AD1457", emoji: "🎨" },
    { etapa: 14, title: "Wireframes",                 subtitle: "Componentes aplicados nas telas",    route: "/mais/wireframes",              color: "#4527A0", emoji: "📐" },
    { etapa: 15, title: "Fluxos de Usuário",          subtitle: "Componentes em cada fluxo",          route: "/mais/fluxos-usuario",          color: "#00838F", emoji: "🗺️" },
    { etapa: 7,  title: "Arquitetura de Sistema",     subtitle: "Stack que suporta os componentes",   route: "/mais/arquitetura-sistema",     color: "#004D40", emoji: "🏗️" },
  ],
};
