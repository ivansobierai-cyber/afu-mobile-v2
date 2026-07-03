import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { RelatedLinks } from "@/components/related-links";
import { RELATED_LINKS_MAP } from "@/constants/related-links-map";

const TABS = ["Visão Geral", "Autenticação", "Dados", "LGPD", "Auditoria"];

export default function SegurancaTecnicaScreen() {
  const colors = useColors();
  const [tab, setTab] = useState(0);

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: "#B71C1C" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-2">
          <View style={{ backgroundColor: "#C62828" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">🔒</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Segurança Técnica</Text>
            <Text style={{ color: "#FFCDD2" }} className="text-xs">Etapa 10 · Arquitetura Técnica</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 pt-1">
            {TABS.map((t, i) => (
              <TouchableOpacity key={t} onPress={() => setTab(i)}
                style={{ backgroundColor: tab === i ? "#fff" : "rgba(255,255,255,0.15)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 }}>
                <Text style={{ color: tab === i ? "#B71C1C" : "#fff" }} className="text-xs font-bold">{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {tab === 0 && (
          <View className="gap-4">
            <View style={{ backgroundColor: "#B71C1C15", borderWidth: 1, borderColor: "#B71C1C30" }} className="rounded-xl p-4">
              <Text style={{ color: "#B71C1C" }} className="text-sm font-bold mb-3">🛡️ Pilares de Segurança AFU</Text>
              {[
                { emoji: "🔐", t: "Autenticação Forte", d: "JWT + MFA obrigatório para admins. OAuth 2.0 para integrações." },
                { emoji: "🔑", t: "Autorização RBAC", d: "5 perfis: Produtor, Técnico, Cooperativa, Admin, Super Admin." },
                { emoji: "🔒", t: "Criptografia", d: "TLS 1.3 em trânsito. AES-256 em repouso. Bcrypt para senhas." },
                { emoji: "📋", t: "LGPD Compliance", d: "DPO dedicado. Consentimento explícito. Direito ao esquecimento." },
                { emoji: "🔍", t: "Auditoria", d: "Logs imutáveis de todas as ações. Retenção 5 anos." },
                { emoji: "🛡️", t: "ISO 27001", d: "Roadmap de certificação para AFU 3.0." },
              ].map((p) => (
                <View key={p.t} className="flex-row gap-3 mb-3">
                  <Text className="text-xl">{p.emoji}</Text>
                  <View className="flex-1">
                    <Text style={{ color: "#B71C1C" }} className="text-xs font-bold">{p.t}</Text>
                    <Text className="text-xs text-muted mt-1">{p.d}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {tab === 1 && (
          <View className="gap-4">
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#B71C1C" }} className="text-sm font-bold mb-3">🔐 Estratégia de Autenticação</Text>
              {[
                { k: "Protocolo", v: "JWT (RS256 — chave assimétrica)" },
                { k: "Access Token TTL", v: "15 minutos" },
                { k: "Refresh Token TTL", v: "7 dias (rotativo)" },
                { k: "MFA", v: "TOTP (Google Authenticator) para admins" },
                { k: "OAuth 2.0", v: "Google, Apple, Meta (WhatsApp)" },
                { k: "Brute Force", v: "Bloqueio após 5 tentativas (15 min)" },
                { k: "Senhas", v: "Bcrypt rounds=12, mínimo 8 chars" },
              ].map((r) => (
                <View key={r.k} className="flex-row py-2" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text className="text-xs text-muted w-36">{r.k}</Text>
                  <Text style={{ color: "#B71C1C" }} className="text-xs font-bold flex-1">{r.v}</Text>
                </View>
              ))}
            </View>
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#B71C1C" }} className="text-sm font-bold mb-3">👥 RBAC — Perfis e Permissões</Text>
              {[
                { perfil: "Produtor", perms: "Próprias propriedades, diagnósticos e cultivos" },
                { perfil: "Técnico", perms: "Produtores vinculados + relatórios" },
                { perfil: "Cooperativa", perms: "Todos os produtores da cooperativa + dashboard" },
                { perfil: "Admin", perms: "Gestão de usuários + banco agronômico" },
                { perfil: "Super Admin", perms: "Acesso total + configurações de sistema" },
              ].map((r) => (
                <View key={r.perfil} className="py-2" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text style={{ color: "#B71C1C" }} className="text-xs font-bold">{r.perfil}</Text>
                  <Text className="text-xs text-muted mt-1">{r.perms}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {tab === 2 && (
          <View className="gap-4">
            {[
              { t: "Em Trânsito", cor: "#1565C0", items: ["TLS 1.3 obrigatório em todos os endpoints", "HSTS com max-age 1 ano", "Certificate Pinning no app mobile", "Sem suporte a TLS 1.0/1.1"] },
              { t: "Em Repouso", cor: "#7B1FA2", items: ["AES-256-GCM para dados sensíveis", "Chaves gerenciadas por AWS KMS", "Backup criptografado (AES-256)", "Logs de acesso a dados sensíveis"] },
              { t: "Proteção de API", cor: "#C62828", items: ["Rate limiting por IP e por usuário", "WAF (Web Application Firewall)", "Validação de input (Zod schemas)", "SQL injection prevention (ORM)"] },
              { t: "Segurança Mobile", cor: "#E65100", items: ["Expo SecureStore para tokens", "Jailbreak/root detection", "Screenshot prevention (dados sensíveis)", "Biometria para acesso rápido"] },
            ].map((g) => (
              <View key={g.t} style={{ backgroundColor: g.cor + "12", borderWidth: 1, borderColor: g.cor + "30" }} className="rounded-xl p-4">
                <Text style={{ color: g.cor }} className="text-sm font-bold mb-2">{g.t}</Text>
                {g.items.map((item) => (
                  <Text key={item} className="text-xs text-muted">• {item}</Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {tab === 3 && (
          <View className="gap-4">
            <View style={{ backgroundColor: "#B71C1C15", borderWidth: 1, borderColor: "#B71C1C30" }} className="rounded-xl p-4">
              <Text style={{ color: "#B71C1C" }} className="text-sm font-bold mb-3">⚖️ LGPD — Lei 13.709/2018</Text>
              {[
                { d: "Base Legal", v: "Consentimento explícito + execução de contrato" },
                { d: "DPO", v: "Encarregado de Proteção de Dados designado" },
                { d: "Consentimento", v: "Opt-in granular por tipo de dado" },
                { d: "Direito de Acesso", v: "Export de dados em 15 dias úteis" },
                { d: "Direito ao Esquecimento", v: "Exclusão em 30 dias úteis" },
                { d: "Portabilidade", v: "Export em JSON/CSV" },
                { d: "Notificação de Vazamento", v: "ANPD notificada em 72h" },
                { d: "Retenção de Dados", v: "5 anos após encerramento do contrato" },
              ].map((r) => (
                <View key={r.d} className="flex-row py-2" style={{ borderBottomWidth: 1, borderBottomColor: "#B71C1C20" }}>
                  <Text className="text-xs text-muted w-36">{r.d}</Text>
                  <Text className="text-xs text-foreground flex-1">{r.v}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {tab === 4 && (
          <View className="gap-4">
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#B71C1C" }} className="text-sm font-bold mb-3">📋 Sistema de Auditoria</Text>
              {[
                { t: "Eventos Auditados", items: ["Login e logout de usuários", "Criação e exclusão de dados", "Acesso a dados sensíveis", "Alterações de permissão", "Diagnósticos realizados", "Transações no marketplace"] },
                { t: "Estrutura do Log", items: ["Timestamp UTC (imutável)", "user_id + IP + user_agent", "Ação realizada + recurso afetado", "Resultado (sucesso/falha)", "Hash de integridade (SHA-256)"] },
                { t: "Retenção e Armazenamento", items: ["Logs críticos: 5 anos", "Logs de acesso: 1 ano", "Armazenamento imutável (WORM)", "Backup diário criptografado"] },
              ].map((g) => (
                <View key={g.t} style={{ borderBottomWidth: 1, borderBottomColor: colors.border }} className="py-3">
                  <Text style={{ color: "#B71C1C" }} className="text-xs font-bold mb-2">{g.t}</Text>
                  {g.items.map((item) => (
                    <Text key={item} className="text-xs text-muted">• {item}</Text>
                  ))}
                </View>
              ))}
            </View>
          </View>
        )}
        <RelatedLinks links={RELATED_LINKS_MAP["/mais/seguranca-tecnica"]} />
      </ScrollView>
    </ScreenContainer>
  );
}
