/**
 * parceiros.tsx — Tela pública de Parceiros
 * Conectada ao banco real via tRPC: materiaisParceiros.parceiros.list
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
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader } from "@/components/screen-header";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { MODULE_COLORS } from "@/constants/module-colors";
import { trpc } from "@/lib/trpc";

type TipoParceiro = "laboratorio" | "cooperativa" | "consultoria" | "revendedor" | "instituicao" | "outro";

const TIPO_CONFIG: Record<TipoParceiro, { label: string; icon: string; color: string }> = {
  laboratorio: { label: "Laboratório",  icon: "flask.fill",        color: "#7C3AED" },
  cooperativa: { label: "Cooperativa",  icon: "building.2.fill",   color: "#166534" },
  consultoria: { label: "Consultoria",  icon: "person.fill",       color: "#1565C0" },
  revendedor:  { label: "Revendedor",   icon: "cart.fill",         color: "#D97706" },
  instituicao: { label: "Instituição",  icon: "graduationcap.fill",color: "#374151" },
  outro:       { label: "Outro",        icon: "circle.fill",       color: "#6B7280" },
};

export default function ParceirosScreen() {
  const colors = useColors();
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<TipoParceiro | undefined>();
  const [detalhe, setDetalhe] = useState<any | null>(null);

  const { data, isLoading, isError, refetch } = trpc.materiaisParceiros.parceiros.list.useQuery({
    busca: busca.trim() || undefined,
    tipo: filtroTipo,
    status: "ativo",
    limit: 200,
    offset: 0,
  });

  const parceiros = data?.items ?? [];
  const total = data?.total ?? 0;

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1,
      marginRight: 8,
    },
  });

  // ── Tela de detalhe ────────────────────────────────────────────────────────
  if (detalhe) {
    const cfg = TIPO_CONFIG[detalhe.tipo as TipoParceiro] ?? TIPO_CONFIG.outro;

    const abrirLink = (url: string) => {
      Linking.openURL(url).catch(() => Alert.alert("Erro", "Não foi possível abrir o link."));
    };

    const abrirEmail = (email: string) => {
      Linking.openURL(`mailto:${email}`).catch(() => Alert.alert("Erro", "Não foi possível abrir o e-mail."));
    };

    const abrirTelefone = (tel: string) => {
      Linking.openURL(`tel:${tel}`).catch(() => Alert.alert("Erro", "Não foi possível fazer a ligação."));
    };

    return (
      <ScreenContainer>
        <ScreenHeader
          title={detalhe.nome}
          subtitle={cfg.label}
          accentColor={cfg.color}
          onBack={() => setDetalhe(null)}
        />

        <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
          {/* Localização */}
          {(detalhe.cidade || detalhe.estado) && (
            <View style={[styles.card, { flexDirection: "row", alignItems: "center", gap: 10 }]}>
              <View style={{ backgroundColor: cfg.color + "20", borderRadius: 10, padding: 10 }}>
                <IconSymbol name={cfg.icon as any} size={22} color={cfg.color} />
              </View>
              <View>
                <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "600" }}>Localização</Text>
                <Text style={{ fontSize: 15, color: colors.foreground, fontWeight: "700" }}>
                  📍 {[detalhe.cidade, detalhe.estado].filter(Boolean).join(", ")}
                </Text>
              </View>
            </View>
          )}

          {/* Descrição */}
          {detalhe.descricao && (
            <View style={styles.card}>
              <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "700", textTransform: "uppercase", marginBottom: 8 }}>Sobre</Text>
              <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 22 }}>{detalhe.descricao}</Text>
            </View>
          )}

          {/* Serviços */}
          {detalhe.servicosOferecidos && (
            <View style={styles.card}>
              <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "700", textTransform: "uppercase", marginBottom: 8 }}>Serviços Oferecidos</Text>
              {detalhe.servicosOferecidos.split(",").map((s: string, i: number) => s.trim() && (
                <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 5 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: cfg.color }} />
                  <Text style={{ fontSize: 14, color: colors.foreground }}>{s.trim()}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Contato */}
          <View style={styles.card}>
            <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "700", textTransform: "uppercase", marginBottom: 12 }}>Contato</Text>
            {detalhe.email && (
              <TouchableOpacity onPress={() => abrirEmail(detalhe.email)}
                style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <View style={{ backgroundColor: "#DBEAFE", borderRadius: 8, padding: 8 }}>
                  <IconSymbol name="paperplane.fill" size={16} color="#2563EB" />
                </View>
                <View>
                  <Text style={{ fontSize: 11, color: colors.muted }}>E-mail</Text>
                  <Text style={{ fontSize: 14, color: "#2563EB", fontWeight: "600" }}>{detalhe.email}</Text>
                </View>
              </TouchableOpacity>
            )}
            {detalhe.telefone && (
              <TouchableOpacity onPress={() => abrirTelefone(detalhe.telefone)}
                style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <View style={{ backgroundColor: "#D1FAE5", borderRadius: 8, padding: 8 }}>
                  <IconSymbol name="iphone" size={16} color="#16A34A" />
                </View>
                <View>
                  <Text style={{ fontSize: 11, color: colors.muted }}>Telefone</Text>
                  <Text style={{ fontSize: 14, color: "#16A34A", fontWeight: "600" }}>{detalhe.telefone}</Text>
                </View>
              </TouchableOpacity>
            )}
            {detalhe.website && (
              <TouchableOpacity onPress={() => abrirLink(detalhe.website)}
                style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 }}>
                <View style={{ backgroundColor: "#EDE9FE", borderRadius: 8, padding: 8 }}>
                  <IconSymbol name="globe" size={16} color="#7C3AED" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: colors.muted }}>Website</Text>
                  <Text style={{ fontSize: 14, color: "#7C3AED", fontWeight: "600" }} numberOfLines={1}>{detalhe.website}</Text>
                </View>
              </TouchableOpacity>
            )}
            {!detalhe.email && !detalhe.telefone && !detalhe.website && (
              <Text style={{ color: colors.muted, fontSize: 13, textAlign: "center", paddingVertical: 8 }}>
                Nenhuma informação de contato cadastrada.
              </Text>
            )}
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ── Lista principal ────────────────────────────────────────────────────────
  return (
    <ScreenContainer>
      <ScreenHeader
        title="Parceiros"
        subtitle={isLoading ? "Carregando..." : `${total} parceiro${total !== 1 ? "s" : ""} ativo${total !== 1 ? "s" : ""}`}
        accentColor={MODULE_COLORS.materiais}
      />

      {/* Busca */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
        <TextInput
          value={busca}
          onChangeText={setBusca}
          placeholder="🔍 Buscar por nome, cidade ou serviços..."
          placeholderTextColor={colors.muted}
          style={{
            backgroundColor: colors.surface, borderRadius: 10, padding: 12,
            color: colors.foreground, borderWidth: 1, borderColor: colors.border, fontSize: 14,
          }}
          returnKeyType="search"
        />
      </View>

      {/* Filtros por tipo */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}>
        <TouchableOpacity
          style={[styles.chip, { backgroundColor: !filtroTipo ? "#8B5CF6" : colors.surface, borderColor: !filtroTipo ? "#8B5CF6" : colors.border }]}
          onPress={() => setFiltroTipo(undefined)}
        >
          <Text style={{ fontSize: 12, fontWeight: "600", color: !filtroTipo ? "#FFF" : colors.foreground }}>Todos</Text>
        </TouchableOpacity>
        {(Object.keys(TIPO_CONFIG) as TipoParceiro[]).map((t) => {
          const cfg = TIPO_CONFIG[t];
          const ativo = filtroTipo === t;
          return (
            <TouchableOpacity key={t}
              style={[styles.chip, { backgroundColor: ativo ? cfg.color : colors.surface, borderColor: ativo ? cfg.color : colors.border }]}
              onPress={() => setFiltroTipo(ativo ? undefined : t)}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: ativo ? "#FFF" : colors.foreground }}>{cfg.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Estado de carregamento */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={{ color: colors.muted, marginTop: 12, fontSize: 14 }}>Carregando parceiros...</Text>
        </View>
      ) : isError ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <Text style={{ fontSize: 40 }}>⚠️</Text>
          <Text style={{ color: colors.muted, marginTop: 12, textAlign: "center", fontSize: 14 }}>
            Não foi possível carregar os parceiros.{"\n"}Verifique sua conexão.
          </Text>
          <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 16, backgroundColor: "#8B5CF6", borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 }}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={parceiros}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const cfg = TIPO_CONFIG[item.tipo as TipoParceiro] ?? TIPO_CONFIG.outro;
            return (
              <TouchableOpacity style={styles.card} onPress={() => setDetalhe(item)}>
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                  <View style={{ backgroundColor: cfg.color + "20", borderRadius: 12, padding: 10 }}>
                    <IconSymbol name={cfg.icon as any} size={22} color={cfg.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>{item.nome}</Text>
                    <Text style={{ fontSize: 12, color: colors.muted, marginTop: 3 }}>
                      {cfg.label}{(item.cidade || item.estado) ? ` • ${[item.cidade, item.estado].filter(Boolean).join("/")}` : ""}
                    </Text>
                    {item.servicosOferecidos && (
                      <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }} numberOfLines={1}>
                        {item.servicosOferecidos}
                      </Text>
                    )}
                    <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
                      {item.email && <Text style={{ fontSize: 11, color: "#2563EB" }}>✉️ E-mail</Text>}
                      {item.telefone && <Text style={{ fontSize: 11, color: "#16A34A" }}>📞 Telefone</Text>}
                      {item.website && <Text style={{ fontSize: 11, color: "#7C3AED" }}>🌐 Site</Text>}
                    </View>
                  </View>
                  <View style={{ backgroundColor: "#dcfce7", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: "#16a34a" }}>Ativo</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", padding: 40 }}>
              <Text style={{ fontSize: 40 }}>🤝</Text>
              <Text style={{ fontSize: 16, color: colors.muted, marginTop: 12, textAlign: "center" }}>
                {busca || filtroTipo
                  ? "Nenhum parceiro encontrado com esses filtros."
                  : "Nenhum parceiro cadastrado ainda.\nO administrador pode adicionar parceiros no Painel Admin."}
              </Text>
              {(busca || filtroTipo) && (
                <TouchableOpacity onPress={() => { setBusca(""); setFiltroTipo(undefined); }}
                  style={{ marginTop: 12, backgroundColor: "#8B5CF6", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 }}>
                  <Text style={{ color: "#fff", fontWeight: "600" }}>Limpar filtros</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}
