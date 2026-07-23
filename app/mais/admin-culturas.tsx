/**
 * admin-culturas.tsx — Gestão Admin de Culturas
 *
 * Tela exclusiva para administradores:
 * - Listar culturas com filtros (busca, status)
 * - Criar nova cultura
 * - Editar cultura existente
 * - Excluir cultura
 * - Ver estatísticas
 */
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { RouteGuard } from "@/components/route-guard";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";

const STATUS_OPTIONS = [
  { value: "em_andamento", label: "Em Andamento", color: "#22C55E" },
  { value: "planejado", label: "Planejado", color: "#3B82F6" },
  { value: "colhido", label: "Colhido", color: "#F59E0B" },
  { value: "perdido", label: "Perdido", color: "#EF4444" },
] as const;

type StatusCultura = "planejado" | "em_andamento" | "colhido" | "perdido";

type FormData = {
  propriedadeId: string;
  terrenoId: string;
  nomeCultura: string;
  variedade: string;
  dataPlantio: string;
  faseAtual: string;
  areaPlantada: string;
  previsaoColheita: string;
  producaoEstimada: string;
  unidadeProducao: string;
  status: StatusCultura;
  observacoes: string;
};

const FORM_VAZIO: FormData = {
  propriedadeId: "1",
  terrenoId: "",
  nomeCultura: "",
  variedade: "",
  dataPlantio: "",
  faseAtual: "",
  areaPlantada: "",
  previsaoColheita: "",
  producaoEstimada: "",
  unidadeProducao: "ton/ha",
  status: "em_andamento",
  observacoes: "",
};

export default function AdminCulturas() {
  return (
    <RouteGuard requireAdmin>
      <AdminCulturasContent />
    </RouteGuard>
  );
}

function AdminCulturasContent() {
  const colors = useColors();
  const router = useRouter();
  const utils = trpc.useUtils();

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<StatusCultura | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(FORM_VAZIO);

  const { data, isLoading, refetch } = trpc.culturasPragas.culturas.list.useQuery({
    busca: busca || undefined,
    status: filtroStatus,
    limit: 100,
    offset: 0,
  });

  const { data: stats } = trpc.culturasPragas.culturas.stats.useQuery();

  const createMutation = trpc.culturasPragas.culturas.create.useMutation({
    onSuccess: () => {
      utils.culturasPragas.culturas.list.invalidate();
      utils.culturasPragas.culturas.stats.invalidate();
      setModalVisible(false);
      setForm(FORM_VAZIO);
      Alert.alert("✅ Sucesso", "Cultura criada com sucesso!");
    },
    onError: (e) => Alert.alert("Erro", e.message),
  });

  const updateMutation = trpc.culturasPragas.culturas.update.useMutation({
    onSuccess: () => {
      utils.culturasPragas.culturas.list.invalidate();
      setModalVisible(false);
      setEditandoId(null);
      setForm(FORM_VAZIO);
      Alert.alert("✅ Sucesso", "Cultura atualizada!");
    },
    onError: (e) => Alert.alert("Erro", e.message),
  });

  const deleteMutation = trpc.culturasPragas.culturas.delete.useMutation({
    onSuccess: () => {
      utils.culturasPragas.culturas.list.invalidate();
      utils.culturasPragas.culturas.stats.invalidate();
    },
    onError: (e) => Alert.alert("Erro", e.message),
  });

  function abrirCriar() {
    setEditandoId(null);
    setForm(FORM_VAZIO);
    setModalVisible(true);
  }

  function abrirEditar(item: any) {
    setEditandoId(item.id);
    setForm({
      propriedadeId: String(item.propriedadeId),
      terrenoId: item.terrenoId != null ? String(item.terrenoId) : "",
      nomeCultura: item.nomeCultura ?? "",
      variedade: item.variedade ?? "",
      dataPlantio: item.dataPlantio ? String(item.dataPlantio).split("T")[0] : "",
      faseAtual: item.faseAtual ?? "",
      areaPlantada: item.areaPlantada ?? "",
      previsaoColheita: item.previsaoColheita ? String(item.previsaoColheita).split("T")[0] : "",
      producaoEstimada: item.producaoEstimada ?? "",
      unidadeProducao: item.unidadeProducao ?? "ton/ha",
      status: item.status ?? "em_andamento",
      observacoes: item.observacoes ?? "",
    });
    setModalVisible(true);
  }

  function confirmarDelete(id: number, nome: string) {
    Alert.alert(
      "Excluir Cultura",
      `Deseja excluir "${nome}"? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => deleteMutation.mutate({ id }),
        },
      ],
    );
  }

  function salvar() {
    if (!form.nomeCultura.trim()) {
      Alert.alert("Atenção", "O nome da cultura é obrigatório.");
      return;
    }
    const terrenoId = parseInt(form.terrenoId, 10);
    if (!editandoId && (!Number.isFinite(terrenoId) || terrenoId <= 0)) {
      Alert.alert("Atenção", "Informe o ID do talhão (terrenoId).");
      return;
    }
    const payload = {
      propriedadeId: parseInt(form.propriedadeId) || 1,
      ...(Number.isFinite(terrenoId) && terrenoId > 0 ? { terrenoId } : {}),
      nomeCultura: form.nomeCultura.trim(),
      variedade: form.variedade || null,
      dataPlantio: form.dataPlantio || null,
      faseAtual: form.faseAtual || null,
      areaPlantada: form.areaPlantada || null,
      previsaoColheita: form.previsaoColheita || null,
      producaoEstimada: form.producaoEstimada || null,
      unidadeProducao: form.unidadeProducao || null,
      status: form.status,
      observacoes: form.observacoes || null,
    };

    if (editandoId) {
      updateMutation.mutate({ id: editandoId, ...payload });
    } else {
      createMutation.mutate({ ...payload, terrenoId });
    }
  }

  const statusAtual = STATUS_OPTIONS.find((s) => s.value === filtroStatus);
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ backgroundColor: "#166534", paddingHorizontal: 16, paddingVertical: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Text style={{ color: "#fff", fontSize: 18 }}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>🌱 Gestão de Culturas</Text>
            <Text style={{ color: "#bbf7d0", fontSize: 12 }}>Painel Administrativo</Text>
          </View>
          <TouchableOpacity
            onPress={abrirCriar}
            style={{ backgroundColor: "#22C55E", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>+ Nova</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
        {/* Stats */}
        {stats && (
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            {[
              { label: "Total", value: stats.total, color: "#6B7280" },
              { label: "Ativas", value: stats.emAndamento, color: "#22C55E" },
              { label: "Planejadas", value: stats.planejadas, color: "#3B82F6" },
              { label: "Colhidas", value: stats.colhidas, color: "#F59E0B" },
            ].map((s) => (
              <View
                key={s.label}
                style={{
                  flex: 1,
                  minWidth: 70,
                  backgroundColor: colors.surface,
                  borderRadius: 10,
                  padding: 10,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 20, fontWeight: "800", color: s.color }}>{s.value}</Text>
                <Text style={{ fontSize: 11, color: colors.muted }}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Busca */}
        <TextInput
          value={busca}
          onChangeText={setBusca}
          placeholder="🔍 Buscar por nome, variedade ou fase..."
          placeholderTextColor={colors.muted}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 10,
            padding: 12,
            color: colors.foreground,
            borderWidth: 1,
            borderColor: colors.border,
            fontSize: 14,
          }}
        />

        {/* Filtro de status */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={() => setFiltroStatus(undefined)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: !filtroStatus ? "#166534" : colors.surface,
                borderWidth: 1,
                borderColor: !filtroStatus ? "#166534" : colors.border,
              }}
            >
              <Text style={{ color: !filtroStatus ? "#fff" : colors.muted, fontSize: 12, fontWeight: "600" }}>
                Todos
              </Text>
            </TouchableOpacity>
            {STATUS_OPTIONS.map((s) => (
              <TouchableOpacity
                key={s.value}
                onPress={() => setFiltroStatus(filtroStatus === s.value ? undefined : s.value)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: filtroStatus === s.value ? s.color : colors.surface,
                  borderWidth: 1,
                  borderColor: filtroStatus === s.value ? s.color : colors.border,
                }}
              >
                <Text style={{ color: filtroStatus === s.value ? "#fff" : colors.muted, fontSize: 12, fontWeight: "600" }}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Lista */}
        {isLoading ? (
          <ActivityIndicator size="large" color="#166534" style={{ marginTop: 32 }} />
        ) : (data?.items?.length ?? 0) === 0 ? (
          <View style={{ alignItems: "center", padding: 32 }}>
            <Text style={{ fontSize: 40 }}>🌱</Text>
            <Text style={{ color: colors.muted, marginTop: 8, textAlign: "center" }}>
              Nenhuma cultura encontrada.{"\n"}Toque em "+ Nova" para adicionar.
            </Text>
          </View>
        ) : (
          data?.items?.map((item) => {
            const statusOpt = STATUS_OPTIONS.find((s) => s.value === item.status);
            return (
              <View
                key={item.id}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderLeftWidth: 4,
                  borderLeftColor: statusOpt?.color ?? "#6B7280",
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "700", fontSize: 15, color: colors.foreground }}>
                      {item.nomeCultura}
                    </Text>
                    {item.variedade ? (
                      <Text style={{ color: colors.muted, fontSize: 12 }}>{item.variedade}</Text>
                    ) : null}
                    <View style={{ flexDirection: "row", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                      <View style={{ backgroundColor: statusOpt?.color + "22", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Text style={{ color: statusOpt?.color, fontSize: 11, fontWeight: "600" }}>
                          {statusOpt?.label}
                        </Text>
                      </View>
                      {item.faseAtual ? (
                        <View style={{ backgroundColor: colors.border, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                          <Text style={{ color: colors.muted, fontSize: 11 }}>{item.faseAtual}</Text>
                        </View>
                      ) : null}
                      {item.areaPlantada ? (
                        <View style={{ backgroundColor: colors.border, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                          <Text style={{ color: colors.muted, fontSize: 11 }}>{item.areaPlantada} ha</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", gap: 8, marginLeft: 8 }}>
                    <TouchableOpacity
                      onPress={() => abrirEditar(item)}
                      style={{ backgroundColor: "#3B82F6" + "22", borderRadius: 8, padding: 8 }}
                    >
                      <Text style={{ fontSize: 16 }}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => confirmarDelete(item.id, item.nomeCultura)}
                      style={{ backgroundColor: "#EF4444" + "22", borderRadius: 8, padding: 8 }}
                    >
                      <Text style={{ fontSize: 16 }}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Modal de criação/edição */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ backgroundColor: "#166534", padding: 16, flexDirection: "row", alignItems: "center" }}>
            <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700", flex: 1 }}>
              {editandoId ? "✏️ Editar Cultura" : "🌱 Nova Cultura"}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={{ color: "#bbf7d0", fontSize: 16 }}>✕ Fechar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
            {[
              { label: "Nome da Cultura *", key: "nomeCultura", placeholder: "Ex: Soja, Milho, Café..." },
              { label: "Variedade / Cultivar", key: "variedade", placeholder: "Ex: TMG 7062 IPRO" },
              { label: "Fase Atual", key: "faseAtual", placeholder: "Ex: Floração, Enchimento de grãos..." },
              { label: "Área Plantada (ha)", key: "areaPlantada", placeholder: "Ex: 120.5" },
              { label: "Data de Plantio (AAAA-MM-DD)", key: "dataPlantio", placeholder: "Ex: 2025-10-15" },
              { label: "Previsão de Colheita (AAAA-MM-DD)", key: "previsaoColheita", placeholder: "Ex: 2026-03-20" },
              { label: "Produção Estimada", key: "producaoEstimada", placeholder: "Ex: 3600" },
              { label: "Unidade de Produção", key: "unidadeProducao", placeholder: "Ex: ton/ha, sacas/ha" },
              { label: "ID da Propriedade", key: "propriedadeId", placeholder: "Ex: 1" },
              { label: "ID do Talhão *", key: "terrenoId", placeholder: "Ex: 1" },
              { label: "Observações", key: "observacoes", placeholder: "Informações adicionais..." },
            ].map(({ label, key, placeholder }) => (
              <View key={key}>
                <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 4, fontWeight: "600" }}>{label}</Text>
                <TextInput
                  value={form[key as keyof FormData]}
                  onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
                  placeholder={placeholder}
                  placeholderTextColor={colors.muted}
                  multiline={key === "observacoes"}
                  numberOfLines={key === "observacoes" ? 3 : 1}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 10,
                    padding: 12,
                    color: colors.foreground,
                    borderWidth: 1,
                    borderColor: colors.border,
                    fontSize: 14,
                    minHeight: key === "observacoes" ? 80 : undefined,
                    textAlignVertical: key === "observacoes" ? "top" : "center",
                  }}
                />
              </View>
            ))}

            {/* Status */}
            <View>
              <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 8, fontWeight: "600" }}>Status</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {STATUS_OPTIONS.map((s) => (
                  <TouchableOpacity
                    key={s.value}
                    onPress={() => setForm((f) => ({ ...f, status: s.value }))}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 10,
                      backgroundColor: form.status === s.value ? s.color : colors.surface,
                      borderWidth: 1,
                      borderColor: form.status === s.value ? s.color : colors.border,
                    }}
                  >
                    <Text style={{ color: form.status === s.value ? "#fff" : colors.muted, fontWeight: "600", fontSize: 13 }}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              onPress={salvar}
              disabled={isSaving}
              style={{
                backgroundColor: isSaving ? colors.muted : "#166534",
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
                marginTop: 8,
              }}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                  {editandoId ? "Salvar Alterações" : "Criar Cultura"}
                </Text>
              )}
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
