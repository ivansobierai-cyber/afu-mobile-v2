/**
 * materiais.tsx — Tela pública de Materiais Didáticos
 * Conectada ao banco real via tRPC: materiaisParceiros.materiais.list
 */
import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader } from "@/components/screen-header";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { MODULE_COLORS } from "@/constants/module-colors";
import { trpc } from "@/lib/trpc";

type TipoFiltro = "todos" | "video" | "audio" | "apostila" | "guia" | "checklist" | "infografico";

const TIPO_CONFIG: Record<TipoFiltro, { label: string; icon: string; color: string; bg: string }> = {
  todos:       { label: "Todos",      icon: "list.bullet",           color: "#6B7280", bg: "#F3F4F6" },
  video:       { label: "Vídeos",     icon: "photo.fill",            color: "#EF4444", bg: "#FEE2E2" },
  audio:       { label: "Áudios",     icon: "waveform.path.ecg",     color: "#8B5CF6", bg: "#EDE9FE" },
  apostila:    { label: "Apostilas",  icon: "doc.text.fill",         color: "#2563EB", bg: "#DBEAFE" },
  guia:        { label: "Guias",      icon: "doc.fill",              color: "#D97706", bg: "#FEF3C7" },
  checklist:   { label: "Checklists", icon: "checkmark.circle.fill", color: "#16A34A", bg: "#D1FAE5" },
  infografico: { label: "Infográficos",icon: "chart.bar.fill",       color: "#06B6D4", bg: "#CFFAFE" },
};

const NIVEL_CONFIG: Record<string, { label: string; color: string }> = {
  iniciante:     { label: "Iniciante",     color: "#16A34A" },
  intermediario: { label: "Intermediário", color: "#D97706" },
  avancado:      { label: "Avançado",      color: "#EF4444" },
};

const PUBLICO_CONFIG: Record<string, { label: string; color: string }> = {
  todos:    { label: "Todos",    color: "#6B7280" },
  produtor: { label: "Produtor", color: "#166534" },
  tecnico:  { label: "Técnico",  color: "#1565C0" },
};

export default function MateriaisScreen() {
  const colors = useColors();
  const router = useRouter();
  const [filtroTipo, setFiltroTipo] = useState<TipoFiltro>("todos");
  const [detalhe, setDetalhe] = useState<any | null>(null);

  const { data, isLoading, isError, refetch } = trpc.materiaisParceiros.materiais.list.useQuery({
    tipo: filtroTipo === "todos" ? undefined : filtroTipo as any,
    status: "ativo",
    limit: 200,
    offset: 0,
  });

  const materiais = data?.items ?? [];
  const total = data?.total ?? 0;

  const styles = StyleSheet.create({
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 8,
      borderWidth: 1.5,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
  });

  // ── Tela de detalhe ────────────────────────────────────────────────────────
  if (detalhe) {
    const cfg = TIPO_CONFIG[detalhe.tipoMaterial as TipoFiltro] ?? TIPO_CONFIG.todos;
    const nivelCfg = NIVEL_CONFIG[detalhe.nivel] ?? NIVEL_CONFIG.iniciante;
    const publicoCfg = PUBLICO_CONFIG[detalhe.publicoAlvo] ?? PUBLICO_CONFIG.todos;

    const abrirLink = (url: string) => {
      Linking.openURL(url).catch(() => Alert.alert("Erro", "Não foi possível abrir o link."));
    };

    return (
      <ScreenContainer>
        <ScreenHeader
          title={detalhe.titulo}
          subtitle={cfg.label}
          accentColor={cfg.color}
          onBack={() => setDetalhe(null)}
        />

        <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
          {/* Badges */}
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <View style={{ backgroundColor: cfg.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: cfg.color, fontWeight: "700", fontSize: 12 }}>{cfg.label}</Text>
            </View>
            <View style={{ backgroundColor: nivelCfg.color + "20", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: nivelCfg.color, fontWeight: "700", fontSize: 12 }}>{nivelCfg.label}</Text>
            </View>
            <View style={{ backgroundColor: publicoCfg.color + "20", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: publicoCfg.color, fontWeight: "700", fontSize: 12 }}>Para: {publicoCfg.label}</Text>
            </View>
            {detalhe.idioma && (
              <View style={{ backgroundColor: colors.surface, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ color: colors.muted, fontWeight: "600", fontSize: 12 }}>🌐 {detalhe.idioma}</Text>
              </View>
            )}
          </View>

          {/* Tema */}
          {detalhe.tema && (
            <View style={styles.card}>
              <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "700", textTransform: "uppercase", marginBottom: 4 }}>Tema</Text>
              <Text style={{ fontSize: 15, color: colors.foreground, fontWeight: "600" }}>🏷️ {detalhe.tema}</Text>
            </View>
          )}

          {/* Descrição */}
          {detalhe.descricao && (
            <View style={styles.card}>
              <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "700", textTransform: "uppercase", marginBottom: 8 }}>Sobre este material</Text>
              <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 22 }}>{detalhe.descricao}</Text>
            </View>
          )}

          {/* Links */}
          {(detalhe.videoUrl || detalhe.arquivoUrl) && (
            <View style={styles.card}>
              <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "700", textTransform: "uppercase", marginBottom: 12 }}>Acessar Conteúdo</Text>
              {detalhe.videoUrl && (
                <TouchableOpacity
                  onPress={() => abrirLink(detalhe.videoUrl)}
                  style={{ backgroundColor: "#EF4444", borderRadius: 10, padding: 14, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}
                >
                  <IconSymbol name="photo.fill" size={20} color="#fff" />
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>Assistir Vídeo</Text>
                </TouchableOpacity>
              )}
              {detalhe.arquivoUrl && (
                <TouchableOpacity
                  onPress={() => abrirLink(detalhe.arquivoUrl)}
                  style={{ backgroundColor: "#2563EB", borderRadius: 10, padding: 14, flexDirection: "row", alignItems: "center", gap: 10 }}
                >
                  <IconSymbol name="doc.text.fill" size={20} color="#fff" />
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>Baixar Arquivo</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Sem links */}
          {!detalhe.videoUrl && !detalhe.arquivoUrl && (
            <View style={[styles.card, { alignItems: "center", padding: 24 }]}>
              <Text style={{ fontSize: 32 }}>📋</Text>
              <Text style={{ color: colors.muted, marginTop: 8, textAlign: "center", fontSize: 13 }}>
                O link de acesso para este material ainda não foi cadastrado.{"\n"}Entre em contato com o suporte.
              </Text>
            </View>
          )}
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ── Lista principal ────────────────────────────────────────────────────────
  return (
    <ScreenContainer>
      <ScreenHeader
        title="Materiais"
        subtitle={isLoading ? "Carregando..." : `${total} conteúdo${total !== 1 ? "s" : ""} disponível${total !== 1 ? "is" : ""}`}
        accentColor={MODULE_COLORS.materiais}
      />

      {/* Filtros */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16, paddingVertical: 14, maxHeight: 60 }}>
        {(Object.keys(TIPO_CONFIG) as TipoFiltro[]).map((tipo) => {
          const cfg = TIPO_CONFIG[tipo];
          const ativo = filtroTipo === tipo;
          return (
            <TouchableOpacity
              key={tipo}
              style={[styles.filterChip, {
                backgroundColor: ativo ? colors.primary : colors.surface,
                borderColor: ativo ? colors.primary : colors.border,
              }]}
              onPress={() => setFiltroTipo(tipo)}
            >
              <IconSymbol name={cfg.icon as any} size={14} color={ativo ? "#FFFFFF" : colors.muted} />
              <Text style={{ fontSize: 13, fontWeight: "600", color: ativo ? "#FFFFFF" : colors.foreground }}>{cfg.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Estado de carregamento */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.muted, marginTop: 12, fontSize: 14 }}>Carregando materiais...</Text>
        </View>
      ) : isError ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <Text style={{ fontSize: 40 }}>⚠️</Text>
          <Text style={{ color: colors.muted, marginTop: 12, textAlign: "center", fontSize: 14 }}>
            Não foi possível carregar os materiais.{"\n"}Verifique sua conexão.
          </Text>
          <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 16, backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 }}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={materiais}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          renderItem={({ item }) => {
            const cfg = TIPO_CONFIG[item.tipoMaterial as TipoFiltro] ?? TIPO_CONFIG.todos;
            const nivelCfg = NIVEL_CONFIG[item.nivel ?? "iniciante"] ?? NIVEL_CONFIG.iniciante;
            const temLink = !!(item.videoUrl || item.arquivoUrl);
            return (
              <TouchableOpacity style={styles.card} onPress={() => setDetalhe(item)}>
                <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
                  {/* Ícone do tipo */}
                  <View style={{ backgroundColor: cfg.bg, borderRadius: 12, padding: 12, alignItems: "center", justifyContent: "center" }}>
                    <IconSymbol name={cfg.icon as any} size={22} color={cfg.color} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <View style={{ backgroundColor: cfg.bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Text style={{ fontSize: 11, fontWeight: "700", color: cfg.color }}>{cfg.label}</Text>
                      </View>
                      <View style={{ backgroundColor: nivelCfg.color + "20", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Text style={{ fontSize: 11, fontWeight: "700", color: nivelCfg.color }}>{nivelCfg.label}</Text>
                      </View>
                      {temLink && (
                        <View style={{ backgroundColor: "#D1FAE5", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                          <Text style={{ fontSize: 11, fontWeight: "700", color: "#16A34A" }}>✓ Disponível</Text>
                        </View>
                      )}
                    </View>

                    <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, lineHeight: 22 }}>{item.titulo}</Text>
                    {item.tema && (
                      <Text style={{ fontSize: 12, color: colors.primary, marginTop: 2, fontWeight: "600" }}>🏷️ {item.tema}</Text>
                    )}
                    {item.descricao && (
                      <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4, lineHeight: 18 }} numberOfLines={2}>{item.descricao}</Text>
                    )}

                    <View style={{ flexDirection: "row", gap: 12, marginTop: 8, alignItems: "center" }}>
                      {item.publicoAlvo && item.publicoAlvo !== "todos" && (
                        <View style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
                          <IconSymbol name="person.fill" size={12} color={colors.muted} />
                          <Text style={{ fontSize: 12, color: colors.muted }}>{PUBLICO_CONFIG[item.publicoAlvo]?.label}</Text>
                        </View>
                      )}
                      {item.idioma && item.idioma !== "pt-BR" && (
                        <View style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
                          <Text style={{ fontSize: 12, color: colors.muted }}>🌐 {item.idioma}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <IconSymbol name="chevron.right" size={16} color={colors.muted} />
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingVertical: 60 }}>
              <IconSymbol name="doc.text.fill" size={48} color={colors.border} />
              <Text style={{ fontSize: 16, color: colors.muted, marginTop: 12, textAlign: "center" }}>
                {filtroTipo === "todos"
                  ? "Nenhum material cadastrado ainda.\nO administrador pode adicionar conteúdos no Painel Admin."
                  : `Nenhum material do tipo "${TIPO_CONFIG[filtroTipo].label}" encontrado.`}
              </Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}
