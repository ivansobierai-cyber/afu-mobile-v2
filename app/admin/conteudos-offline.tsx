import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { useAdmin } from "@/lib/admin/admin-context";
import type { Conteudo, Modulo } from "@/lib/admin/types";
import { MediaUpload } from "@/components/media-upload";
import { HtmlEditor } from "@/components/html-editor";
import { useColors } from "@/hooks/use-colors";

interface FormData {
  moduloId: string;
  titulo: string;
  descricao: string;
  tipo: "artigo" | "guia" | "pdf" | "video" | "imagem";
  conteudo: string;
  tags: string;
  ordem: number;
  ativo: boolean;
}

const INITIAL_FORM_DATA: FormData = {
  moduloId: "",
  titulo: "",
  descricao: "",
  tipo: "artigo",
  conteudo: "",
  tags: "",
  ordem: 0,
  ativo: true,
};

export default function ConteudosOfflineScreen(): React.ReactNode {
  const colors = useColors();
  const s = useMemo(() => styles(colors), [colors]);

  const router = useRouter();
  const { state, adicionarConteudo, atualizarConteudo, deletarConteudo } = useAdmin();

  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [moduloIdFiltro, setModuloIdFiltro] = useState<string>("");
  const [buscaTexto, setBuscaTexto] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  const modulos: Modulo[] = state.modulos;
  const conteudos: Conteudo[] = state.conteudos;

  const conteudosFiltrados = useMemo(() => {
    const q = buscaTexto.trim().toLowerCase();
    return conteudos
      .filter((c) => {
        const matchModulo = !moduloIdFiltro || c.moduloId === moduloIdFiltro;
        const matchBusca =
          !q ||
          c.titulo.toLowerCase().includes(q) ||
          c.descricao.toLowerCase().includes(q);
        return matchModulo && matchBusca;
      })
      .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
  }, [conteudos, moduloIdFiltro, buscaTexto]);

  const itensPendentes = useMemo(
    () => conteudos.filter((c) => c.syncStatus !== "sincronizado").length,
    [conteudos]
  );

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setEditingId(null);
    setShowForm(false);
  }, []);

  const validateForm = useCallback((f: FormData): string | null => {
    if (!f.moduloId) return "Selecione um módulo.";
    if (!f.titulo || f.titulo.trim().length < 3) return "Título deve ter pelo menos 3 caracteres.";
    if (!f.descricao || f.descricao.trim().length < 10) return "Descrição deve ter pelo menos 10 caracteres.";
    if (!f.conteudo || f.conteudo.trim().length === 0) return "Conteúdo é obrigatório.";
    return null;
  }, []);

  const handleSave = useCallback(async () => {
    const err = validateForm(formData);
    if (err) {
      Alert.alert("Erro", err);
      return;
    }

    setSaving(true);
    try {
      const tags = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        moduloId: formData.moduloId,
        titulo: formData.titulo.trim(),
        descricao: formData.descricao.trim(),
        tipo: formData.tipo,
        conteudo: formData.conteudo,
        tags,
        ordem: Number(formData.ordem) || 0,
        ativo: Boolean(formData.ativo),
      };

      if (editingId) {
        await atualizarConteudo(editingId, payload);
        Alert.alert("Sucesso", "Conteúdo atualizado");
      } else {
        await adicionarConteudo(payload);
        Alert.alert("Sucesso", "Conteúdo criado");
      }

      resetForm();
    } catch (e) {
      console.error(e);
      Alert.alert("Erro", "Falha ao salvar conteúdo");
    } finally {
      setSaving(false);
    }
  }, [formData, editingId, adicionarConteudo, atualizarConteudo, resetForm, validateForm]);

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert("Confirmar", "Deletar este conteúdo?", [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Deletar",
          style: "destructive",
          onPress: async () => {
            try {
              await deletarConteudo(id);
              Alert.alert("Sucesso", "Conteúdo deletado");
            } catch (e) {
              console.error(e);
              Alert.alert("Erro", "Falha ao deletar conteúdo");
            }
          },
        },
      ]);
    },
    [deletarConteudo]
  );

  const handleEdit = useCallback((conteudo: Conteudo) => {
    setFormData({
      moduloId: conteudo.moduloId,
      titulo: conteudo.titulo,
      descricao: conteudo.descricao,
      tipo: conteudo.tipo,
      conteudo: conteudo.conteudo,
      tags: (conteudo.tags || []).join(", "),
      ordem: conteudo.ordem ?? 0,
      ativo: conteudo.ativo ?? true,
    });
    setEditingId(conteudo.id);
    setShowForm(true);
  }, []);

  const renderConteudo = useCallback(
    ({ item }: { item: Conteudo }) => {
      const modulo = modulos.find((m) => m.id === item.moduloId);
      const status = item.syncStatus ?? "desconhecido";
      const statusEmoji =
        status === "sincronizado" ? "🟢" :
        status === "pendente" ? "🟠" :
        status === "sincronizando" ? "🟡" : "🔴";

      return (
        <View style={s.card}>
          <View style={s.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{item.titulo}</Text>
              <Text style={s.cardSubtitle}>{modulo?.nome ?? "Módulo desconhecido"}</Text>
              <View style={s.tagRow}>
                <View style={s.typeTag}>
                  <Text style={s.typeTagText}>
                    {item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1)}
                  </Text>
                </View>
                <View style={[s.statusTag, status === "sincronizado" ? s.statusSuccess : status === "pendente" ? s.statusWarning : status === "sincronizando" ? s.statusPrimary : s.statusError]}>
                  <Text style={[s.statusTagText, status === "sincronizado" ? s.statusSuccessText : status === "pendente" ? s.statusWarningText : status === "sincronizando" ? s.statusPrimaryText : s.statusErrorText]}>
                    {statusEmoji} {status}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <Text style={s.description} numberOfLines={2}>{item.descricao}</Text>

          {item.tags && item.tags.length > 0 && (
            <View style={s.tagsWrap}>
              {item.tags.map((tag, idx) => (
                <View key={idx} style={s.tagPill}>
                  <Text style={s.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={s.actionsRow}>
            <TouchableOpacity style={[s.actionBtn, s.editBtn]} onPress={() => handleEdit(item)}>
              <Text style={s.actionBtnText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.actionBtn, s.deleteBtn]} onPress={() => handleDelete(item.id)}>
              <Text style={s.actionBtnText}>Deletar</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [modulos, s, handleEdit, handleDelete]
  );

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.title}>Conteúdos</Text>
          <Text style={s.subtitle}>Gerencie conteúdos educativos offline</Text>
        </View>

        <View style={s.syncBox}>
          <View style={{ flex: 1 }}>
            <Text style={s.syncTitle}>Status de Sincronização</Text>
            <Text style={s.syncText}>
              {itensPendentes > 0 ? `🟠 ${itensPendentes} pendente(s)` : "🟢 Tudo sincronizado"}
            </Text>
          </View>
          {state.isSyncing ? <ActivityIndicator color={colors.primary} /> : null}
        </View>

        <TextInput
          placeholder="Buscar por título ou descrição..."
          value={buscaTexto}
          onChangeText={setBuscaTexto}
          placeholderTextColor={colors.muted}
          style={s.searchInput}
        />

        {!showForm && (
          <TouchableOpacity style={s.newBtn} onPress={() => setShowForm(true)}>
            <Text style={s.newBtnText}>+ Novo Conteúdo</Text>
          </TouchableOpacity>
        )}

        <View style={s.filterRow}>
          <Text style={s.filterLabel}>Filtrar por Módulo</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.moduleScroll}>
            <TouchableOpacity
              onPress={() => setModuloIdFiltro("")}
              style={[s.moduleBtn, moduloIdFiltro === "" ? s.moduleBtnActive : null]}
            >
              <Text style={moduloIdFiltro === "" ? s.moduleBtnActiveText : s.moduleBtnText}>Todos</Text>
            </TouchableOpacity>

            {modulos.map((m) => (
              <TouchableOpacity
                key={m.id}
                onPress={() => setModuloIdFiltro(m.id)}
                style={[s.moduleBtn, moduloIdFiltro === m.id ? s.moduleBtnActive : null]}
              >
                <Text style={moduloIdFiltro === m.id ? s.moduleBtnActiveText : s.moduleBtnText}>{m.nome}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {showForm ? (
          <View style={s.formCard}>
            <Text style={s.formTitle}>{editingId ? "Editar Conteúdo" : "Novo Conteúdo"}</Text>

            <Text style={s.fieldLabel}>Módulo *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.moduleScroll}>
              {modulos.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => setFormData((p) => ({ ...p, moduloId: m.id }))}
                  style={[s.moduleBtn, formData.moduloId === m.id ? s.moduleBtnActive : null]}
                >
                  <Text style={formData.moduloId === m.id ? s.moduleBtnActiveText : s.moduleBtnText}>{m.nome}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={s.fieldLabel}>Título *</Text>
            <TextInput
              placeholder="Título (mínimo 3 caracteres)"
              value={formData.titulo}
              onChangeText={(text) => setFormData((p) => ({ ...p, titulo: text }))}
              placeholderTextColor={colors.muted}
              style={s.input}
            />

            <Text style={s.fieldLabel}>Descrição *</Text>
            <TextInput
              placeholder="Descrição (mínimo 10 caracteres)"
              value={formData.descricao}
              onChangeText={(text) => setFormData((p) => ({ ...p, descricao: text }))}
              placeholderTextColor={colors.muted}
              style={[s.input, s.textarea]}
              multiline
              numberOfLines={3}
            />

            <Text style={s.fieldLabel}>Tipo de Conteúdo *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.moduleScroll}>
              {(["artigo", "guia", "pdf", "video", "imagem"] as FormData["tipo"][]).map((tipo) => (
                <TouchableOpacity
                  key={tipo}
                  onPress={() => setFormData((p) => ({ ...p, tipo }))}
                  style={[s.moduleBtn, formData.tipo === tipo ? s.moduleBtnActive : null]}
                >
                  <Text style={formData.tipo === tipo ? s.moduleBtnActiveText : s.moduleBtnText}>
                    {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={s.fieldLabel}>Conteúdo *</Text>
            <HtmlEditor
              value={formData.conteudo}
              onChange={(html) => setFormData((p) => ({ ...p, conteudo: html }))}
              placeholder="Digite seu conteúdo aqui..."
              maxHeight={350}
            />

            <Text style={s.fieldLabel}>Tags (separadas por vírgula)</Text>
            <TextInput
              placeholder="Ex: educação, solo, monitoramento"
              value={formData.tags}
              onChangeText={(text) => setFormData((p) => ({ ...p, tags: text }))}
              placeholderTextColor={colors.muted}
              style={s.input}
            />

            <Text style={s.fieldLabel}>Ordem</Text>
            <TextInput
              placeholder="0"
              value={String(formData.ordem)}
              onChangeText={(text) => setFormData((p) => ({ ...p, ordem: parseInt(text, 10) || 0 }))}
              keyboardType="number-pad"
              placeholderTextColor={colors.muted}
              style={s.input}
            />

            <TouchableOpacity
              onPress={() => setFormData((p) => ({ ...p, ativo: !p.ativo }))}
              style={[s.toggleBtn, formData.ativo ? s.toggleActive : s.toggleInactive]}
            >
              <Text style={formData.ativo ? s.toggleActiveText : s.toggleInactiveText}>
                {formData.ativo ? "✓ Ativo" : "✗ Inativo"}
              </Text>
            </TouchableOpacity>

            {editingId ? (
              <View style={{ marginTop: 8 }}>
                <MediaUpload conteudoId={editingId} maxArquivos={5} />
              </View>
            ) : null}

            <View style={s.formActions}>
              <TouchableOpacity style={[s.formActionBtn, s.saveBtn]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.formActionText}>Salvar</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[s.formActionBtn, s.cancelBtn]} onPress={resetForm}>
                <Text style={s.cancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {conteudosFiltrados.length > 0 ? (
          <FlatList
            data={conteudosFiltrados}
            renderItem={renderConteudo}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        ) : (
          <View style={s.emptyList}>
            <Text style={s.emptyText}>
              {moduloIdFiltro ? "Nenhum conteúdo neste módulo" : "Nenhum conteúdo criado ainda"}
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

/* Styles factory (outside component for performance) */
const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { padding: 16 },
    header: { marginBottom: 12 },
    title: { fontSize: 28, fontWeight: "700", color: colors.foreground, marginBottom: 4 },
    subtitle: { fontSize: 14, color: colors.muted },

    syncBox: { backgroundColor: colors.primary + "10", borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.primary + "20", flexDirection: "row", alignItems: "center" },
    syncTitle: { fontSize: 13, fontWeight: "700", color: colors.primary, marginBottom: 2 },
    syncText: { fontSize: 12, color: colors.primary + "80" },

    searchInput: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground, marginBottom: 12 },

    newBtn: { backgroundColor: colors.primary, borderRadius: 10, padding: 14, marginBottom: 12, alignItems: "center" },
    newBtnText: { color: "#fff", fontWeight: "700" },

    filterRow: { marginBottom: 12 },
    filterLabel: { fontSize: 13, fontWeight: "700", color: colors.foreground, marginBottom: 8 },
    moduleScroll: { marginBottom: 8 },
    moduleBtn: { paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, borderRadius: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    moduleBtnActive: { backgroundColor: colors.primary },
    moduleBtnText: { color: colors.foreground },
    moduleBtnActiveText: { color: "#fff", fontWeight: "700" },

    formCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
    formTitle: { fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 12 },
    fieldLabel: { fontSize: 13, fontWeight: "700", color: colors.foreground, marginBottom: 6 },

    input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground, marginBottom: 12 },
    textarea: { minHeight: 80 },

    toggleBtn: { padding: 12, borderRadius: 8, marginBottom: 12, alignItems: "center" },
    toggleActive: { backgroundColor: colors.success + "10" },
    toggleInactive: { backgroundColor: colors.error + "10" },
    toggleActiveText: { color: colors.success, fontWeight: "700" },
    toggleInactiveText: { color: colors.error, fontWeight: "700" },

    formActions: { flexDirection: "row", gap: 8, marginTop: 8 },
    formActionBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: "center" },
    saveBtn: { backgroundColor: colors.primary },
    formActionText: { color: "#fff", fontWeight: "700" },
    cancelBtn: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    cancelText: { color: colors.foreground, fontWeight: "700" },

    card: { backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
    cardHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
    cardTitle: { fontSize: 16, fontWeight: "700", color: colors.foreground },
    cardSubtitle: { fontSize: 12, color: colors.muted, marginTop: 4 },
    tagRow: { flexDirection: "row", marginTop: 8, gap: 8 },
    typeTag: { backgroundColor: colors.primary + "20", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    typeTagText: { color: colors.primary, fontWeight: "700", fontSize: 12 },
    statusTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusTagText: { fontSize: 12, fontWeight: "700" },
    statusSuccess: { backgroundColor: colors.success + "20" },
    statusWarning: { backgroundColor: colors.warning + "20" },
    statusPrimary: { backgroundColor: colors.primary + "20" },
    statusError: { backgroundColor: colors.error + "20" },
    statusSuccessText: { color: colors.success },
    statusWarningText: { color: colors.warning },
    statusPrimaryText: { color: colors.primary },
    statusErrorText: { color: colors.error },

    description: { color: colors.foreground, marginBottom: 8 },
    tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
    tagPill: { backgroundColor: colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 6 },
    tagText: { color: colors.muted, fontSize: 12 },

    actionsRow: { flexDirection: "row", gap: 8 },
    actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
    editBtn: { backgroundColor: colors.primary },
    deleteBtn: { backgroundColor: colors.error },
    actionBtnText: { color: "#fff", fontWeight: "700" },

    emptyList: { alignItems: "center", justifyContent: "center", paddingVertical: 40 },
    emptyText: { color: colors.muted },

    // small helpers
    cardSmall: { padding: 8 },
  });
