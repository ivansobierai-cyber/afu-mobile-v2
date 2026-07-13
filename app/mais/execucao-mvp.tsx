import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { AfuStackBanner } from "@/components/afu-stack-banner";

const ENTREGA_REAL = [
  { sprint: "01", plano: "Fundação (NestJS/Prisma)", entregue: "Auth JWT, MySQL, tRPC, seeds", status: "done" },
  { sprint: "02", plano: "Entidades Core", entregue: "CRUD propriedades, cultivos, terrenos", status: "done" },
  { sprint: "03", plano: "Upload MinIO", entregue: "Upload imagem diagnóstico (Expo)", status: "partial" },
  { sprint: "04", plano: "Diagnóstico IA", entregue: "Foto → laudo IA (smoke OK)", status: "done" },
  { sprint: "05", plano: "Relatórios PDF", entregue: "Laudos e relatórios no app", status: "partial" },
] as const;

const TABS = [
  { id: "monorepo", label: "Monorepo" },
  { id: "sprints", label: "Sprints" },
  { id: "infra", label: "Infraestrutura" },
  { id: "api", label: "API & Backend" },
  { id: "apps", label: "Apps" },
  { id: "mvp", label: "MVP Ready" },
];

type SectionKey =
  | "estrutura" | "branches" | "fluxo"
  | "sprint1" | "sprint2" | "sprint3" | "sprint4" | "sprint5"
  | "docker" | "postgres" | "redis" | "minio"
  | "rotas" | "ambiente" | "ia"
  | "mobile" | "webadmin" | "portal"
  | "criterios" | "roadmap";

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
    <View className="mb-3 rounded-xl overflow-hidden border border-gray-200">
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
        <IconSymbol
          name={expanded ? "chevron.down" : "chevron.right"}
          size={16}
          color={color}
        />
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
      <Text className="text-xs text-muted flex-1">{label}</Text>
      <Text className="text-xs font-semibold text-foreground text-right flex-1">{value}</Text>
    </View>
  );
}

const SPRINTS = [
  {
    key: "sprint1" as SectionKey,
    num: "01",
    titulo: "Fundação",
    duracao: "2 semanas",
    cor: "#2E7D32",
    bg: "#E8F5E9",
    objetivos: ["Criar monorepo", "Configurar banco", "Configurar API", "Configurar autenticação"],
    entregaveis: ["Login", "Cadastro", "JWT", "MySQL", "Drizzle ORM"],
  },
  {
    key: "sprint2" as SectionKey,
    num: "02",
    titulo: "Entidades Core",
    duracao: "2 semanas",
    cor: "#1565C0",
    bg: "#E3F2FD",
    objetivos: ["Módulo de produtores", "Módulo de propriedades", "Módulo de culturas"],
    entregaveis: ["CRUD completo de produtores", "CRUD completo de propriedades", "CRUD completo de culturas"],
  },
  {
    key: "sprint3" as SectionKey,
    num: "03",
    titulo: "Upload & Armazenamento",
    duracao: "2 semanas",
    cor: "#EF6C00",
    bg: "#FFF3E0",
    objetivos: ["Upload de imagem", "Armazenamento MinIO"],
    entregaveis: ["Envio de fotos", "Histórico de imagens"],
  },
  {
    key: "sprint4" as SectionKey,
    num: "04",
    titulo: "Diagnóstico IA",
    duracao: "2 semanas",
    cor: "#6A1B9A",
    bg: "#F3E5F5",
    objetivos: ["Integração com API de visão computacional", "Diagnóstico por imagem"],
    entregaveis: ["Primeira versão funcional do diagnóstico IA"],
  },
  {
    key: "sprint5" as SectionKey,
    num: "05",
    titulo: "Relatórios",
    duracao: "2 semanas",
    cor: "#C62828",
    bg: "#FFEBEE",
    objetivos: ["Geração de relatórios PDF", "Download e histórico"],
    entregaveis: ["PDF gerado", "Download disponível", "Histórico de relatórios"],
  },
];

export default function ExecucaoMvpScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState("monorepo");
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
            <IconSymbol name="hammer.fill" size={22} color="#FFFFFF" />
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Execução Real — MVP 1.0</Text>
            <Text style={{ color: "#90CAF9" }} className="text-xs">
              Monorepo · Sprints · Infra · API · Apps · Critérios
            </Text>
          </View>
          <View style={{ backgroundColor: "#2E7D32" }} className="rounded-full px-2 py-0.5">
            <Text className="text-white text-xs font-bold">Etapa 21</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View className="bg-surface border-b border-border">
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
                <View style={{ backgroundColor: "#0D47A1" }} className="h-0.5 rounded-full mt-1" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        <AfuStackBanner note="Sprints abaixo misturam plano original e entrega real. Veja o quadro de status antes de cada aba." />

        <View style={{ backgroundColor: "#0D47A112", borderWidth: 1, borderColor: "#0D47A140", borderRadius: 12, padding: 12, marginBottom: 16 }}>
          <Text style={{ color: "#0D47A1", fontSize: 13, fontWeight: "700", marginBottom: 8 }}>Status de entrega (jul/2026)</Text>
          {ENTREGA_REAL.map((row) => (
            <View key={row.sprint} className="flex-row items-center py-1.5 border-b border-gray-100">
              <Text className="text-xs font-bold w-8" style={{ color: "#0D47A1" }}>S{row.sprint}</Text>
              <Text className="text-xs text-muted flex-1" numberOfLines={1}>{row.plano}</Text>
              <Text className="text-xs flex-1 text-foreground" numberOfLines={2}>{row.entregue}</Text>
              <View style={{ backgroundColor: row.status === "done" ? "#2E7D3220" : "#F57F1720", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ color: row.status === "done" ? "#2E7D32" : "#F57F17", fontSize: 10, fontWeight: "700" }}>
                  {row.status === "done" ? "OK" : "Parcial"}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* ─── MONOREPO ─── */}
        {activeTab === "monorepo" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Estrutura do Monorepo</Text>
            <Text className="text-xs text-muted mb-4">
              Repositório: afu-platform · Estrutura oficial do projeto
            </Text>

            <ExpandableSection
              title="Estrutura de Pastas — afu-platform"
              subtitle="apps · services · packages · docs · infra · scripts"
              color="#1565C0"
              sectionKey="estrutura"
              expanded={!!expanded.estrutura}
              onToggle={toggle}
            >
              <View className="bg-gray-900 rounded-xl p-4">
                <Text className="text-green-400 text-xs font-mono font-bold mb-2">AFU/</Text>
                {[
                  { dir: "apps/", items: ["mobile/", "web-admin/", "web-produtor/"], cor: "#64B5F6" },
                  { dir: "services/", items: ["api/", "ai-service/", "pdf-service/", "notification-service/"], cor: "#81C784" },
                  { dir: "packages/", items: ["ui/", "database/", "shared-types/", "validators/"], cor: "#FFB74D" },
                  { dir: "docs/", items: ["arquitetura/", "banco/", "api/", "ia/"], cor: "#CE93D8" },
                  { dir: "infra/", items: ["docker/", "kubernetes/", "monitoring/"], cor: "#EF9A9A" },
                  { dir: "scripts/", items: ["deploy/"], cor: "#80CBC4" },
                ].map((section) => (
                  <View key={section.dir} className="mb-3">
                    <Text style={{ color: section.cor }} className="text-xs font-mono font-bold">
                      ├── {section.dir}
                    </Text>
                    {section.items.map((item) => (
                      <Text key={item} className="text-gray-400 text-xs font-mono ml-4">
                        │   ├── {item}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Branches Git"
              subtitle="main · develop · staging · feature/* · hotfix/*"
              color="#2E7D32"
              sectionKey="branches"
              expanded={!!expanded.branches}
              onToggle={toggle}
            >
              {[
                { branch: "main", desc: "Código em produção — protegido, apenas via PR aprovado", cor: "#C62828" },
                { branch: "develop", desc: "Branch de desenvolvimento — integração contínua", cor: "#2E7D32" },
                { branch: "staging", desc: "Ambiente de homologação — pré-produção", cor: "#EF6C00" },
                { branch: "feature/*", desc: "Novas funcionalidades — ex: feature/auth-jwt", cor: "#1565C0" },
                { branch: "hotfix/*", desc: "Correções urgentes em produção", cor: "#6A1B9A" },
              ].map((b) => (
                <View key={b.branch} className="mb-3 flex-row items-start">
                  <View
                    style={{ backgroundColor: b.cor + "20", borderColor: b.cor }}
                    className="rounded px-2 py-0.5 border mr-3 mt-0.5"
                  >
                    <Text style={{ color: b.cor }} className="text-xs font-mono font-bold">
                      {b.branch}
                    </Text>
                  </View>
                  <Text className="text-xs text-muted flex-1">{b.desc}</Text>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="Fluxo Git"
              subtitle="feature → develop → staging → main"
              color="#37474F"
              sectionKey="fluxo"
              expanded={!!expanded.fluxo}
              onToggle={toggle}
            >
              <View className="bg-gray-900 rounded-xl p-4">
                <Text className="text-white text-xs font-bold mb-3 text-center">
                  Fluxo de Desenvolvimento
                </Text>
                {[
                  { step: "feature/*", desc: "Desenvolvimento da funcionalidade", cor: "#64B5F6" },
                  { step: "↓ Pull Request", desc: "Code review + testes automatizados", cor: "#546E7A" },
                  { step: "develop", desc: "Integração e testes de integração", cor: "#81C784" },
                  { step: "↓ Deploy automático", desc: "CI/CD para staging", cor: "#546E7A" },
                  { step: "staging", desc: "QA, homologação e aprovação", cor: "#FFB74D" },
                  { step: "↓ Aprovação manual", desc: "Release para produção", cor: "#546E7A" },
                  { step: "main", desc: "Produção — versão estável", cor: "#EF9A9A" },
                ].map((s, i) => (
                  <View key={i} className="items-center mb-1">
                    {s.step.startsWith("↓") ? (
                      <View className="items-center">
                        <Text style={{ color: s.cor }} className="text-xs">↓</Text>
                        <Text className="text-gray-500 text-xs">{s.desc}</Text>
                      </View>
                    ) : (
                      <View
                        style={{ backgroundColor: s.cor + "20", borderColor: s.cor }}
                        className="rounded-xl px-4 py-2 border w-full"
                      >
                        <Text style={{ color: s.cor }} className="text-xs font-bold text-center">
                          {s.step}
                        </Text>
                        <Text style={{ color: s.cor + "CC" }} className="text-xs text-center mt-0.5">
                          {s.desc}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </ExpandableSection>

            {/* Módulos prioritários */}
            <Text className="text-sm font-bold text-foreground mt-2 mb-3">
              Módulos Prioritários do MVP
            </Text>
            {[
              { mod: "Auth", items: ["Login", "Cadastro", "JWT"], cor: "#C62828", bg: "#FFEBEE" },
              { mod: "Produtores", items: ["Cadastro", "Consulta"], cor: "#1565C0", bg: "#E3F2FD" },
              { mod: "Propriedades", items: ["CRUD completo"], cor: "#2E7D32", bg: "#E8F5E9" },
              { mod: "Culturas", items: ["CRUD completo"], cor: "#EF6C00", bg: "#FFF3E0" },
              { mod: "Diagnóstico IA", items: ["Upload de imagem", "Resultado"], cor: "#6A1B9A", bg: "#F3E5F5" },
              { mod: "Relatórios", items: ["PDF básico"], cor: "#37474F", bg: "#ECEFF1" },
            ].map((m) => (
              <View
                key={m.mod}
                style={{ borderLeftColor: m.cor, backgroundColor: m.bg + "80" }}
                className="border-l-4 rounded-r-xl p-3 mb-2"
              >
                <Text style={{ color: m.cor }} className="text-xs font-bold mb-1">{m.mod}</Text>
                <View className="flex-row flex-wrap">
                  {m.items.map((item) => (
                    <Text key={item} className="text-xs text-muted mr-3">• {item}</Text>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ─── SPRINTS ─── */}
        {activeTab === "sprints" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Planejamento de Sprints</Text>
            <Text className="text-xs text-muted mb-4">
              5 sprints de 2 semanas · Total: ~10 semanas para o MVP
            </Text>

            {/* Timeline de sprints */}
            <View className="bg-gray-900 rounded-xl p-4 mb-4">
              <Text className="text-white text-xs font-bold mb-3 text-center">
                Timeline do MVP
              </Text>
              <View className="flex-row items-center justify-between">
                {SPRINTS.map((s, i) => (
                  <View key={s.num} className="items-center flex-1">
                    <View
                      style={{ backgroundColor: s.cor + "30", borderColor: s.cor }}
                      className="w-8 h-8 rounded-full items-center justify-center border"
                    >
                      <Text style={{ color: s.cor }} className="text-xs font-bold">
                        S{s.num}
                      </Text>
                    </View>
                    {i < SPRINTS.length - 1 && (
                      <View
                        style={{ position: "absolute", right: 0, top: 14, width: "50%", height: 1, backgroundColor: "#374151" }}
                      />
                    )}
                    <Text style={{ color: s.cor }} className="text-xs mt-1 text-center">
                      {s.titulo}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {SPRINTS.map((s) => (
              <ExpandableSection
                key={s.key}
                title={`Sprint ${s.num} — ${s.titulo}`}
                subtitle={`${s.duracao} · ${s.entregaveis.length} entregáveis`}
                color={s.cor}
                sectionKey={s.key}
                expanded={!!expanded[s.key]}
                onToggle={toggle}
              >
                <InfoRow label="Duração" value={s.duracao} />
                <Text className="text-xs font-semibold text-foreground mt-3 mb-2">Objetivos:</Text>
                {s.objetivos.map((o) => (
                  <View key={o} className="flex-row items-center mb-1">
                    <View style={{ backgroundColor: s.cor }} className="w-1.5 h-1.5 rounded-full mr-2" />
                    <Text className="text-xs text-muted">{o}</Text>
                  </View>
                ))}
                <Text className="text-xs font-semibold text-foreground mt-3 mb-2">Entregáveis:</Text>
                <View className="flex-row flex-wrap">
                  {s.entregaveis.map((e) => (
                    <Tag key={e} label={e} color={s.cor} bg={s.bg} />
                  ))}
                </View>
              </ExpandableSection>
            ))}
          </View>
        )}

        {/* ─── INFRAESTRUTURA ─── */}
        {activeTab === "infra" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Infraestrutura MVP</Text>
            <Text className="text-xs text-muted mb-4">
              Docker · PostgreSQL · Redis · MinIO
            </Text>

            <ExpandableSection
              title="Docker — Containers Iniciais"
              subtitle="7 containers para o ambiente MVP"
              color="#1565C0"
              sectionKey="docker"
              expanded={!!expanded.docker}
              onToggle={toggle}
            >
              <View className="bg-gray-900 rounded-xl p-4">
                <Text className="text-white text-xs font-bold mb-3">docker-compose.yml</Text>
                {[
                  { container: "postgres", desc: "Banco de dados principal", porta: "5432", cor: "#64B5F6" },
                  { container: "api", desc: "Backend NestJS", porta: "3000", cor: "#81C784" },
                  { container: "web-admin", desc: "Painel administrativo Next.js", porta: "3001", cor: "#FFB74D" },
                  { container: "web-produtor", desc: "Portal do produtor Next.js", porta: "3002", cor: "#CE93D8" },
                  { container: "mobile-builder", desc: "Build do app React Native", porta: "8081", cor: "#EF9A9A" },
                  { container: "redis", desc: "Cache e filas", porta: "6379", cor: "#80CBC4" },
                  { container: "minio", desc: "Armazenamento de objetos", porta: "9000", cor: "#FFCC80" },
                ].map((c) => (
                  <View key={c.container} className="flex-row items-center mb-2">
                    <View
                      style={{ backgroundColor: c.cor + "20", borderColor: c.cor }}
                      className="rounded px-2 py-0.5 border mr-3 w-32"
                    >
                      <Text style={{ color: c.cor }} className="text-xs font-mono">{c.container}</Text>
                    </View>
                    <Text className="text-gray-400 text-xs flex-1">{c.desc}</Text>
                    <Text className="text-gray-500 text-xs">:{c.porta}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="PostgreSQL — Schemas Iniciais"
              subtitle="7 schemas organizados por domínio"
              color="#2E7D32"
              sectionKey="postgres"
              expanded={!!expanded.postgres}
              onToggle={toggle}
            >
              {[
                { schema: "auth", desc: "Usuários, sessões, tokens, permissões", cor: "#C62828" },
                { schema: "agricola", desc: "Produtores, propriedades, culturas, diagnósticos", cor: "#2E7D32" },
                { schema: "laboratorio", desc: "Amostras, análises, laudos, certificações", cor: "#1565C0" },
                { schema: "marketplace", desc: "Produtos, pedidos, pagamentos, logística", cor: "#EF6C00" },
                { schema: "educacao", desc: "Cursos, trilhas, certificados, progresso", cor: "#6A1B9A" },
                { schema: "iot", desc: "Sensores, leituras, alertas, automações", cor: "#37474F" },
                { schema: "analytics", desc: "Eventos, métricas, relatórios, BI", cor: "#0277BD" },
              ].map((s) => (
                <View key={s.schema} className="flex-row items-start mb-3">
                  <View
                    style={{ backgroundColor: s.cor + "20", borderColor: s.cor }}
                    className="rounded px-2 py-0.5 border mr-3 mt-0.5"
                  >
                    <Text style={{ color: s.cor }} className="text-xs font-mono font-bold">{s.schema}</Text>
                  </View>
                  <Text className="text-xs text-muted flex-1">{s.desc}</Text>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="Redis — Cache & Filas"
              subtitle="4 casos de uso principais"
              color="#EF6C00"
              sectionKey="redis"
              expanded={!!expanded.redis}
              onToggle={toggle}
            >
              <View className="flex-row flex-wrap">
                {[
                  { uso: "Cache", desc: "Dados frequentes, sessões ativas, respostas de API" },
                  { uso: "Filas", desc: "Processamento assíncrono de diagnósticos e relatórios" },
                  { uso: "Sessões", desc: "Tokens JWT, refresh tokens, dados de sessão" },
                  { uso: "Notificações", desc: "Pub/Sub para notificações em tempo real" },
                ].map((r) => (
                  <View key={r.uso} className="w-full mb-3">
                    <Text className="text-xs font-bold text-foreground">{r.uso}</Text>
                    <Text className="text-xs text-muted">{r.desc}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="MinIO — Object Storage"
              subtitle="4 buckets de armazenamento"
              color="#37474F"
              sectionKey="minio"
              expanded={!!expanded.minio}
              onToggle={toggle}
            >
              <View className="flex-row flex-wrap">
                {[
                  { bucket: "imagens", desc: "Fotos de culturas e diagnósticos", cor: "#2E7D32" },
                  { bucket: "relatorios", desc: "PDFs gerados pelo sistema", cor: "#1565C0" },
                  { bucket: "certificados", desc: "Certificados digitais assinados", cor: "#EF6C00" },
                  { bucket: "materiais", desc: "Conteúdo educacional e documentos", cor: "#6A1B9A" },
                ].map((b) => (
                  <View
                    key={b.bucket}
                    style={{ backgroundColor: b.cor + "15", borderColor: b.cor + "40" }}
                    className="rounded-xl p-3 mb-2 border w-full"
                  >
                    <Text style={{ color: b.cor }} className="text-xs font-bold">{b.bucket}/</Text>
                    <Text className="text-xs text-muted mt-0.5">{b.desc}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>
          </View>
        )}

        {/* ─── API & BACKEND ─── */}
        {activeTab === "api" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">API & Backend MVP</Text>
            <Text className="text-xs text-muted mb-4">
              NestJS · 6 rotas iniciais · IA via API externa
            </Text>

            <ExpandableSection
              title="Rotas da API MVP"
              subtitle="6 endpoints principais"
              color="#1565C0"
              sectionKey="rotas"
              expanded={!!expanded.rotas}
              onToggle={toggle}
            >
              <View className="bg-gray-900 rounded-xl p-4">
                {[
                  { rota: "/auth", metodos: ["POST /login", "POST /register", "POST /refresh", "POST /logout"], cor: "#EF9A9A" },
                  { rota: "/produtores", metodos: ["GET /", "POST /", "GET /:id", "PUT /:id"], cor: "#81C784" },
                  { rota: "/propriedades", metodos: ["GET /", "POST /", "GET /:id", "PUT /:id", "DELETE /:id"], cor: "#64B5F6" },
                  { rota: "/culturas", metodos: ["GET /", "POST /", "GET /:id", "PUT /:id", "DELETE /:id"], cor: "#FFB74D" },
                  { rota: "/diagnosticos", metodos: ["POST /upload", "GET /:id", "GET /historico"], cor: "#CE93D8" },
                  { rota: "/relatorios", metodos: ["POST /gerar", "GET /:id/download", "GET /historico"], cor: "#80CBC4" },
                ].map((r) => (
                  <View key={r.rota} className="mb-4">
                    <Text style={{ color: r.cor }} className="text-xs font-mono font-bold mb-1">
                      {r.rota}
                    </Text>
                    {r.metodos.map((m) => (
                      <Text key={m} className="text-gray-400 text-xs font-mono ml-3">
                        {m}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Ambiente de Backend"
              subtitle="NestJS · Docker · PostgreSQL · Redis"
              color="#2E7D32"
              sectionKey="ambiente"
              expanded={!!expanded.ambiente}
              onToggle={toggle}
            >
              <InfoRow label="Framework" value="NestJS (Node.js)" />
              <InfoRow label="Linguagem" value="TypeScript" />
              <InfoRow label="ORM" value="Prisma + PostgreSQL" />
              <InfoRow label="Autenticação" value="JWT + Refresh Token" />
              <InfoRow label="Cache" value="Redis" />
              <InfoRow label="Storage" value="MinIO (S3-compatible)" />
              <InfoRow label="Containerização" value="Docker + docker-compose" />
              <InfoRow label="Documentação" value="Swagger / OpenAPI" />
            </ExpandableSection>

            <ExpandableSection
              title="IA — Primeira Versão"
              subtitle="API de visão computacional externa · Validação rápida"
              color="#6A1B9A"
              sectionKey="ia"
              expanded={!!expanded.ia}
              onToggle={toggle}
            >
              <View
                style={{ backgroundColor: "#F3E5F5" }}
                className="rounded-xl p-3 mb-3"
              >
                <Text className="text-purple-800 text-xs font-bold mb-1">
                  Estratégia MVP
                </Text>
                <Text className="text-xs text-muted">
                  Utilizar API de visão computacional externa para validar o produto rapidamente. Modelo próprio será desenvolvido nas versões futuras (AFU 2.0+).
                </Text>
              </View>
              <InfoRow label="Versão MVP" value="API externa de visão computacional" />
              <InfoRow label="Objetivo" value="Validar produto rapidamente" />
              <InfoRow label="Modelo próprio" value="AFU 2.0+ (50K imagens)" />
              <InfoRow label="Confiança alvo" value="> 85% de precisão" />
            </ExpandableSection>
          </View>
        )}

        {/* ─── APPS ─── */}
        {activeTab === "apps" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Aplicativos MVP</Text>
            <Text className="text-xs text-muted mb-4">
              Mobile · Web Admin · Portal Produtor
            </Text>

            <ExpandableSection
              title="Mobile MVP — React Native"
              subtitle="6 telas iniciais"
              color="#2E7D32"
              sectionKey="mobile"
              expanded={!!expanded.mobile}
              onToggle={toggle}
            >
              <View className="flex-row flex-wrap mb-3">
                {["Login", "Cadastro", "Dashboard", "Diagnóstico", "Histórico", "Perfil"].map((t) => (
                  <Tag key={t} label={t} color="#2E7D32" bg="#E8F5E9" />
                ))}
              </View>
              <View className="bg-gray-900 rounded-xl p-3">
                <Text className="text-white text-xs font-bold mb-2">Stack Mobile</Text>
                {[
                  "React Native 0.81 + Expo SDK 54",
                  "TypeScript + NativeWind (Tailwind)",
                  "Expo Router (file-based navigation)",
                  "TanStack Query + tRPC",
                  "AsyncStorage (dados locais)",
                ].map((s) => (
                  <Text key={s} className="text-gray-400 text-xs mb-1">• {s}</Text>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Web Admin MVP — Next.js"
              subtitle="4 telas administrativas"
              color="#1565C0"
              sectionKey="webadmin"
              expanded={!!expanded.webadmin}
              onToggle={toggle}
            >
              <View className="flex-row flex-wrap mb-3">
                {["Dashboard", "Produtores", "Diagnósticos", "Relatórios"].map((t) => (
                  <Tag key={t} label={t} color="#1565C0" bg="#E3F2FD" />
                ))}
              </View>
              <View className="bg-gray-900 rounded-xl p-3">
                <Text className="text-white text-xs font-bold mb-2">Stack Web Admin</Text>
                {[
                  "Next.js 14 (App Router)",
                  "TypeScript + Tailwind CSS",
                  "Shadcn/UI components",
                  "Recharts (gráficos)",
                  "NextAuth.js (autenticação)",
                ].map((s) => (
                  <Text key={s} className="text-gray-400 text-xs mb-1">• {s}</Text>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Portal Produtor MVP — Next.js PWA"
              subtitle="5 telas do produtor"
              color="#EF6C00"
              sectionKey="portal"
              expanded={!!expanded.portal}
              onToggle={toggle}
            >
              <View className="flex-row flex-wrap mb-3">
                {["Painel", "Propriedades", "Culturas", "Diagnóstico", "Relatórios"].map((t) => (
                  <Tag key={t} label={t} color="#EF6C00" bg="#FFF3E0" />
                ))}
              </View>
              <View className="bg-gray-900 rounded-xl p-3">
                <Text className="text-white text-xs font-bold mb-2">Stack Portal</Text>
                {[
                  "Next.js 14 + PWA (Progressive Web App)",
                  "TypeScript + Tailwind CSS",
                  "Service Worker (offline)",
                  "Push Notifications",
                  "Instalável no celular",
                ].map((s) => (
                  <Text key={s} className="text-gray-400 text-xs mb-1">• {s}</Text>
                ))}
              </View>
            </ExpandableSection>
          </View>
        )}

        {/* ─── MVP READY ─── */}
        {activeTab === "mvp" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Critérios de MVP Concluído</Text>
            <Text className="text-xs text-muted mb-4">
              7 critérios obrigatórios + Roadmap imediato
            </Text>

            <ExpandableSection
              title="Critérios de Aceitação do MVP"
              subtitle="7 funcionalidades obrigatórias"
              color="#2E7D32"
              sectionKey="criterios"
              expanded={!!expanded.criterios}
              onToggle={toggle}
            >
              {[
                { criterio: "Usuário cadastrar conta", desc: "Registro com e-mail, senha e perfil" },
                { criterio: "Usuário cadastrar propriedade", desc: "Nome, localização, área e tipo" },
                { criterio: "Usuário cadastrar cultura", desc: "Tipo, data de plantio e fase fenológica" },
                { criterio: "Usuário enviar foto", desc: "Upload de imagem da planta/lavoura" },
                { criterio: "Sistema gerar diagnóstico", desc: "IA analisa a imagem e retorna resultado" },
                { criterio: "Sistema gerar relatório", desc: "PDF com diagnóstico e recomendações" },
                { criterio: "Histórico funcionar", desc: "Consulta de diagnósticos e relatórios anteriores" },
              ].map((c, i) => (
                <View key={c.criterio} className="flex-row items-start py-2 border-b border-gray-100">
                  <View
                    style={{ backgroundColor: "#2E7D32" }}
                    className="w-5 h-5 rounded items-center justify-center mr-3 mt-0.5"
                  >
                    <Text className="text-white text-xs font-bold">{i + 1}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-semibold text-foreground">{c.criterio}</Text>
                    <Text className="text-xs text-muted">{c.desc}</Text>
                  </View>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="Roadmap Imediato — Etapas 22 a 27"
              subtitle="Após conclusão do MVP"
              color="#1565C0"
              sectionKey="roadmap"
              expanded={!!expanded.roadmap}
              onToggle={toggle}
            >
              {[
                { etapa: "22", titulo: "Sistema de Design AFU", cor: "#2E7D32", desc: "Design system completo: tokens, componentes, guidelines de UI/UX" },
                { etapa: "23", titulo: "Protótipos UX/UI", cor: "#1565C0", desc: "Wireframes e protótipos interativos de todas as telas" },
                { etapa: "24", titulo: "Backend NestJS Completo", cor: "#EF6C00", desc: "Todos os módulos da API implementados e testados" },
                { etapa: "25", titulo: "App React Native Funcional", cor: "#6A1B9A", desc: "Aplicativo mobile completo com todas as funcionalidades" },
                { etapa: "26", titulo: "Portal Web Funcional", cor: "#C62828", desc: "Portal do produtor e admin web em produção" },
                { etapa: "27", titulo: "Deploy Beta", cor: "#37474F", desc: "Lançamento beta com primeiros produtores reais" },
              ].map((r) => (
                <View key={r.etapa} className="flex-row items-start mb-3">
                  <View
                    style={{ backgroundColor: r.cor + "20", borderColor: r.cor }}
                    className="rounded-full w-8 h-8 items-center justify-center border mr-3"
                  >
                    <Text style={{ color: r.cor }} className="text-xs font-bold">{r.etapa}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-foreground">{r.titulo}</Text>
                    <Text className="text-xs text-muted">{r.desc}</Text>
                  </View>
                </View>
              ))}
            </ExpandableSection>

            {/* Resultado */}
            <View style={{ backgroundColor: "#0D47A1" }} className="rounded-xl p-4 mt-2">
              <Text className="text-white text-xs font-bold mb-2">
                Resultado da Etapa 21
              </Text>
              <Text style={{ color: "#90CAF9" }} className="text-xs leading-5">
                O AFU entra oficialmente na fase de desenvolvimento real, com escopo definido para construção do MVP, infraestrutura organizada e sprints planejadas para entrega incremental do produto.
              </Text>
              <View className="mt-3 flex-row flex-wrap">
                {["Monorepo configurado", "5 sprints planejadas", "7 containers Docker", "7 schemas PostgreSQL", "6 rotas API", "3 aplicativos MVP"].map((item) => (
                  <Tag key={item} label={item} color="#90CAF9" bg="#1565C020" />
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
