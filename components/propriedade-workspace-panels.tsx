/**
 * FASE 2N — painéis Documentos, Recursos e Configurações no workspace da propriedade.
 */
import { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ScreenState } from "@/components/screen-state";
import {
  PropriedadeEstoquePanel,
  PropriedadeMaquinasPanel,
} from "@/components/propriedade-expansao-panels";
import { buildPropertyEditHref } from "@/lib/propriedades/registrar-flow";
import { trpc } from "@/lib/trpc";
import { useTenantQueryScope } from "@/hooks/use-tenant-query-scope";

const TIPO_LABELS: Record<string, string> = {
  graos: "Grãos",
  hortifruti: "Hortifruti",
  fruticultura: "Fruticultura",
  cana: "Cana",
  cafe: "Café",
  pecuaria: "Pecuária",
  misto: "Misto",
  outro: "Outro",
};

type RecursosProps = {
  propriedadeId: number;
  readOnly?: boolean;
};

export function PropriedadeRecursosWorkspacePanel({ propriedadeId, readOnly }: RecursosProps) {
  const colors = useColors();
  const [section, setSection] = useState<"estoque" | "maquinas">("estoque");
  const styles = useMemo(
    () =>
      StyleSheet.create({
        seg: {
          flexDirection: "row",
          marginBottom: 14,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: "hidden",
        },
        segBtn: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center" },
      }),
    [colors.border],
  );

  return (
    <View>
      <View style={styles.seg} accessibilityRole="tablist">
        {(
          [
            { id: "estoque" as const, label: "Estoque e insumos" },
            { id: "maquinas" as const, label: "Máquinas" },
          ] as const
        ).map((s) => {
          const active = section === s.id;
          return (
            <TouchableOpacity
              key={s.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setSection(s.id)}
              style={[
                styles.segBtn,
                { backgroundColor: active ? colors.primary : colors.surface },
              ]}
            >
              <Text style={{ fontWeight: "700", color: active ? "#FFF" : colors.foreground, fontSize: 13 }}>
                {s.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {section === "estoque" ? (
        <PropriedadeEstoquePanel propriedadeId={propriedadeId} />
      ) : (
        <PropriedadeMaquinasPanel propriedadeId={propriedadeId} readOnly={readOnly} />
      )}
    </View>
  );
}

export function PropriedadeDocumentosWorkspacePanel() {
  const colors = useColors();
  const router = useRouter();
  const { cacheInput, tenantReady } = useTenantQueryScope();
  const { data = [], isLoading, isError, refetch } = trpc.secondaryData.relatorios.list.useQuery(
    cacheInput,
    { enabled: tenantReady },
  );

  if (isLoading) return <ScreenState status="loading" compact message="Carregando documentos…" />;
  if (isError) return <ScreenState status="error" compact onAction={() => void refetch()} />;

  return (
    <View>
      <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 12, lineHeight: 18 }}>
        Relatórios e laudos emitidos para a organização. Use o módulo global para detalhes e exportação.
      </Text>
      {data.length === 0 ? (
        <ScreenState
          status="empty"
          compact
          title="Nenhum documento"
          message="Os relatórios gerados aparecerão aqui."
          actionLabel="Abrir relatórios"
          onAction={() => router.push("/mais/relatorios" as any)}
        />
      ) : (
        data.slice(0, 20).map((r) => (
          <TouchableOpacity
            key={r.id}
            onPress={() => router.push("/mais/relatorios" as any)}
            accessibilityRole="button"
            accessibilityLabel={`Abrir relatório ${r.titulo}`}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 8,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <IconSymbol name="doc.fill" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "700", color: colors.foreground }} numberOfLines={1}>
                {r.titulo}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>
                {r.tipoRelatorio ?? "relatório"} · {r.status ?? "—"}
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={colors.muted} />
          </TouchableOpacity>
        ))
      )}
      <TouchableOpacity
        onPress={() => router.push("/mais/relatorios" as any)}
        accessibilityRole="link"
        style={{ marginTop: 8, minHeight: 44, justifyContent: "center" }}
      >
        <Text style={{ color: colors.primary, fontWeight: "700" }}>Ver todos os relatórios →</Text>
      </TouchableOpacity>
    </View>
  );
}

type ConfigProps = {
  propriedade: {
    id: number;
    nome: string;
    tipoProducao?: string | null;
    tipoSolo?: string | null;
    sistemaIrrigacao?: string | null;
    fonteAgua?: string | null;
    cidade?: string | null;
    estado?: string | null;
    createdAt?: Date | string | null;
  };
  localizacao: string;
  activeSafraId: number | null;
  tabForReturn: string;
};

export function PropriedadeConfiguracoesWorkspacePanel({
  propriedade,
  localizacao,
  activeSafraId,
  tabForReturn,
}: ConfigProps) {
  const colors = useColors();
  const router = useRouter();

  const rows = [
    { label: "Tipo de Produção", value: TIPO_LABELS[propriedade.tipoProducao ?? "outro"] ?? "—" },
    { label: "Tipo de Solo", value: propriedade.tipoSolo || "—" },
    { label: "Irrigação", value: propriedade.sistemaIrrigacao || "—" },
    { label: "Fonte de água", value: propriedade.fonteAgua || "—" },
    { label: "Localização", value: localizacao || "—" },
    {
      label: "Cadastrado em",
      value: propriedade.createdAt
        ? new Date(propriedade.createdAt).toLocaleDateString("pt-BR")
        : "—",
    },
  ];

  return (
    <View>
      <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 10 }}>
        Configurações da propriedade
      </Text>
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 14,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 12,
        }}
      >
        {rows.map((item, idx) => (
          <View
            key={item.label}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingVertical: 10,
              borderBottomWidth: idx < rows.length - 1 ? 1 : 0,
              borderBottomColor: colors.border,
              gap: 12,
            }}
          >
            <Text style={{ fontSize: 14, color: colors.muted }}>{item.label}</Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.foreground,
                fontWeight: "600",
                flexShrink: 1,
                textAlign: "right",
              }}
            >
              {item.value}
            </Text>
          </View>
        ))}
      </View>
      <TouchableOpacity
        onPress={() =>
          router.push(
            buildPropertyEditHref({
              propriedadeId: propriedade.id,
              tab: tabForReturn,
              safraId: activeSafraId,
            }) as any,
          )
        }
        accessibilityRole="button"
        accessibilityLabel="Editar cadastro da propriedade"
        style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 14,
          borderWidth: 1,
          borderColor: colors.border,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <IconSymbol name="pencil" size={20} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>Editar cadastro</Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>Nome, GPS, área e dados técnicos</Text>
        </View>
        <IconSymbol name="chevron.right" size={16} color={colors.muted} />
      </TouchableOpacity>
    </View>
  );
}
