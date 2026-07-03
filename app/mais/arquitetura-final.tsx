import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

const TABS = [
  { id: "apps", label: "Apps" },
  { id: "backend", label: "Backend & API" },
  { id: "dados", label: "Dados & IA" },
  { id: "cloud", label: "Cloud & Infra" },
  { id: "seguranca", label: "Segurança" },
  { id: "devops", label: "DevOps & Status" },
];

type SectionProps = {
  title: string;
  color: string;
  children: React.ReactNode;
};

function Section({ title, color, children }: SectionProps) {
  return (
    <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: color + "30" }}>
      <View style={{ backgroundColor: color }} className="p-3">
        <Text className="text-white text-sm font-bold">{title}</Text>
      </View>
      <View className="p-4 bg-surface">{children}</View>
    </View>
  );
}

type BadgeProps = {
  label: string;
  color: string;
  bg?: string;
};

function Badge({ label, color, bg }: BadgeProps) {
  return (
    <View style={{ backgroundColor: bg ?? color + "15", borderWidth: 1, borderColor: color + "30" }} className="rounded-full px-2 py-0.5">
      <Text style={{ color }} className="text-xs font-semibold">{label}</Text>
    </View>
  );
}

type CardProps = {
  label: string;
  color: string;
  emoji?: string;
  half?: boolean;
};

function Card({ label, color, emoji, half }: CardProps) {
  return (
    <View style={{ backgroundColor: color + "15", borderWidth: 1, borderColor: color + "30", width: half ? "47%" : undefined }} className="rounded-xl p-3 flex-row items-center gap-2 mb-0">
      {emoji ? <Text className="text-lg">{emoji}</Text> : null}
      <Text style={{ color }} className="text-xs font-bold flex-1">{label}</Text>
    </View>
  );
}

export default function ArquiteturaFinalScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState("apps");

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ backgroundColor: "#212121" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-1">
          <View style={{ backgroundColor: "#424242" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">🏗️</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Arquitetura Final AFU</Text>
            <Text style={{ color: "#BDBDBD" }} className="text-xs">
              Software · Infraestrutura · Cloud · DevOps · Segurança
            </Text>
          </View>
          <View style={{ backgroundColor: "#C62828" }} className="rounded-full px-2 py-0.5">
            <Text className="text-white text-xs font-bold">Etapa 46</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={{ backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-2">
          {TABS.map((tab) => (
            <TouchableOpacity key={tab.id} onPress={() => setActiveTab(tab.id)} className="mr-1 py-3 px-3">
              <Text style={{ color: activeTab === tab.id ? "#212121" : colors.muted, fontWeight: activeTab === tab.id ? "700" : "400", fontSize: 12 }}>
                {tab.label}
              </Text>
              {activeTab === tab.id && (
                <View style={{ backgroundColor: "#212121", height: 2 }} className="rounded-full mt-1" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">

        {/* ─── APPS ─── */}
        {activeTab === "apps" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Aplicativos Cliente</Text>
            <Text className="text-xs text-muted mb-4">Android APK · iOS IPA · Portal Web · Admin · PWA</Text>

            {/* Visão geral das plataformas */}
            <View style={{ backgroundColor: "#212121" }} className="rounded-xl p-4 mb-4">
              <Text className="text-white text-sm font-bold mb-2">📱 Plataformas AFU</Text>
              <View className="flex-row flex-wrap gap-2">
                {[
                  { p: "Android APK/AAB", emoji: "🤖", cor: "#2E7D32" },
                  { p: "iOS IPA", emoji: "🍎", cor: "#1565C0" },
                  { p: "Portal Web Produtor", emoji: "🌐", cor: "#0288D1" },
                  { p: "Painel Admin", emoji: "🖥️", cor: "#7B1FA2" },
                  { p: "PWA Offline", emoji: "📶", cor: "#F57F17" },
                ].map((pl) => (
                  <View key={pl.p} style={{ backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 12, padding: 8, width: "47%", flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text className="text-xl">{pl.emoji}</Text>
                    <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700", flex: 1 }}>{pl.p}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* App Mobile */}
            <Section title="📱 App Mobile — React Native + Expo" color="#2E7D32">
              <View className="flex-row flex-wrap gap-1 mb-3">
                {["Expo SDK 54", "React Native 0.81", "TypeScript", "NativeWind v4", "Expo Router 6", "TanStack Query", "Zustand", "AsyncStorage", "expo-camera", "expo-notifications", "EAS Build"].map((t) => (
                  <Badge key={t} label={t} color="#2E7D32" />
                ))}
              </View>
              <Text className="text-xs font-bold text-foreground mb-2">Telas MVP</Text>
              <View className="flex-row flex-wrap gap-1">
                {["Splash / Onboarding", "Login / Cadastro", "Dashboard", "Propriedades", "Cultivos", "Diagnóstico IA", "Resultado", "Histórico", "Calendário", "Marketplace", "Perfil"].map((t) => (
                  <Badge key={t} label={t} color="#388E3C" />
                ))}
              </View>
            </Section>

            {/* Portal Web Produtor */}
            <Section title="🌐 Portal Web Produtor — Next.js 15" color="#0288D1">
              <View className="flex-row flex-wrap gap-1 mb-3">
                {["Next.js 15", "React 19", "TypeScript", "Tailwind CSS", "shadcn/ui", "TanStack Query", "Zustand", "Recharts", "next-auth", "PWA"].map((t) => (
                  <Badge key={t} label={t} color="#0288D1" />
                ))}
              </View>
              <Text className="text-xs font-bold text-foreground mb-2">13 Rotas</Text>
              <View className="flex-row flex-wrap gap-1">
                {["/login", "/dashboard", "/propriedades", "/cultivos", "/diagnostico", "/resultado", "/historico", "/calendario", "/laboratorio", "/marketplace", "/relatorios", "/materiais", "/perfil"].map((r) => (
                  <View key={r} style={{ backgroundColor: "#E1F5FE", borderWidth: 1, borderColor: "#0288D130" }} className="rounded px-1.5 py-0.5">
                    <Text style={{ color: "#0288D1", fontFamily: "monospace" }} className="text-xs">{r}</Text>
                  </View>
                ))}
              </View>
            </Section>

            {/* Painel Admin */}
            <Section title="🖥️ Painel Administrativo — Next.js 15" color="#7B1FA2">
              <View className="flex-row flex-wrap gap-1 mb-2">
                {["Dashboard Executivo", "Gestão de Usuários", "Gestão de Produtores", "Diagnósticos", "Laboratório", "Banco de Conhecimento", "Relatórios", "Auditoria", "NOC"].map((m) => (
                  <Badge key={m} label={m} color="#7B1FA2" />
                ))}
              </View>
              <Text className="text-xs text-muted">RBAC com 5 perfis: Super Admin · Admin · Técnico · Produtor · Visualizador</Text>
            </Section>

            {/* Build & Deploy */}
            <Section title="🚀 Build & Deploy" color="#F57F17">
              <View className="flex-row flex-wrap gap-2">
                {[
                  { l: "EAS Build Android", sub: "APK + AAB (Google Play)", cor: "#2E7D32" },
                  { l: "EAS Build iOS", sub: "IPA (App Store)", cor: "#1565C0" },
                  { l: "Vercel / AWS Amplify", sub: "Portal Web + Admin", cor: "#0288D1" },
                  { l: "Docker + Cloud Run", sub: "Backend + API", cor: "#455A64" },
                ].map((b) => (
                  <View key={b.l} style={{ backgroundColor: b.cor + "15", borderWidth: 1, borderColor: b.cor + "30", width: "47%" }} className="rounded-xl p-3">
                    <Text style={{ color: b.cor }} className="text-xs font-bold">{b.l}</Text>
                    <Text className="text-xs text-muted mt-0.5">{b.sub}</Text>
                  </View>
                ))}
              </View>
            </Section>
          </View>
        )}

        {/* ─── BACKEND & API ─── */}
        {activeTab === "backend" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Backend e API</Text>
            <Text className="text-xs text-muted mb-4">NestJS · REST · JWT · Prisma · PostgreSQL · Redis · MinIO</Text>

            {/* Stack */}
            <Section title="⚙️ Stack Backend — NestJS" color="#C62828">
              <View className="flex-row flex-wrap gap-1 mb-3">
                {["NestJS 11", "TypeScript", "Prisma ORM", "PostgreSQL 16", "Redis 7", "MinIO", "BullMQ", "Passport JWT", "Multer", "PDFKit", "Puppeteer", "Nodemailer", "Socket.IO"].map((t) => (
                  <Badge key={t} label={t} color="#C62828" />
                ))}
              </View>
            </Section>

            {/* Módulos NestJS */}
            <Section title="🧩 Módulos NestJS — 11 Módulos" color="#1565C0">
              <View className="flex-row flex-wrap gap-2">
                {[
                  { m: "AuthModule", emoji: "🔐", cor: "#C62828" },
                  { m: "UsersModule", emoji: "👤", cor: "#1565C0" },
                  { m: "ProducersModule", emoji: "👨‍🌾", cor: "#2E7D32" },
                  { m: "PropertiesModule", emoji: "🏡", cor: "#F57F17" },
                  { m: "CropsModule", emoji: "🌱", cor: "#388E3C" },
                  { m: "DiagnosticsModule", emoji: "🔬", cor: "#7B1FA2" },
                  { m: "LaboratoryModule", emoji: "🧪", cor: "#00695C" },
                  { m: "MarketplaceModule", emoji: "🛒", cor: "#1B5E20" },
                  { m: "ReportsModule", emoji: "📊", cor: "#455A64" },
                  { m: "NotificationsModule", emoji: "🔔", cor: "#E65100" },
                  { m: "AiModule", emoji: "🤖", cor: "#0D47A1" },
                ].map((mod) => (
                  <View key={mod.m} style={{ backgroundColor: mod.cor + "15", borderWidth: 1, borderColor: mod.cor + "30", width: "47%" }} className="rounded-xl p-2 flex-row items-center gap-2">
                    <Text className="text-base">{mod.emoji}</Text>
                    <Text style={{ color: mod.cor }} className="text-xs font-bold">{mod.m}</Text>
                  </View>
                ))}
              </View>
            </Section>

            {/* Endpoints */}
            <Section title="🔗 Endpoints REST — Principais" color="#0288D1">
              <View className="gap-1">
                {[
                  { method: "POST", path: "/auth/login", desc: "Autenticação JWT" },
                  { method: "POST", path: "/auth/register", desc: "Cadastro de usuário" },
                  { method: "GET", path: "/producers/:id", desc: "Dados do produtor" },
                  { method: "POST", path: "/properties", desc: "Cadastrar propriedade" },
                  { method: "POST", path: "/crops", desc: "Novo cultivo" },
                  { method: "POST", path: "/diagnostics/upload", desc: "Upload imagem + IA" },
                  { method: "GET", path: "/diagnostics/:id", desc: "Resultado diagnóstico" },
                  { method: "POST", path: "/laboratory/samples", desc: "Cadastrar amostra" },
                  { method: "GET", path: "/reports/pdf/:id", desc: "Gerar laudo PDF" },
                  { method: "GET", path: "/marketplace/products", desc: "Listar produtos" },
                ].map((ep) => (
                  <View key={ep.path} style={{ backgroundColor: "#1A1A2E", borderRadius: 8, padding: 8, flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={{ backgroundColor: ep.method === "POST" ? "#2E7D32" : ep.method === "GET" ? "#1565C0" : "#F57F17", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                      <Text className="text-white text-xs font-bold">{ep.method}</Text>
                    </View>
                    <Text style={{ color: "#90CAF9", fontFamily: "monospace", fontSize: 11, flex: 1 }}>{ep.path}</Text>
                    <Text style={{ color: "#9E9E9E" }} className="text-xs">{ep.desc}</Text>
                  </View>
                ))}
              </View>
            </Section>

            {/* Filas & Eventos */}
            <Section title="⚡ Filas, Cache e Eventos" color="#00695C">
              <View className="flex-row flex-wrap gap-2">
                {[
                  { l: "BullMQ + Redis", sub: "Filas assíncronas: IA, PDF, e-mail", cor: "#C62828" },
                  { l: "Redis Cache", sub: "TTL: 5min (clima) / 1h (culturas)", cor: "#00695C" },
                  { l: "Socket.IO", sub: "Alertas IoT em tempo real", cor: "#1565C0" },
                  { l: "Cron Jobs", sub: "Relatórios diários, alertas climáticos", cor: "#7B1FA2" },
                ].map((item) => (
                  <View key={item.l} style={{ backgroundColor: item.cor + "15", borderWidth: 1, borderColor: item.cor + "30", width: "47%" }} className="rounded-xl p-3">
                    <Text style={{ color: item.cor }} className="text-xs font-bold">{item.l}</Text>
                    <Text className="text-xs text-muted mt-0.5">{item.sub}</Text>
                  </View>
                ))}
              </View>
            </Section>
          </View>
        )}

        {/* ─── DADOS & IA ─── */}
        {activeTab === "dados" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Banco de Dados e IA</Text>
            <Text className="text-xs text-muted mb-4">PostgreSQL · Redis · MinIO · Prisma · IA Multimodal · Vetores</Text>

            {/* PostgreSQL */}
            <Section title="🗄️ PostgreSQL 16 — 17 Tabelas" color="#1565C0">
              <View className="flex-row flex-wrap gap-1 mb-3">
                {["usuarios", "produtores", "propriedades", "talhoes", "cultivos", "diagnosticos", "laudos", "amostras", "marketplace_produtos", "pedidos", "culturas_avancadas", "pragas", "doencas", "solo_dados", "clima_dados", "sensores_iot", "leituras_iot"].map((t) => (
                  <View key={t} style={{ backgroundColor: "#E3F2FD", borderWidth: 1, borderColor: "#1565C030" }} className="rounded px-1.5 py-0.5">
                    <Text style={{ color: "#1565C0", fontFamily: "monospace" }} className="text-xs">{t}</Text>
                  </View>
                ))}
              </View>
              <Text className="text-xs text-muted">Prisma ORM · Migrations automáticas · Índices otimizados · PostGIS para dados geoespaciais</Text>
            </Section>

            {/* Redis */}
            <Section title="⚡ Redis 7 — Cache e Filas" color="#C62828">
              <View className="flex-row flex-wrap gap-2">
                {[
                  { u: "Cache de sessões JWT", ttl: "TTL: 24h", cor: "#C62828" },
                  { u: "Cache de dados climáticos", ttl: "TTL: 5min", cor: "#0288D1" },
                  { u: "Cache de culturas/banco agro", ttl: "TTL: 1h", cor: "#2E7D32" },
                  { u: "Filas BullMQ (IA, PDF, e-mail)", ttl: "Persistente", cor: "#7B1FA2" },
                  { u: "Pub/Sub IoT (Socket.IO)", ttl: "Tempo real", cor: "#F57F17" },
                ].map((r) => (
                  <View key={r.u} style={{ backgroundColor: r.cor + "15", borderWidth: 1, borderColor: r.cor + "30", width: "47%" }} className="rounded-xl p-2">
                    <Text style={{ color: r.cor }} className="text-xs font-bold">{r.u}</Text>
                    <Text className="text-xs text-muted">{r.ttl}</Text>
                  </View>
                ))}
              </View>
            </Section>

            {/* MinIO */}
            <Section title="📦 MinIO — Object Storage" color="#F57F17">
              <View className="flex-row flex-wrap gap-1 mb-2">
                {["afu-images", "afu-reports", "afu-samples", "afu-drones", "afu-satellites"].map((b) => (
                  <Badge key={b} label={b} color="#F57F17" />
                ))}
              </View>
              <Text className="text-xs text-muted">Compatível com S3 · Replicação automática · CDN via CloudFront · Backup diário</Text>
            </Section>

            {/* IA */}
            <Section title="🤖 IA Multimodal — AFU AI CORE" color="#0D47A1">
              <View className="flex-row flex-wrap gap-2 mb-3">
                {[
                  { m: "GPT-4o Vision", sub: "Diagnóstico por imagem", cor: "#0D47A1" },
                  { m: "Claude 3.5 Sonnet", sub: "Análise agronômica", cor: "#7B1FA2" },
                  { m: "Gemini Pro Vision", sub: "Fallback multimodal", cor: "#C62828" },
                  { m: "Whisper API", sub: "Voz → texto (3 idiomas)", cor: "#00695C" },
                ].map((ai) => (
                  <View key={ai.m} style={{ backgroundColor: ai.cor + "15", borderWidth: 1, borderColor: ai.cor + "30", width: "47%" }} className="rounded-xl p-3">
                    <Text style={{ color: ai.cor }} className="text-xs font-bold">{ai.m}</Text>
                    <Text className="text-xs text-muted mt-0.5">{ai.sub}</Text>
                  </View>
                ))}
              </View>
              <Text className="text-xs font-bold text-foreground mb-1">Prompt Engineering</Text>
              <Text className="text-xs text-muted">Contexto: Cultura + Solo + Clima + Genética + Histórico + Localização → Diagnóstico + Recomendação + Calendário + Economia</Text>
            </Section>

            {/* Banco Agronômico */}
            <Section title="🌱 Banco Agronômico — 10 Módulos" color="#2E7D32">
              <View className="flex-row flex-wrap gap-1">
                {["Culturas (17)", "Clima Regional", "Solos (12 classes)", "Genética G1-G10", "Irrigação", "Nutrientes", "Pragas & Doenças", "Calendário Agrícola", "Laboratório Digital", "Economia Agrícola"].map((m) => (
                  <Badge key={m} label={m} color="#2E7D32" />
                ))}
              </View>
            </Section>
          </View>
        )}

        {/* ─── CLOUD & INFRA ─── */}
        {activeTab === "cloud" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Cloud e Infraestrutura</Text>
            <Text className="text-xs text-muted mb-4">AWS / GCP · Docker · Kubernetes · 3 Ambientes · RPO/RTO</Text>

            {/* Diagrama de camadas */}
            <View style={{ backgroundColor: "#1A1A2E" }} className="rounded-xl p-4 mb-4">
              <Text className="text-white text-sm font-bold mb-3">🏗️ Arquitetura em Camadas</Text>
              {[
                { layer: "CDN + WAF", desc: "CloudFront · Cloudflare · DDoS protection", cor: "#C62828" },
                { layer: "Load Balancer", desc: "AWS ALB · Nginx · SSL Termination", cor: "#F57F17" },
                { layer: "App Layer", desc: "ECS Fargate · Cloud Run · Auto Scaling", cor: "#0288D1" },
                { layer: "Cache Layer", desc: "Redis ElastiCache · Session Store", cor: "#00695C" },
                { layer: "Database Layer", desc: "RDS PostgreSQL · Multi-AZ · Read Replicas", cor: "#1565C0" },
                { layer: "Storage Layer", desc: "S3 / MinIO · Glacier Backup · CDN Assets", cor: "#7B1FA2" },
              ].map((l, i) => (
                <View key={l.layer} style={{ flexDirection: "row", alignItems: "center", marginBottom: i < 5 ? 2 : 0 }}>
                  <View style={{ backgroundColor: l.cor, borderRadius: 8, padding: 8, flex: 1 }}>
                    <Text className="text-white text-xs font-bold">{l.layer}</Text>
                    <Text style={{ color: "rgba(255,255,255,0.8)" }} className="text-xs">{l.desc}</Text>
                  </View>
                  {i < 5 && <Text style={{ color: "#9E9E9E", marginLeft: 8, fontSize: 16 }}>↓</Text>}
                </View>
              ))}
            </View>

            {/* 3 Ambientes */}
            <Section title="🌍 3 Ambientes — DEV · STAGING · PROD" color="#455A64">
              <View className="flex-row gap-2">
                {[
                  { env: "DEV", desc: "Local Docker\nCompose", cor: "#2E7D32" },
                  { env: "STAGING", desc: "AWS ECS\nFargate t3.small", cor: "#F57F17" },
                  { env: "PROD", desc: "AWS ECS\nFargate t3.medium+", cor: "#C62828" },
                ].map((e) => (
                  <View key={e.env} style={{ backgroundColor: e.cor, flex: 1 }} className="rounded-xl p-3 items-center">
                    <Text className="text-white text-sm font-bold">{e.env}</Text>
                    <Text className="text-white text-xs text-center mt-1">{e.desc}</Text>
                  </View>
                ))}
              </View>
            </Section>

            {/* Docker Compose */}
            <Section title="🐳 Docker Compose — 8 Serviços" color="#0288D1">
              <View className="gap-1">
                {[
                  { s: "afu-api", port: ":3000", desc: "NestJS Backend", cor: "#C62828" },
                  { s: "afu-web-produtor", port: ":3001", desc: "Next.js Portal", cor: "#0288D1" },
                  { s: "afu-web-admin", port: ":3002", desc: "Next.js Admin", cor: "#7B1FA2" },
                  { s: "afu-ai-service", port: ":3003", desc: "Serviço IA", cor: "#0D47A1" },
                  { s: "afu-pdf-service", port: ":3004", desc: "Geração PDF", cor: "#455A64" },
                  { s: "postgres", port: ":5432", desc: "Banco de dados", cor: "#1565C0" },
                  { s: "redis", port: ":6379", desc: "Cache + Filas", cor: "#C62828" },
                  { s: "minio", port: ":9000", desc: "Object Storage", cor: "#F57F17" },
                ].map((sv) => (
                  <View key={sv.s} style={{ backgroundColor: "#1A1A2E", borderRadius: 8, padding: 8, flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={{ backgroundColor: sv.cor, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                      <Text className="text-white text-xs font-bold">{sv.port}</Text>
                    </View>
                    <Text style={{ color: "#90CAF9", fontFamily: "monospace", fontSize: 11, flex: 1 }}>{sv.s}</Text>
                    <Text style={{ color: "#9E9E9E" }} className="text-xs">{sv.desc}</Text>
                  </View>
                ))}
              </View>
            </Section>

            {/* SLA */}
            <Section title="📊 SLA e Disponibilidade" color="#2E7D32">
              <View className="flex-row flex-wrap gap-2">
                {[
                  { k: "Uptime", v: "99,9%", cor: "#2E7D32" },
                  { k: "RPO", v: "1 hora", cor: "#0288D1" },
                  { k: "RTO", v: "4 horas", cor: "#F57F17" },
                  { k: "Backup", v: "Diário", cor: "#7B1FA2" },
                  { k: "Retenção", v: "90 dias", cor: "#455A64" },
                  { k: "Réplicas", v: "Multi-AZ", cor: "#C62828" },
                ].map((s) => (
                  <View key={s.k} style={{ backgroundColor: s.cor + "15", borderWidth: 1, borderColor: s.cor + "30", width: "30%" }} className="rounded-xl p-2 items-center">
                    <Text style={{ color: s.cor }} className="text-sm font-bold">{s.v}</Text>
                    <Text className="text-xs text-muted">{s.k}</Text>
                  </View>
                ))}
              </View>
            </Section>
          </View>
        )}

        {/* ─── SEGURANÇA ─── */}
        {activeTab === "seguranca" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Segurança e LGPD</Text>
            <Text className="text-xs text-muted mb-4">JWT · MFA · TLS 1.3 · AES-256 · RBAC · LGPD · ISO 27001</Text>

            {/* Autenticação */}
            <Section title="🔐 Autenticação e Autorização" color="#C62828">
              <View className="flex-row flex-wrap gap-2 mb-3">
                {[
                  { t: "JWT RS256", sub: "Access + Refresh tokens", cor: "#C62828" },
                  { t: "MFA TOTP", sub: "Google Authenticator", cor: "#7B1FA2" },
                  { t: "OAuth 2.0", sub: "Google / Apple Sign-In", cor: "#1565C0" },
                  { t: "RBAC", sub: "5 perfis de acesso", cor: "#2E7D32" },
                ].map((a) => (
                  <View key={a.t} style={{ backgroundColor: a.cor + "15", borderWidth: 1, borderColor: a.cor + "30", width: "47%" }} className="rounded-xl p-3">
                    <Text style={{ color: a.cor }} className="text-xs font-bold">{a.t}</Text>
                    <Text className="text-xs text-muted mt-0.5">{a.sub}</Text>
                  </View>
                ))}
              </View>
              <Text className="text-xs font-bold text-foreground mb-1">5 Perfis RBAC</Text>
              <View className="flex-row flex-wrap gap-1">
                {["Super Admin", "Admin", "Técnico Agrônomo", "Produtor Rural", "Visualizador"].map((p) => (
                  <Badge key={p} label={p} color="#C62828" />
                ))}
              </View>
            </Section>

            {/* Criptografia */}
            <Section title="🔒 Criptografia e Proteção" color="#455A64">
              <View className="flex-row flex-wrap gap-2">
                {[
                  { t: "TLS 1.3", sub: "Toda comunicação HTTPS", cor: "#0288D1" },
                  { t: "AES-256-GCM", sub: "Dados sensíveis em repouso", cor: "#455A64" },
                  { t: "bcrypt (cost 12)", sub: "Hash de senhas", cor: "#C62828" },
                  { t: "HMAC-SHA256", sub: "Assinatura de webhooks", cor: "#2E7D32" },
                  { t: "SecureStore", sub: "Tokens no dispositivo", cor: "#7B1FA2" },
                  { t: "Helmet.js", sub: "Headers de segurança", cor: "#F57F17" },
                ].map((c) => (
                  <View key={c.t} style={{ backgroundColor: c.cor + "15", borderWidth: 1, borderColor: c.cor + "30", width: "47%" }} className="rounded-xl p-2">
                    <Text style={{ color: c.cor }} className="text-xs font-bold">{c.t}</Text>
                    <Text className="text-xs text-muted">{c.sub}</Text>
                  </View>
                ))}
              </View>
            </Section>

            {/* LGPD */}
            <Section title="⚖️ LGPD e Conformidade" color="#0D47A1">
              <View className="flex-row flex-wrap gap-1 mb-3">
                {["Consentimento explícito", "Portabilidade de dados", "Direito ao esquecimento", "DPO designado", "Relatório de impacto (RIPD)", "Logs de acesso 5 anos", "Anonimização", "Pseudonimização"].map((l) => (
                  <Badge key={l} label={l} color="#0D47A1" />
                ))}
              </View>
              <Text className="text-xs font-bold text-foreground mb-1">Certificações Alvo</Text>
              <View className="flex-row gap-2">
                {["LGPD", "ISO 27001", "ISO 9001", "SOC 2 Type II"].map((c) => (
                  <View key={c} style={{ backgroundColor: "#0D47A1", flex: 1 }} className="rounded-xl p-2 items-center">
                    <Text className="text-white text-xs font-bold">{c}</Text>
                  </View>
                ))}
              </View>
            </Section>

            {/* Proteções */}
            <Section title="🛡️ Proteções de Aplicação" color="#7B1FA2">
              <View className="flex-row flex-wrap gap-1">
                {["Rate Limiting (100 req/min)", "CORS configurado", "SQL Injection → Prisma ORM", "XSS → sanitização", "CSRF tokens", "WAF (AWS Shield)", "DDoS protection", "IP Allowlist Admin", "Auditoria JSON completa"].map((p) => (
                  <Badge key={p} label={p} color="#7B1FA2" />
                ))}
              </View>
            </Section>
          </View>
        )}

        {/* ─── DEVOPS & STATUS ─── */}
        {activeTab === "devops" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">DevOps e Status Final</Text>
            <Text className="text-xs text-muted mb-4">CI/CD · Testes · Observabilidade · Escalabilidade · Etapas concluídas</Text>

            {/* Pipeline CI/CD */}
            <Section title="🔄 Pipeline CI/CD — GitHub Actions" color="#1565C0">
              <View style={{ backgroundColor: "#1A1A2E" }} className="rounded-xl p-3 mb-3">
                <View className="flex-row items-center gap-1 flex-wrap">
                  {[
                    { s: "Lint & Format", cor: "#F57F17" },
                    { s: "Unit Tests", cor: "#2E7D32" },
                    { s: "Integration Tests", cor: "#0288D1" },
                    { s: "Build Docker", cor: "#455A64" },
                    { s: "Push ECR", cor: "#7B1FA2" },
                    { s: "Deploy ECS", cor: "#C62828" },
                    { s: "Smoke Tests", cor: "#00695C" },
                    { s: "Notify Slack", cor: "#1565C0" },
                  ].map((step, i) => (
                    <React.Fragment key={step.s}>
                      <View style={{ backgroundColor: step.cor, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 }}>
                        <Text className="text-white text-xs font-bold">{step.s}</Text>
                      </View>
                      {i < 7 && <Text style={{ color: "#9E9E9E" }}>→</Text>}
                    </React.Fragment>
                  ))}
                </View>
              </View>
              <Text className="text-xs text-muted">Branches: feature/* → develop → staging → main (produção)</Text>
            </Section>

            {/* Testes */}
            <Section title="🧪 Estratégia de Testes" color="#2E7D32">
              <View className="flex-row flex-wrap gap-2">
                {[
                  { t: "Unit Tests (Jest)", meta: "≥ 80% cobertura", cor: "#2E7D32" },
                  { t: "Integration Tests", meta: "Todos os endpoints", cor: "#0288D1" },
                  { t: "E2E Tests (Playwright)", meta: "Fluxos críticos", cor: "#7B1FA2" },
                  { t: "Load Tests (k6)", meta: "1000 req/s", cor: "#F57F17" },
                  { t: "Security Tests (OWASP ZAP)", meta: "Top 10 OWASP", cor: "#C62828" },
                  { t: "Mobile Tests (Detox)", meta: "iOS + Android", cor: "#455A64" },
                ].map((t) => (
                  <View key={t.t} style={{ backgroundColor: t.cor + "15", borderWidth: 1, borderColor: t.cor + "30", width: "47%" }} className="rounded-xl p-2">
                    <Text style={{ color: t.cor }} className="text-xs font-bold">{t.t}</Text>
                    <Text className="text-xs text-muted">{t.meta}</Text>
                  </View>
                ))}
              </View>
            </Section>

            {/* Observabilidade */}
            <Section title="📡 Observabilidade" color="#F57F17">
              <View className="flex-row flex-wrap gap-2">
                {[
                  { o: "Prometheus + Grafana", sub: "Métricas e dashboards", cor: "#F57F17" },
                  { o: "ELK Stack", sub: "Logs centralizados", cor: "#C62828" },
                  { o: "Sentry", sub: "Erros em tempo real", cor: "#7B1FA2" },
                  { o: "AWS CloudWatch", sub: "Infra e alertas", cor: "#0288D1" },
                  { o: "Datadog APM", sub: "Tracing distribuído", cor: "#455A64" },
                  { o: "Uptime Robot", sub: "Health checks 24h", cor: "#2E7D32" },
                ].map((ob) => (
                  <View key={ob.o} style={{ backgroundColor: ob.cor + "15", borderWidth: 1, borderColor: ob.cor + "30", width: "47%" }} className="rounded-xl p-2">
                    <Text style={{ color: ob.cor }} className="text-xs font-bold">{ob.o}</Text>
                    <Text className="text-xs text-muted">{ob.sub}</Text>
                  </View>
                ))}
              </View>
            </Section>

            {/* Status Final */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#1B5E2030" }}>
              <View style={{ backgroundColor: "#1B5E20" }} className="p-3">
                <Text className="text-white text-sm font-bold">✅ STATUS FINAL — AFU 1.0 PRONTO PARA IMPLEMENTAÇÃO</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="flex-row flex-wrap gap-1 mb-4">
                  {[
                    "Banco Agronômico", "Banco Climático", "Banco de Solos", "Banco Genético",
                    "Banco de Irrigação", "Banco de Nutrientes", "Pragas e Doenças",
                    "Calendário Inteligente", "Laboratório Digital", "Economia Agrícola",
                    "IA Agrônomo Virtual", "Geointeligência", "IoT e Automação",
                    "Marketplace Agrícola", "Centro de Comando NOC", "Arquitetura Final",
                  ].map((m) => (
                    <View key={m} style={{ backgroundColor: "#E8F5E9", borderWidth: 1, borderColor: "#2E7D3230" }} className="rounded-full px-2 py-0.5 flex-row items-center gap-1">
                      <Text style={{ color: "#2E7D32" }} className="text-xs">✅</Text>
                      <Text style={{ color: "#2E7D32" }} className="text-xs font-semibold">{m}</Text>
                    </View>
                  ))}
                </View>

                {/* Métricas finais */}
                <View className="flex-row flex-wrap gap-2 mb-3">
                  {[
                    { k: "46 Etapas", v: "Documentadas", cor: "#2E7D32" },
                    { k: "17 Culturas", v: "No banco", cor: "#0288D1" },
                    { k: "17 Tabelas", v: "PostgreSQL", cor: "#1565C0" },
                    { k: "11 Módulos", v: "NestJS", cor: "#C62828" },
                    { k: "20+ Endpoints", v: "REST API", cor: "#7B1FA2" },
                    { k: "15 Módulos", v: "Concluídos", cor: "#F57F17" },
                  ].map((m) => (
                    <View key={m.k} style={{ backgroundColor: m.cor + "15", borderWidth: 1, borderColor: m.cor + "30", width: "30%" }} className="rounded-xl p-2 items-center">
                      <Text style={{ color: m.cor }} className="text-sm font-bold">{m.k}</Text>
                      <Text className="text-xs text-muted">{m.v}</Text>
                    </View>
                  ))}
                </View>

                <View style={{ backgroundColor: "#0D47A115", borderWidth: 1, borderColor: "#0D47A130" }} className="rounded-xl p-3">
                  <Text style={{ color: "#0D47A1" }} className="text-xs font-bold mb-1">🚀 Próximo Passo: Implementação Real</Text>
                  <Text style={{ color: "#0D47A1" }} className="text-xs">Toda a documentação estratégica, técnica e de infraestrutura do AFU está concluída. O projeto está pronto para iniciar o desenvolvimento real do MVP com a equipe técnica, seguindo as 46 etapas documentadas neste app.</Text>
                </View>
              </View>
            </View>
          </View>
        )}

      </ScrollView>
    </ScreenContainer>
  );
}
