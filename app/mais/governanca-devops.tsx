import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

const TABS = [
  { id: "governanca", label: "Governança" },
  { id: "lgpd", label: "LGPD" },
  { id: "seguranca", label: "Segurança" },
  { id: "infra", label: "Infra Cloud" },
  { id: "devops", label: "DevOps" },
  { id: "conformidade", label: "Conformidade" },
];

type SectionKey =
  | "conselho" | "tecnico" | "cientifico" | "segComite"
  | "publico" | "interno" | "restrito" | "confidencial"
  | "dadosLGPD" | "principios" | "consentimento" | "acesso"
  | "appSec" | "cripto" | "auditoria" | "logs"
  | "mvp" | "producao" | "ambientes" | "backup"
  | "pipeline" | "ci" | "observabilidade" | "segredos"
  | "escalabilidade" | "conformidades" | "resultado";

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

function Tag({
  label,
  color,
  bg,
}: {
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <View
      style={{ backgroundColor: bg }}
      className="rounded-full px-3 py-1 mr-2 mb-2"
    >
      <Text style={{ color }} className="text-xs font-semibold">
        {label}
      </Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
      <Text className="text-xs text-muted flex-1">{label}</Text>
      <Text className="text-xs font-semibold text-foreground text-right flex-1">
        {value}
      </Text>
    </View>
  );
}

export default function GovernancaDevopsScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState("governanca");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (key: SectionKey) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View
        style={{ backgroundColor: "#37474F" }}
        className="px-4 pt-4 pb-3"
      >
        <View className="flex-row items-center gap-3 mb-1">
          <View
            style={{ backgroundColor: "#546E7A" }}
            className="w-10 h-10 rounded-xl items-center justify-center"
          >
            <IconSymbol name="shield.fill" size={22} color="#FFFFFF" />
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">
              Governança & DevOps
            </Text>
            <Text style={{ color: "#B0BEC5" }} className="text-xs">
              Segurança · LGPD · Infra Cloud · CI/CD · Conformidade
            </Text>
          </View>
          <View
            style={{ backgroundColor: "#C62828" }}
            className="rounded-full px-2 py-0.5"
          >
            <Text className="text-white text-xs font-bold">Etapa 19</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View className="bg-surface border-b border-border">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-2"
        >
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              className="mr-1 py-3 px-3"
            >
              <Text
                style={{
                  color: activeTab === tab.id ? "#37474F" : colors.muted,
                  fontWeight: activeTab === tab.id ? "700" : "400",
                  fontSize: 13,
                }}
              >
                {tab.label}
              </Text>
              {activeTab === tab.id && (
                <View
                  style={{ backgroundColor: "#37474F" }}
                  className="h-0.5 rounded-full mt-1"
                />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {/* ─── GOVERNANÇA ─── */}
        {activeTab === "governanca" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">
              Estrutura de Governança
            </Text>
            <Text className="text-xs text-muted mb-4">
              Organização responsável pela visão, operação e segurança do AFU
            </Text>

            {/* Comitês */}
            <ExpandableSection
              title="Conselho Estratégico"
              subtitle="Visão · Expansão · Parcerias · Investimentos"
              color="#1565C0"
              sectionKey="conselho"
              expanded={!!expanded.conselho}
              onToggle={toggle}
            >
              <View className="flex-row flex-wrap">
                {["Visão do projeto", "Expansão", "Parcerias", "Investimentos"].map((r) => (
                  <Tag key={r} label={r} color="#1565C0" bg="#E3F2FD" />
                ))}
              </View>
              <Text className="text-xs text-muted mt-2">
                Nível mais alto de decisão. Define rumos estratégicos, aprova grandes investimentos e representa o AFU perante parceiros institucionais.
              </Text>
            </ExpandableSection>

            <ExpandableSection
              title="Comitê Técnico"
              subtitle="Arquitetura · Banco de Dados · IA · Sensores · Qualidade"
              color="#2E7D32"
              sectionKey="tecnico"
              expanded={!!expanded.tecnico}
              onToggle={toggle}
            >
              <View className="flex-row flex-wrap">
                {["Arquitetura", "Banco de Dados", "IA", "Sensores IoT", "Qualidade de Software"].map((r) => (
                  <Tag key={r} label={r} color="#2E7D32" bg="#E8F5E9" />
                ))}
              </View>
              <Text className="text-xs text-muted mt-2">
                Responsável por decisões técnicas, revisão de arquitetura, aprovação de novas tecnologias e garantia de qualidade do código e infraestrutura.
              </Text>
            </ExpandableSection>

            <ExpandableSection
              title="Comitê Científico"
              subtitle="Validação Agronômica · Metodologias · Conteúdo Técnico"
              color="#EF6C00"
              sectionKey="cientifico"
              expanded={!!expanded.cientifico}
              onToggle={toggle}
            >
              <View className="flex-row flex-wrap">
                {["Validação agronômica", "Metodologias laboratoriais", "Conteúdo técnico"].map((r) => (
                  <Tag key={r} label={r} color="#EF6C00" bg="#FFF3E0" />
                ))}
              </View>
              <Text className="text-xs text-muted mt-2">
                Formado por agrônomos, pesquisadores e especialistas. Valida o conteúdo científico, metodologias de análise e a precisão do banco de conhecimento.
              </Text>
            </ExpandableSection>

            <ExpandableSection
              title="Comitê de Segurança"
              subtitle="Proteção de Dados · Auditoria · Incidentes"
              color="#C62828"
              sectionKey="segComite"
              expanded={!!expanded.segComite}
              onToggle={toggle}
            >
              <View className="flex-row flex-wrap">
                {["Proteção de dados", "Auditoria", "Resposta a incidentes", "LGPD"].map((r) => (
                  <Tag key={r} label={r} color="#C62828" bg="#FFEBEE" />
                ))}
              </View>
              <Text className="text-xs text-muted mt-2">
                Monitora a segurança da plataforma, conduz auditorias periódicas, responde a incidentes e garante conformidade com LGPD e normas de segurança.
              </Text>
            </ExpandableSection>

            {/* Classificação de Dados */}
            <Text className="text-sm font-bold text-foreground mt-4 mb-3">
              Classificação de Dados
            </Text>
            {[
              { nivel: "Público", cor: "#2E7D32", bg: "#E8F5E9", exemplos: ["Materiais educativos", "Conteúdos institucionais"] },
              { nivel: "Interno", cor: "#1565C0", bg: "#E3F2FD", exemplos: ["Indicadores operacionais", "Métricas de uso"] },
              { nivel: "Restrito", cor: "#EF6C00", bg: "#FFF3E0", exemplos: ["Dados de produtores", "Análises laboratoriais", "Diagnósticos"] },
              { nivel: "Confidencial", cor: "#C62828", bg: "#FFEBEE", exemplos: ["Credenciais", "Chaves de API", "Informações financeiras"] },
            ].map((item) => (
              <View
                key={item.nivel}
                style={{ borderLeftColor: item.cor, backgroundColor: item.bg + "80" }}
                className="border-l-4 rounded-r-xl p-3 mb-2"
              >
                <Text style={{ color: item.cor }} className="text-xs font-bold mb-1">
                  {item.nivel}
                </Text>
                <View className="flex-row flex-wrap">
                  {item.exemplos.map((e) => (
                    <Text key={e} className="text-xs text-muted mr-3">• {e}</Text>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ─── LGPD ─── */}
        {activeTab === "lgpd" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">
              LGPD — Lei Geral de Proteção de Dados
            </Text>
            <Text className="text-xs text-muted mb-4">
              Lei nº 13.709/2018 · Adequação completa à legislação brasileira
            </Text>

            {/* Dados protegidos */}
            <ExpandableSection
              title="Dados Pessoais Protegidos"
              subtitle="7 categorias de dados sob proteção LGPD"
              color="#1565C0"
              sectionKey="dadosLGPD"
              expanded={!!expanded.dadosLGPD}
              onToggle={toggle}
            >
              <View className="flex-row flex-wrap">
                {["Nome", "CPF/CNPJ", "Telefone", "E-mail", "Localização", "Documentos", "Dados financeiros"].map((d) => (
                  <Tag key={d} label={d} color="#1565C0" bg="#E3F2FD" />
                ))}
              </View>
              <Text className="text-xs text-muted mt-2">
                Todos os dados pessoais coletados são armazenados com criptografia AES-256, acessados apenas por perfis autorizados e nunca compartilhados sem consentimento explícito.
              </Text>
            </ExpandableSection>

            <ExpandableSection
              title="Princípios LGPD"
              subtitle="6 princípios fundamentais aplicados ao AFU"
              color="#2E7D32"
              sectionKey="principios"
              expanded={!!expanded.principios}
              onToggle={toggle}
            >
              {[
                { p: "Finalidade", d: "Dados coletados apenas para fins específicos e legítimos informados ao titular." },
                { p: "Necessidade", d: "Coleta limitada ao mínimo necessário para a finalidade declarada." },
                { p: "Transparência", d: "Informações claras sobre coleta, uso e compartilhamento de dados." },
                { p: "Segurança", d: "Medidas técnicas e administrativas para proteger os dados." },
                { p: "Prevenção", d: "Adoção de medidas para prevenir danos antes que ocorram." },
                { p: "Responsabilização", d: "Demonstração de conformidade com a LGPD mediante auditoria." },
              ].map((item) => (
                <View key={item.p} className="mb-3">
                  <Text className="text-xs font-bold text-foreground">{item.p}</Text>
                  <Text className="text-xs text-muted mt-0.5">{item.d}</Text>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="Consentimento e Direitos do Titular"
              subtitle="Registro · Revogação · Exportação · Exclusão"
              color="#EF6C00"
              sectionKey="consentimento"
              expanded={!!expanded.consentimento}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Campos registrados no consentimento:</Text>
              <View className="flex-row flex-wrap mb-3">
                {["Data", "Hora", "IP", "Versão do termo", "Aceite"].map((c) => (
                  <Tag key={c} label={c} color="#EF6C00" bg="#FFF3E0" />
                ))}
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Direitos garantidos:</Text>
              <View className="flex-row flex-wrap">
                {["Revogação do consentimento", "Exportação dos dados", "Exclusão permanente", "Portabilidade", "Correção"].map((d) => (
                  <Tag key={d} label={d} color="#2E7D32" bg="#E8F5E9" />
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Controle de Acesso RBAC"
              subtitle="Role Based Access Control · 7 perfis"
              color="#37474F"
              sectionKey="acesso"
              expanded={!!expanded.acesso}
              onToggle={toggle}
            >
              {[
                { perfil: "Administrador", acesso: "Acesso total ao sistema" },
                { perfil: "Técnico", acesso: "Diagnósticos, análises, revisões" },
                { perfil: "Produtor", acesso: "Próprias propriedades e cultivos" },
                { perfil: "Parceiro", acesso: "Marketplace e integrações" },
                { perfil: "Comprador", acesso: "Pedidos e logística" },
                { perfil: "Laboratório", acesso: "Amostras e laudos" },
                { perfil: "Auditor", acesso: "Logs e relatórios de auditoria" },
              ].map((item) => (
                <InfoRow key={item.perfil} label={item.perfil} value={item.acesso} />
              ))}
            </ExpandableSection>

            {/* Diagrama LGPD */}
            <View className="bg-gray-900 rounded-xl p-4 mt-2">
              <Text className="text-white text-xs font-bold mb-3 text-center">
                Fluxo de Consentimento LGPD
              </Text>
              {[
                { step: "1", label: "Usuário acessa o AFU", color: "#64B5F6" },
                { step: "2", label: "Exibição do Termo de Consentimento", color: "#81C784" },
                { step: "3", label: "Registro: data · hora · IP · versão", color: "#FFB74D" },
                { step: "4", label: "Dados armazenados com criptografia", color: "#EF9A9A" },
                { step: "5", label: "Titular pode revogar / exportar / excluir", color: "#CE93D8" },
              ].map((s, i) => (
                <View key={s.step} className="flex-row items-start mb-2">
                  <View
                    style={{ backgroundColor: s.color + "30", borderColor: s.color }}
                    className="w-6 h-6 rounded-full items-center justify-center border mr-3 mt-0.5"
                  >
                    <Text style={{ color: s.color }} className="text-xs font-bold">
                      {s.step}
                    </Text>
                  </View>
                  <Text style={{ color: s.color }} className="text-xs flex-1">
                    {s.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ─── SEGURANÇA ─── */}
        {activeTab === "seguranca" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">
              Segurança da Aplicação
            </Text>
            <Text className="text-xs text-muted mb-4">
              Autenticação · Criptografia · Proteções · Auditoria · Logs
            </Text>

            <ExpandableSection
              title="Segurança de Aplicação"
              subtitle="Autenticação JWT · MFA · Proteções contra ataques"
              color="#C62828"
              sectionKey="appSec"
              expanded={!!expanded.appSec}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Autenticação:</Text>
              <View className="flex-row flex-wrap mb-3">
                {["JWT", "Refresh Token", "MFA (2FA)"].map((a) => (
                  <Tag key={a} label={a} color="#C62828" bg="#FFEBEE" />
                ))}
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Proteções contra ataques:</Text>
              <View className="flex-row flex-wrap">
                {["XSS", "CSRF", "SQL Injection", "Brute Force", "Upload malicioso"].map((p) => (
                  <Tag key={p} label={p} color="#EF6C00" bg="#FFF3E0" />
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Criptografia"
              subtitle="TLS 1.3 em trânsito · AES-256 em repouso"
              color="#1565C0"
              sectionKey="cripto"
              expanded={!!expanded.cripto}
              onToggle={toggle}
            >
              <View className="mb-3">
                <Text className="text-xs font-bold text-foreground mb-1">Em Trânsito</Text>
                <View className="flex-row flex-wrap">
                  {["TLS 1.3", "HTTPS obrigatório"].map((c) => (
                    <Tag key={c} label={c} color="#1565C0" bg="#E3F2FD" />
                  ))}
                </View>
              </View>
              <View>
                <Text className="text-xs font-bold text-foreground mb-1">Em Repouso — AES-256</Text>
                <View className="flex-row flex-wrap">
                  {["Banco de dados", "Backups", "Documentos"].map((c) => (
                    <Tag key={c} label={c} color="#2E7D32" bg="#E8F5E9" />
                  ))}
                </View>
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Auditoria de Eventos"
              subtitle="7 tipos de evento · 6 campos registrados"
              color="#37474F"
              sectionKey="auditoria"
              expanded={!!expanded.auditoria}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Eventos registrados:</Text>
              <View className="flex-row flex-wrap mb-3">
                {["Login", "Logout", "Criação", "Edição", "Exclusão", "Aprovação", "Certificação"].map((e) => (
                  <Tag key={e} label={e} color="#37474F" bg="#ECEFF1" />
                ))}
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Campos do registro de auditoria:</Text>
              <View className="bg-gray-900 rounded-lg p-3">
                <Text className="text-green-400 text-xs font-mono">{`{`}</Text>
                {[
                  { k: "  usuario_id", v: '"uuid-do-usuario"' },
                  { k: "  data_hora", v: '"2026-06-13T14:00:00Z"' },
                  { k: "  ip_origem", v: '"192.168.1.100"' },
                  { k: "  dispositivo", v: '"iPhone 15 / iOS 17"' },
                  { k: "  acao", v: '"EDICAO_LAUDO"' },
                  { k: "  resultado", v: '"SUCESSO"' },
                ].map((f) => (
                  <Text key={f.k} className="text-xs font-mono">
                    <Text className="text-blue-300">{f.k}</Text>
                    <Text className="text-white">{": "}</Text>
                    <Text className="text-yellow-300">{f.v}</Text>
                    <Text className="text-white">{","}</Text>
                  </Text>
                ))}
                <Text className="text-green-400 text-xs font-mono">{`}`}</Text>
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Centralização de Logs"
              subtitle="6 fontes · Retenção 5 anos"
              color="#2E7D32"
              sectionKey="logs"
              expanded={!!expanded.logs}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Fontes de log centralizadas:</Text>
              <View className="flex-row flex-wrap mb-3">
                {["Aplicação", "API", "Banco de Dados", "Sensores IoT", "IA", "Marketplace"].map((f) => (
                  <Tag key={f} label={f} color="#2E7D32" bg="#E8F5E9" />
                ))}
              </View>
              <InfoRow label="Retenção dos logs" value="5 anos" />
              <InfoRow label="Formato" value="JSON estruturado" />
              <InfoRow label="Indexação" value="Elasticsearch / OpenSearch" />
              <InfoRow label="Alertas automáticos" value="Anomalias e erros críticos" />
            </ExpandableSection>

            {/* Diagrama de segurança */}
            <View className="bg-gray-900 rounded-xl p-4 mt-2">
              <Text className="text-white text-xs font-bold mb-3 text-center">
                Camadas de Segurança AFU
              </Text>
              {[
                { layer: "Rede", items: ["TLS 1.3", "HTTPS", "Firewall", "DDoS Protection"], color: "#EF9A9A" },
                { layer: "Aplicação", items: ["JWT", "MFA", "RBAC", "Rate Limiting"], color: "#FFB74D" },
                { layer: "Dados", items: ["AES-256", "Backups", "Mascaramento"], color: "#81C784" },
                { layer: "Auditoria", items: ["Logs 5 anos", "Rastreabilidade", "Alertas"], color: "#64B5F6" },
              ].map((l) => (
                <View key={l.layer} className="mb-3">
                  <Text style={{ color: l.color }} className="text-xs font-bold mb-1">
                    {l.layer}
                  </Text>
                  <View className="flex-row flex-wrap">
                    {l.items.map((i) => (
                      <View
                        key={i}
                        style={{ backgroundColor: l.color + "20", borderColor: l.color + "60" }}
                        className="rounded px-2 py-0.5 mr-1 mb-1 border"
                      >
                        <Text style={{ color: l.color }} className="text-xs">
                          {i}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ─── INFRA CLOUD ─── */}
        {activeTab === "infra" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">
              Infraestrutura Cloud
            </Text>
            <Text className="text-xs text-muted mb-4">
              Ambientes MVP e Produção · Backup · Recuperação de Desastres
            </Text>

            <ExpandableSection
              title="Ambiente MVP"
              subtitle="PostgreSQL · Object Storage · API · Frontend"
              color="#2E7D32"
              sectionKey="mvp"
              expanded={!!expanded.mvp}
              onToggle={toggle}
            >
              {[
                { svc: "PostgreSQL", desc: "Banco de dados relacional gerenciado" },
                { svc: "Object Storage", desc: "Armazenamento de arquivos e imagens (S3-compatible)" },
                { svc: "API Server", desc: "NestJS containerizado com Docker" },
                { svc: "Frontend Web", desc: "Next.js com CDN para assets estáticos" },
              ].map((s) => (
                <InfoRow key={s.svc} label={s.svc} value={s.desc} />
              ))}
              <Text className="text-xs text-muted mt-2">
                Ambiente enxuto para validação do produto com custo reduzido. Escalável para produção sem mudança de arquitetura.
              </Text>
            </ExpandableSection>

            <ExpandableSection
              title="Ambiente de Produção"
              subtitle="Alta disponibilidade · Replicação · CDN · Monitoramento"
              color="#1565C0"
              sectionKey="producao"
              expanded={!!expanded.producao}
              onToggle={toggle}
            >
              {[
                { svc: "Balanceadores de Carga", desc: "Distribuição de tráfego com failover automático" },
                { svc: "Banco Replicado", desc: "PostgreSQL com réplicas de leitura e failover" },
                { svc: "Cache", desc: "Redis para sessões, filas e dados frequentes" },
                { svc: "CDN", desc: "Distribuição global de assets e imagens" },
                { svc: "Monitoramento", desc: "Prometheus + Grafana + alertas em tempo real" },
              ].map((s) => (
                <InfoRow key={s.svc} label={s.svc} value={s.desc} />
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="Ambientes de Desenvolvimento"
              subtitle="DEV → STAGING → PROD"
              color="#37474F"
              sectionKey="ambientes"
              expanded={!!expanded.ambientes}
              onToggle={toggle}
            >
              <View className="bg-gray-900 rounded-xl p-4">
                <Text className="text-white text-xs font-bold mb-3 text-center">
                  Fluxo de Ambientes
                </Text>
                {[
                  { env: "DEV", desc: "Desenvolvimento local · Testes unitários · Hot reload", color: "#81C784" },
                  { env: "↓", desc: "", color: "#546E7A" },
                  { env: "STAGING", desc: "Homologação · Testes integração · QA · Aprovação", color: "#FFB74D" },
                  { env: "↓", desc: "", color: "#546E7A" },
                  { env: "PROD", desc: "Produção · Alta disponibilidade · Monitoramento 24/7", color: "#EF9A9A" },
                ].map((e, i) => (
                  <View key={i} className="items-center mb-1">
                    {e.env === "↓" ? (
                      <Text style={{ color: e.color }} className="text-lg">↓</Text>
                    ) : (
                      <View
                        style={{ backgroundColor: e.color + "20", borderColor: e.color }}
                        className="rounded-xl px-4 py-2 border w-full"
                      >
                        <Text style={{ color: e.color }} className="text-xs font-bold text-center">
                          {e.env}
                        </Text>
                        <Text style={{ color: e.color + "CC" }} className="text-xs text-center mt-0.5">
                          {e.desc}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Backup e Recuperação de Desastres"
              subtitle="RPO 1h · RTO 4h · Backup incremental e completo"
              color="#C62828"
              sectionKey="backup"
              expanded={!!expanded.backup}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Banco de Dados:</Text>
              <InfoRow label="Backup incremental" value="A cada 1 hora" />
              <InfoRow label="Backup completo" value="Diário (00:00 UTC)" />
              <Text className="text-xs font-semibold text-foreground mt-3 mb-2">Arquivos:</Text>
              <InfoRow label="Backup de arquivos" value="Diário" />
              <Text className="text-xs font-semibold text-foreground mt-3 mb-2">Metas de Recuperação:</Text>
              <View className="flex-row gap-3 mt-1">
                <View className="flex-1 bg-red-50 rounded-xl p-3 items-center">
                  <Text className="text-red-700 text-lg font-bold">1h</Text>
                  <Text className="text-red-600 text-xs font-semibold">RPO</Text>
                  <Text className="text-xs text-muted text-center mt-1">
                    Recovery Point Objective
                  </Text>
                </View>
                <View className="flex-1 bg-orange-50 rounded-xl p-3 items-center">
                  <Text className="text-orange-700 text-lg font-bold">4h</Text>
                  <Text className="text-orange-600 text-xs font-semibold">RTO</Text>
                  <Text className="text-xs text-muted text-center mt-1">
                    Recovery Time Objective
                  </Text>
                </View>
              </View>
            </ExpandableSection>
          </View>
        )}

        {/* ─── DEVOPS ─── */}
        {activeTab === "devops" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">
              DevOps & Operações
            </Text>
            <Text className="text-xs text-muted mb-4">
              Pipeline CI/CD · Observabilidade · Gestão de Segredos
            </Text>

            {/* Pipeline */}
            <View className="bg-gray-900 rounded-xl p-4 mb-4">
              <Text className="text-white text-xs font-bold mb-3 text-center">
                Pipeline DevOps
              </Text>
              {[
                { step: "Commit", desc: "Push para repositório Git (GitHub/GitLab)", color: "#64B5F6", icon: "↑" },
                { step: "Testes", desc: "Unitários · Integração · E2E · Cobertura", color: "#81C784", icon: "✓" },
                { step: "Build", desc: "Docker image · Assets · Otimização", color: "#FFB74D", icon: "⚙" },
                { step: "Deploy", desc: "Staging → Aprovação → Produção", color: "#CE93D8", icon: "🚀" },
                { step: "Monitoramento", desc: "Métricas · Alertas · Logs · Dashboards", color: "#EF9A9A", icon: "◉" },
              ].map((s, i) => (
                <View key={s.step} className="flex-row items-start mb-3">
                  <View
                    style={{ backgroundColor: s.color + "30", borderColor: s.color }}
                    className="w-8 h-8 rounded-full items-center justify-center border mr-3"
                  >
                    <Text style={{ color: s.color }} className="text-sm font-bold">
                      {i + 1}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text style={{ color: s.color }} className="text-xs font-bold">
                      {s.step}
                    </Text>
                    <Text className="text-gray-400 text-xs mt-0.5">{s.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* CI */}
            <ExpandableSection
              title="Integração Contínua (CI)"
              subtitle="Lint · Testes · Segurança · Build · Deploy"
              color="#2E7D32"
              sectionKey="ci"
              expanded={!!expanded.ci}
              onToggle={toggle}
            >
              {[
                { etapa: "Lint", desc: "ESLint, Prettier — verificação de estilo e qualidade" },
                { etapa: "Testes", desc: "Vitest, Jest — unitários e integração com cobertura mínima 80%" },
                { etapa: "Segurança", desc: "SAST, dependências vulneráveis, secrets scan" },
                { etapa: "Build", desc: "TypeScript compile, bundle otimizado, Docker image" },
                { etapa: "Deploy", desc: "Deploy automático em staging; manual para produção" },
              ].map((e) => (
                <View key={e.etapa} className="mb-3">
                  <Text className="text-xs font-bold text-foreground">{e.etapa}</Text>
                  <Text className="text-xs text-muted mt-0.5">{e.desc}</Text>
                </View>
              ))}
            </ExpandableSection>

            {/* Observabilidade */}
            <ExpandableSection
              title="Observabilidade"
              subtitle="API · Banco · Sensores · IA · Marketplace"
              color="#1565C0"
              sectionKey="observabilidade"
              expanded={!!expanded.observabilidade}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Serviços monitorados:</Text>
              <View className="flex-row flex-wrap mb-3">
                {["API", "Banco de Dados", "Sensores IoT", "IA", "Marketplace"].map((s) => (
                  <Tag key={s} label={s} color="#1565C0" bg="#E3F2FD" />
                ))}
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Indicadores (KPIs de infra):</Text>
              {[
                { ind: "CPU", meta: "< 70% em média" },
                { ind: "Memória", meta: "< 80% utilização" },
                { ind: "Tempo de resposta", meta: "< 200ms (p95)" },
                { ind: "Taxa de erros", meta: "< 0,1% das requisições" },
                { ind: "Disponibilidade", meta: "> 99,9% (SLA)" },
              ].map((i) => (
                <InfoRow key={i.ind} label={i.ind} value={i.meta} />
              ))}
            </ExpandableSection>

            {/* Gestão de Segredos */}
            <ExpandableSection
              title="Gestão de Segredos"
              subtitle="Tokens · Senhas · Certificados · Chaves"
              color="#C62828"
              sectionKey="segredos"
              expanded={!!expanded.segredos}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Tipos armazenados:</Text>
              <View className="flex-row flex-wrap mb-3">
                {["Tokens JWT", "Senhas de serviço", "Certificados TLS", "Chaves de API", "Chaves de criptografia"].map((s) => (
                  <Tag key={s} label={s} color="#C62828" bg="#FFEBEE" />
                ))}
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Políticas de segurança:</Text>
              {[
                { pol: "Rotação automática", desc: "Chaves rotacionadas a cada 90 dias" },
                { pol: "Criptografia", desc: "Segredos criptografados em repouso (AES-256)" },
                { pol: "Controle de acesso", desc: "Apenas serviços autorizados acessam segredos" },
                { pol: "Auditoria", desc: "Acesso a segredos registrado em log imutável" },
              ].map((p) => (
                <View key={p.pol} className="mb-2">
                  <Text className="text-xs font-bold text-foreground">{p.pol}</Text>
                  <Text className="text-xs text-muted">{p.desc}</Text>
                </View>
              ))}
            </ExpandableSection>
          </View>
        )}

        {/* ─── CONFORMIDADE ─── */}
        {activeTab === "conformidade" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">
              Conformidade & Escalabilidade
            </Text>
            <Text className="text-xs text-muted mb-4">
              LGPD · ISO 27001 · ISO 9001 · Plano de Crescimento
            </Text>

            <ExpandableSection
              title="Plano de Escalabilidade"
              subtitle="100K → 1M usuários · Crescimento nacional e internacional"
              color="#1565C0"
              sectionKey="escalabilidade"
              expanded={!!expanded.escalabilidade}
              onToggle={toggle}
            >
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1 bg-blue-50 rounded-xl p-3">
                  <Text className="text-blue-700 text-xs font-bold mb-2 text-center">Meta Inicial</Text>
                  <InfoRow label="Usuários" value="100.000" />
                  <InfoRow label="Propriedades" value="10.000" />
                  <InfoRow label="Sensores" value="100.000" />
                </View>
                <View className="flex-1 bg-green-50 rounded-xl p-3">
                  <Text className="text-green-700 text-xs font-bold mb-2 text-center">Meta Futura</Text>
                  <InfoRow label="Usuários" value="1.000.000" />
                  <InfoRow label="Propriedades" value="100.000" />
                  <InfoRow label="Sensores" value="1.000.000" />
                </View>
              </View>
              <Text className="text-xs text-muted">
                A arquitetura foi projetada para escalonamento horizontal. Microsserviços, filas assíncronas e banco replicado garantem crescimento sem redesenho da plataforma.
              </Text>
            </ExpandableSection>

            <ExpandableSection
              title="Certificações e Conformidades"
              subtitle="LGPD · ISO 27001 · ISO 9001 · Boas Práticas Agrícolas"
              color="#2E7D32"
              sectionKey="conformidades"
              expanded={!!expanded.conformidades}
              onToggle={toggle}
            >
              {[
                {
                  cert: "LGPD",
                  desc: "Lei Geral de Proteção de Dados (Lei nº 13.709/2018)",
                  status: "Implementada",
                  cor: "#2E7D32",
                },
                {
                  cert: "ISO 27001",
                  desc: "Gestão de Segurança da Informação",
                  status: "Em adequação",
                  cor: "#1565C0",
                },
                {
                  cert: "ISO 9001",
                  desc: "Sistema de Gestão da Qualidade",
                  status: "Em adequação",
                  cor: "#EF6C00",
                },
                {
                  cert: "Boas Práticas Agrícolas",
                  desc: "GlobalG.A.P. e normas MAPA",
                  status: "Planejada",
                  cor: "#37474F",
                },
                {
                  cert: "Programas de Certificação",
                  desc: "Orgânicos, Rastreabilidade, Sustentabilidade",
                  status: "Planejada",
                  cor: "#37474F",
                },
              ].map((c) => (
                <View key={c.cert} className="mb-3 flex-row items-start">
                  <View
                    style={{ backgroundColor: c.cor }}
                    className="w-2 h-2 rounded-full mt-1.5 mr-3"
                  />
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs font-bold text-foreground">{c.cert}</Text>
                      <View
                        style={{ backgroundColor: c.cor + "20" }}
                        className="rounded-full px-2 py-0.5"
                      >
                        <Text style={{ color: c.cor }} className="text-xs font-semibold">
                          {c.status}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-xs text-muted mt-0.5">{c.desc}</Text>
                  </View>
                </View>
              ))}
            </ExpandableSection>

            {/* Resultado da Etapa */}
            <ExpandableSection
              title="Resultado da Etapa 19"
              subtitle="Fundação corporativa completa do AFU"
              color="#C62828"
              sectionKey="resultado"
              expanded={!!expanded.resultado}
              onToggle={toggle}
            >
              <Text className="text-xs text-muted leading-5">
                O AFU passa a possuir uma fundação corporativa completa de segurança, governança, conformidade, infraestrutura cloud, continuidade operacional e DevOps, preparada para sustentar crescimento nacional e internacional.
              </Text>
              <View className="mt-3 flex-row flex-wrap">
                {[
                  "Governança estruturada",
                  "LGPD compliant",
                  "Segurança multicamada",
                  "Infra cloud escalável",
                  "CI/CD automatizado",
                  "Observabilidade total",
                  "ISO 27001 em adequação",
                  "RPO 1h / RTO 4h",
                ].map((item) => (
                  <Tag key={item} label={item} color="#C62828" bg="#FFEBEE" />
                ))}
              </View>
            </ExpandableSection>

            {/* Resumo visual */}
            <View className="bg-gray-900 rounded-xl p-4 mt-2">
              <Text className="text-white text-xs font-bold mb-3 text-center">
                Fundação Corporativa AFU
              </Text>
              {[
                { area: "Governança", items: "4 comitês · 4 níveis de dados", color: "#64B5F6" },
                { area: "LGPD", items: "7 dados protegidos · 6 princípios · 7 perfis RBAC", color: "#81C784" },
                { area: "Segurança", items: "TLS 1.3 · AES-256 · JWT · MFA · 5 proteções", color: "#EF9A9A" },
                { area: "Infra Cloud", items: "MVP → Produção · RPO 1h · RTO 4h", color: "#FFB74D" },
                { area: "DevOps", items: "Pipeline 5 etapas · CI/CD · Observabilidade", color: "#CE93D8" },
                { area: "Conformidade", items: "LGPD · ISO 27001 · ISO 9001 · 1M usuários", color: "#80CBC4" },
              ].map((a) => (
                <View key={a.area} className="flex-row items-center mb-2">
                  <View
                    style={{ backgroundColor: a.color }}
                    className="w-2 h-2 rounded-full mr-3"
                  />
                  <Text style={{ color: a.color }} className="text-xs font-bold w-24">
                    {a.area}
                  </Text>
                  <Text className="text-gray-400 text-xs flex-1">{a.items}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
