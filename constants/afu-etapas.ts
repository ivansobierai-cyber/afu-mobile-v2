/**
 * Fonte única das etapas AFU 1–30 (MVP Planta Saudável).
 * Usado por indice-geral, badges do menu Mais e relatórios de progresso.
 */

export type EtapaStatus = "doc" | "partial" | "done" | "pending";

export type AfuEtapa = {
  num: number;
  title: string;
  route: string;
  faseId: AfuFaseId;
  requireAdmin?: boolean;
  /** doc = planejamento; partial = parte no código; done = entregue MVP; pending = não iniciado */
  status: EtapaStatus;
};

export type AfuFaseId =
  | "estrategia"
  | "tecnica"
  | "design"
  | "governanca"
  | "implementacao"
  | "banco";

export type AfuFase = {
  id: AfuFaseId;
  label: string;
  emoji: string;
  color: string;
  etapas: AfuEtapa[];
};

/** Stack implementada no repositório (jul/2026) */
export const AFU_STACK_REAL = {
  frontend: "Expo SDK 54 · React Native · Expo Router · NativeWind",
  backend: "Express · tRPC",
  database: "MySQL 8 · Drizzle ORM",
  auth: "JWT + refresh token · bcrypt",
  deploy: "Railway (API) · Vercel (web) · EAS (mobile)",
} as const;

export const AFU_ETAPAS_1_30: AfuEtapa[] = [
  { num: 1, title: "Visão Geral e Proposta de Valor", route: "/mais/visao-geral", faseId: "estrategia", status: "doc" },
  { num: 2, title: "Análise de Mercado e Público-Alvo", route: "/mais/analise-mercado", faseId: "estrategia", status: "doc" },
  { num: 3, title: "Modelo de Negócio e Monetização", route: "/mais/modelo-negocio", faseId: "estrategia", status: "doc" },
  { num: 4, title: "Estratégia de Produto e Roadmap", route: "/mais/estrategia-produto", faseId: "estrategia", status: "doc" },
  { num: 5, title: "Plano de Marketing e Go-to-Market", route: "/mais/plano-marketing", faseId: "estrategia", status: "doc" },
  { num: 6, title: "Captação e Investimento", route: "/mais/captacao-investimento", faseId: "estrategia", status: "doc" },
  { num: 7, title: "Arquitetura do Sistema e Stack", route: "/mais/arquitetura-sistema", faseId: "tecnica", status: "done" },
  { num: 8, title: "Banco de Dados e Schema", route: "/mais/banco-dados-schema", faseId: "tecnica", status: "done" },
  { num: 9, title: "API Design — Contratos e Endpoints", route: "/mais/api-design", faseId: "tecnica", status: "done" },
  { num: 10, title: "Segurança Técnica e LGPD", route: "/mais/seguranca-tecnica", faseId: "tecnica", status: "done" },
  { num: 11, title: "Infraestrutura Técnica e Cloud", route: "/mais/infraestrutura-tecnica", faseId: "tecnica", status: "done" },
  { num: 12, title: "Integrações Técnicas e Parceiros", route: "/mais/integracoes-tecnicas", faseId: "tecnica", status: "done" },
  { num: 13, title: "Design System Base", route: "/mais/design-system-base", faseId: "design", status: "done" },
  { num: 14, title: "Wireframes — App, Web e Admin", route: "/mais/wireframes", faseId: "design", status: "done" },
  { num: 15, title: "Fluxos de Usuário e Jornada", route: "/mais/fluxos-usuario", faseId: "design", status: "done" },
  { num: 16, title: "Guia de Componentes", route: "/mais/guia-componentes", faseId: "design", status: "done" },
  { num: 17, title: "Estrutura Organizacional e Equipe", route: "/mais/estrutura-organizacional", faseId: "governanca", status: "done" },
  { num: 18, title: "Indicadores de Desempenho (KPIs)", route: "/mais/kpis", faseId: "governanca", status: "done" },
  { num: 19, title: "Governança, Segurança e DevOps", route: "/mais/governanca-devops", faseId: "governanca", status: "done" },
  { num: 20, title: "Plano Mestre AFU 1.0 → 5.0", route: "/mais/plano-mestre", faseId: "governanca", status: "done" },
  { num: 21, title: "Execução Real do MVP 1.0", route: "/mais/execucao-mvp", faseId: "governanca", status: "done" },
  { num: 22, title: "Design System AFU", route: "/mais/design-system", faseId: "design", status: "done" },
  { num: 23, title: "Protótipos UX/UI MVP", route: "/mais/prototipos-ux", faseId: "design", status: "done" },
  { num: 24, title: "Backend API — MVP 1.0", route: "/mais/backend-nestjs", faseId: "implementacao", status: "done" },
  { num: 25, title: "App Planta Saudável — React Native", route: "/mais/app-react-native", faseId: "implementacao", status: "done" },
  { num: 26, title: "Portal Web do Produtor", route: "/mais/portal-web-v2", faseId: "implementacao", status: "done" },
  { num: 27, title: "Painel Administrativo AFU", route: "/mais/painel-admin", faseId: "implementacao", status: "done", requireAdmin: true },
  { num: 28, title: "Deploy Beta — Homologação STAGING", route: "/mais/deploy-beta", faseId: "implementacao", status: "done" },
  { num: 29, title: "Testes de Campo — Projeto Piloto", route: "/mais/testes-campo", faseId: "implementacao", status: "partial" },
  { num: 30, title: "Banco de Dados Agronômico Avançado", route: "/mais/banco-agronomico", faseId: "banco", status: "done" },
];

/** @deprecated Use AFU_ETAPAS_1_30 */
export const AFU_ETAPAS_1_29 = AFU_ETAPAS_1_30.filter((e) => e.num <= 29);

/** Expansão banco agronômico — etapas 31–34 entregues; 35–46 planejadas */
export const AFU_ETAPAS_31_46: AfuEtapa[] = [
  { num: 31, title: "Culturas Iniciais — 17 Fichas Técnicas", route: "/mais/culturas-iniciais", faseId: "banco", status: "done" },
  { num: 32, title: "Seed Inicial das Culturas", route: "/mais/seed-culturas", faseId: "banco", status: "done" },
  { num: 33, title: "Seed de Clima, Irrigação e Nutrientes", route: "/mais/seed-tecnico", faseId: "banco", status: "done" },
  { num: 34, title: "Pragas, Doenças, Rotação e Genética G1–G5", route: "/mais/banco-fitossanitario", faseId: "banco", status: "done" },
  { num: 35, title: "AFU GeoClima — Banco Climático Nacional", route: "/mais/geoclima", faseId: "banco", status: "done" },
  { num: 36, title: "AFU Solos — Banco Nacional de Solos", route: "/mais/afu-solos", faseId: "banco", status: "done" },
  { num: 37, title: "AFU Genoma Vegetal e Melhoramento Genético", route: "/mais/genoma-vegetal", faseId: "banco", status: "done" },
  { num: 38, title: "Calendário Agrícola Inteligente", route: "/mais/calendario-agricola", faseId: "banco", status: "done" },
  { num: 39, title: "AFU Laboratório Digital", route: "/mais/laboratorio-digital", faseId: "banco", status: "done" },
  { num: 40, title: "Economia Agrícola e Previsão de Produção", route: "/mais/economia-agricola", faseId: "banco", status: "done" },
  { num: 41, title: "IA Agrônomo Virtual (AFU AI CORE)", route: "/mais/ia-agronomo", faseId: "banco", status: "done" },
  { num: 42, title: "Satélite, Drones e Geointeligência", route: "/mais/geointeligencia", faseId: "banco", status: "doc" },
  { num: 43, title: "Rede de Sensores IoT e Automação Rural", route: "/mais/iot-automacao", faseId: "banco", status: "doc" },
  { num: 44, title: "Marketplace e Comercialização Agrícola", route: "/mais/marketplace-agricola", faseId: "banco", status: "partial" },
  { num: 45, title: "Centro de Comando NOC Agrícola", route: "/mais/noc-agricola", faseId: "banco", status: "doc" },
  { num: 46, title: "Arquitetura Final de Software e Infra", route: "/mais/arquitetura-final", faseId: "banco", status: "doc" },
];

export const AFU_ETAPAS_31_34 = AFU_ETAPAS_31_46.filter((e) => e.num <= 34);
export const AFU_ETAPAS_35_38 = AFU_ETAPAS_31_46.filter((e) => e.num >= 35 && e.num <= 38);
export const AFU_ETAPAS_39_41 = AFU_ETAPAS_31_46.filter((e) => e.num >= 39 && e.num <= 41);

export const AFU_FASES: AfuFase[] = [
  {
    id: "estrategia",
    label: "Estratégia e Negócio",
    emoji: "🎯",
    color: "#1565C0",
    etapas: AFU_ETAPAS_1_30.filter((e) => e.faseId === "estrategia"),
  },
  {
    id: "tecnica",
    label: "Arquitetura Técnica",
    emoji: "⚙️",
    color: "#C62828",
    etapas: AFU_ETAPAS_1_30.filter((e) => e.faseId === "tecnica"),
  },
  {
    id: "design",
    label: "Design e UX/UI",
    emoji: "🎨",
    color: "#7B1FA2",
    etapas: AFU_ETAPAS_1_30.filter((e) => e.faseId === "design"),
  },
  {
    id: "governanca",
    label: "Governança e Planejamento",
    emoji: "⚖️",
    color: "#455A64",
    etapas: AFU_ETAPAS_1_30.filter((e) => e.faseId === "governanca"),
  },
  {
    id: "implementacao",
    label: "Implementação do MVP",
    emoji: "🚀",
    color: "#2E7D32",
    etapas: AFU_ETAPAS_1_30.filter((e) => e.faseId === "implementacao"),
  },
  {
    id: "banco",
    label: "Banco Agronômico",
    emoji: "🌱",
    color: "#00695C",
    etapas: AFU_ETAPAS_1_30.filter((e) => e.faseId === "banco"),
  },
];

/** Mapa rota → número da etapa (para badges no menu Mais) */
export const ETAPA_BY_ROUTE: Record<string, number> = Object.fromEntries(
  [...AFU_ETAPAS_1_30, ...AFU_ETAPAS_31_46].map((e) => [e.route, e.num]),
);

export function etapaBadgeForRoute(route: string): string | undefined {
  const num = ETAPA_BY_ROUTE[route];
  return num != null ? `Etapa ${num}` : undefined;
}

export function etapaProgressPercent(etapas: AfuEtapa[]): number {
  if (etapas.length === 0) return 0;
  const weights: Record<EtapaStatus, number> = { done: 1, partial: 0.65, doc: 0.35, pending: 0 };
  const sum = etapas.reduce((acc, e) => acc + weights[e.status], 0);
  return Math.round((sum / etapas.length) * 100);
}

export function etapas1a29ProgressPercent(): number {
  return etapaProgressPercent(AFU_ETAPAS_1_29);
}

export function etapas1a30ProgressPercent(): number {
  return etapaProgressPercent(AFU_ETAPAS_1_30);
}

export function etapas31a34ProgressPercent(): number {
  return etapaProgressPercent(AFU_ETAPAS_31_34);
}

export function etapas35a38ProgressPercent(): number {
  return etapaProgressPercent(AFU_ETAPAS_35_38);
}

export function etapas39a41ProgressPercent(): number {
  return etapaProgressPercent(AFU_ETAPAS_39_41);
}

export function etapasDoneOrPartialCount(etapas: AfuEtapa[]): number {
  return etapas.filter((e) => e.status === "done" || e.status === "partial").length;
}
