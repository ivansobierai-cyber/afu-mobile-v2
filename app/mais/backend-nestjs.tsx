import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { AfuStackBanner } from "@/components/afu-stack-banner";

const TABS = [
  { id: "estrutura", label: "Estrutura" },
  { id: "auth", label: "Auth" },
  { id: "modulos", label: "Módulos" },
  { id: "uploads", label: "Uploads & IA" },
  { id: "relatorios", label: "Relatórios" },
  { id: "devops", label: "DevOps" },
];

type SectionKey =
  | "instalacao" | "envVars" | "prisma"
  | "authEndpoints" | "jwtFluxo"
  | "users" | "producers" | "properties" | "crops"
  | "uploadFluxo" | "diagnosticStruct" | "iaFluxo"
  | "reportsEndpoints" | "pdfService" | "middleware"
  | "dockerfile" | "compose" | "seguranca" | "testes" | "criterios";

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

function EndpointRow({ method, path, desc }: { method: string; path: string; desc?: string }) {
  const methodColors: Record<string, { bg: string; text: string }> = {
    GET: { bg: "#E3F2FD", text: "#1565C0" },
    POST: { bg: "#E8F5E9", text: "#2E7D32" },
    PATCH: { bg: "#FFF3E0", text: "#EF6C00" },
    DELETE: { bg: "#FFEBEE", text: "#C62828" },
  };
  const mc = methodColors[method] ?? { bg: "#F5F5F5", text: "#37474F" };
  return (
    <View className="flex-row items-center py-2 border-b border-gray-100">
      <View style={{ backgroundColor: mc.bg }} className="rounded px-2 py-0.5 w-14 items-center mr-3">
        <Text style={{ color: mc.text }} className="text-xs font-bold">{method}</Text>
      </View>
      <Text className="text-xs font-mono text-foreground flex-1">{path}</Text>
      {desc ? <Text className="text-xs text-muted ml-2">{desc}</Text> : null}
    </View>
  );
}

export default function BackendNestjsScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState("estrutura");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (key: SectionKey) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ backgroundColor: "#B71C1C" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-1">
          <View
            style={{ backgroundColor: "#C62828" }}
            className="w-10 h-10 rounded-xl items-center justify-center"
          >
            <IconSymbol name="server.rack" size={22} color="#FFFFFF" />
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Backend API — MVP 1.0</Text>
            <Text style={{ color: "#EF9A9A" }} className="text-xs">
              Express · tRPC · MySQL · Drizzle · JWT
            </Text>
          </View>
          <View style={{ backgroundColor: "#2E7D32" }} className="rounded-full px-2 py-0.5">
            <Text className="text-white text-xs font-bold">Etapa 24</Text>
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
                  color: activeTab === tab.id ? "#B71C1C" : colors.muted,
                  fontWeight: activeTab === tab.id ? "700" : "400",
                  fontSize: 13,
                }}
              >
                {tab.label}
              </Text>
              {activeTab === tab.id && (
                <View style={{ backgroundColor: "#B71C1C" }} className="h-0.5 rounded-full mt-1" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        <AfuStackBanner note="Esta tela documenta o plano NestJS original. A API entregue está em server/ com Express + tRPC + MySQL + Drizzle." />
        {activeTab === "estrutura" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Estrutura do Projeto</Text>
            <Text className="text-xs text-muted mb-4">
              services/api/ · 11 módulos · Prisma · Config
            </Text>

            {/* Árvore de pastas */}
            <View className="bg-gray-900 rounded-xl p-4 mb-4">
              <Text className="text-green-400 text-xs font-mono font-bold mb-2">services/api/src/</Text>
              {[
                { pasta: "auth/", desc: "Login · Registro · JWT · Refresh", cor: "#EF9A9A" },
                { pasta: "users/", desc: "CRUD usuários · Perfil · Permissões", cor: "#CE93D8" },
                { pasta: "producers/", desc: "CRUD produtores · Dados rurais", cor: "#81C784" },
                { pasta: "properties/", desc: "CRUD propriedades · Geolocalização", cor: "#64B5F6" },
                { pasta: "crops/", desc: "CRUD culturas · Variedades · Fases", cor: "#A5D6A7" },
                { pasta: "diagnostics/", desc: "IA · Upload · Resultado · Status", cor: "#FFB74D" },
                { pasta: "reports/", desc: "PDF · JSON · Geração · Histórico", cor: "#80CBC4" },
                { pasta: "uploads/", desc: "Multer · MinIO · Validação · URL", cor: "#F48FB1" },
                { pasta: "common/", desc: "Guards · Decorators · Pipes · Utils", cor: "#B0BEC5" },
                { pasta: "prisma/", desc: "Schema · Migrations · Client", cor: "#FFCC80" },
                { pasta: "config/", desc: "Env · Database · JWT · Storage", cor: "#90CAF9" },
              ].map((p) => (
                <View key={p.pasta} className="flex-row items-center mb-1.5">
                  <Text className="text-gray-500 text-xs mr-1">├──</Text>
                  <View style={{ backgroundColor: p.cor + "20" }} className="rounded px-1.5 py-0.5 mr-2">
                    <Text style={{ color: p.cor }} className="text-xs font-mono">{p.pasta}</Text>
                  </View>
                  <Text className="text-gray-500 text-xs flex-1">{p.desc}</Text>
                </View>
              ))}
              <View className="flex-row items-center mt-1">
                <Text className="text-gray-500 text-xs mr-1">├──</Text>
                <Text className="text-yellow-400 text-xs font-mono">app.module.ts</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-gray-500 text-xs mr-1">└──</Text>
                <Text className="text-yellow-400 text-xs font-mono">main.ts</Text>
              </View>
            </View>

            <ExpandableSection
              title="Instalação Inicial"
              subtitle="NestJS CLI + 9 pacotes essenciais"
              color="#C62828"
              sectionKey="instalacao"
              expanded={!!expanded.instalacao}
              onToggle={toggle}
            >
              <View className="bg-gray-900 rounded-xl p-4">
                {[
                  "npm i -g @nestjs/cli",
                  "nest new afu-api",
                  "npm install @prisma/client prisma",
                  "npm install @nestjs/jwt @nestjs/passport",
                  "npm install passport passport-jwt",
                  "npm install bcrypt",
                  "npm install class-validator class-transformer",
                  "npm install multer @nestjs/platform-express",
                ].map((cmd) => (
                  <View key={cmd} className="flex-row items-center mb-1.5">
                    <Text className="text-green-400 text-xs mr-1">$</Text>
                    <Text className="text-gray-300 text-xs font-mono flex-1">{cmd}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Variáveis de Ambiente"
              subtitle=".env · 6 variáveis obrigatórias"
              color="#EF6C00"
              sectionKey="envVars"
              expanded={!!expanded.envVars}
              onToggle={toggle}
            >
              <View className="bg-gray-900 rounded-xl p-4">
                {[
                  { key: "DATABASE_URL", desc: "PostgreSQL connection string" },
                  { key: "JWT_SECRET", desc: "Chave secreta access token" },
                  { key: "JWT_REFRESH_SECRET", desc: "Chave secreta refresh token" },
                  { key: "STORAGE_URL", desc: "URL do MinIO / S3" },
                  { key: "MINIO_BUCKET", desc: "Nome do bucket de imagens" },
                  { key: "PORT", desc: "Porta da API (padrão: 3000)" },
                ].map((v) => (
                  <View key={v.key} className="flex-row items-center mb-1.5">
                    <Text className="text-yellow-400 text-xs font-mono w-40">{v.key}=</Text>
                    <Text className="text-gray-500 text-xs flex-1"># {v.desc}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Configuração Prisma"
              subtitle="prisma/schema.prisma · Conforme Etapa 6"
              color="#1565C0"
              sectionKey="prisma"
              expanded={!!expanded.prisma}
              onToggle={toggle}
            >
              <View className="bg-gray-900 rounded-xl p-4">
                <Text className="text-blue-400 text-xs font-mono mb-2">// prisma/schema.prisma</Text>
                <Text className="text-purple-400 text-xs font-mono">generator</Text>
                <Text className="text-gray-300 text-xs font-mono ml-2">{"client {"}</Text>
                <Text className="text-gray-400 text-xs font-mono ml-4">provider = "prisma-client-js"</Text>
                <Text className="text-gray-300 text-xs font-mono ml-2">{"}"}</Text>
                <Text className="text-purple-400 text-xs font-mono mt-2">datasource</Text>
                <Text className="text-gray-300 text-xs font-mono ml-2">{"db {"}</Text>
                <Text className="text-gray-400 text-xs font-mono ml-4">provider = "postgresql"</Text>
                <Text className="text-gray-400 text-xs font-mono ml-4">url = env("DATABASE_URL")</Text>
                <Text className="text-gray-300 text-xs font-mono ml-2">{"}"}</Text>
                <Text className="text-gray-500 text-xs mt-2">// 17 modelos conforme Etapa 6</Text>
                <Text className="text-gray-500 text-xs">// User · Producer · Property · Crop</Text>
                <Text className="text-gray-500 text-xs">// Diagnostic · Report · Sensor · ...</Text>
              </View>
            </ExpandableSection>
          </View>
        )}

        {/* ─── AUTH ─── */}
        {activeTab === "auth" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Módulo Auth</Text>
            <Text className="text-xs text-muted mb-4">
              Login · Cadastro · JWT · Refresh Token · Recuperação
            </Text>

            <ExpandableSection
              title="Endpoints Auth"
              subtitle="4 rotas de autenticação"
              color="#C62828"
              sectionKey="authEndpoints"
              expanded={!!expanded.authEndpoints}
              onToggle={toggle}
            >
              <EndpointRow method="POST" path="/auth/register" desc="Cadastro novo usuário" />
              <EndpointRow method="POST" path="/auth/login" desc="Login + tokens JWT" />
              <EndpointRow method="POST" path="/auth/refresh" desc="Renovar access token" />
              <EndpointRow method="GET" path="/auth/me" desc="Dados do usuário logado" />
              <View className="mt-3">
                <Text className="text-xs font-semibold text-foreground mb-2">Responsabilidades:</Text>
                <View className="flex-row flex-wrap">
                  {["Login", "Cadastro", "Refresh Token", "Recuperação de Senha"].map((r) => (
                    <Tag key={r} label={r} color="#C62828" bg="#FFEBEE" />
                  ))}
                </View>
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Fluxo JWT"
              subtitle="Login → Access Token → Refresh Token → API"
              color="#1565C0"
              sectionKey="jwtFluxo"
              expanded={!!expanded.jwtFluxo}
              onToggle={toggle}
            >
              <View className="bg-gray-900 rounded-xl p-4">
                {[
                  { step: "1. Login", desc: "POST /auth/login com e-mail + senha", cor: "#EF9A9A" },
                  { step: "2. Validação", desc: "bcrypt.compare(senha, hash) no banco", cor: "#FFB74D" },
                  { step: "3. Access Token", desc: "JWT 15min · payload: userId, role", cor: "#81C784" },
                  { step: "4. Refresh Token", desc: "JWT 7d · armazenado no banco", cor: "#64B5F6" },
                  { step: "5. Acesso API", desc: "Bearer token no header Authorization", cor: "#CE93D8" },
                ].map((s, i) => (
                  <View key={s.step} className="items-start mb-1">
                    <View style={{ backgroundColor: s.cor + "20", borderColor: s.cor }} className="rounded-xl px-3 py-2 border w-full">
                      <Text style={{ color: s.cor }} className="text-xs font-bold">{s.step}</Text>
                      <Text className="text-gray-400 text-xs mt-0.5">{s.desc}</Text>
                    </View>
                    {i < 4 && <Text className="text-gray-500 text-sm ml-4">↓</Text>}
                  </View>
                ))}
              </View>

              {/* Segurança JWT */}
              <View className="mt-3">
                <Text className="text-xs font-semibold text-foreground mb-2">Configuração de Segurança:</Text>
                <View className="bg-gray-900 rounded-xl p-3">
                  <Text className="text-yellow-400 text-xs font-mono">JwtModule.register{"({"}</Text>
                  <Text className="text-gray-400 text-xs font-mono ml-3">secret: process.env.JWT_SECRET,</Text>
                  <Text className="text-gray-400 text-xs font-mono ml-3">signOptions: {"{"} expiresIn: '15m' {"}"}</Text>
                  <Text className="text-yellow-400 text-xs font-mono">{"});"}</Text>
                </View>
              </View>
            </ExpandableSection>
          </View>
        )}

        {/* ─── MÓDULOS ─── */}
        {activeTab === "modulos" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Módulos CRUD</Text>
            <Text className="text-xs text-muted mb-4">
              Users · Producers · Properties · Crops
            </Text>

            <ExpandableSection
              title="Módulo Users"
              subtitle="4 endpoints · Gerenciamento de usuários"
              color="#6A1B9A"
              sectionKey="users"
              expanded={!!expanded.users}
              onToggle={toggle}
            >
              <EndpointRow method="GET" path="/users" desc="Listar todos os usuários" />
              <EndpointRow method="GET" path="/users/:id" desc="Buscar usuário por ID" />
              <EndpointRow method="PATCH" path="/users/:id" desc="Atualizar dados do usuário" />
              <EndpointRow method="DELETE" path="/users/:id" desc="Remover usuário" />
            </ExpandableSection>

            <ExpandableSection
              title="Módulo Producers"
              subtitle="5 endpoints · Dados dos produtores rurais"
              color="#2E7D32"
              sectionKey="producers"
              expanded={!!expanded.producers}
              onToggle={toggle}
            >
              <EndpointRow method="POST" path="/producers" desc="Criar produtor" />
              <EndpointRow method="GET" path="/producers" desc="Listar produtores" />
              <EndpointRow method="GET" path="/producers/:id" desc="Buscar produtor" />
              <EndpointRow method="PATCH" path="/producers/:id" desc="Atualizar produtor" />
              <EndpointRow method="DELETE" path="/producers/:id" desc="Remover produtor" />
            </ExpandableSection>

            <ExpandableSection
              title="Módulo Properties"
              subtitle="5 endpoints · Propriedades rurais"
              color="#1565C0"
              sectionKey="properties"
              expanded={!!expanded.properties}
              onToggle={toggle}
            >
              <EndpointRow method="POST" path="/properties" desc="Criar propriedade" />
              <EndpointRow method="GET" path="/properties" desc="Listar propriedades" />
              <EndpointRow method="GET" path="/properties/:id" desc="Buscar propriedade" />
              <EndpointRow method="PATCH" path="/properties/:id" desc="Atualizar propriedade" />
              <EndpointRow method="DELETE" path="/properties/:id" desc="Remover propriedade" />
            </ExpandableSection>

            <ExpandableSection
              title="Módulo Crops"
              subtitle="5 endpoints · Culturas e variedades"
              color="#EF6C00"
              sectionKey="crops"
              expanded={!!expanded.crops}
              onToggle={toggle}
            >
              <EndpointRow method="POST" path="/crops" desc="Criar cultura" />
              <EndpointRow method="GET" path="/crops" desc="Listar culturas" />
              <EndpointRow method="GET" path="/crops/:id" desc="Buscar cultura" />
              <EndpointRow method="PATCH" path="/crops/:id" desc="Atualizar cultura" />
              <EndpointRow method="DELETE" path="/crops/:id" desc="Remover cultura" />
            </ExpandableSection>

            {/* Resumo de endpoints */}
            <View className="bg-gray-900 rounded-xl p-4 mt-2">
              <Text className="text-white text-xs font-bold mb-3">Resumo de Endpoints CRUD</Text>
              <View className="flex-row gap-2">
                {[
                  { label: "POST", count: "4", cor: "#81C784" },
                  { label: "GET", count: "8", cor: "#64B5F6" },
                  { label: "PATCH", count: "4", cor: "#FFB74D" },
                  { label: "DELETE", count: "4", cor: "#EF9A9A" },
                ].map((e) => (
                  <View key={e.label} style={{ backgroundColor: e.cor + "20" }} className="flex-1 rounded-xl p-2 items-center">
                    <Text style={{ color: e.cor }} className="text-base font-bold">{e.count}</Text>
                    <Text style={{ color: e.cor }} className="text-xs">{e.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── UPLOADS & IA ─── */}
        {activeTab === "uploads" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Uploads & Integração IA</Text>
            <Text className="text-xs text-muted mb-4">
              Multer · MinIO · Diagnósticos · IA
            </Text>

            <ExpandableSection
              title="Fluxo de Upload de Imagens"
              subtitle="Multer → MinIO → URL pública"
              color="#EF6C00"
              sectionKey="uploadFluxo"
              expanded={!!expanded.uploadFluxo}
              onToggle={toggle}
            >
              <View className="bg-gray-900 rounded-xl p-4">
                {[
                  { step: "Imagem", desc: "Arquivo recebido via multipart/form-data", cor: "#F48FB1" },
                  { step: "Upload", desc: "Multer intercepta e valida o arquivo", cor: "#FFB74D" },
                  { step: "Validação", desc: "Tipo (jpg/png/webp) · Tamanho (max 10MB)", cor: "#EF9A9A" },
                  { step: "Armazenamento", desc: "MinIO S3-compatible · bucket afu-images", cor: "#64B5F6" },
                  { step: "URL", desc: "URL pública retornada para o cliente", cor: "#81C784" },
                ].map((s, i) => (
                  <View key={s.step} className="items-start mb-1">
                    <View style={{ backgroundColor: s.cor + "20", borderColor: s.cor }} className="rounded-xl px-3 py-2 border w-full">
                      <Text style={{ color: s.cor }} className="text-xs font-bold">{s.step}</Text>
                      <Text className="text-gray-400 text-xs mt-0.5">{s.desc}</Text>
                    </View>
                    {i < 4 && <Text className="text-gray-500 text-sm ml-4">↓</Text>}
                  </View>
                ))}
              </View>
              <View className="flex-row flex-wrap mt-3">
                {["Multer", "MinIO", "S3-compatible", "max 10MB", "jpg/png/webp"].map((t) => (
                  <Tag key={t} label={t} color="#EF6C00" bg="#FFF3E0" />
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Módulo Diagnostics"
              subtitle="3 endpoints · Receber · Registrar · Salvar"
              color="#C62828"
              sectionKey="diagnosticStruct"
              expanded={!!expanded.diagnosticStruct}
              onToggle={toggle}
            >
              <EndpointRow method="POST" path="/diagnostics/image" desc="Enviar imagem para análise" />
              <EndpointRow method="GET" path="/diagnostics" desc="Listar diagnósticos" />
              <EndpointRow method="GET" path="/diagnostics/:id" desc="Buscar diagnóstico" />

              <Text className="text-xs font-semibold text-foreground mt-3 mb-2">Estrutura JSON do Diagnóstico:</Text>
              <View className="bg-gray-900 rounded-xl p-4">
                <Text className="text-blue-400 text-xs font-mono">{"{"}</Text>
                <Text className="text-gray-400 text-xs font-mono ml-3">"crop": <Text className="text-green-400">"Milho"</Text>,</Text>
                <Text className="text-gray-400 text-xs font-mono ml-3">"part": <Text className="text-green-400">"Folha"</Text>,</Text>
                <Text className="text-gray-400 text-xs font-mono ml-3">"imageUrl": <Text className="text-green-400">"https://..."</Text>,</Text>
                <Text className="text-gray-400 text-xs font-mono ml-3">"status": <Text className="text-yellow-400">"processing"</Text></Text>
                <Text className="text-blue-400 text-xs font-mono">{"}"}</Text>
              </View>

              <Text className="text-xs font-semibold text-foreground mt-3 mb-2">Funções do Módulo:</Text>
              <View className="flex-row flex-wrap">
                {["Receber imagem", "Registrar análise", "Salvar resultado"].map((f) => (
                  <Tag key={f} label={f} color="#C62828" bg="#FFEBEE" />
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Integração IA Inicial"
              subtitle="Imagem → API IA → Resultado → Banco → Relatório"
              color="#6A1B9A"
              sectionKey="iaFluxo"
              expanded={!!expanded.iaFluxo}
              onToggle={toggle}
            >
              <View className="bg-gray-900 rounded-xl p-4">
                {[
                  { step: "Imagem", desc: "URL da imagem armazenada no MinIO", cor: "#F48FB1" },
                  { step: "API IA", desc: "Chamada à API de visão computacional", cor: "#CE93D8" },
                  { step: "Resultado", desc: "Diagnóstico + confiança + recomendações", cor: "#FFB74D" },
                  { step: "Banco", desc: "Salvar resultado no PostgreSQL via Prisma", cor: "#64B5F6" },
                  { step: "Relatório", desc: "Gerar PDF/JSON automaticamente", cor: "#81C784" },
                ].map((s, i) => (
                  <View key={s.step} className="items-start mb-1">
                    <View style={{ backgroundColor: s.cor + "20", borderColor: s.cor }} className="rounded-xl px-3 py-2 border w-full">
                      <Text style={{ color: s.cor }} className="text-xs font-bold">{s.step}</Text>
                      <Text className="text-gray-400 text-xs mt-0.5">{s.desc}</Text>
                    </View>
                    {i < 4 && <Text className="text-gray-500 text-sm ml-4">↓</Text>}
                  </View>
                ))}
              </View>
            </ExpandableSection>
          </View>
        )}

        {/* ─── RELATÓRIOS ─── */}
        {activeTab === "relatorios" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Módulo Reports & Middleware</Text>
            <Text className="text-xs text-muted mb-4">
              PDFKit · Puppeteer · Middleware Global · Logs
            </Text>

            <ExpandableSection
              title="Endpoints Reports"
              subtitle="3 rotas · PDF e JSON"
              color="#2E7D32"
              sectionKey="reportsEndpoints"
              expanded={!!expanded.reportsEndpoints}
              onToggle={toggle}
            >
              <EndpointRow method="POST" path="/reports/generate" desc="Gerar relatório" />
              <EndpointRow method="GET" path="/reports" desc="Listar relatórios" />
              <EndpointRow method="GET" path="/reports/:id" desc="Buscar relatório" />
              <Text className="text-xs font-semibold text-foreground mt-3 mb-2">Formatos de Saída:</Text>
              <View className="flex-row flex-wrap">
                {["PDF", "JSON"].map((f) => (
                  <Tag key={f} label={f} color="#2E7D32" bg="#E8F5E9" />
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Serviço PDF"
              subtitle="PDFKit + Puppeteer · 4 seções de conteúdo"
              color="#1565C0"
              sectionKey="pdfService"
              expanded={!!expanded.pdfService}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Bibliotecas:</Text>
              <View className="flex-row flex-wrap mb-3">
                {["PDFKit", "Puppeteer"].map((lib) => (
                  <Tag key={lib} label={lib} color="#1565C0" bg="#E3F2FD" />
                ))}
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Conteúdo do Relatório:</Text>
              {[
                { sec: "Produtor", desc: "Nome, CPF/CNPJ, contato, localização" },
                { sec: "Propriedade", desc: "Nome, área, cidade, coordenadas" },
                { sec: "Diagnóstico", desc: "Cultura, parte, imagem, status, confiança" },
                { sec: "Recomendações", desc: "Tratamentos, produtos, dosagens, prazo" },
              ].map((s) => (
                <View key={s.sec} className="flex-row py-2 border-b border-gray-100">
                  <View style={{ backgroundColor: "#E3F2FD" }} className="rounded px-2 py-0.5 mr-3 self-start">
                    <Text style={{ color: "#1565C0" }} className="text-xs font-bold">{s.sec}</Text>
                  </View>
                  <Text className="text-xs text-muted flex-1">{s.desc}</Text>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="Middleware Global"
              subtitle="Logger · Exception Filter · Validation · Rate Limit"
              color="#37474F"
              sectionKey="middleware"
              expanded={!!expanded.middleware}
              onToggle={toggle}
            >
              {[
                { mw: "Logger", desc: "Winston · Registra todas as requisições com método, rota, status e tempo", cor: "#64B5F6" },
                { mw: "Exception Filter", desc: "Captura erros globais · Formata resposta padronizada", cor: "#EF9A9A" },
                { mw: "Validation Pipe", desc: "class-validator · Valida DTOs automaticamente", cor: "#81C784" },
                { mw: "Rate Limit", desc: "100 req/min por IP · Proteção contra abuso", cor: "#FFB74D" },
              ].map((m) => (
                <View key={m.mw} style={{ borderLeftColor: m.cor, backgroundColor: m.cor + "10" }} className="border-l-4 rounded-r-xl p-3 mb-2">
                  <Text style={{ color: m.cor }} className="text-xs font-bold">{m.mw}</Text>
                  <Text className="text-xs text-muted mt-0.5">{m.desc}</Text>
                </View>
              ))}
              <Text className="text-xs font-semibold text-foreground mt-3 mb-2">Logs Registrados:</Text>
              <View className="flex-row flex-wrap">
                {["Login", "Uploads", "Diagnósticos", "Relatórios"].map((l) => (
                  <Tag key={l} label={l} color="#37474F" bg="#ECEFF1" />
                ))}
              </View>
            </ExpandableSection>
          </View>
        )}

        {/* ─── DEVOPS ─── */}
        {activeTab === "devops" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">DevOps & Qualidade</Text>
            <Text className="text-xs text-muted mb-4">
              Docker · Compose · Segurança · Testes · Critérios
            </Text>

            <ExpandableSection
              title="Dockerfile — API"
              subtitle="Node 22 Alpine · Build otimizado"
              color="#1565C0"
              sectionKey="dockerfile"
              expanded={!!expanded.dockerfile}
              onToggle={toggle}
            >
              <View className="bg-gray-900 rounded-xl p-4">
                <Text className="text-blue-400 text-xs font-mono">FROM node:22-alpine</Text>
                <Text className="text-gray-300 text-xs font-mono mt-1">WORKDIR /app</Text>
                <Text className="text-gray-300 text-xs font-mono">COPY . .</Text>
                <Text className="text-gray-300 text-xs font-mono">RUN npm install</Text>
                <Text className="text-gray-300 text-xs font-mono">RUN npm run build</Text>
                <Text className="text-green-400 text-xs font-mono mt-1">CMD ["node","dist/main.js"]</Text>
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Docker Compose MVP"
              subtitle="4 serviços: api · postgres · redis · minio"
              color="#2E7D32"
              sectionKey="compose"
              expanded={!!expanded.compose}
              onToggle={toggle}
            >
              <View className="gap-2">
                {[
                  { svc: "api", desc: "NestJS · Porta 3000 · depends_on: postgres", cor: "#EF9A9A", port: "3000" },
                  { svc: "postgres", desc: "PostgreSQL 16 · Porta 5432 · volume: pgdata", cor: "#64B5F6", port: "5432" },
                  { svc: "redis", desc: "Redis 7 · Porta 6379 · Cache e filas", cor: "#FFB74D", port: "6379" },
                  { svc: "minio", desc: "MinIO · Porta 9000 · Armazenamento de imagens", cor: "#81C784", port: "9000" },
                ].map((s) => (
                  <View key={s.svc} style={{ backgroundColor: "#1F2937", borderColor: s.cor + "40" }} className="rounded-xl p-3 border flex-row items-start">
                    <View style={{ backgroundColor: s.cor + "20" }} className="rounded-lg px-2 py-1 mr-3">
                      <Text style={{ color: s.cor }} className="text-xs font-mono font-bold">{s.svc}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-300 text-xs">{s.desc}</Text>
                    </View>
                    <View style={{ backgroundColor: "#374151" }} className="rounded px-1.5 py-0.5">
                      <Text className="text-gray-400 text-xs font-mono">:{s.port}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Segurança"
              subtitle="JWT · bcrypt · Helmet · CORS · Rate Limit"
              color="#C62828"
              sectionKey="seguranca"
              expanded={!!expanded.seguranca}
              onToggle={toggle}
            >
              <View className="flex-row flex-wrap">
                {[
                  { item: "JWT", desc: "Access + Refresh tokens", cor: "#EF9A9A" },
                  { item: "bcrypt", desc: "Hash de senhas (rounds: 12)", cor: "#FFB74D" },
                  { item: "Helmet", desc: "Headers HTTP de segurança", cor: "#81C784" },
                  { item: "CORS", desc: "Origens permitidas configuráveis", cor: "#64B5F6" },
                  { item: "Rate Limit", desc: "100 req/min por IP", cor: "#CE93D8" },
                ].map((s) => (
                  <View key={s.item} style={{ backgroundColor: s.cor + "15", borderColor: s.cor + "40" }} className="rounded-xl p-3 mb-2 border w-full flex-row items-start">
                    <View style={{ backgroundColor: s.cor + "30" }} className="rounded px-2 py-0.5 mr-3">
                      <Text style={{ color: s.cor }} className="text-xs font-bold">{s.item}</Text>
                    </View>
                    <Text className="text-xs text-muted flex-1">{s.desc}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Testes — Jest"
              subtitle="Cobertura mínima: 80%"
              color="#6A1B9A"
              sectionKey="testes"
              expanded={!!expanded.testes}
              onToggle={toggle}
            >
              <View className="bg-gray-900 rounded-xl p-4 mb-3">
                <Text className="text-purple-400 text-xs font-mono font-bold mb-2">Framework: Jest</Text>
                <View className="flex-row items-center mb-2">
                  <Text className="text-gray-400 text-xs flex-1">Cobertura mínima:</Text>
                  <View style={{ backgroundColor: "#4A148C" }} className="rounded px-2 py-0.5">
                    <Text className="text-purple-300 text-xs font-bold">80%</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: "#374151" }} className="rounded h-2 mb-1">
                  <View style={{ backgroundColor: "#CE93D8", width: "80%" }} className="h-2 rounded" />
                </View>
                <Text className="text-gray-500 text-xs">Testes unitários + integração</Text>
              </View>
              <View className="flex-row flex-wrap">
                {["Unit Tests", "Integration Tests", "E2E Tests", "Auth", "CRUD", "Upload"].map((t) => (
                  <Tag key={t} label={t} color="#6A1B9A" bg="#F3E5F5" />
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Critérios de Conclusão"
              subtitle="9 critérios para backend MVP pronto"
              color="#2E7D32"
              sectionKey="criterios"
              expanded={!!expanded.criterios}
              onToggle={toggle}
            >
              {[
                "Cadastro funcionar",
                "Login funcionar",
                "JWT funcionar",
                "CRUD produtores",
                "CRUD propriedades",
                "CRUD culturas",
                "Upload de imagem",
                "Registro diagnóstico",
                "Geração PDF",
              ].map((c) => (
                <View key={c} className="flex-row items-center py-2 border-b border-gray-100">
                  <View style={{ backgroundColor: "#E8F5E9" }} className="w-5 h-5 rounded items-center justify-center mr-3">
                    <Text style={{ color: "#2E7D32" }} className="text-xs font-bold">✓</Text>
                  </View>
                  <Text className="text-xs text-foreground">{c}</Text>
                </View>
              ))}
              <View style={{ backgroundColor: "#1B5E20" }} className="rounded-xl p-4 mt-3">
                <Text className="text-white text-xs font-bold mb-1">Resultado da Etapa 24</Text>
                <Text style={{ color: "#A5D6A7" }} className="text-xs leading-5">
                  O AFU passa a possuir a especificação técnica completa do backend NestJS e está pronto para implementação efetiva do código do MVP 1.0.
                </Text>
              </View>
            </ExpandableSection>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
