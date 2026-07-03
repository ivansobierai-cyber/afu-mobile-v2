import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { RelatedLinks } from "@/components/related-links";
import { RELATED_LINKS_MAP } from "@/constants/related-links-map";

const TABS = ["Fundamentos", "Cores", "Tipografia", "Espaçamento", "Tokens"];

export default function DesignSystemBaseScreen() {
  const colors = useColors();
  const [tab, setTab] = useState(0);

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: "#AD1457" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-2">
          <View style={{ backgroundColor: "#C2185B" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">🎨</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Design System Base</Text>
            <Text style={{ color: "#F8BBD0" }} className="text-xs">Etapa 13 · Design e UX/UI</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 pt-1">
            {TABS.map((t, i) => (
              <TouchableOpacity key={t} onPress={() => setTab(i)}
                style={{ backgroundColor: tab === i ? "#fff" : "rgba(255,255,255,0.15)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 }}>
                <Text style={{ color: tab === i ? "#AD1457" : "#fff" }} className="text-xs font-bold">{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {tab === 0 && (
          <View className="gap-4">
            <View style={{ backgroundColor: "#AD145715", borderWidth: 1, borderColor: "#AD145730" }} className="rounded-xl p-4">
              <Text style={{ color: "#AD1457" }} className="text-sm font-bold mb-3">🎨 AFU Design System</Text>
              <Text className="text-sm text-foreground leading-relaxed mb-3">
                O AFU Design System é um conjunto de <Text className="font-bold">princípios, tokens e componentes</Text> que garantem consistência visual e experiência unificada em todas as plataformas do ecossistema AFU.
              </Text>
              {[
                { p: "Clareza", d: "Interfaces simples e diretas para produtores com baixa familiaridade digital." },
                { p: "Consistência", d: "Mesmos padrões visuais em app mobile, portal web e painel admin." },
                { p: "Acessibilidade", d: "WCAG 2.1 AA. Contraste mínimo 4,5:1. Suporte a texto grande." },
                { p: "Eficiência", d: "Menos de 3 toques para qualquer ação principal." },
                { p: "Confiança", d: "Visual profissional que transmite credibilidade técnica." },
              ].map((p) => (
                <View key={p.p} className="flex-row gap-3 mb-2">
                  <View style={{ backgroundColor: "#AD145720", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" }}>
                    <Text style={{ color: "#AD1457" }} className="text-xs font-bold">{p.p}</Text>
                  </View>
                  <Text className="text-xs text-muted flex-1 leading-relaxed">{p.d}</Text>
                </View>
              ))}
            </View>
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#AD1457" }} className="text-sm font-bold mb-2">🛠️ Stack do Design System</Text>
              {[
                { k: "Mobile", v: "NativeWind 4 (Tailwind CSS para RN)" },
                { k: "Web", v: "Tailwind CSS + shadcn/ui" },
                { k: "Ícones", v: "Expo Symbols + Material Icons" },
                { k: "Animações", v: "React Native Reanimated 4" },
                { k: "Documentação", v: "Storybook (web)" },
              ].map((r) => (
                <View key={r.k} className="flex-row py-2" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text className="text-xs text-muted w-24">{r.k}</Text>
                  <Text style={{ color: "#AD1457" }} className="text-xs font-bold flex-1">{r.v}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {tab === 1 && (
          <View className="gap-4">
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#AD1457" }} className="text-sm font-bold mb-3">🎨 Paleta de Cores AFU</Text>
              {[
                { nome: "Verde Primário", hex: "#1B5E20", uso: "Ações principais, botões CTA" },
                { nome: "Verde Médio", hex: "#2E7D32", uso: "Hover, estados ativos" },
                { nome: "Verde Claro", hex: "#A5D6A7", uso: "Backgrounds de sucesso" },
                { nome: "Azul Técnico", hex: "#1565C0", uso: "Informações, links, dados" },
                { nome: "Laranja Alerta", hex: "#E65100", uso: "Avisos, atenção" },
                { nome: "Vermelho Erro", hex: "#C62828", uso: "Erros, alertas críticos" },
                { nome: "Cinza Texto", hex: "#11181C", uso: "Texto principal (light)" },
                { nome: "Cinza Muted", hex: "#687076", uso: "Texto secundário" },
              ].map((c) => (
                <View key={c.nome} className="flex-row items-center gap-3 py-2" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <View style={{ backgroundColor: c.hex, width: 32, height: 32, borderRadius: 8 }} />
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-foreground">{c.nome}</Text>
                    <Text style={{ fontFamily: "monospace", color: "#687076" }} className="text-xs">{c.hex}</Text>
                  </View>
                  <Text className="text-xs text-muted text-right w-32">{c.uso}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {tab === 2 && (
          <View className="gap-4">
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#AD1457" }} className="text-sm font-bold mb-3">✍️ Escala Tipográfica</Text>
              {[
                { nome: "Display", size: "32px", weight: "800", uso: "Títulos de tela" },
                { nome: "H1", size: "24px", weight: "700", uso: "Cabeçalhos principais" },
                { nome: "H2", size: "20px", weight: "700", uso: "Seções" },
                { nome: "H3", size: "16px", weight: "600", uso: "Subseções" },
                { nome: "Body Large", size: "16px", weight: "400", uso: "Texto principal" },
                { nome: "Body", size: "14px", weight: "400", uso: "Conteúdo padrão" },
                { nome: "Caption", size: "12px", weight: "400", uso: "Legendas, labels" },
                { nome: "Micro", size: "10px", weight: "500", uso: "Badges, chips" },
              ].map((t) => (
                <View key={t.nome} className="flex-row items-center py-2" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text className="text-xs text-muted w-24">{t.nome}</Text>
                  <Text style={{ color: "#AD1457" }} className="text-xs font-bold w-16">{t.size}</Text>
                  <Text className="text-xs text-muted w-12">{t.weight}</Text>
                  <Text className="text-xs text-muted flex-1">{t.uso}</Text>
                </View>
              ))}
            </View>
            <View style={{ backgroundColor: "#AD145715", borderWidth: 1, borderColor: "#AD145730" }} className="rounded-xl p-4">
              <Text style={{ color: "#AD1457" }} className="text-sm font-bold mb-2">📝 Fontes</Text>
              <Text className="text-xs text-muted">• <Text className="font-bold">Inter</Text> — Interface (mobile e web)</Text>
              <Text className="text-xs text-muted">• <Text className="font-bold">JetBrains Mono</Text> — Código e dados técnicos</Text>
              <Text className="text-xs text-muted">• <Text className="font-bold">System Default</Text> — Fallback nativo</Text>
            </View>
          </View>
        )}

        {tab === 3 && (
          <View className="gap-4">
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#AD1457" }} className="text-sm font-bold mb-3">📐 Escala de Espaçamento (base 4px)</Text>
              {[
                { token: "space-1", val: "4px", uso: "Espaçamento mínimo entre elementos" },
                { token: "space-2", val: "8px", uso: "Padding interno de chips e badges" },
                { token: "space-3", val: "12px", uso: "Padding de botões pequenos" },
                { token: "space-4", val: "16px", uso: "Padding padrão de cards e seções" },
                { token: "space-6", val: "24px", uso: "Espaçamento entre seções" },
                { token: "space-8", val: "32px", uso: "Margem de tela" },
                { token: "space-12", val: "48px", uso: "Espaçamento entre blocos maiores" },
              ].map((r) => (
                <View key={r.token} className="flex-row items-center py-2" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text style={{ fontFamily: "monospace", color: "#AD1457" }} className="text-xs font-bold w-20">{r.token}</Text>
                  <Text style={{ color: "#1565C0" }} className="text-xs font-bold w-12">{r.val}</Text>
                  <Text className="text-xs text-muted flex-1">{r.uso}</Text>
                </View>
              ))}
            </View>
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#AD1457" }} className="text-sm font-bold mb-2">🔲 Border Radius</Text>
              {[
                { t: "sm", v: "4px", u: "Chips, badges" },
                { t: "md", v: "8px", u: "Botões, inputs" },
                { t: "lg", v: "12px", u: "Cards" },
                { t: "xl", v: "16px", u: "Modais, sheets" },
                { t: "full", v: "9999px", u: "Avatares, pills" },
              ].map((r) => (
                <View key={r.t} className="flex-row py-1">
                  <Text style={{ fontFamily: "monospace", color: "#AD1457" }} className="text-xs w-12">{r.t}</Text>
                  <Text style={{ color: "#1565C0" }} className="text-xs w-12">{r.v}</Text>
                  <Text className="text-xs text-muted">{r.u}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {tab === 4 && (
          <View className="gap-4">
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#AD1457" }} className="text-sm font-bold mb-3">🔑 Design Tokens (CSS Variables)</Text>
              {[
                { token: "--color-primary", val: "#1B5E20" },
                { token: "--color-background", val: "#ffffff (light)" },
                { token: "--color-surface", val: "#f5f5f5 (light)" },
                { token: "--color-foreground", val: "#11181C (light)" },
                { token: "--color-muted", val: "#687076 (light)" },
                { token: "--color-border", val: "#E5E7EB (light)" },
                { token: "--color-success", val: "#22C55E" },
                { token: "--color-warning", val: "#F59E0B" },
                { token: "--color-error", val: "#EF4444" },
              ].map((r) => (
                <View key={r.token} className="flex-row py-1">
                  <Text style={{ fontFamily: "monospace", color: "#AD1457" }} className="text-xs flex-1">{r.token}</Text>
                  <Text style={{ fontFamily: "monospace", color: "#1565C0" }} className="text-xs">{r.val}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        <RelatedLinks links={RELATED_LINKS_MAP["/mais/design-system-base"]} />
      </ScrollView>
    </ScreenContainer>
  );
}
