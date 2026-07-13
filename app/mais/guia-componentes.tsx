import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { AfuMvpFooter } from "@/components/afu-mvp-footer";
import { RelatedLinks } from "@/components/related-links";
import { RELATED_LINKS_MAP } from "@/constants/related-links-map";

const TABS = ["Atoms", "Molecules", "Organisms", "Padrões", "Acessibilidade"];

export default function GuiaComponentesScreen() {
  const colors = useColors();
  const [tab, setTab] = useState(0);

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: "#E65100" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-2">
          <View style={{ backgroundColor: "#F4511E" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">🧩</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Guia de Componentes</Text>
            <Text style={{ color: "#FFCCBC" }} className="text-xs">Etapa 16 · Design e UX/UI</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 pt-1">
            {TABS.map((t, i) => (
              <TouchableOpacity key={t} onPress={() => setTab(i)}
                style={{ backgroundColor: tab === i ? "#fff" : "rgba(255,255,255,0.15)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 }}>
                <Text style={{ color: tab === i ? "#E65100" : "#fff" }} className="text-xs font-bold">{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {tab === 0 && (
          <View className="gap-4">
            <Text style={{ color: "#E65100" }} className="text-sm font-bold">⚛️ Atoms — Componentes Básicos</Text>
            {[
              { nome: "Button", variantes: ["Primary", "Secondary", "Outline", "Ghost", "Danger"], desc: "Botão com estados: default, hover, pressed, disabled, loading." },
              { nome: "Text", variantes: ["Display", "H1", "H2", "H3", "Body", "Caption", "Micro"], desc: "Componente de texto com escala tipográfica definida." },
              { nome: "Badge", variantes: ["Success", "Warning", "Error", "Info", "Neutral"], desc: "Indicador de status com cor semântica." },
              { nome: "Icon", variantes: ["SF Symbols (iOS)", "Material Icons (Android/Web)"], desc: "Ícone com mapeamento SF Symbols → Material Icons." },
              { nome: "Input", variantes: ["Text", "Password", "Number", "Search", "Multiline"], desc: "Campo de entrada com label, placeholder, erro e helper text." },
              { nome: "Divider", variantes: ["Horizontal", "Vertical"], desc: "Separador visual com espessura e cor configuráveis." },
            ].map((c) => (
              <View key={c.nome} style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
                <Text style={{ color: "#E65100" }} className="text-xs font-bold mb-1">{c.nome}</Text>
                <Text className="text-xs text-muted mb-2">{c.desc}</Text>
                <View className="flex-row flex-wrap gap-2">
                  {c.variantes.map((v) => (
                    <View key={v} style={{ backgroundColor: "#E6510020", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ color: "#E65100" }} className="text-xs">{v}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {tab === 1 && (
          <View className="gap-4">
            <Text style={{ color: "#E65100" }} className="text-sm font-bold">🔬 Molecules — Componentes Compostos</Text>
            {[
              { nome: "Card", desc: "Container com sombra, borda, padding e slots para header, body e footer.", props: ["title", "subtitle", "badge", "onPress", "children"] },
              { nome: "ListItem", desc: "Item de lista com ícone, título, subtítulo e ação à direita.", props: ["icon", "title", "subtitle", "rightElement", "onPress"] },
              { nome: "TabBar", desc: "Barra de abas horizontal com scroll e indicador ativo.", props: ["tabs", "activeTab", "onTabChange", "color"] },
              { nome: "SearchBar", desc: "Campo de busca com ícone, limpar e filtros.", props: ["value", "onChangeText", "placeholder", "onFilter"] },
              { nome: "ProgressBar", desc: "Barra de progresso com label e porcentagem.", props: ["value", "max", "color", "label", "showPercent"] },
              { nome: "AlertBanner", desc: "Banner de alerta com ícone, mensagem e ação.", props: ["type", "message", "onDismiss", "action"] },
            ].map((c) => (
              <View key={c.nome} style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
                <Text style={{ color: "#E65100" }} className="text-xs font-bold mb-1">{c.nome}</Text>
                <Text className="text-xs text-muted mb-2">{c.desc}</Text>
                <Text className="text-xs text-muted">Props: {c.props.join(", ")}</Text>
              </View>
            ))}
          </View>
        )}

        {tab === 2 && (
          <View className="gap-4">
            <Text style={{ color: "#E65100" }} className="text-sm font-bold">🏛️ Organisms — Componentes Complexos</Text>
            {[
              { nome: "ScreenContainer", desc: "Wrapper de tela com SafeArea, background e scroll.", status: "Implementado" },
              { nome: "DiagnosisCard", desc: "Card de resultado de diagnóstico com foto, nome da praga, confiança e recomendações.", status: "Planejado" },
              { nome: "CultureFiche", desc: "Ficha técnica de cultura com abas: Clima, Solo, Pragas, Doenças, Calendário.", status: "Planejado" },
              { nome: "PropertyMap", desc: "Mapa interativo de propriedade com talhões e sensores IoT.", status: "Planejado" },
              { nome: "MenuSection", desc: "Seção do menu Mais com título, ícone e lista de itens navegáveis.", status: "Implementado" },
              { nome: "IndexCard", desc: "Card do Índice Geral com número da etapa, título, fase e link.", status: "Implementado" },
            ].map((c) => (
              <View key={c.nome} style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
                <View className="flex-row items-center gap-2 mb-1">
                  <Text style={{ color: "#E65100" }} className="text-xs font-bold flex-1">{c.nome}</Text>
                  <View style={{ backgroundColor: c.status === "Implementado" ? "#1B5E2020" : "#E6510020", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ color: c.status === "Implementado" ? "#1B5E20" : "#E65100" }} className="text-xs">{c.status}</Text>
                  </View>
                </View>
                <Text className="text-xs text-muted leading-relaxed">{c.desc}</Text>
              </View>
            ))}
          </View>
        )}

        {tab === 3 && (
          <View className="gap-4">
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#E65100" }} className="text-sm font-bold mb-3">📋 Padrões de Uso</Text>
              {[
                { t: "Pressable vs TouchableOpacity", d: "Use Pressable com style prop (nunca className). Use TouchableOpacity para compatibilidade com bibliotecas antigas." },
                { t: "ScrollView vs FlatList", d: "Use FlatList para listas longas (>20 itens). Use ScrollView apenas para conteúdo de tamanho fixo." },
                { t: "StyleSheet.create()", d: "Sempre defina estilos fora do componente para evitar recriação a cada render." },
                { t: "useColors() hook", d: "Use sempre para cores dinâmicas (light/dark mode). Nunca hardcode cores fora do design system." },
                { t: "cn() utility", d: "Use para combinar classes Tailwind condicionalmente: cn('base', isActive && 'active')." },
              ].map((p) => (
                <View key={p.t} style={{ borderBottomWidth: 1, borderBottomColor: colors.border }} className="py-3">
                  <Text style={{ color: "#E65100" }} className="text-xs font-bold mb-1">{p.t}</Text>
                  <Text className="text-xs text-muted leading-relaxed">{p.d}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {tab === 4 && (
          <View className="gap-4">
            <View style={{ backgroundColor: "#E6510015", borderWidth: 1, borderColor: "#E6510030" }} className="rounded-xl p-4">
              <Text style={{ color: "#E65100" }} className="text-sm font-bold mb-3">♿ Diretrizes de Acessibilidade</Text>
              {[
                { k: "Contraste mínimo", v: "4,5:1 para texto normal · 3:1 para texto grande" },
                { k: "Área de toque", v: "Mínimo 44×44px (Apple HIG)" },
                { k: "accessibilityLabel", v: "Obrigatório em ícones e botões sem texto" },
                { k: "accessibilityRole", v: "button, link, header, image, etc." },
                { k: "accessibilityHint", v: "Descreve o que acontece ao ativar o elemento" },
                { k: "Tamanho de fonte", v: "Mínimo 14px para texto de conteúdo" },
                { k: "Espaçamento de linha", v: "1,4–1,6× o tamanho da fonte" },
                { k: "Foco visível", v: "Indicador de foco visível para navegação por teclado (web)" },
              ].map((r) => (
                <View key={r.k} className="flex-row py-2" style={{ borderBottomWidth: 1, borderBottomColor: "#E6510020" }}>
                  <Text className="text-xs text-muted flex-1">{r.k}</Text>
                  <Text style={{ color: "#E65100" }} className="text-xs font-bold text-right w-48">{r.v}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        <AfuMvpFooter etapaNum={16} />
        <RelatedLinks links={RELATED_LINKS_MAP["/mais/guia-componentes"]} />
      </ScrollView>
    </ScreenContainer>
  );
}
