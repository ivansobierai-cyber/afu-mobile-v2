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
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";

type SyncStatus = "sincronizado" | "pendente" | "erro";

interface Modulo {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  ordem: number;
  ativo: boolean;
  dataCriacao: number;
  dataAtualizacao: number;
  syncStatus: SyncStatus;
}

const INITIAL_MODULES: Modulo[] = [
  {
    id: "1",
    nome: "Monitoramento de Solo",
    descricao: "Análise e monitoramento de saúde do solo",
    icone: "🌱",
    ordem: 1,
    ativo: true,
    dataCriacao: Date.now(),
    dataAtualizacao: Date.now(),
    syncStatus: "sincronizado",
  },
  {
    id: "2",
    nome: "Pragas e Doenças",
    descricao: "Identificação e controle de pragas",
    icone: "🐛",
    ordem: 2,
    ativo: true,
    dataCriacao: Date.now(),
    dataAtualizacao: Date.now(),
    syncStatus: "sincronizado",
  },
];

export default function ModulosOfflineScreen(): React.ReactNode {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  const [modulos, setModulos] = useState<Modulo[]>(INITIAL_MODULES);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    icone: "📚",
    ordem: INITIAL_MODULES.length + 1,
  });

  const nextOrdem = useMemo(() => (modulos.length ? Math.max(...modulos.map((m) => m.ordem)) + 1 : 1), [modulos]);

  const resetForm = useCallback(() => {
    setFormData({ nome: "", descricao: "", icone: "📚", ordem: nextOrdem });
    setEditingId(null);
    setShowForm(false);
  }, [nextOrdem]);

  const handleSave = useCallback(() => {
    if (!formData.nome.trim()) {
      Alert.alert("Erro", "Nome do módulo é obrigatório");
      return;
    }

    if (editingId) {
      setModulos((prev) =>
        prev.map((m) =>
          m.id === editingId
            ? {
                ...m,
                nome: formData.nome.trim(),
                descricao: formData.descricao.trim(),
                icone: formData.icone || "📚",
                ordem: Number(formData.ordem) || m.ordem,
                dataAtualizacao: Date.now(),
                syncStatus: "pendente",
              }
            : m
        )
      );
    } else {
      const novoModulo: Modulo = {
        id: Date.now().toString(),
        nome: formData.nome.trim(),
        descricao: formData.descricao.trim(),
        icone: formData.icone || "📚",
        ordem: Number(formData.ordem) || nextOrdem,
        ativo: true,
        dataCriacao: Date.now(),
        dataAtualizacao: Date.now(),
        syncStatus: "pendente",
      };
      setModulos((prev) => [...prev, novoModulo]);
    }

    resetForm();
  }, [formData, editingId, nextOrdem, resetForm]);

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert("Confirmar", "Deseja deletar este módulo?", [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Deletar",
          style: "destructive",
          onPress: () => setModulos((prev) => prev.filter((m) => m.id !== id)),
        },
      ]);
    },
    []
  );

  const handleEdit = useCallback((modulo: Modulo) => {
    setFormData({
      nome: modulo.nome,
      descricao: modulo.descricao,
      icone: modulo.icone,
      ordem: modulo.ordem,
    });
    setEditingId(modulo.id);
    setShowForm(true);
  }, []);

  const renderModulo = useCallback(
    ({ item }: { item: Modulo }) => {
      const statusLabel = item.syncStatus === "sincronizado" ? "✓" : item.syncStatus === "pendente" ? "⏳" : "✕";
      const statusColor =
        item.syncStatus === "sincronizado" ? colors.success : item.syncStatus === "pendente" ? colors.warning : colors.error;

      return (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>
                {item.icone} {item.nome}
              </Text>
              <Text style={styles.cardSubtitle}>{item.descricao}</Text>
            </View>

            <View style={[styles.statusPill, { backgroundColor: statusColor + "20" }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={() => handleEdit(item)}>
              <Text style={styles.actionText}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.error }]} onPress={() => handleDelete(item.id)}>
              <Text style={styles.actionText}>Deletar</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [colors, handleDelete, handleEdit, styles]
  );

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Módulos</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>
        </View>

        {showForm ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>{editingId ? "Editar Módulo" : "Novo Módulo"}</Text>

            <Text style={styles.label}>Nome</Text>
            <TextInput
              value={formData.nome}
              onChangeText={(text) => setFormData((p) => ({ ...p, nome: text }))}
              placeholder="Nome do módulo"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />

            <Text style={styles.label}>Descrição</Text>
            <TextInput
              value={formData.descricao}
              onChangeText={(text) => setFormData((p) => ({ ...p, descricao: text }))}
              placeholder="Descrição"
              placeholderTextColor={colors.muted}
              style={[styles.input, styles.textarea]}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Ícone</Text>
            <TextInput
              value={formData.icone}
              onChangeText={(text) => setFormData((p) => ({ ...p, icone: text }))}
              placeholder="Emoji ou caractere"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />

            <View style={styles.formActions}>
              <TouchableOpacity style={[styles.formBtn, { backgroundColor: colors.primary }]} onPress={handleSave}>
                <Text style={styles.formBtnText}>Salvar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.formBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
                onPress={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({ nome: "", descricao: "", icone: "📚", ordem: modulos.length + 1 });
                }}
              >
                <Text style={[styles.formBtnText, { color: colors.foreground }]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={[styles.newBtn, { backgroundColor: colors.primary }]} onPress={() => setShowForm(true)}>
            <Text style={styles.newBtnText}>+ Novo Módulo</Text>
          </TouchableOpacity>
        )}

        <FlatList data={modulos} renderItem={renderModulo} keyExtractor={(item) => item.id} scrollEnabled={false} />
      </ScrollView>
    </ScreenContainer>
  );
}

const createStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { padding: 16 },
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    title: { fontSize: 22, fontWeight: "700", color: colors.foreground },
    backBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    backText: { color: colors.foreground },

    formCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
    formTitle: { fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 12 },
    label: { fontSize: 13, color: colors.muted, marginBottom: 6 },
    input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground, marginBottom: 12 },
    textarea: { minHeight: 80 },

    formActions: { flexDirection: "row", gap: 8 },
    formBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: "center" },
    formBtnText: { color: "#fff", fontWeight: "700" },

    newBtn: { borderRadius: 10, padding: 12, marginBottom: 12, alignItems: "center" },
    newBtnText: { color: "#fff", fontWeight: "700" },

    card: { backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
    cardHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
    cardTitle: { fontSize: 16, fontWeight: "700", color: colors.foreground },
    cardSubtitle: { fontSize: 12, color: colors.muted, marginTop: 4 },

    statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignItems: "center", justifyContent: "center" },
    statusText: { fontSize: 12, fontWeight: "700" },

    cardActions: { flexDirection: "row", gap: 8, marginTop: 8 },
    actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
    actionText: { color: "#fff", fontWeight: "700" },
  });
