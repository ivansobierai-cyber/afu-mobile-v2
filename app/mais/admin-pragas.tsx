/**
 * admin-pragas.tsx — Gestão Admin de Pragas e Doenças
 *
 * Tela exclusiva para administradores:
 * - Listar pragas/doenças com filtros (busca, tipo, nível de risco)
 * - Criar nova entrada no banco de conhecimento
 * - Editar entrada existente
 * - Excluir entrada
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
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { RouteGuard } from "@/components/route-guard";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";

const TIPO_OPTIONS = [
  { value: "praga", label: "🐛 Praga", color: "#F59E0B" },
  { value: "doenca", label: "🦠 Doença", color: "#EF4444" },
  { value: "deficiencia", label: "🌿 Deficiência", color: "#8B5CF6" },
] as const;

const RISCO_OPTIONS = [
  { value: "baixo", label: "Baixo", color: "#22C55E" },
  { value: "medio", label: "Médio", color: "#F59E0B" },
  { value: "alto", label: "Alto", color: "#EF4444" },
  { value: "critico", label: "Crítico", color: "#7F1D1D" },
] as const;

type TipoPraga = "praga" | "doenca" | "deficiencia";
type NivelRisco = "baixo" | "medio" | "alto" | "critico";

type FormData = {
  nome: string;
  nomeCientifico: string;
  tipo: TipoPraga;
  culturaAfetada: string;
  sintomas: string;
  causas: string;
  tratamento: string;
  prevencao: string;
  nivelRisco: NivelRisco;
};

const FORM_VAZIO: FormData = {
  nome: "",
  nomeCientifico: "",
  tipo: "praga",
  culturaAfetada: "",
  sintomas: "",
  causas: "",
  tratamento: "",
  prevencao: "",
  nivelRisco: "medio",
};

export default function AdminPragas() {
  return (
    <RouteGuard requireAdmin>
      <AdminPragasContent />
    </RouteGuard>
  );
}

function AdminPragasContent() {
  const colors = useColors();
  const router = useRouter();
  const utils = trpc.useUtils();

  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<TipoPraga | undefined>();
  const [filtroRisco, setFiltroRisco] = useState<NivelRisco | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(FORM_VAZIO);

  const { data, isLoading } = trpc.culturasPragas.pragas.list.useQuery({
    busca: busca || undefined,
    tipo: filtroTipo,
    nivelRisco: filtroRisco,
    limit: 100,
    offset: 0,
  });

  const { data: stats } = trpc.culturasPragas.pragas.stats.useQuery();

  const createMutation = trpc.culturasPragas.pragas.create.useMutation({
    onSuccess: () => {
      utils.culturasPragas.pragas.list.invalidate();
      utils.culturasPragas.pragas.stats.invalidate();
      setModalVisible(false);
      setForm(FORM_VAZIO);
      Alert.alert("✅ Sucesso", "Registro criado com sucesso!");
    },
    onError: (e) => Alert.alert("Erro", e.message),
  });

  const updateMutation = trpc.culturasPragas.pragas.update.useMutation({
    onSuccess: () => {
      utils.culturasPragas.pragas.list.invalidate();
      setModalVisible(false);
      setEditandoId(null);
      setForm(FORM_VAZIO);
      Alert.alert("✅ Sucesso", "Registro atualizado!");
    },
    onError: (e) => Alert.alert("Erro", e.message),
  });

  const deleteMutation = trpc.culturasPragas.pragas.delete.useMutation({
    onSuccess: () => {
      utils.culturasPragas.pragas.list.invalidate();
      utils.culturasPragas.pragas.stats.invalidate();
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
      nome: item.nome ?? "",
      nomeCientifico: item.nomecientifico ?? "",
      tipo: item.tipo ?? "praga",
      culturaAfetada: item.culturaAfetada ?? "",
      sintomas: item.sintomas ?? "",
      causas: item.causas ?? "",
      tratamento: item.tratamento ?? "",
      prevencao: item.prevencao ?? "",
      nivelRisco: item.nivelRisco ?? "medio",
    });
    setModalVisible(true);
  }

  function confirmarDelete(id: number, nome: string) {
    Alert.alert(
      "Excluir Registro",
      `Deseja excluir "${nome}" do banco de conhecimento?`,
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
    if (!form.nome.trim()) {
      Alert.alert("Atenção", "O nome é obrigatório.");
      return;
    }
    const payload = {
      nome: form.nome.trim(),
      nomeCientifico: form.nomeCientifico || null,
      tipo: form.tipo,
      culturaAfetada: form.culturaAfetada || null,
      sintomas: form.sintomas || null,
      causas: form.causas || null,
      tratamento: form.tratamento || null,
      prevencao: form.prevencao || null,
      nivelRisco: form.nivelRisco,
    };

    if (editandoId) {
      updateMutation.mutate({ id: editandoId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ backgroundColor: "#7F1D1D", paddingHorizontal: 16, paddingVertical: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Text style={{ color: "#fff", fontSize: 18 }}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>🐛 Pragas e Doenças</Text>
            <Text style={{ color: "#fca5a5", fontSize: 12 }}>Banco de Conhecimento — Admin</Text>
          </View>
          <TouchableOpacity
            onPress={abrirCriar}
            style={{ backgroundColor: "#EF4444", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>+ Novo</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
        {/* Stats */}
        {stats && (
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            {[
              { label: "Total", value: stats.total, color: "#6B7280" },
              { label: "Pragas", value: stats.pragas, color: "#F59E0B" },
              { label: "Doenças", value: stats.doencas, color: "#EF4444" },
              { label: "Críticas", value: stats.criticas, color: "#7F1D1D" },
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
          placeholder="🔍 Buscar por nome, cultura afetada, sintomas..."
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

        {/* Filtros */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={() => setFiltroTipo(undefined)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: !filtroTipo ? "#7F1D1D" : colors.surface,
                borderWidth: 1,
                borderColor: !filtroTipo ? "#7F1D1D" : colors.border,
              }}
            >
              <Text style={{ color: !filtroTipo ? "#fff" : colors.muted, fontSize: 12, fontWeight: "600" }}>Todos</Text>
            </TouchableOpacity>
            {TIPO_OPTIONS.map((t) => (
              <TouchableOpacity
                key={t.value}
                onPress={() => setFiltroTipo(filtroTipo === t.value ? undefined : t.value)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: filtroTipo === t.value ? t.color : colors.surface,
                  borderWidth: 1,
                  borderColor: filtroTipo === t.value ? t.color : colors.border,
                }}
              >
                <Text style={{ color: filtroTipo === t.value ? "#fff" : colors.muted, fontSize: 12, fontWeight: "600" }}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
            {RISCO_OPTIONS.map((r) => (
              <TouchableOpacity
                key={r.value}
                onPress={() => setFiltroRisco(filtroRisco === r.value ? undefined : r.value)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: filtroRisco === r.value ? r.color : colors.surface,
                  borderWidth: 1,
                  borderColor: filtroRisco === r.value ? r.color : colors.border,
                }}
              >
                <Text style={{ color: filtroRisco === r.value ? "#fff" : colors.muted, fontSize: 12, fontWeight: "600" }}>
                  ⚠️ {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Lista */}
        {isLoading ? (
          <ActivityIndicator size="large" color="#7F1D1D" style={{ marginTop: 32 }} />
        ) : (data?.items?.length ?? 0) === 0 ? (
          <View style={{ alignItems: "center", padding: 32 }}>
            <Text style={{ fontSize: 40 }}>🐛</Text>
            <Text style={{ color: colors.muted, marginTop: 8, textAlign: "center" }}>
              Nenhum registro encontrado.{"\n"}Toque em "+ Novo" para adicionar ao banco de conhecimento.
            </Text>
          </View>
        ) : (
          data?.items?.map((item) => {
            const tipoOpt = TIPO_OPTIONS.find((t) => t.value === item.tipo);
            const riscoOpt = RISCO_OPTIONS.find((r) => r.value === item.nivelRisco);
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
                  borderLeftColor: riscoOpt?.color ?? "#6B7280",
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "700", fontSize: 15, color: colors.foreground }}>
                      {item.nome}
                    </Text>
                    {item.nomecientifico ? (
                      <Text style={{ color: colors.muted, fontSize: 12, fontStyle: "italic" }}>{item.nomecientifico}</Text>
                    ) : null}
                    <View style={{ flexDirection: "row", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                      <View style={{ backgroundColor: (tipoOpt?.color ?? "#6B7280") + "22", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Text style={{ color: tipoOpt?.color, fontSize: 11, fontWeight: "600" }}>{tipoOpt?.label}</Text>
                      </View>
                      <View style={{ backgroundColor: (riscoOpt?.color ?? "#6B7280") + "22", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Text style={{ color: riscoOpt?.color, fontSize: 11, fontWeight: "600" }}>⚠️ {riscoOpt?.label}</Text>
                      </View>
                      {item.culturaAfetada ? (
                        <View style={{ backgroundColor: colors.border, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                          <Text style={{ color: colors.muted, fontSize: 11 }}>🌱 {item.culturaAfetada}</Text>
                        </View>
                      ) : null}
                    </View>
                    {item.sintomas ? (
                      <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }} numberOfLines={2}>
                        {item.sintomas}
                      </Text>
                    ) : null}
                  </View>
                  <View style={{ flexDirection: "row", gap: 8, marginLeft: 8 }}>
                    <TouchableOpacity
                      onPress={() => abrirEditar(item)}
                      style={{ backgroundColor: "#3B82F6" + "22", borderRadius: 8, padding: 8 }}
                    >
                      <Text style={{ fontSize: 16 }}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => confirmarDelete(item.id, item.nome)}
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
          <View style={{ backgroundColor: "#7F1D1D", padding: 16, flexDirection: "row", alignItems: "center" }}>
            <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700", flex: 1 }}>
              {editandoId ? "✏️ Editar Registro" : "🐛 Novo Registro"}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={{ color: "#fca5a5", fontSize: 16 }}>✕ Fechar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
            {[
              { label: "Nome *", key: "nome", placeholder: "Ex: Ferrugem Asiática da Soja" },
              { label: "Nome Científico", key: "nomeCientifico", placeholder: "Ex: Phakopsora pachyrhizi" },
              { label: "Cultura(s) Afetada(s)", key: "culturaAfetada", placeholder: "Ex: Soja, Milho, Trigo" },
              { label: "Sintomas", key: "sintomas", placeholder: "Descreva os sintomas visíveis..." },
              { label: "Causas", key: "causas", placeholder: "Agente causador, condições favoráveis..." },
              { label: "Tratamento", key: "tratamento", placeholder: "Fungicidas, inseticidas, medidas culturais..." },
              { label: "Prevenção", key: "prevencao", placeholder: "Medidas preventivas recomendadas..." },
            ].map(({ label, key, placeholder }) => (
              <View key={key}>
                <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 4, fontWeight: "600" }}>{label}</Text>
                <TextInput
                  value={form[key as keyof FormData]}
                  onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
                  placeholder={placeholder}
                  placeholderTextColor={colors.muted}
                  multiline={["sintomas", "causas", "tratamento", "prevencao"].includes(key)}
                  numberOfLines={["sintomas", "causas", "tratamento", "prevencao"].includes(key) ? 3 : 1}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 10,
                    padding: 12,
                    color: colors.foreground,
                    borderWidth: 1,
                    borderColor: colors.border,
                    fontSize: 14,
                    minHeight: ["sintomas", "causas", "tratamento", "prevencao"].includes(key) ? 80 : undefined,
                    textAlignVertical: ["sintomas", "causas", "tratamento", "prevencao"].includes(key) ? "top" : "center",
                  }}
                />
              </View>
            ))}

            {/* Tipo */}
            <View>
              <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 8, fontWeight: "600" }}>Tipo *</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {TIPO_OPTIONS.map((t) => (
                  <TouchableOpacity
                    key={t.value}
                    onPress={() => setForm((f) => ({ ...f, tipo: t.value }))}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      backgroundColor: form.tipo === t.value ? t.color : colors.surface,
                      borderWidth: 1,
                      borderColor: form.tipo === t.value ? t.color : colors.border,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: form.tipo === t.value ? "#fff" : colors.muted, fontWeight: "600", fontSize: 12 }}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Nível de Risco */}
            <View>
              <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 8, fontWeight: "600" }}>Nível de Risco</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {RISCO_OPTIONS.map((r) => (
                  <TouchableOpacity
                    key={r.value}
                    onPress={() => setForm((f) => ({ ...f, nivelRisco: r.value }))}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      backgroundColor: form.nivelRisco === r.value ? r.color : colors.surface,
                      borderWidth: 1,
                      borderColor: form.nivelRisco === r.value ? r.color : colors.border,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: form.nivelRisco === r.value ? "#fff" : colors.muted, fontWeight: "600", fontSize: 11 }}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              onPress={salvar}
              disabled={isSaving}
              style={{
                backgroundColor: isSaving ? colors.muted : "#7F1D1D",
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
                  {editandoId ? "Salvar Alterações" : "Criar Registro"}
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
