import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { usePermission } from "@/components/route-guard";
import { useSession } from "@/hooks/use-session";
import { etapaBadgeForRoute } from "@/constants/afu-etapas";

/** Badge canônico por rota; preserva Admin/Novo; remove numeração incorreta no menu Admin. */
function resolveMenuBadge(item: MenuItem): string | undefined {
  if (item.badge === "Admin" || item.badge === "Novo") return item.badge;
  return etapaBadgeForRoute(item.route);
}

type MenuItem = {
  title: string;
  subtitle: string;
  icon: string;
  route: string;
  color: string;
  badge?: string;
  requireAdmin?: boolean;
};

type MenuSection = {
  title: string;
  items: MenuItem[];
  /** Se true, seção inteira só para admin (docs de planejamento / CRUD) */
  requireAdmin?: boolean;
}

const MENU_SECTIONS: MenuSection[] = [
  {
    title: "Início",
    items: [
      {
        title: "Índice Geral — Etapas AFU",
        subtitle: "Progresso MVP · Expansão 31–46 · Links diretos",
        icon: "house.fill",
        route: "/mais/indice-geral",
        color: "#1B5E20",
        badge: "Novo",
      },
      {
        title: "Laboratório Planta Saudável",
        subtitle: "Hub de diagnóstico, análises e laudos",
        icon: "flask.fill",
        route: "/mais/laboratorio",
        color: "#2E7D32",
      },
    ],
  },
  {
    title: "Etapas 1–6 · Estratégia e Negócio",
    requireAdmin: true,
    items: [
      {
        title: "Visão Geral do AFU",
        subtitle: "Missão, visão, valores, problema e solução",
        icon: "house.fill",
        route: "/mais/visao-geral",
        color: "#1B5E20",
        badge: "Etapa 1",
      },
      {
        title: "Análise de Mercado",
        subtitle: "TAM, SAM, SOM · Concorrência · Tendências",
        icon: "chart.bar.fill",
        route: "/mais/analise-mercado",
        color: "#1565C0",
        badge: "Etapa 2",
      },
      {
        title: "Modelo de Negócio",
        subtitle: "Canvas · Receitas · Proposta de Valor · Parceiros",
        icon: "doc.text.fill",
        route: "/mais/modelo-negocio",
        color: "#E65100",
        badge: "Etapa 3",
      },
      {
        title: "Estratégia de Produto",
        subtitle: "Roadmap · Priorização · OKRs · Visão de Produto",
        icon: "map.fill",
        route: "/mais/estrategia-produto",
        color: "#7B1FA2",
        badge: "Etapa 4",
      },
      {
        title: "Plano de Marketing",
        subtitle: "Go-to-Market · Canais · CAC · Funil de Aquisição",
        icon: "megaphone.fill",
        route: "/mais/plano-marketing",
        color: "#C62828",
        badge: "Etapa 5",
      },
      {
        title: "Captação e Investimento",
        subtitle: "Valuation · Rodadas · Pitch · Projeções Financeiras",
        icon: "dollarsign.circle.fill",
        route: "/mais/captacao-investimento",
        color: "#2E7D32",
        badge: "Etapa 6",
      },
    ],
  },
  {
    title: "Etapas 7–12 · Arquitetura Técnica",
    requireAdmin: true,
    items: [
      {
        title: "Arquitetura de Sistema",
        subtitle: "Microserviços · Stack · Componentes · Diagrama",
        icon: "server.rack",
        route: "/mais/arquitetura-sistema",
        color: "#004D40",
        badge: "Etapa 7",
      },
      {
        title: "Banco de Dados e Schema",
        subtitle: "PostgreSQL · Drizzle ORM · Tabelas · Relações",
        icon: "server.rack",
        route: "/mais/banco-dados-schema",
        color: "#004D40",
        badge: "Etapa 8",
      },
      {
        title: "API Design",
        subtitle: "RESTful · Endpoints · JWT · WebSocket · OpenAPI",
        icon: "chevron.left.forwardslash.chevron.right",
        route: "/mais/api-design",
        color: "#311B92",
        badge: "Etapa 9",
      },
      {
        title: "Segurança Técnica",
        subtitle: "RBAC · LGPD · Criptografia · Auditoria · ISO 27001",
        icon: "lock.fill",
        route: "/mais/seguranca-tecnica",
        color: "#B71C1C",
        badge: "Etapa 10",
      },
      {
        title: "Infraestrutura Técnica",
        subtitle: "AWS · Docker · Ambientes · Monitoramento · SLA",
        icon: "cloud.fill",
        route: "/mais/infraestrutura-tecnica",
        color: "#37474F",
        badge: "Etapa 11",
      },
      {
        title: "Integrações Técnicas",
        subtitle: "IA · IoT · Pagamentos · Clima · Satélite · Parceiros",
        icon: "link",
        route: "/mais/integracoes-tecnicas",
        color: "#1B5E20",
        badge: "Etapa 12",
      },
    ],
  },
  {
    title: "Etapas 13–16 · Design e UX/UI",
    requireAdmin: true,
    items: [
      {
        title: "Design System Base",
        subtitle: "Cores · Tipografia · Tokens · Espaçamento · Stack",
        icon: "paintbrush.fill",
        route: "/mais/design-system-base",
        color: "#AD1457",
        badge: "Etapa 13",
      },
      {
        title: "Wireframes",
        subtitle: "App Mobile · Portal Web · Admin · Fluxos · Figma",
        icon: "rectangle.on.rectangle",
        route: "/mais/wireframes",
        color: "#4527A0",
        badge: "Etapa 14",
      },
      {
        title: "Fluxos de Usuário",
        subtitle: "Jornadas · Personas · Edge Cases · Métricas UX",
        icon: "person.fill",
        route: "/mais/fluxos-usuario",
        color: "#00838F",
        badge: "Etapa 15",
      },
      {
        title: "Guia de Componentes",
        subtitle: "Atoms · Molecules · Organisms · Acessibilidade",
        icon: "square.grid.2x2.fill",
        route: "/mais/guia-componentes",
        color: "#E65100",
        badge: "Etapa 16",
      },
    ],
  },
  {
    title: "Etapas 17–21 · Governança",
    requireAdmin: true,
    items: [
      {
        title: "Estrutura Organizacional",
        subtitle: "Equipe MVP · Papéis · RACI · Parceiros",
        icon: "person.2.fill",
        route: "/mais/estrutura-organizacional",
        color: "#455A64",
        badge: "Etapa 17",
      },
      {
        title: "Indicadores (KPIs)",
        subtitle: "Métricas MVP · Staging · Piloto etapa 29",
        icon: "chart.bar.fill",
        route: "/mais/kpis",
        color: "#37474F",
        badge: "Etapa 18",
      },
      {
        title: "Governança & DevOps",
        subtitle: "Segurança · LGPD · CI/CD · Conformidade",
        icon: "shield.fill",
        route: "/mais/governanca-devops",
        color: "#37474F",
        badge: "Etapa 19",
      },
      {
        title: "Plano Mestre AFU 1.0 → 5.0",
        subtitle: "Roadmap · Cronograma · Equipes · Financeiro",
        icon: "map.fill",
        route: "/mais/plano-mestre",
        color: "#1B5E20",
        badge: "Etapa 20",
      },
      {
        title: "Execução Real — MVP 1.0",
        subtitle: "Sprints · Entregas · Stack real · Critérios MVP",
        icon: "hammer.fill",
        route: "/mais/execucao-mvp",
        color: "#0D47A1",
        badge: "Etapa 21",
      },
    ],
  },
  {
    title: "Etapas 22–30 · Implementação",
    requireAdmin: true,
    items: [
      {
        title: "Design System AFU",
        subtitle: "Marca · Cores · Tipografia · Componentes",
        icon: "paintbrush.fill",
        route: "/mais/design-system",
        color: "#1B5E20",
        badge: "Etapa 22",
      },
      {
        title: "Protótipos UX/UI — MVP 1.0",
        subtitle: "Fluxos · Mobile · Portal · Admin",
        icon: "rectangle.on.rectangle",
        route: "/mais/prototipos-ux",
        color: "#4A148C",
        badge: "Etapa 23",
      },
      {
        title: "Backend API — MVP 1.0",
        subtitle: "Express · tRPC · MySQL · Drizzle · JWT",
        icon: "server.rack",
        route: "/mais/backend-nestjs",
        color: "#B71C1C",
        badge: "Etapa 24",
      },
      {
        title: "App Planta Saudável",
        subtitle: "Expo 54 · Tabs · Diagnóstico IA · CRUD",
        icon: "leaf.fill",
        route: "/mais/app-react-native",
        color: "#1B5E20",
        badge: "Etapa 25",
      },
      {
        title: "Portal Web do Produtor",
        subtitle: "Expo Web · PWA · JWT · Diagnóstico",
        icon: "globe",
        route: "/mais/portal-web-v2",
        color: "#0D47A1",
        badge: "Etapa 26",
      },
      {
        title: "Painel Administrativo AFU",
        subtitle: "Dashboard · RBAC · CRUD · Auditoria",
        icon: "gearshape.2.fill",
        route: "/mais/painel-admin",
        color: "#37474F",
        badge: "Etapa 27",
        requireAdmin: true,
      },
      {
        title: "Deploy Beta — Homologação",
        subtitle: "Railway · Vercel · CI · Staging",
        icon: "server.rack",
        route: "/mais/deploy-beta",
        color: "#0D47A1",
        badge: "Etapa 28",
      },
      {
        title: "Testes de Campo — Piloto",
        subtitle: "50 produtores · IA 85%+ · Satisfação 4,5+",
        icon: "leaf.fill",
        route: "/mais/testes-campo",
        color: "#2E7D32",
        badge: "Etapa 29",
      },
      {
        title: "Banco Agronômico Avançado",
        subtitle: "Catálogo · Clima · Nutrientes · Pragas · IA",
        icon: "leaf.fill",
        route: "/mais/banco-agronomico",
        color: "#00695C",
        badge: "Etapa 30",
      },
    ],
  },
  {
    title: "Análise e Diagnóstico",
    items: [
      {
        title: "Análise Fitotécnica",
        subtitle: "Solo, água, nutrientes e fertilidade",
        icon: "flask.fill",
        route: "/mais/analise-fitotecnica",
        color: "#92400E",
        badge: "Novo",
      },
      {
        title: "Nutrição Vegetal",
        subtitle: "Macro e micronutrientes, deficiências",
        icon: "leaf.fill",
        route: "/mais/nutricao",
        color: "#D97706",
      },
    ],
  },
  {
    title: "Relatórios e Laudos",
    items: [
      {
        title: "Relatórios e Laudos",
        subtitle: "Laudos técnicos, certificados e histórico",
        icon: "doc.fill",
        route: "/mais/relatorios",
        color: "#2D6A4F",
        badge: "Novo",
      },
    ],
  },
  {
    title: "Banco Técnico",
    items: [
      {
        title: "Catálogo Botânico",
        subtitle: "Família botânica, ciclo, fases fenológicas e exigências agronômicas",
        icon: "books.vertical.fill",
        route: "/mais/catalogo-culturas",
        color: "#1B4332",
        badge: "Novo",
      },
      {
        title: "Banco de Culturas",
        subtitle: "15 espécies com dados técnicos completos",
        icon: "leaf.fill",
        route: "/mais/culturas",
        color: "#38A169",
      },
      {
        title: "Pragas e Doenças",
        subtitle: "Identificação, sintomas e controle",
        icon: "ant.fill",
        route: "/mais/pragas-doencas",
        color: "#E53E3E",
      },
      {
        title: "Clima Agrícola",
        subtitle: "Tempo real por propriedade e necessidades por cultura",
        icon: "sun.max.fill",
        route: "/mais/tempo",
        color: "#0288D1",
      },
      {
        title: "Clima por Cultura",
        subtitle: "Necessidades climáticas de cada cultura",
        icon: "leaf.fill",
        route: "/mais/clima",
        color: "#F59E0B",
      },
      {
        title: "Irrigação",
        subtitle: "Recomendações hídricas e métodos",
        icon: "drop.fill",
        route: "/mais/irrigacao",
        color: "#3B82F6",
      },
    ],
  },
  {
    title: "Planejamento",
    items: [
      {
        title: "Calendário Agrícola",
        subtitle: "Planejamento e eventos operacionais",
        icon: "calendar",
        route: "/mais/calendario",
        color: "#2D6A4F",
      },
    ],
  },
  {
    title: "Rede e Negócios",
    items: [
      {
        title: "Parceiros",
        subtitle: "Laboratórios, cooperativas e consultorias",
        icon: "building.2.fill",
        route: "/mais/parceiros",
        color: "#8B5CF6",
        badge: "Novo",
      },
      {
        title: "Marketplace",
        subtitle: "Insumos, sementes, serviços e equipamentos",
        icon: "cart.fill",
        route: "/mais/marketplace",
        color: "#D97706",
        badge: "Novo",
      },
    ],
  },
  {
    title: "Educação e Suporte",
    items: [
      {
        title: "Materiais Didáticos",
        subtitle: "Vídeos, áudios, apostilas, guias e checklists",
        icon: "doc.text.fill",
        route: "/mais/materiais",
        color: "#2563EB",
        badge: "Novo",
      },
      {
        title: "Suporte Técnico",
        subtitle: "Chat, chamados, dúvidas e visita técnica",
        icon: "person.fill",
        route: "/mais/suporte",
        color: "#16A34A",
        badge: "Novo",
      },
    ],
  },
  {
    title: "Banco Agronômico · Etapas 31–46",
    items: [
      { title: "Culturas Iniciais", subtitle: "17 fichas live · catálogo botânico", icon: "leaf.fill", route: "/mais/culturas-iniciais", color: "#2E7D32", badge: "Etapa 31" },
      { title: "Seed das Culturas", subtitle: "seed:agronomico · idempotente", icon: "leaf.fill", route: "/mais/seed-culturas", color: "#1B5E20", badge: "Etapa 32" },
      { title: "Seed Técnico", subtitle: "Clima · Irrigação · Nutrientes", icon: "drop.fill", route: "/mais/seed-tecnico", color: "#1565C0", badge: "Etapa 33" },
      { title: "Fitossanitário e Genética", subtitle: "Pragas · Doenças · G1–G5", icon: "ant.fill", route: "/mais/banco-fitossanitario", color: "#880E4F", badge: "Etapa 34" },
      { title: "GeoClima", subtitle: "Zonas Köppen · clima nacional", icon: "cloud.fill", route: "/mais/geoclima", color: "#0D47A1", badge: "Etapa 35" },
      { title: "AFU Solos", subtitle: "Classes SiBCS · pH · aptidão", icon: "globe", route: "/mais/afu-solos", color: "#4E342E", badge: "Etapa 36" },
      { title: "Genoma Vegetal", subtitle: "Melhoramento G1–G5", icon: "leaf.fill", route: "/mais/genoma-vegetal", color: "#1B5E20", badge: "Etapa 37" },
      { title: "Calendário Agrícola Inteligente", subtitle: "Épocas de plantio · ciclos", icon: "calendar", route: "/mais/calendario-agricola", color: "#2E7D32", badge: "Etapa 38" },
      { title: "Laboratório Digital", subtitle: "7 módulos · laudos", icon: "flask.fill", route: "/mais/laboratorio-digital", color: "#1A237E", badge: "Etapa 39" },
      { title: "Economia Agrícola", subtitle: "Custo/ha · simulador de margem", icon: "chart.bar.fill", route: "/mais/economia-agricola", color: "#1B5E20", badge: "Etapa 40" },
      { title: "IA Agrônomo Virtual", subtitle: "Diagnóstico + consulta composta", icon: "brain", route: "/mais/ia-agronomo", color: "#6A1B9A", badge: "Etapa 41" },
      { title: "Geointeligência", subtitle: "Camadas satélite · NDVI · drones", icon: "map.fill", route: "/mais/geointeligencia", color: "#1A237E", badge: "Etapa 42" },
      { title: "IoT e Automação", subtitle: "Sensores · leituras · alertas", icon: "antenna.radiowaves.left.and.right", route: "/mais/iot-automacao", color: "#004D40", badge: "Etapa 43" },
      { title: "Marketplace Agrícola", subtitle: "Catálogo live · comercialização", icon: "cart.fill", route: "/mais/marketplace-agricola", color: "#1B5E20", badge: "Etapa 44" },
      { title: "Centro de Comando NOC", subtitle: "Painel operacional · alertas", icon: "desktopcomputer", route: "/mais/noc-agricola", color: "#0D47A1", badge: "Etapa 45" },
      { title: "Arquitetura Final", subtitle: "Stack real · componentes vivos", icon: "wrench.fill", route: "/mais/arquitetura-final", color: "#212121", badge: "Etapa 46" },
    ],
  },
  {
    title: "Administração",
    requireAdmin: true,
    items: [
      { title: "Dashboard Admin", subtitle: "Contadores em tempo real", icon: "chart.bar.fill", route: "/mais/admin-dashboard", color: "#1E3A5F", badge: "Admin", requireAdmin: true },
      { title: "Gerenciar Usuários", subtitle: "Roles, status e tipos de perfil", icon: "person.2.fill", route: "/mais/admin-usuarios", color: "#7C3AED", badge: "Admin", requireAdmin: true },
      { title: "Gestão de Culturas", subtitle: "CRUD do banco de culturas", icon: "leaf.fill", route: "/mais/admin-culturas", color: "#166534", badge: "Admin", requireAdmin: true },
      { title: "Gestão de Pragas e Doenças", subtitle: "Banco fitossanitário — CRUD", icon: "cross.circle.fill", route: "/mais/admin-pragas", color: "#7F1D1D", badge: "Admin", requireAdmin: true },
      { title: "Gestão de Materiais", subtitle: "Conteúdos didáticos — CRUD", icon: "books.vertical.fill", route: "/mais/admin-materiais", color: "#1565C0", badge: "Admin", requireAdmin: true },
      { title: "Conteúdos Offline", subtitle: "Artigos e mídia — sync offline", icon: "doc.richtext.fill", route: "/admin/conteudos-offline", color: "#0D47A1", badge: "Admin", requireAdmin: true },
      { title: "Gestão de Parceiros", subtitle: "Laboratórios e cooperativas — CRUD", icon: "building.2.fill", route: "/mais/admin-parceiros", color: "#7C3AED", badge: "Admin", requireAdmin: true },
      { title: "Painel Administrativo", subtitle: "RBAC · auditoria · monitor", icon: "gearshape.2.fill", route: "/mais/painel-admin", color: "#37474F", badge: "Etapa 27", requireAdmin: true },
    ],
  },
  {
    title: "Documentação (referência)",
    requireAdmin: true,
    items: [
      { title: "Schema / Banco (legado)", subtitle: "Doc histórica — stack real em drizzle/schema", icon: "server.rack", route: "/mais/banco-dados", color: "#1B4332" },
      { title: "Arquitetura (legado)", subtitle: "Plano Nest/Prisma — ver banners de stack", icon: "wrench.fill", route: "/mais/arquitetura", color: "#6A1B9A" },
      { title: "API Docs (legado)", subtitle: "Referência Nest — API real Express/tRPC", icon: "chevron.left.forwardslash.chevron.right", route: "/mais/api-docs", color: "#1565C0" },
      { title: "Backend API (etapa 24)", subtitle: "Express · tRPC · MySQL · Drizzle", icon: "server.rack", route: "/mais/backend-nestjs", color: "#B71C1C", badge: "Etapa 24" },
    ],
  },

];

export default function MaisScreen() {
  const colors = useColors();
  const router = useRouter();
  const { canAccessMaisTab, loading } = useSession();
  const { canAccess: isAdmin } = usePermission({ requireAdmin: true });

  useEffect(() => {
    if (loading || canAccessMaisTab) return;
    router.replace("/(tabs)" as any);
  }, [canAccessMaisTab, loading, router]);

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (!canAccessMaisTab) {
    return null;
  }

  // Produtor: operações + banco 31–46. Admin: + docs de etapas + CRUD.
  const visibleSections = MENU_SECTIONS
    .filter((section) => !section.requireAdmin || isAdmin)
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.requireAdmin || isAdmin),
    }))
    .filter((section) => section.items.length > 0);

  const styles = StyleSheet.create({
    menuCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 14,
      marginBottom: 8,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    iconContainer: {
      width: 46,
      height: 46,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.muted,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 8,
      marginTop: 16,
    },
  });

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ backgroundColor: colors.primary, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text style={{ fontSize: 22, fontWeight: "700", color: "#FFFFFF", flex: 1 }}>Mais</Text>
          {isAdmin && (
            <View style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)" }}>
              <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "800" }}>🔑 Administrador</Text>
            </View>
          )}
        </View>
        <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>
          {isAdmin ? `${visibleSections.reduce((a, s) => a + s.items.length, 0)} módulos visíveis` : "Sistema Fitotécnico Bio-Inteligente"}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {visibleSections.map((section) => (
          <View key={section.title}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item) => {
              const badge = resolveMenuBadge(item);
              return (
              <TouchableOpacity
                key={item.route}
                style={styles.menuCard}
                onPress={() => router.push(item.route as any)}
              >
                <View style={[styles.iconContainer, { backgroundColor: item.color + "20" }]}>
                  <IconSymbol name={item.icon as any} size={22} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>
                      {item.title}
                    </Text>
                    {badge && (
                      <View style={{ backgroundColor: item.color, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                        <Text style={{ fontSize: 10, fontWeight: "800", color: "#FFFFFF" }}>{badge}</Text>
                      </View>
                    )}
                    {item.requireAdmin && (
                      <View style={{ backgroundColor: "#7C3AED20", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: "#7C3AED40" }}>
                        <Text style={{ fontSize: 9, fontWeight: "800", color: "#7C3AED" }}>🔑 ADMIN</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                    {item.subtitle}
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={16} color={colors.muted} />
              </TouchableOpacity>
            );
            })}
          </View>
        ))}

        {/* Perfil */}
        <Text style={styles.sectionTitle}>Conta</Text>
        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => router.push("/mais/perfil" as any)}
        >
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + "20" }]}>
            <IconSymbol name="person.fill" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>Perfil e Configurações</Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>Dados pessoais e profissionais</Text>
          </View>
          <IconSymbol name="chevron.right" size={16} color={colors.muted} />
        </TouchableOpacity>

        {/* App info */}
        <View style={{ alignItems: "center", paddingVertical: 24 }}>
          <Text style={{ fontSize: 13, color: colors.muted, fontWeight: "600" }}>AFU Agro</Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>Analisador Fitotécnico Universal</Text>
          <Text style={{ fontSize: 11, color: colors.border, marginTop: 4 }}>MVP 1.0 — Planta Saudável</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
