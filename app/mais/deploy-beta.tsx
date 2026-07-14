import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { AfuStackBanner } from "@/components/afu-stack-banner";

const TABS = [
  { id: "infra", label: "Infraestrutura" },
  { id: "banco", label: "Banco & Cache" },
  { id: "cicd", label: "CI/CD" },
  { id: "testes", label: "Testes" },
  { id: "piloto", label: "Piloto" },
  { id: "aprovacao", label: "Aprovação" },
];

type SectionKey =
  | "ambientes" | "servicos" | "docker"
  | "postgres" | "redis" | "minio"
  | "pipeline" | "containers" | "dominios"
  | "integrados" | "seguranca" | "performance" | "mobile"
  | "grupo" | "feedback" | "correcoes"
  | "criterios" | "checklist" | "status";

function ExpandableSection({
  title,
  subtitle,
  color,
  sectionKey,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  subtitle?: string;
  color: string;
  sectionKey: SectionKey;
  expanded: boolean;
  onToggle: (key: SectionKey) => void;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-3 rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
      <TouchableOpacity
        onPress={() => onToggle(sectionKey)}
        style={{ backgroundColor: color + "15" }}
        className="flex-row items-center justify-between p-4"
      >
        <View className="flex-1">
          <Text className="text-sm font-bold text-foreground">{title}</Text>
          {subtitle ? (
            <Text className="text-xs text-muted mt-0.5">{subtitle}</Text>
          ) : null}
        </View>
        <Text style={{ color }} className="text-base font-bold ml-2">
          {expanded ? "▲" : "▼"}
        </Text>
      </TouchableOpacity>
      {expanded && (
        <View className="p-4 bg-surface">{children}</View>
      )}
    </View>
  );
}

function Tag({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <View style={{ backgroundColor: bg }} className="rounded-full px-3 py-1 mr-2 mb-2">
      <Text style={{ color }} className="text-xs font-semibold">{label}</Text>
    </View>
  );
}

export default function DeployBetaScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState("infra");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (key: SectionKey) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ backgroundColor: "#0D47A1" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-1">
          <View
            style={{ backgroundColor: "#1565C0" }}
            className="w-10 h-10 rounded-xl items-center justify-center"
          >
            <Text className="text-white text-xl">🚀</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Deploy Beta — Homologação AFU</Text>
            <Text style={{ color: "#90CAF9" }} className="text-xs">
              Railway · Vercel · EAS · CI GitHub Actions
            </Text>
          </View>
          <View style={{ backgroundColor: "#1B5E20" }} className="rounded-full px-2 py-0.5">
            <Text className="text-white text-xs font-bold">Etapa 28</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={{ backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-2">
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              className="mr-1 py-3 px-3"
            >
              <Text
                style={{
                  color: activeTab === tab.id ? "#0D47A1" : colors.muted,
                  fontWeight: activeTab === tab.id ? "700" : "400",
                  fontSize: 13,
                }}
              >
                {tab.label}
              </Text>
              {activeTab === tab.id && (
                <View style={{ backgroundColor: "#0D47A1", height: 2 }} className="rounded-full mt-1" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        <AfuStackBanner note="Homologação real: API no Railway, web no Vercel, CI em GitHub Actions. Docker Compose é referência futura, não o deploy atual." />
        {activeTab === "infra" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Infraestrutura de Ambientes</Text>
            <Text className="text-xs text-muted mb-4">
              3 ambientes · Railway + Vercel (staging ativo)
            </Text>

            <ExpandableSection
              title="Ambientes Oficiais"
              subtitle="DEV · STAGING · PROD"
              color="#0D47A1"
              sectionKey="ambientes"
              expanded={!!expanded.ambientes}
              onToggle={toggle}
            >
              {[
                {
                  env: "DEV",
                  desc: "Utilizado pelos desenvolvedores",
                  detalhe: "Ambiente local · Hot reload · Debug habilitado",
                  cor: "#64B5F6",
                },
                {
                  env: "STAGING",
                  desc: "Testes integrados · Validação técnica · Pilotos",
                  detalhe: "API Railway · Web Vercel · MySQL · CI automático",
                  cor: "#FFB74D",
                },
                {
                  env: "PROD",
                  desc: "Utilizado pelos usuários finais",
                  detalhe: "Alta disponibilidade · Backups automáticos · Monitoramento 24/7",
                  cor: "#81C784",
                },
              ].map((e) => (
                <View
                  key={e.env}
                  style={{ backgroundColor: e.cor + "15", borderWidth: 1, borderColor: e.cor + "40" }}
                  className="rounded-xl p-3 mb-2"
                >
                  <View className="flex-row items-center mb-1">
                    <View style={{ backgroundColor: e.cor }} className="rounded px-2 py-0.5 mr-2">
                      <Text className="text-white text-xs font-bold">{e.env}</Text>
                    </View>
                    <Text className="text-xs font-semibold text-foreground flex-1">{e.desc}</Text>
                  </View>
                  <Text style={{ color: "#888" }} className="text-xs">{e.detalhe}</Text>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="Serviços da Infraestrutura"
              subtitle="8 serviços principais"
              color="#1565C0"
              sectionKey="servicos"
              expanded={!!expanded.servicos}
              onToggle={toggle}
            >
              <View className="flex-row flex-wrap gap-2">
                {[
                  { svc: "MySQL 8", cor: "#64B5F6" },
                  { svc: "Railway API", cor: "#81C784" },
                  { svc: "Vercel Web", cor: "#80CBC4" },
                  { svc: "EAS Mobile", cor: "#CE93D8" },
                ].map((s) => (
                  <View
                    key={s.svc}
                    style={{ backgroundColor: s.cor + "20", borderWidth: 1, borderColor: s.cor + "40", width: "47%" }}
                    className="rounded-xl p-3 items-center"
                  >
                    <Text style={{ color: s.cor }} className="text-xs font-bold">{s.svc}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Docker Compose"
              subtitle="infra/docker/ · 2 arquivos · 6 serviços"
              color="#455A64"
              sectionKey="docker"
              expanded={!!expanded.docker}
              onToggle={toggle}
            >
              <View style={{ backgroundColor: "#1A1A2E" }} className="rounded-xl p-4 mb-3">
                <Text style={{ color: "#90CAF9" }} className="text-xs font-mono font-bold mb-2">infra/docker/</Text>
                {[
                  { arq: "docker-compose.yml", desc: "Ambiente de desenvolvimento", cor: "#64B5F6" },
                  { arq: "docker-compose.staging.yml", desc: "Ambiente de homologação", cor: "#FFB74D" },
                ].map((a) => (
                  <View key={a.arq} className="flex-row items-center mb-1.5">
                    <Text style={{ color: "#555" }} className="text-xs mr-1">├──</Text>
                    <View style={{ backgroundColor: a.cor + "20" }} className="rounded px-1.5 py-0.5 mr-2">
                      <Text style={{ color: a.cor }} className="text-xs font-mono">{a.arq}</Text>
                    </View>
                    <Text style={{ color: "#888" }} className="text-xs flex-1">{a.desc}</Text>
                  </View>
                ))}
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Serviços no Compose:</Text>
              <View className="flex-row flex-wrap">
                {["mysql", "api", "metro", "web-vercel", "eas-apk"].map((s) => (
                  <Tag key={s} label={s} color="#455A64" bg="#ECEFF1" />
                ))}
              </View>
            </ExpandableSection>
          </View>
        )}

        {/* ─── BANCO & CACHE ─── */}
        {activeTab === "banco" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Banco de Dados & Cache</Text>
            <Text className="text-xs text-muted mb-4">
              MySQL 8 · Drizzle · Railway (referência futura: Redis/MinIO)
            </Text>

            <ExpandableSection
              title="MySQL 8 + Drizzle"
              subtitle="31 tabelas MVP · drizzle/schema.ts"
              color="#336791"
              sectionKey="postgres"
              expanded={!!expanded.postgres}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Domínios no schema:</Text>
              {[
                { schema: "auth", desc: "users, tokens, RBAC", cor: "#EF9A9A" },
                { schema: "agricola", desc: "propriedades, culturas, diagnósticos", cor: "#81C784" },
                { schema: "banco", desc: "culturas_catalogo, clima, nutrientes, pragas", cor: "#64B5F6" },
                { schema: "piloto", desc: "participantes, feedback, métricas NPS", cor: "#80CBC4" },
                { schema: "marketplace", desc: "produtos, pedidos, parceiros", cor: "#FFB74D" },
                { schema: "suporte", desc: "tickets, mensagens", cor: "#CE93D8" },
                { schema: "sensores", desc: "IoT leituras (MVP parcial)", cor: "#FFCC80" },
              ].map((s) => (
                <View key={s.schema} className="flex-row items-center py-2" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                  <View style={{ backgroundColor: s.cor + "20" }} className="rounded px-2 py-0.5 mr-3">
                    <Text style={{ color: s.cor }} className="text-xs font-mono font-bold">{s.schema}</Text>
                  </View>
                  <Text className="text-xs text-muted flex-1">{s.desc}</Text>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="Redis"
              subtitle="4 funções de cache e mensageria"
              color="#DC382D"
              sectionKey="redis"
              expanded={!!expanded.redis}
              onToggle={toggle}
            >
              {[
                { func: "Cache", desc: "Respostas de API, dados frequentes, TTL configurável", cor: "#EF9A9A" },
                { func: "Filas", desc: "Jobs assíncronos: diagnósticos, e-mails, relatórios", cor: "#FFB74D" },
                { func: "Sessões", desc: "Tokens JWT, controle de sessões ativas", cor: "#64B5F6" },
                { func: "Notificações", desc: "Pub/Sub para notificações em tempo real", cor: "#81C784" },
              ].map((f) => (
                <View key={f.func} style={{ borderLeftWidth: 4, borderLeftColor: f.cor, backgroundColor: f.cor + "10" }} className="rounded-r-xl px-3 py-2 mb-1.5">
                  <Text style={{ color: f.cor }} className="text-xs font-bold">{f.func}</Text>
                  <Text className="text-xs text-muted mt-0.5">{f.desc}</Text>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="MinIO (Object Storage S3)"
              subtitle="5 buckets por categoria"
              color="#C72E28"
              sectionKey="minio"
              expanded={!!expanded.minio}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Buckets de Armazenamento:</Text>
              {[
                { bucket: "diagnosticos", desc: "Imagens de plantas enviadas para análise IA", cor: "#81C784" },
                { bucket: "relatorios", desc: "PDFs gerados de diagnósticos e análises", cor: "#64B5F6" },
                { bucket: "certificados", desc: "Certificados de análise laboratorial", cor: "#FFB74D" },
                { bucket: "materiais", desc: "Cursos, vídeos, apostilas educacionais", cor: "#CE93D8" },
                { bucket: "usuarios", desc: "Fotos de perfil, documentos de cadastro", cor: "#EF9A9A" },
              ].map((b) => (
                <View key={b.bucket} className="flex-row items-center py-2" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                  <View style={{ backgroundColor: b.cor + "20" }} className="rounded px-2 py-0.5 mr-3">
                    <Text style={{ color: b.cor }} className="text-xs font-mono font-bold">{b.bucket}</Text>
                  </View>
                  <Text className="text-xs text-muted flex-1">{b.desc}</Text>
                </View>
              ))}
            </ExpandableSection>
          </View>
        )}

        {/* ─── CI/CD ─── */}
        {activeTab === "cicd" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">CI/CD & Containers</Text>
            <Text className="text-xs text-muted mb-4">
              GitHub Actions · 5 etapas · 5 containers · 3 domínios
            </Text>

            <ExpandableSection
              title="Pipeline CI/CD"
              subtitle="GitHub → Testes → Build → Deploy Staging"
              color="#24292E"
              sectionKey="pipeline"
              expanded={!!expanded.pipeline}
              onToggle={toggle}
            >
              <View style={{ backgroundColor: "#1A1A2E" }} className="rounded-xl p-4 mb-3">
                {[
                  { step: "GitHub", desc: "Push na branch develop/staging dispara o pipeline", cor: "#64B5F6" },
                  { step: "Testes", desc: "Vitest + tsc (npm run test, npm run check)", cor: "#FFB74D" },
                  { step: "Build", desc: "Expo web export + Docker API (Railway)", cor: "#81C784" },
                  { step: "Deploy Staging", desc: "Vercel (web) + Railway (API) automático em main", cor: "#CE93D8" },
                ].map((s, i) => (
                  <View key={s.step} className="items-start mb-1">
                    <View style={{ backgroundColor: s.cor + "20", borderWidth: 1, borderColor: s.cor }} className="rounded-xl px-3 py-2 w-full">
                      <Text style={{ color: s.cor }} className="text-xs font-bold">{s.step}</Text>
                      <Text style={{ color: "#999" }} className="text-xs mt-0.5">{s.desc}</Text>
                    </View>
                    {i < 3 && <Text style={{ color: "#555" }} className="text-sm ml-4">↓</Text>}
                  </View>
                ))}
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Etapas do Pipeline:</Text>
              <View className="flex-row flex-wrap">
                {[
                  { etapa: "Lint", cor: "#64B5F6" },
                  { etapa: "Testes", cor: "#FFB74D" },
                  { etapa: "Build", cor: "#81C784" },
                  { etapa: "Segurança", cor: "#EF9A9A" },
                  { etapa: "Deploy", cor: "#CE93D8" },
                ].map((e) => (
                  <View key={e.etapa} style={{ backgroundColor: e.cor + "20" }} className="rounded-full px-3 py-1 mr-2 mb-2">
                    <Text style={{ color: e.cor }} className="text-xs font-semibold">{e.etapa}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Containers & Portas"
              subtitle="5 containers com mapeamento de portas"
              color="#0D47A1"
              sectionKey="containers"
              expanded={!!expanded.containers}
              onToggle={toggle}
            >
              {[
                { container: "afu-api", porta: "3000", health: "/api/health", cor: "#81C784" },
                { container: "afu-web-admin", porta: "3001", health: "/health", cor: "#64B5F6" },
                { container: "afu-web-produtor", porta: "3002", health: "/health", cor: "#FFB74D" },
                { container: "afu-ai-service", porta: "4001", health: "/ai/health", cor: "#CE93D8" },
                { container: "afu-pdf-service", porta: "4002", health: "/pdf/health", cor: "#EF9A9A" },
              ].map((c) => (
                <View key={c.container} style={{ backgroundColor: c.cor + "15", borderWidth: 1, borderColor: c.cor + "40" }} className="rounded-xl p-3 mb-2">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text style={{ color: c.cor }} className="text-xs font-bold font-mono">{c.container}</Text>
                    <View style={{ backgroundColor: c.cor + "30" }} className="rounded px-2 py-0.5">
                      <Text style={{ color: c.cor }} className="text-xs font-mono font-bold">:{c.porta}</Text>
                    </View>
                  </View>
                  <Text style={{ color: "#888" }} className="text-xs">Health: {c.health}</Text>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="URLs de Homologação (staging)"
              subtitle="Railway + Vercel — docs/STAGING.md"
              color="#455A64"
              sectionKey="dominios"
              expanded={!!expanded.dominios}
              onToggle={toggle}
            >
              {[
                { dominio: "afu-mobile-v2-production.up.railway.app", desc: "API Express/tRPC — /api/health", cor: "#81C784" },
                { dominio: "afu-mobile-web.vercel.app", desc: "Portal web — Expo export", cor: "#FFB74D" },
                { dominio: "localhost:3000 + :8081", desc: "DEV local — API + Metro web", cor: "#64B5F6" },
              ].map((d) => (
                <View key={d.dominio} style={{ borderLeftWidth: 4, borderLeftColor: d.cor, backgroundColor: d.cor + "10" }} className="rounded-r-xl px-3 py-2 mb-1.5">
                  <Text style={{ color: d.cor }} className="text-xs font-bold font-mono">{d.dominio}</Text>
                  <Text className="text-xs text-muted mt-0.5">{d.desc}</Text>
                </View>
              ))}
            </ExpandableSection>
          </View>
        )}

        {/* ─── TESTES ─── */}
        {activeTab === "testes" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Plano de Testes</Text>
            <Text className="text-xs text-muted mb-4">
              8 fluxos integrados · Segurança · Performance · Mobile
            </Text>

            <ExpandableSection
              title="Testes Integrados"
              subtitle="8 fluxos obrigatórios end-to-end"
              color="#1B5E20"
              sectionKey="integrados"
              expanded={!!expanded.integrados}
              onToggle={toggle}
            >
              {[
                { fluxo: "Cadastro", desc: "Registro de novo usuário com validação de e-mail", cor: "#81C784" },
                { fluxo: "Login", desc: "Autenticação JWT + refresh token + RBAC", cor: "#64B5F6" },
                { fluxo: "Cadastro de Propriedade", desc: "Criação com localização, área e tipo de solo", cor: "#FFB74D" },
                { fluxo: "Cadastro de Cultura", desc: "Vinculação à propriedade + variedade + data de plantio", cor: "#CE93D8" },
                { fluxo: "Upload de Imagem", desc: "Envio para MinIO + validação de formato e tamanho", cor: "#EF9A9A" },
                { fluxo: "Diagnóstico", desc: "Processamento IA + retorno de resultado com confiança", cor: "#80CBC4" },
                { fluxo: "Relatório", desc: "Geração de PDF + envio por e-mail + histórico", cor: "#FFCC80" },
                { fluxo: "Histórico", desc: "Listagem paginada + filtros + exportação", cor: "#F48FB1" },
              ].map((f) => (
                <View key={f.fluxo} className="flex-row items-start py-2" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                  <View style={{ backgroundColor: f.cor + "20", width: 24, height: 24 }} className="rounded items-center justify-center mr-3 mt-0.5">
                    <Text style={{ color: f.cor }} className="text-xs font-bold">✓</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-semibold text-foreground">{f.fluxo}</Text>
                    <Text className="text-xs text-muted">{f.desc}</Text>
                  </View>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="Testes de Segurança"
              subtitle="5 validações críticas"
              color="#C62828"
              sectionKey="seguranca"
              expanded={!!expanded.seguranca}
              onToggle={toggle}
            >
              <View className="flex-row flex-wrap">
                {[
                  { val: "JWT", desc: "Expiração, refresh, revogação", cor: "#EF9A9A" },
                  { val: "RBAC", desc: "Permissões por perfil", cor: "#FFB74D" },
                  { val: "Uploads", desc: "Tipo, tamanho, malware scan", cor: "#64B5F6" },
                  { val: "Rate Limit", desc: "Throttling por IP/usuário", cor: "#81C784" },
                  { val: "LGPD", desc: "Consentimento, anonimização, exclusão", cor: "#CE93D8" },
                ].map((v) => (
                  <View key={v.val} style={{ backgroundColor: v.cor + "15", borderWidth: 1, borderColor: v.cor + "40", width: "47%" }} className="rounded-xl p-3 mr-2 mb-2">
                    <Text style={{ color: v.cor }} className="text-xs font-bold mb-1">{v.val}</Text>
                    <Text style={{ color: "#888" }} className="text-xs">{v.desc}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Testes de Performance"
              subtitle="3 metas mensuráveis"
              color="#EF6C00"
              sectionKey="performance"
              expanded={!!expanded.performance}
              onToggle={toggle}
            >
              {[
                { meta: "Tempo de Resposta API", valor: "< 500 ms", desc: "P95 para endpoints críticos", cor: "#81C784" },
                { meta: "Upload de Imagem", valor: "< 5 segundos", desc: "Para imagens até 10 MB", cor: "#64B5F6" },
                { meta: "Disponibilidade", valor: "> 99%", desc: "Uptime mensal do STAGING", cor: "#FFB74D" },
              ].map((m) => (
                <View key={m.meta} style={{ backgroundColor: m.cor + "15", borderWidth: 1, borderColor: m.cor + "40" }} className="rounded-xl p-3 mb-2">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-xs font-semibold text-foreground">{m.meta}</Text>
                    <View style={{ backgroundColor: m.cor }} className="rounded-full px-2 py-0.5">
                      <Text className="text-white text-xs font-bold">{m.valor}</Text>
                    </View>
                  </View>
                  <Text style={{ color: "#888" }} className="text-xs">{m.desc}</Text>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="Testes Mobile"
              subtitle="Android APK interno · iOS TestFlight"
              color="#1565C0"
              sectionKey="mobile"
              expanded={!!expanded.mobile}
              onToggle={toggle}
            >
              <View className="flex-row gap-3">
                {[
                  { plat: "Android", tipo: "APK interno", desc: "Distribuição via link direto para testadores", cor: "#81C784" },
                  { plat: "iOS", tipo: "TestFlight", desc: "Distribuição via Apple TestFlight para beta testers", cor: "#64B5F6" },
                ].map((p) => (
                  <View key={p.plat} style={{ backgroundColor: p.cor + "15", borderWidth: 1, borderColor: p.cor + "40" }} className="flex-1 rounded-xl p-3">
                    <Text style={{ color: p.cor }} className="text-sm font-bold mb-1">{p.plat}</Text>
                    <View style={{ backgroundColor: p.cor + "30" }} className="rounded px-2 py-0.5 mb-2 self-start">
                      <Text style={{ color: p.cor }} className="text-xs font-semibold">{p.tipo}</Text>
                    </View>
                    <Text style={{ color: "#888" }} className="text-xs">{p.desc}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>
          </View>
        )}

        {/* ─── PILOTO ─── */}
        {activeTab === "piloto" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Projeto Piloto Beta</Text>
            <Text className="text-xs text-muted mb-4">
              14 participantes · 5 categorias de feedback · 4 níveis de correção
            </Text>

            <ExpandableSection
              title="Grupo Piloto"
              subtitle="10 produtores + 3 técnicos + 1 laboratório"
              color="#1B5E20"
              sectionKey="grupo"
              expanded={!!expanded.grupo}
              onToggle={toggle}
            >
              <View className="flex-row gap-2 mb-3">
                {[
                  { tipo: "Produtores", qtd: "10", desc: "Agricultores com diferentes culturas", cor: "#81C784" },
                  { tipo: "Técnicos", qtd: "3", desc: "Agrônomos e técnicos agrícolas", cor: "#64B5F6" },
                  { tipo: "Laboratório", qtd: "1", desc: "Laboratório parceiro de análise", cor: "#FFB74D" },
                ].map((g) => (
                  <View key={g.tipo} style={{ backgroundColor: g.cor + "15", borderWidth: 1, borderColor: g.cor + "40" }} className="flex-1 rounded-xl p-3 items-center">
                    <Text style={{ color: g.cor }} className="text-2xl font-bold">{g.qtd}</Text>
                    <Text style={{ color: g.cor }} className="text-xs font-bold mt-1">{g.tipo}</Text>
                    <Text style={{ color: "#888" }} className="text-xs mt-1 text-center">{g.desc}</Text>
                  </View>
                ))}
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Objetivos da Validação:</Text>
              <View className="flex-row flex-wrap">
                {["Usabilidade", "Estabilidade", "Qualidade dos Diagnósticos"].map((o) => (
                  <Tag key={o} label={o} color="#1B5E20" bg="#E8F5E9" />
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Coleta de Feedback"
              subtitle="5 categorias de avaliação"
              color="#6A1B9A"
              sectionKey="feedback"
              expanded={!!expanded.feedback}
              onToggle={toggle}
            >
              {[
                { cat: "Interface", desc: "Facilidade de uso, clareza visual, navegação intuitiva", cor: "#CE93D8" },
                { cat: "Velocidade", desc: "Tempo de resposta, carregamento, upload de imagens", cor: "#64B5F6" },
                { cat: "Diagnóstico", desc: "Precisão da IA, clareza do resultado, confiança", cor: "#81C784" },
                { cat: "Relatórios", desc: "Qualidade do PDF, informações relevantes, exportação", cor: "#FFB74D" },
                { cat: "Funcionalidades", desc: "Recursos desejados, gaps identificados, sugestões", cor: "#EF9A9A" },
              ].map((c) => (
                <View key={c.cat} style={{ borderLeftWidth: 4, borderLeftColor: c.cor, backgroundColor: c.cor + "10" }} className="rounded-r-xl px-3 py-2 mb-1.5">
                  <Text style={{ color: c.cor }} className="text-xs font-bold">{c.cat}</Text>
                  <Text className="text-xs text-muted mt-0.5">{c.desc}</Text>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="Classificação de Correções"
              subtitle="4 níveis de prioridade"
              color="#C62828"
              sectionKey="correcoes"
              expanded={!!expanded.correcoes}
              onToggle={toggle}
            >
              {[
                { nivel: "Crítica", desc: "Bloqueia uso do sistema · Correção imediata (< 24h)", cor: "#EF9A9A" },
                { nivel: "Alta", desc: "Impacta funcionalidade principal · Correção em 48h", cor: "#FFB74D" },
                { nivel: "Média", desc: "Afeta experiência do usuário · Correção no sprint", cor: "#64B5F6" },
                { nivel: "Baixa", desc: "Melhoria cosmética ou sugestão · Backlog", cor: "#81C784" },
              ].map((n) => (
                <View key={n.nivel} style={{ backgroundColor: n.cor + "15", borderWidth: 1, borderColor: n.cor + "40" }} className="rounded-xl p-3 mb-2">
                  <View className="flex-row items-center mb-1">
                    <View style={{ backgroundColor: n.cor }} className="rounded px-2 py-0.5 mr-2">
                      <Text className="text-white text-xs font-bold">{n.nivel}</Text>
                    </View>
                  </View>
                  <Text style={{ color: "#888" }} className="text-xs">{n.desc}</Text>
                </View>
              ))}
            </ExpandableSection>
          </View>
        )}

        {/* ─── APROVAÇÃO ─── */}
        {activeTab === "aprovacao" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Aprovação & Status do Projeto</Text>
            <Text className="text-xs text-muted mb-4">
              6 critérios · Checklist 6 itens · Status 100%
            </Text>

            <ExpandableSection
              title="Critérios para Aprovação do STAGING"
              subtitle="6 critérios obrigatórios"
              color="#1B5E20"
              sectionKey="criterios"
              expanded={!!expanded.criterios}
              onToggle={toggle}
            >
              {[
                { crit: "Login funcional", desc: "Autenticação JWT completa com RBAC" },
                { crit: "CRUD completo", desc: "Criar, ler, atualizar e excluir em todos os módulos" },
                { crit: "Upload funcional", desc: "Envio de imagens para MinIO com validação" },
                { crit: "Diagnóstico funcional", desc: "IA processando e retornando resultado com confiança" },
                { crit: "Relatórios funcionais", desc: "Geração e download de PDF sem erros" },
                { crit: "Sem erros críticos", desc: "Zero bugs bloqueantes no grupo piloto" },
              ].map((c) => (
                <View key={c.crit} className="flex-row items-start py-2" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                  <View style={{ backgroundColor: "#E8F5E9", width: 20, height: 20 }} className="rounded items-center justify-center mr-3 mt-0.5">
                    <Text style={{ color: "#2E7D32" }} className="text-xs font-bold">✓</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-semibold text-foreground">{c.crit}</Text>
                    <Text className="text-xs text-muted">{c.desc}</Text>
                  </View>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="Checklist de Liberação"
              subtitle="6 itens de validação final"
              color="#0D47A1"
              sectionKey="checklist"
              expanded={!!expanded.checklist}
              onToggle={toggle}
            >
              <View className="flex-row flex-wrap gap-2">
                {[
                  { item: "Banco validado", cor: "#81C784" },
                  { item: "API validada", cor: "#64B5F6" },
                  { item: "Web validado", cor: "#FFB74D" },
                  { item: "Mobile validado", cor: "#CE93D8" },
                  { item: "Segurança validada", cor: "#EF9A9A" },
                  { item: "Backup validado", cor: "#80CBC4" },
                ].map((i) => (
                  <View key={i.item} style={{ backgroundColor: i.cor + "20", borderWidth: 1, borderColor: i.cor + "40", width: "47%" }} className="rounded-xl p-3 items-center">
                    <Text style={{ color: i.cor }} className="text-xs font-bold text-center">{i.item}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Status do Projeto AFU"
              subtitle="Planejamento e arquitetura 100% concluídos"
              color="#1B5E20"
              sectionKey="status"
              expanded={!!expanded.status}
              onToggle={toggle}
            >
              {[
                { fase: "Planejamento", pct: 100, cor: "#81C784" },
                { fase: "Arquitetura", pct: 100, cor: "#64B5F6" },
                { fase: "MVP Especificado", pct: 100, cor: "#FFB74D" },
                { fase: "Homologação", pct: 85, cor: "#CE93D8" },
              ].map((s) => (
                <View key={s.fase} className="mb-3">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-xs font-semibold text-foreground">{s.fase}</Text>
                    <Text style={{ color: s.cor }} className="text-xs font-bold">{s.pct}%</Text>
                  </View>
                  <View style={{ backgroundColor: "#E5E7EB" }} className="rounded-full h-2">
                    <View
                      style={{ backgroundColor: s.cor, width: `${s.pct}%` }}
                      className="rounded-full h-2"
                    />
                  </View>
                </View>
              ))}

              {/* Próxima Etapa */}
              <View style={{ backgroundColor: "#0D47A1" }} className="rounded-xl p-4 mt-2">
                <Text className="text-white text-sm font-bold mb-1">Próxima Etapa: 29</Text>
                <Text style={{ color: "#90CAF9" }} className="text-xs">Testes de Campo e Projeto Piloto</Text>
                <View className="mt-2">
                  {[
                    "Validação com produtores reais",
                    "Validação de diagnósticos IA",
                    "Métricas de desempenho em campo",
                    "Coleta de dados reais",
                    "Refinamento da IA",
                    "Preparação para lançamento AFU 1.0",
                  ].map((item) => (
                    <View key={item} className="flex-row items-center py-0.5">
                      <View style={{ backgroundColor: "#1565C0", width: 6, height: 6 }} className="rounded-full mr-2" />
                      <Text style={{ color: "#BBDEFB" }} className="text-xs">{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </ExpandableSection>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
