import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { RelatedLinks } from "@/components/related-links";
import { RELATED_LINKS_MAP } from "@/constants/related-links-map";

const TABS = ["Visão Geral", "Endpoints", "RBAC", "LGPD"];

const ENDPOINTS = [
  { method: "POST", path: "/auth/signup", desc: "Cadastro com e-mail e senha" },
  { method: "POST", path: "/auth/login", desc: "Login e emissão de JWT + refresh token" },
  { method: "POST", path: "/auth/logout", desc: "Encerrar sessão e invalidar refresh token" },
  { method: "POST", path: "/auth/refresh", desc: "Renovar access token via refresh token" },
  { method: "GET", path: "/auth/session", desc: "Sessão atual e perfil AFU" },
  { method: "POST", path: "/auth/forgot-password", desc: "Solicitar reset de senha por e-mail" },
  { method: "POST", path: "/auth/reset-password", desc: "Redefinir senha com token" },
  { method: "POST", path: "/auth/oauth/callback", desc: "Callback OAuth (Google/Apple)" },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "#2D6A4F",
  POST: "#1565C0",
  PATCH: "#D97706",
  DELETE: "#C62828",
};

export default function AutenticacaoScreen() {
  const colors = useColors();
  const [tab, setTab] = useState(0);

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: "#1565C0" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-2">
          <View style={{ backgroundColor: "#1976D2" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">🔐</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Autenticação</Text>
            <Text style={{ color: "#BBDEFB" }} className="text-xs">Etapa 7 · JWT · bcrypt · MFA · RBAC</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 pt-1">
            {TABS.map((t, i) => (
              <TouchableOpacity
                key={t}
                onPress={() => setTab(i)}
                style={{
                  backgroundColor: tab === i ? "#fff" : "rgba(255,255,255,0.15)",
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ color: tab === i ? "#1565C0" : "#fff" }} className="text-xs font-bold">
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {tab === 0 && (
          <View className="gap-4">
            <View
              style={{ backgroundColor: "#1565C015", borderWidth: 1, borderColor: "#1565C030" }}
              className="rounded-xl p-4"
            >
              <Text style={{ color: "#1565C0" }} className="text-sm font-bold mb-3">
                Estratégia de autenticação AFU
              </Text>
              {[
                { k: "Protocolo", v: "JWT (HS256) + refresh token rotativo" },
                { k: "Access Token", v: "15 minutos" },
                { k: "Refresh Token", v: "30 dias com rotação de versão" },
                { k: "Senhas", v: "Bcrypt, mínimo 8 caracteres" },
                { k: "MFA", v: "TOTP para perfis admin (roadmap)" },
                { k: "OAuth", v: "Google / Apple via callback dedicado" },
                { k: "Armazenamento mobile", v: "Expo SecureStore (tokens) + tRPC session" },
              ].map((row) => (
                <View
                  key={row.k}
                  className="flex-row py-2"
                  style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
                >
                  <Text className="text-xs text-muted w-36">{row.k}</Text>
                  <Text style={{ color: "#1565C0" }} className="text-xs font-bold flex-1">
                    {row.v}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {tab === 1 && (
          <View className="gap-3">
            {ENDPOINTS.map((ep) => (
              <View
                key={ep.path}
                style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
                className="rounded-xl p-3"
              >
                <View className="flex-row items-center gap-2 mb-1">
                  <View
                    style={{ backgroundColor: (METHOD_COLORS[ep.method] ?? "#1565C0") + "20" }}
                    className="rounded px-2 py-0.5"
                  >
                    <Text
                      style={{ color: METHOD_COLORS[ep.method] ?? "#1565C0" }}
                      className="text-xs font-bold"
                    >
                      {ep.method}
                    </Text>
                  </View>
                  <Text className="text-xs font-mono text-foreground flex-1">{ep.path}</Text>
                </View>
                <Text className="text-xs text-muted">{ep.desc}</Text>
              </View>
            ))}
          </View>
        )}

        {tab === 2 && (
          <View className="gap-4">
            {[
              { perfil: "Produtor", perms: "Próprias propriedades, cultivos e diagnósticos" },
              { perfil: "Técnico", perms: "Produtores vinculados e relatórios" },
              { perfil: "Cooperativa", perms: "Membros da cooperativa e dashboard agregado" },
              { perfil: "Admin", perms: "Gestão de usuários e conteúdo técnico" },
              { perfil: "Super Admin", perms: "Acesso total e configurações de sistema" },
            ].map((row) => (
              <View
                key={row.perfil}
                style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
                className="rounded-xl p-3"
              >
                <Text style={{ color: "#1565C0" }} className="text-xs font-bold">
                  {row.perfil}
                </Text>
                <Text className="text-xs text-muted mt-1">{row.perms}</Text>
              </View>
            ))}
          </View>
        )}

        {tab === 3 && (
          <View className="gap-4">
            {[
              "Consentimento explícito no cadastro e onboarding",
              "Direito de acesso e exclusão de dados pessoais",
              "Tokens e credenciais nunca logados em texto claro",
              "Sessão encerrada no logout com limpeza local (SecureStore + cache tRPC)",
              "E-mails transacionais apenas para reset e boas-vindas",
            ].map((item) => (
              <Text key={item} className="text-xs text-muted">
                • {item}
              </Text>
            ))}
          </View>
        )}

        <RelatedLinks links={RELATED_LINKS_MAP["autenticacao"] ?? []} />
      </ScrollView>
    </ScreenContainer>
  );
}
