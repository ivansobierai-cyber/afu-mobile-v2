import { View, Text, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ScreenState } from "@/components/screen-state";
import { trpc } from "@/lib/trpc";

type Props = {
  culturaId: number;
  propriedadeId: number;
  nomeCultura: string;
};

/** Aba Arquivos — fotos/documentos do cultivo (finalização V2). */
export function CultivoArquivosTab({ culturaId, propriedadeId, nomeCultura }: Props) {
  const colors = useColors();
  const router = useRouter();
  const { data, isLoading, isError, refetch } = trpc.coreData.cultivos.arquivos.useQuery({
    id: culturaId,
  });

  if (isLoading) {
    return <ScreenState status="loading" compact message="Carregando arquivos…" />;
  }
  if (isError) {
    return (
      <ScreenState
        status="error"
        compact
        message="Falha ao carregar arquivos."
        onAction={() => void refetch()}
      />
    );
  }

  const items = data?.items ?? [];

  return (
    <View>
      <TouchableOpacity
        style={[styles.cta, { backgroundColor: colors.primary }]}
        onPress={() =>
          router.push({
            pathname: "/(tabs)/diagnostico",
            params: {
              propriedadeId: String(propriedadeId),
              culturaId: String(culturaId),
              culturaNome: nomeCultura,
            },
          } as any)
        }
        accessibilityRole="button"
        accessibilityLabel="Adicionar foto via diagnóstico"
      >
        <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 14 }}>
          Adicionar foto (diagnóstico IA)
        </Text>
      </TouchableOpacity>

      {items.length === 0 ? (
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
            Nenhum arquivo
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 6 }}>
            Fotos e documentos de diagnósticos vinculados a este cultivo aparecerão aqui.
          </Text>
        </View>
      ) : (
        items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => {
              if (item.url) void Linking.openURL(item.url);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Abrir ${item.titulo}`}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <IconSymbol
                name={item.categoria === "diagnostico" || item.origem === "diagnostico_imagem" ? "photo.fill" : "doc.fill"}
                size={22}
                color={colors.primary}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
                  {item.titulo}
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                  {item.categoria}
                  {item.createdAt
                    ? ` · ${new Date(item.createdAt).toLocaleString("pt-BR")}`
                    : ""}
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={18} color={colors.muted} />
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cta: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
});
