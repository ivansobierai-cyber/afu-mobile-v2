import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import { MODULE_COLORS } from "@/constants/module-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import {
  ETIQUETAS_SUGERIDAS,
  checklistProgress,
  newChecklistItem,
  parseChecklist,
  parseEtiquetas,
  type ChecklistItem,
} from "@/lib/eventos/produtividade";
import { getPrioridadeInfo, getTipoInfo } from "@/lib/eventos/constants";
import { formatShortDate } from "@/lib/eventos/date-utils";
import type { EventoItem } from "@/lib/eventos/types";

type Props = {
  visible: boolean;
  item: EventoItem | null;
  onClose: () => void;
  onSaved?: () => void;
};

/** Detalhe do evento — Etapa 8: etiquetas, checklist, comentários e anexos. */
export function EventoDetailModal({ visible, item, onClose, onSaved }: Props) {
  const colors = useColors();
  const utils = trpc.useUtils();
  const [tags, setTags] = useState<string[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newItemText, setNewItemText] = useState("");
  const [comentario, setComentario] = useState("");
  const [anexoNome, setAnexoNome] = useState("");
  const [anexoUrl, setAnexoUrl] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);

  const eventoId = item?.id;

  useEffect(() => {
    if (!item || !visible) return;
    setTags(parseEtiquetas(item.etiquetas));
    setChecklist(parseChecklist(item.checklistJson));
    setComentario("");
    setAnexoNome("");
    setAnexoUrl("");
  }, [item, visible]);

  const { data: comentarios = [], refetch: refetchComentarios } =
    trpc.coreData.calendario.listComentarios.useQuery(
      { eventoId: eventoId! },
      { enabled: visible && !!eventoId },
    );
  const { data: anexos = [], refetch: refetchAnexos } =
    trpc.coreData.calendario.listAnexos.useQuery(
      { eventoId: eventoId! },
      { enabled: visible && !!eventoId },
    );

  const updateMut = trpc.coreData.calendario.update.useMutation();
  const addComentarioMut = trpc.coreData.calendario.addComentario.useMutation();
  const deleteComentarioMut = trpc.coreData.calendario.deleteComentario.useMutation();
  const addAnexoMut = trpc.coreData.calendario.addAnexoLink.useMutation();
  const deleteAnexoMut = trpc.coreData.calendario.deleteAnexo.useMutation();

  const progress = useMemo(() => checklistProgress(checklist), [checklist]);
  const tipo = getTipoInfo(item?.tipoAtividade);
  const prioridade = getPrioridadeInfo(item?.prioridade);

  if (!item) return null;

  const persistMeta = async (nextTags = tags, nextChecklist = checklist) => {
    setSavingMeta(true);
    try {
      await updateMut.mutateAsync({
        id: item.id,
        data: {
          etiquetas: nextTags,
          checklist: nextChecklist,
        },
      });
      await utils.coreData.calendario.list.invalidate();
      onSaved?.();
    } catch (e: unknown) {
      Alert.alert("Erro", e instanceof Error ? e.message : "Falha ao salvar.");
    } finally {
      setSavingMeta(false);
    }
  };

  const toggleTag = (tag: string) => {
    const next = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
    setTags(next);
    void persistMeta(next, checklist);
  };

  const toggleCheck = (id: string) => {
    const next = checklist.map((c) => (c.id === id ? { ...c, feito: !c.feito } : c));
    setChecklist(next);
    void persistMeta(tags, next);
  };

  const addCheckItem = () => {
    if (!newItemText.trim()) return;
    const next = [...checklist, newChecklistItem(newItemText)];
    setChecklist(next);
    setNewItemText("");
    void persistMeta(tags, next);
  };

  const removeCheckItem = (id: string) => {
    const next = checklist.filter((c) => c.id !== id);
    setChecklist(next);
    void persistMeta(tags, next);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <ScrollView
          style={[styles.sheet, { backgroundColor: colors.background }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
              {item.titulo}
            </Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Fechar">
              <IconSymbol name="xmark" size={18} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <View style={styles.metaRow}>
            <View style={[styles.chip, { backgroundColor: `${tipo.color}22` }]}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: tipo.color }}>{tipo.label}</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: `${prioridade.color}22` }]}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: prioridade.color }}>
                {prioridade.label}
              </Text>
            </View>
            {item.dataProgramada ? (
              <Text style={{ fontSize: 12, color: colors.muted }}>
                {formatShortDate(item.dataProgramada)}
              </Text>
            ) : null}
            {savingMeta ? <ActivityIndicator size="small" color={MODULE_COLORS.eventos} /> : null}
          </View>

          {/* Etiquetas */}
          <Text style={[styles.section, { color: colors.foreground }]}>Etiquetas</Text>
          <View style={styles.chipRow}>
            {ETIQUETAS_SUGERIDAS.map((tag) => {
              const active = tags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? `${MODULE_COLORS.eventos}22` : colors.surface,
                      borderColor: active ? MODULE_COLORS.eventos : colors.border,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: active ? MODULE_COLORS.eventos : colors.foreground,
                    }}
                  >
                    #{tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Checklist */}
          <Text style={[styles.section, { color: colors.foreground }]}>
            Checklist {progress.total ? `(${progress.done}/${progress.total})` : ""}
          </Text>
          {checklist.map((c) => (
            <View key={c.id} style={styles.checkRow}>
              <TouchableOpacity
                onPress={() => toggleCheck(c.id)}
                style={[
                  styles.checkBox,
                  {
                    borderColor: c.feito ? colors.success : colors.border,
                    backgroundColor: c.feito ? colors.success : "transparent",
                  },
                ]}
              >
                {c.feito ? <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>✓</Text> : null}
              </TouchableOpacity>
              <Text
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: c.feito ? colors.muted : colors.foreground,
                  textDecorationLine: c.feito ? "line-through" : "none",
                }}
              >
                {c.texto}
              </Text>
              <TouchableOpacity onPress={() => removeCheckItem(c.id)} hitSlop={8}>
                <IconSymbol name="trash.fill" size={14} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.addRow}>
            <TextInput
              style={[
                styles.input,
                { flex: 1, color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface },
              ]}
              value={newItemText}
              onChangeText={setNewItemText}
              placeholder="Novo item…"
              placeholderTextColor={colors.muted}
            />
            <TouchableOpacity
              onPress={addCheckItem}
              style={[styles.addBtn, { backgroundColor: MODULE_COLORS.eventos }]}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* Comentários */}
          <Text style={[styles.section, { color: colors.foreground }]}>Comentários</Text>
          {comentarios.map((c) => (
            <View
              key={c.id}
              style={[styles.commentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: colors.foreground }}>
                  {c.autorNome ?? `User #${c.autorUserId}`}
                </Text>
                <TouchableOpacity
                  onPress={async () => {
                    await deleteComentarioMut.mutateAsync({ id: c.id });
                    await refetchComentarios();
                  }}
                >
                  <IconSymbol name="trash.fill" size={12} color={colors.error} />
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>{c.texto}</Text>
            </View>
          ))}
          <View style={styles.addRow}>
            <TextInput
              style={[
                styles.input,
                { flex: 1, color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface },
              ]}
              value={comentario}
              onChangeText={setComentario}
              placeholder="Escrever comentário…"
              placeholderTextColor={colors.muted}
            />
            <TouchableOpacity
              onPress={async () => {
                if (!comentario.trim() || !eventoId) return;
                await addComentarioMut.mutateAsync({ eventoId, texto: comentario.trim() });
                setComentario("");
                await refetchComentarios();
              }}
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>Enviar</Text>
            </TouchableOpacity>
          </View>

          {/* Anexos */}
          <Text style={[styles.section, { color: colors.foreground }]}>Anexos</Text>
          {anexos.map((a) => (
            <View
              key={a.id}
              style={[styles.commentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <IconSymbol name="doc.fill" size={14} color={MODULE_COLORS.eventos} />
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => {
                    if (a.url) void Linking.openURL(a.url);
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.foreground }}>{a.nome}</Text>
                  {a.url ? (
                    <Text style={{ fontSize: 11, color: colors.muted }} numberOfLines={1}>
                      {a.url}
                    </Text>
                  ) : null}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async () => {
                    await deleteAnexoMut.mutateAsync({ id: a.id });
                    await refetchAnexos();
                  }}
                >
                  <IconSymbol name="trash.fill" size={12} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <TextInput
            style={[
              styles.input,
              { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface },
            ]}
            value={anexoNome}
            onChangeText={setAnexoNome}
            placeholder="Nome do anexo"
            placeholderTextColor={colors.muted}
          />
          <View style={styles.addRow}>
            <TextInput
              style={[
                styles.input,
                { flex: 1, color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface },
              ]}
              value={anexoUrl}
              onChangeText={setAnexoUrl}
              placeholder="https://…"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={async () => {
                if (!anexoNome.trim() || !anexoUrl.trim() || !eventoId) return;
                try {
                  await addAnexoMut.mutateAsync({
                    eventoId,
                    nome: anexoNome.trim(),
                    url: anexoUrl.trim(),
                  });
                  setAnexoNome("");
                  setAnexoUrl("");
                  await refetchAnexos();
                } catch (e: unknown) {
                  Alert.alert("Erro", e instanceof Error ? e.message : "URL inválida");
                }
              }}
              style={[styles.addBtn, { backgroundColor: MODULE_COLORS.eventos }]}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>Link</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={{ color: colors.muted, fontWeight: "600" }}>Fechar</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { maxHeight: "92%", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18 },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 10 },
  title: { flex: 1, fontSize: 18, fontWeight: "800" },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 },
  section: { fontSize: 14, fontWeight: "800", marginTop: 14, marginBottom: 8 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  addRow: { flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 8,
  },
  addBtn: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  commentCard: { borderRadius: 12, borderWidth: 1, padding: 10, marginBottom: 8 },
  closeBtn: { alignItems: "center", paddingVertical: 16, marginBottom: 20 },
});
