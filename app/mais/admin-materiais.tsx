/**
 * admin-materiais.tsx — Gestão Admin de Materiais Didáticos
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
  { value: "video", label: "🎥 Vídeo", color: "#EF4444" },
  { value: "audio", label: "🎵 Áudio", color: "#8B5CF6" },
  { value: "apostila", label: "📚 Apostila", color: "#3B82F6" },
  { value: "guia", label: "📋 Guia", color: "#22C55E" },
  { value: "checklist", label: "✅ Checklist", color: "#F59E0B" },
  { value: "infografico", label: "📊 Infográfico", color: "#06B6D4" },
] as const;

const NIVEL_OPTIONS = [
  { value: "iniciante", label: "Iniciante", color: "#22C55E" },
  { value: "intermediario", label: "Intermediário", color: "#F59E0B" },
  { value: "avancado", label: "Avançado", color: "#EF4444" },
] as const;

const PUBLICO_OPTIONS = [
  { value: "todos", label: "Todos", color: "#6B7280" },
  { value: "produtor", label: "Produtor", color: "#166534" },
  { value: "tecnico", label: "Técnico", color: "#1565C0" },
] as const;

const STATUS_OPTIONS = [
  { value: "ativo", label: "Ativo", color: "#22C55E" },
  { value: "rascunho", label: "Rascunho", color: "#F59E0B" },
  { value: "inativo", label: "Inativo", color: "#6B7280" },
] as const;

type TipoMaterial = "video" | "audio" | "apostila" | "guia" | "checklist" | "infografico";
type Nivel = "iniciante" | "intermediario" | "avancado";
type PublicoAlvo = "produtor" | "tecnico" | "todos";
type StatusMaterial = "ativo" | "inativo" | "rascunho";

type FormData = {
  titulo: string;
  tipoMaterial: TipoMaterial;
  tema: string;
  descricao: string;
  arquivoUrl: string;
  videoUrl: string;
  idioma: string;
  publicoAlvo: PublicoAlvo;
  nivel: Nivel;
  status: StatusMaterial;
};

const FORM_VAZIO: FormData = {
  titulo: "",
  tipoMaterial: "apostila",
  tema: "",
  descricao: "",
  arquivoUrl: "",
  videoUrl: "",
  idioma: "pt-BR",
  publicoAlvo: "todos",
  nivel: "iniciante",
  status: "ativo",
};

export default function AdminMateriais() {
  return (
    <RouteGuard requireAdmin>
      <AdminMateriaisContent />
    </RouteGuard>
  );
}

function AdminMateriaisContent() {
  const colors = useColors();
  const router = useRouter();
  const utils = trpc.useUtils();

  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<TipoMaterial | undefined>();
  const [filtroStatus, setFiltroStatus] = useState<StatusMaterial | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(FORM_VAZIO);

  const { data, isLoading } = trpc.materiaisParceiros.materiais.list.useQuery({
    busca: busca || undefined,
    tipo: filtroTipo,
    status: filtroStatus,
    limit: 100,
    offset: 0,
  });

  const { data: stats } = trpc.materiaisParceiros.materiais.stats.useQuery();

  const createMutation = trpc.materiaisParceiros.materiais.create.useMutation({
    onSuccess: () => {
      utils.materiaisParceiros.materiais.list.invalidate();
      utils.materiaisParceiros.materiais.stats.invalidate();
      setModalVisible(false);
      setForm(FORM_VAZIO);
      Alert.alert("✅ Sucesso", "Material criado com sucesso!");
    },
    onError: (e) => Alert.alert("Erro", e.message),
  });

  const updateMutation = trpc.materiaisParceiros.materiais.update.useMutation({
    onSuccess: () => {
      utils.materiaisParceiros.materiais.list.invalidate();
      setModalVisible(false);
      setEditandoId(null);
      setForm(FORM_VAZIO);
      Alert.alert("✅ Sucesso", "Material atualizado!");
    },
    onError: (e) => Alert.alert("Erro", e.message),
  });

  const deleteMutation = trpc.materiaisParceiros.materiais.delete.useMutation({
    onSuccess: () => {
      utils.materiaisParceiros.materiais.list.invalidate();
      utils.materiaisParceiros.materiais.stats.invalidate();
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
      titulo: item.titulo ?? "",
      tipoMaterial: item.tipoMaterial ?? "apostila",
      tema: item.tema ?? "",
      descricao: item.descricao ?? "",
      arquivoUrl: item.arquivoUrl ?? "",
      videoUrl: item.videoUrl ?? "",
      idioma: item.idioma ?? "pt-BR",
      publicoAlvo: item.publicoAlvo ?? "todos",
      nivel: item.nivel ?? "iniciante",
      status: item.status ?? "ativo",
    });
    setModalVisible(true);
  }

  function confirmarDelete(id: number, titulo: string) {
    Alert.alert("Excluir Material", `Deseja excluir "${titulo}"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => deleteMutation.mutate({ id }) },
    ]);
  }

  function salvar() {
    if (!form.titulo.trim()) {
      Alert.alert("Atenção", "O título é obrigatório.");
      return;
    }
    const payload = {
      titulo: form.titulo.trim(),
      tipoMaterial: form.tipoMaterial,
      tema: form.tema || null,
      descricao: form.descricao || null,
      arquivoUrl: form.arquivoUrl || null,
      videoUrl: form.videoUrl || null,
      idioma: form.idioma || "pt-BR",
      publicoAlvo: form.publicoAlvo,
      nivel: form.nivel,
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
      <View style={{ backgroundColor: "#1565C0", paddingHorizontal: 16, paddingVertical: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Text style={{ color: "#fff", fontSize: 18 }}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>📚 Materiais Didáticos</Text>
            <Text style={{ color: "#bfdbfe", fontSize: 12 }}>Painel Administrativo</Text>
          </View>
          <TouchableOpacity
            onPress={abrirCriar}
            style={{ backgroundColor: "#3B82F6", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
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
              { label: "Rascunhos", value: stats.rascunhos, color: "#F59E0B" },
              { label: "Vídeos", value: stats.videos, color: "#EF4444" },
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
          placeholder="🔍 Buscar por título, tema ou descrição..."
          placeholderTextColor={colors.muted}
          style={{
            backgroundColor: colors.surface, borderRadius: 10, padding: 12,
            color: colors.foreground, borderWidth: 1, borderColor: colors.border, fontSize: 14,
          }}
        />

        {/* Filtros de tipo */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={() => setFiltroTipo(undefined)}
              style={{
                paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
                backgroundColor: !filtroTipo ? "#1565C0" : colors.surface,
                borderWidth: 1, borderColor: !filtroTipo ? "#1565C0" : colors.border,
              }}
            >
              <Text style={{ color: !filtroTipo ? "#fff" : colors.muted, fontSize: 12, fontWeight: "600" }}>Todos</Text>
            </TouchableOpacity>
            {TIPO_OPTIONS.map((t) => (
              <TouchableOpacity
                key={t.value}
                onPress={() => setFiltroTipo(filtroTipo === t.value ? undefined : t.value)}
                style={{
                  paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
                  backgroundColor: filtroTipo === t.value ? t.color : colors.surface,
                  borderWidth: 1, borderColor: filtroTipo === t.value ? t.color : colors.border,
                }}
              >
                <Text style={{ color: filtroTipo === t.value ? "#fff" : colors.muted, fontSize: 12, fontWeight: "600" }}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Lista */}
        {isLoading ? (
          <ActivityIndicator size="large" color="#1565C0" style={{ marginTop: 32 }} />
        ) : (data?.items?.length ?? 0) === 0 ? (
          <View style={{ alignItems: "center", padding: 32 }}>
            <Text style={{ fontSize: 40 }}>📚</Text>
            <Text style={{ color: colors.muted, marginTop: 8, textAlign: "center" }}>
              Nenhum material encontrado.{"\n"}Toque em "+ Novo" para adicionar.
            </Text>
          </View>
        ) : (
          data?.items?.map((item) => {
            const tipoOpt = TIPO_OPTIONS.find((t) => t.value === item.tipoMaterial);
            const nivelOpt = NIVEL_OPTIONS.find((n) => n.value === item.nivel);
            const statusOpt = STATUS_OPTIONS.find((s) => s.value === item.status);
            return (
              <View key={item.id} style={{
                backgroundColor: colors.surface, borderRadius: 12, padding: 14,
                borderWidth: 1, borderColor: colors.border,
                borderLeftWidth: 4, borderLeftColor: tipoOpt?.color ?? "#6B7280",
              }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "700", fontSize: 15, color: colors.foreground }}>{item.titulo}</Text>
                    {item.tema ? <Text style={{ color: colors.muted, fontSize: 12 }}>{item.tema}</Text> : null}
                    <View style={{ flexDirection: "row", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                      <View style={{ backgroundColor: (tipoOpt?.color ?? "#6B7280") + "22", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Text style={{ color: tipoOpt?.color, fontSize: 11, fontWeight: "600" }}>{tipoOpt?.label}</Text>
                      </View>
                      <View style={{ backgroundColor: (nivelOpt?.color ?? "#6B7280") + "22", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Text style={{ color: nivelOpt?.color, fontSize: 11, fontWeight: "600" }}>{nivelOpt?.label}</Text>
                      </View>
                      <View style={{ backgroundColor: (statusOpt?.color ?? "#6B7280") + "22", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Text style={{ color: statusOpt?.color, fontSize: 11, fontWeight: "600" }}>{statusOpt?.label}</Text>
                      </View>
                    </View>
                    {item.descricao ? (
                      <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }} numberOfLines={2}>{item.descricao}</Text>
                    ) : null}
                  </View>
                  <View style={{ flexDirection: "row", gap: 8, marginLeft: 8 }}>
                    <TouchableOpacity onPress={() => abrirEditar(item)} style={{ backgroundColor: "#3B82F6" + "22", borderRadius: 8, padding: 8 }}>
                      <Text style={{ fontSize: 16 }}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => confirmarDelete(item.id, item.titulo)} style={{ backgroundColor: "#EF4444" + "22", borderRadius: 8, padding: 8 }}>
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
          <View style={{ backgroundColor: "#1565C0", padding: 16, flexDirection: "row", alignItems: "center" }}>
            <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700", flex: 1 }}>
              {editandoId ? "✏️ Editar Material" : "📚 Novo Material"}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={{ color: "#bfdbfe", fontSize: 16 }}>✕ Fechar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
            {[
              { label: "Título *", key: "titulo", placeholder: "Ex: Manejo Integrado de Pragas na Soja" },
              { label: "Tema", key: "tema", placeholder: "Ex: Fitossanidade, Solos, Irrigação..." },
              { label: "Descrição", key: "descricao", placeholder: "Descreva o conteúdo do material..." },
              { label: "URL do Arquivo", key: "arquivoUrl", placeholder: "https://..." },
              { label: "URL do Vídeo", key: "videoUrl", placeholder: "https://youtube.com/..." },
              { label: "Idioma", key: "idioma", placeholder: "pt-BR" },
            ].map(({ label, key, placeholder }) => (
              <View key={key}>
                <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 4, fontWeight: "600" }}>{label}</Text>
                <TextInput
                  value={form[key as keyof FormData]}
                  onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
                  placeholder={placeholder}
                  placeholderTextColor={colors.muted}
                  multiline={key === "descricao"}
                  numberOfLines={key === "descricao" ? 3 : 1}
                  style={{
                    backgroundColor: colors.surface, borderRadius: 10, padding: 12,
                    color: colors.foreground, borderWidth: 1, borderColor: colors.border, fontSize: 14,
                    minHeight: key === "descricao" ? 80 : undefined,
                    textAlignVertical: key === "descricao" ? "top" : "center",
                  }}
                />
              </View>
            ))}

            {/* Tipo */}
            <View>
              <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 8, fontWeight: "600" }}>Tipo *</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {TIPO_OPTIONS.map((t) => (
                  <TouchableOpacity key={t.value} onPress={() => setForm((f) => ({ ...f, tipoMaterial: t.value }))}
                    style={{
                      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
                      backgroundColor: form.tipoMaterial === t.value ? t.color : colors.surface,
                      borderWidth: 1, borderColor: form.tipoMaterial === t.value ? t.color : colors.border,
                    }}>
                    <Text style={{ color: form.tipoMaterial === t.value ? "#fff" : colors.muted, fontWeight: "600", fontSize: 12 }}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Nível */}
            <View>
              <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 8, fontWeight: "600" }}>Nível</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {NIVEL_OPTIONS.map((n) => (
                  <TouchableOpacity key={n.value} onPress={() => setForm((f) => ({ ...f, nivel: n.value }))}
                    style={{
                      flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center",
                      backgroundColor: form.nivel === n.value ? n.color : colors.surface,
                      borderWidth: 1, borderColor: form.nivel === n.value ? n.color : colors.border,
                    }}>
                    <Text style={{ color: form.nivel === n.value ? "#fff" : colors.muted, fontWeight: "600", fontSize: 12 }}>{n.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Público-alvo */}
            <View>
              <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 8, fontWeight: "600" }}>Público-alvo</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {PUBLICO_OPTIONS.map((p) => (
                  <TouchableOpacity key={p.value} onPress={() => setForm((f) => ({ ...f, publicoAlvo: p.value }))}
                    style={{
                      flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center",
                      backgroundColor: form.publicoAlvo === p.value ? p.color : colors.surface,
                      borderWidth: 1, borderColor: form.publicoAlvo === p.value ? p.color : colors.border,
                    }}>
                    <Text style={{ color: form.publicoAlvo === p.value ? "#fff" : colors.muted, fontWeight: "600", fontSize: 12 }}>{p.label}</Text>
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
                    <Text style={{ color: form.status === s.value ? "#fff" : colors.muted, fontWeight: "600", fontSize: 12 }}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity onPress={salvar} disabled={isSaving}
              style={{
                backgroundColor: isSaving ? colors.muted : "#1565C0",
                borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8,
              }}>
              {isSaving ? <ActivityIndicator color="#fff" /> : (
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                  {editandoId ? "Salvar Alterações" : "Criar Material"}
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
