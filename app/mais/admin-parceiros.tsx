/**
 * admin-parceiros.tsx — Gestão Admin de Parceiros
 */
import React, { useState } from "react";
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { RouteGuard } from "@/components/route-guard";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";

const TIPO_OPTIONS = [
  { value: "laboratorio", label: "🔬 Laboratório", color: "#7C3AED" },
  { value: "cooperativa", label: "🤝 Cooperativa", color: "#166534" },
  { value: "consultoria", label: "💼 Consultoria", color: "#1565C0" },
  { value: "revendedor", label: "🏪 Revendedor", color: "#D97706" },
  { value: "instituicao", label: "🏛️ Instituição", color: "#374151" },
  { value: "outro", label: "📌 Outro", color: "#6B7280" },
] as const;

const STATUS_OPTIONS = [
  { value: "ativo", label: "Ativo", color: "#22C55E" },
  { value: "inativo", label: "Inativo", color: "#6B7280" },
] as const;

type TipoParceiro = "laboratorio" | "cooperativa" | "consultoria" | "revendedor" | "instituicao" | "outro";
type StatusParceiro = "ativo" | "inativo";

type FormData = {
  nome: string;
  tipo: TipoParceiro;
  descricao: string;
  cidade: string;
  estado: string;
  telefone: string;
  email: string;
  website: string;
  servicosOferecidos: string;
  status: StatusParceiro;
};

const FORM_VAZIO: FormData = {
  nome: "",
  tipo: "laboratorio",
  descricao: "",
  cidade: "",
  estado: "",
  telefone: "",
  email: "",
  website: "",
  servicosOferecidos: "",
  status: "ativo",
};

export default function AdminParceiros() {
  return (
    <RouteGuard requireAdmin>
      <AdminParceirosContent />
    </RouteGuard>
  );
}

function AdminParceirosContent() {
  const colors = useColors();
  const router = useRouter();
  const utils = trpc.useUtils();

  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<TipoParceiro | undefined>();
  const [filtroStatus, setFiltroStatus] = useState<StatusParceiro | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(FORM_VAZIO);

  const { data, isLoading } = trpc.materiaisParceiros.parceiros.list.useQuery({
    busca: busca || undefined,
    tipo: filtroTipo,
    status: filtroStatus,
    limit: 100,
    offset: 0,
  });

  const { data: stats } = trpc.materiaisParceiros.parceiros.stats.useQuery();

  const createMutation = trpc.materiaisParceiros.parceiros.create.useMutation({
    onSuccess: () => {
      utils.materiaisParceiros.parceiros.list.invalidate();
      utils.materiaisParceiros.parceiros.stats.invalidate();
      setModalVisible(false);
      setForm(FORM_VAZIO);
      Alert.alert("✅ Sucesso", "Parceiro cadastrado com sucesso!");
    },
    onError: (e) => Alert.alert("Erro", e.message),
  });

  const updateMutation = trpc.materiaisParceiros.parceiros.update.useMutation({
    onSuccess: () => {
      utils.materiaisParceiros.parceiros.list.invalidate();
      setModalVisible(false);
      setEditandoId(null);
      setForm(FORM_VAZIO);
      Alert.alert("✅ Sucesso", "Parceiro atualizado!");
    },
    onError: (e) => Alert.alert("Erro", e.message),
  });

  const deleteMutation = trpc.materiaisParceiros.parceiros.delete.useMutation({
    onSuccess: () => {
      utils.materiaisParceiros.parceiros.list.invalidate();
      utils.materiaisParceiros.parceiros.stats.invalidate();
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
      tipo: item.tipo ?? "laboratorio",
      descricao: item.descricao ?? "",
      cidade: item.cidade ?? "",
      estado: item.estado ?? "",
      telefone: item.telefone ?? "",
      email: item.email ?? "",
      website: item.website ?? "",
      servicosOferecidos: item.servicosOferecidos ?? "",
      status: item.status ?? "ativo",
    });
    setModalVisible(true);
  }

  function confirmarDelete(id: number, nome: string) {
    Alert.alert("Excluir Parceiro", `Deseja excluir "${nome}"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => deleteMutation.mutate({ id }) },
    ]);
  }

  function salvar() {
    if (!form.nome.trim()) {
      Alert.alert("Atenção", "O nome do parceiro é obrigatório.");
      return;
    }
    const payload = {
      nome: form.nome.trim(),
      tipo: form.tipo,
      descricao: form.descricao || null,
      cidade: form.cidade || null,
      estado: form.estado || null,
      telefone: form.telefone || null,
      email: form.email || null,
      website: form.website || null,
      servicosOferecidos: form.servicosOferecidos || null,
      status: form.status,
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
      <View style={{ backgroundColor: "#7C3AED", paddingHorizontal: 16, paddingVertical: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Text style={{ color: "#fff", fontSize: 18 }}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>🤝 Gestão de Parceiros</Text>
            <Text style={{ color: "#ddd6fe", fontSize: 12 }}>Painel Administrativo</Text>
          </View>
          <TouchableOpacity
            onPress={abrirCriar}
            style={{ backgroundColor: "#8B5CF6", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
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
              { label: "Ativos", value: stats.ativos, color: "#22C55E" },
              { label: "Labs", value: stats.laboratorios, color: "#7C3AED" },
              { label: "Cooperativas", value: stats.cooperativas, color: "#166534" },
            ].map((s) => (
              <View key={s.label} style={{
                flex: 1, minWidth: 70, backgroundColor: colors.surface,
                borderRadius: 10, padding: 10, alignItems: "center",
                borderWidth: 1, borderColor: colors.border,
              }}>
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
          placeholder="🔍 Buscar por nome, cidade, serviços..."
          placeholderTextColor={colors.muted}
          style={{
            backgroundColor: colors.surface, borderRadius: 10, padding: 12,
            color: colors.foreground, borderWidth: 1, borderColor: colors.border, fontSize: 14,
          }}
        />

        {/* Filtros */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={() => setFiltroTipo(undefined)}
              style={{
                paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
                backgroundColor: !filtroTipo ? "#7C3AED" : colors.surface,
                borderWidth: 1, borderColor: !filtroTipo ? "#7C3AED" : colors.border,
              }}
            >
              <Text style={{ color: !filtroTipo ? "#fff" : colors.muted, fontSize: 12, fontWeight: "600" }}>Todos</Text>
            </TouchableOpacity>
            {TIPO_OPTIONS.map((t) => (
              <TouchableOpacity key={t.value}
                onPress={() => setFiltroTipo(filtroTipo === t.value ? undefined : t.value)}
                style={{
                  paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
                  backgroundColor: filtroTipo === t.value ? t.color : colors.surface,
                  borderWidth: 1, borderColor: filtroTipo === t.value ? t.color : colors.border,
                }}>
                <Text style={{ color: filtroTipo === t.value ? "#fff" : colors.muted, fontSize: 12, fontWeight: "600" }}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Lista */}
        {isLoading ? (
          <ActivityIndicator size="large" color="#7C3AED" style={{ marginTop: 32 }} />
        ) : (data?.items?.length ?? 0) === 0 ? (
          <View style={{ alignItems: "center", padding: 32 }}>
            <Text style={{ fontSize: 40 }}>🤝</Text>
            <Text style={{ color: colors.muted, marginTop: 8, textAlign: "center" }}>
              Nenhum parceiro encontrado.{"\n"}Toque em "+ Novo" para cadastrar.
            </Text>
          </View>
        ) : (
          data?.items?.map((item) => {
            const tipoOpt = TIPO_OPTIONS.find((t) => t.value === item.tipo);
            const statusOpt = STATUS_OPTIONS.find((s) => s.value === item.status);
            return (
              <View key={item.id} style={{
                backgroundColor: colors.surface, borderRadius: 12, padding: 14,
                borderWidth: 1, borderColor: colors.border,
                borderLeftWidth: 4, borderLeftColor: tipoOpt?.color ?? "#6B7280",
              }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "700", fontSize: 15, color: colors.foreground }}>{item.nome}</Text>
                    {(item.cidade || item.estado) ? (
                      <Text style={{ color: colors.muted, fontSize: 12 }}>
                        📍 {[item.cidade, item.estado].filter(Boolean).join(", ")}
                      </Text>
                    ) : null}
                    <View style={{ flexDirection: "row", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                      <View style={{ backgroundColor: (tipoOpt?.color ?? "#6B7280") + "22", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Text style={{ color: tipoOpt?.color, fontSize: 11, fontWeight: "600" }}>{tipoOpt?.label}</Text>
                      </View>
                      <View style={{ backgroundColor: (statusOpt?.color ?? "#6B7280") + "22", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Text style={{ color: statusOpt?.color, fontSize: 11, fontWeight: "600" }}>{statusOpt?.label}</Text>
                      </View>
                    </View>
                    {item.servicosOferecidos ? (
                      <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }} numberOfLines={2}>{item.servicosOferecidos}</Text>
                    ) : null}
                    {item.email ? <Text style={{ color: "#3B82F6", fontSize: 12, marginTop: 4 }}>✉️ {item.email}</Text> : null}
                    {item.telefone ? <Text style={{ color: colors.muted, fontSize: 12 }}>📞 {item.telefone}</Text> : null}
                  </View>
                  <View style={{ flexDirection: "row", gap: 8, marginLeft: 8 }}>
                    <TouchableOpacity onPress={() => abrirEditar(item)} style={{ backgroundColor: "#3B82F6" + "22", borderRadius: 8, padding: 8 }}>
                      <Text style={{ fontSize: 16 }}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => confirmarDelete(item.id, item.nome)} style={{ backgroundColor: "#EF4444" + "22", borderRadius: 8, padding: 8 }}>
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

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ backgroundColor: "#7C3AED", padding: 16, flexDirection: "row", alignItems: "center" }}>
            <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700", flex: 1 }}>
              {editandoId ? "✏️ Editar Parceiro" : "🤝 Novo Parceiro"}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={{ color: "#ddd6fe", fontSize: 16 }}>✕ Fechar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
            {[
              { label: "Nome *", key: "nome", placeholder: "Ex: Laboratório Agroquímica Ltda" },
              { label: "Descrição", key: "descricao", placeholder: "Descreva os serviços e diferenciais..." },
              { label: "Cidade", key: "cidade", placeholder: "Ex: Ribeirão Preto" },
              { label: "Estado", key: "estado", placeholder: "Ex: SP" },
              { label: "Telefone", key: "telefone", placeholder: "Ex: (16) 99999-9999" },
              { label: "E-mail", key: "email", placeholder: "contato@empresa.com.br" },
              { label: "Website", key: "website", placeholder: "https://www.empresa.com.br" },
              { label: "Serviços Oferecidos", key: "servicosOferecidos", placeholder: "Ex: Análise de solo, foliar, água..." },
            ].map(({ label, key, placeholder }) => (
              <View key={key}>
                <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 4, fontWeight: "600" }}>{label}</Text>
                <TextInput
                  value={form[key as keyof FormData]}
                  onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
                  placeholder={placeholder}
                  placeholderTextColor={colors.muted}
                  multiline={["descricao", "servicosOferecidos"].includes(key)}
                  numberOfLines={["descricao", "servicosOferecidos"].includes(key) ? 3 : 1}
                  style={{
                    backgroundColor: colors.surface, borderRadius: 10, padding: 12,
                    color: colors.foreground, borderWidth: 1, borderColor: colors.border, fontSize: 14,
                    minHeight: ["descricao", "servicosOferecidos"].includes(key) ? 80 : undefined,
                    textAlignVertical: ["descricao", "servicosOferecidos"].includes(key) ? "top" : "center",
                  }}
                />
              </View>
            ))}

            {/* Tipo */}
            <View>
              <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 8, fontWeight: "600" }}>Tipo *</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {TIPO_OPTIONS.map((t) => (
                  <TouchableOpacity key={t.value} onPress={() => setForm((f) => ({ ...f, tipo: t.value }))}
                    style={{
                      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
                      backgroundColor: form.tipo === t.value ? t.color : colors.surface,
                      borderWidth: 1, borderColor: form.tipo === t.value ? t.color : colors.border,
                    }}>
                    <Text style={{ color: form.tipo === t.value ? "#fff" : colors.muted, fontWeight: "600", fontSize: 12 }}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Status */}
            <View>
              <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 8, fontWeight: "600" }}>Status</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {STATUS_OPTIONS.map((s) => (
                  <TouchableOpacity key={s.value} onPress={() => setForm((f) => ({ ...f, status: s.value }))}
                    style={{
                      flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center",
                      backgroundColor: form.status === s.value ? s.color : colors.surface,
                      borderWidth: 1, borderColor: form.status === s.value ? s.color : colors.border,
                    }}>
                    <Text style={{ color: form.status === s.value ? "#fff" : colors.muted, fontWeight: "600", fontSize: 13 }}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity onPress={salvar} disabled={isSaving}
              style={{
                backgroundColor: isSaving ? colors.muted : "#7C3AED",
                borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8,
              }}>
              {isSaving ? <ActivityIndicator color="#fff" /> : (
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                  {editandoId ? "Salvar Alterações" : "Cadastrar Parceiro"}
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
