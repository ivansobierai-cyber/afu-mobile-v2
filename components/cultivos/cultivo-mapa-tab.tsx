import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { PropertyMap } from "@/components/property-map";
import { trpc } from "@/lib/trpc";

type Props = {
  culturaId: number;
};

/** Aba Mapa do workspace do cultivo (Etapa 6). */
export function CultivoMapaTab({ culturaId }: Props) {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const { data, isLoading, isError, refetch } = trpc.coreData.cultivos.mapa.useQuery({
    id: culturaId,
  });

  if (isLoading) {
    return <Text style={{ color: colors.muted }}>Carregando mapa…</Text>;
  }
  if (isError || !data) {
    return (
      <Text style={{ color: colors.muted }} onPress={() => void refetch()}>
        Não foi possível carregar o mapa. Toque para tentar de novo.
      </Text>
    );
  }

  const centerMarkers =
    data.propriedadeCenter != null
      ? [
          {
            id: "prop-center",
            latitude: data.propriedadeCenter.latitude,
            longitude: data.propriedadeCenter.longitude,
            title: data.propriedadeNome ?? "Propriedade",
            description: data.terrenoNome
              ? `Talhão: ${data.terrenoNome}`
              : "Centro da propriedade",
          },
        ]
      : [];

  const markers = [...centerMarkers, ...data.markers];
  const hasMap = markers.length > 0 || data.polygons.length > 0;

  return (
    <View>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
          Mapa do cultivo
        </Text>
        <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
          {data.terrenoNome
            ? `Talhão: ${data.terrenoNome}`
            : "Sem talhão com geometria — exibindo propriedade se disponível."}
        </Text>
        <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
          {data.markers.length} ocorrência(s) com coordenadas · {data.polygons.length}{" "}
          polígono(s)
        </Text>
      </View>

      {hasMap ? (
        <PropertyMap
          markers={markers}
          polygons={data.polygons}
          height={isWide ? 360 : 260}
        />
      ) : (
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 12 },
          ]}
        >
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
            Sem geometria
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 6 }}>
            Cadastre GPS/perímetro na propriedade ou geometria do talhão, e registre
            ocorrências com latitude/longitude para ver pins aqui.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
});
