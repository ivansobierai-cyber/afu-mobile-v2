import { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import { PRIORIDADES, TIPO_EVENTO } from "@/lib/eventos/constants";

export type EventoFormState = {
  titulo: string;
  tipoAtividade: string;
  prioridade: string;
  dataProgramada: string;
  descricao: string;
  lembreteAtivo: boolean;
  propriedadeId?: number;
  terrenoId?: number;
  culturaId?: number;
  safraId?: number;
  responsavelUserId?: number;
};

export const EMPTY_EVENTO_FORM: EventoFormState = {
  titulo: "",
  tipoAtividade: "plantio",
  prioridade: "normal",
  dataProgramada: "",
  descricao: "",
  lembreteAtivo: true,
};

type LinkOption = { id: number; label: string };

type Props = {
  visible: boolean;
  initial?: Partial<EventoFormState>;
  saving: boolean;
  onClose: () => void;
  onSave: (form: EventoFormState) => void;
  propriedades?: LinkOption[];
  terrenos?: LinkOption[];
  cultivos?: LinkOption[];
  safras?: LinkOption[];
  responsaveis?: LinkOption[];
  /** Notifica o parent para recarregar talhões/safras da propriedade escolhida. */
  onPropriedadeChange?: (propriedadeId?: number) => void;
};

function LinkChips({
  label,
  options,
  value,
  onChange,
  colors,
}: {
  label: string;
  options: LinkOption[];
  value?: number;
  onChange: (id?: number) => void;
  colors: ReturnType<typeof useColors>;
}) {
  if (!options.length) return null;
  return (
    <>
      <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4, fontWeight: "500" }}>
        {label}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        <TouchableOpacity
          onPress={() => onChange(undefined)}
          style={{
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderWidth: 1,
            backgroundColor: value == null ? colors.primary : colors.surface,
            borderColor: value == null ? colors.primary : colors.border,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: value == null ? "#fff" : colors.foreground,
            }}
          >
            —
          </Text>
        </TouchableOpacity>
        {options.map((opt) => {
          const active = value === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              onPress={() => onChange(opt.id)}
              style={{
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderWidth: 1,
                backgroundColor: active ? colors.primary : colors.surface,
                borderColor: active ? colors.primary : colors.border,
                maxWidth: 200,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: active ? "#fff" : colors.foreground,
                }}
                numberOfLines={1}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
}

export function EventoCreateModal({
  visible,
  initial,
  saving,
  onClose,
  onSave,
  propriedades = [],
  terrenos = [],
  cultivos = [],
  safras = [],
  responsaveis = [],
  onPropriedadeChange,
}: Props) {
  const colors = useColors();
  const [form, setForm] = useState<EventoFormState>(EMPTY_EVENTO_FORM);
  const initialKey = JSON.stringify(initial ?? {});

  useEffect(() => {
    if (visible) {
      setForm({ ...EMPTY_EVENTO_FORM, ...initial });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when sheet opens / seed changes
  }, [visible, initialKey]);

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: "90%",
      padding: 20,
    },
    sheetTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: 16,
    },
    label: {
      fontSize: 12,
      color: colors.muted,
      marginBottom: 4,
      fontWeight: "500",
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
      color: colors.foreground,
      marginBottom: 12,
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginBottom: 12,
    },
    chip: {
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderWidth: 1,
    },
    saveBtn: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 16,
    },
    saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    cancelBtn: {
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: "center",
      marginTop: 8,
    },
    cancelBtnText: { color: colors.muted, fontSize: 14 },
  });

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <ScrollView style={styles.sheet} keyboardShouldPersistTaps="handled">
          <Text style={styles.sheetTitle}>Novo Evento</Text>

          <Text style={styles.label}>Título *</Text>
          <TextInput
            style={styles.input}
            value={form.titulo}
            onChangeText={(v) => setForm((f) => ({ ...f, titulo: v }))}
            placeholder="Ex: Aplicação de fungicida"
            placeholderTextColor={colors.muted}
          />

          <Text style={styles.label}>Tipo</Text>
          <View style={styles.chipRow}>
            {TIPO_EVENTO.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      form.tipoAtividade === t.value ? t.color : colors.surface,
                    borderColor:
                      form.tipoAtividade === t.value ? t.color : colors.border,
                  },
                ]}
                onPress={() => setForm((f) => ({ ...f, tipoAtividade: t.value }))}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: form.tipoAtividade === t.value ? "#fff" : colors.foreground,
                  }}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Prioridade</Text>
          <View style={styles.chipRow}>
            {PRIORIDADES.map((p) => (
              <TouchableOpacity
                key={p.value}
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      form.prioridade === p.value ? p.color : colors.surface,
                    borderColor:
                      form.prioridade === p.value ? p.color : colors.border,
                  },
                ]}
                onPress={() => setForm((f) => ({ ...f, prioridade: p.value }))}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: form.prioridade === p.value ? "#fff" : colors.foreground,
                  }}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Data Programada * (AAAA-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={form.dataProgramada}
            onChangeText={(v) => setForm((f) => ({ ...f, dataProgramada: v }))}
            placeholder="Ex: 2026-07-15"
            placeholderTextColor={colors.muted}
          />

          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]}
            value={form.descricao}
            onChangeText={(v) => setForm((f) => ({ ...f, descricao: v }))}
            placeholder="Detalhes do evento..."
            placeholderTextColor={colors.muted}
            multiline
          />

            <LinkChips
              label="Propriedade"
              options={propriedades}
              value={form.propriedadeId}
              colors={colors}
              onChange={(id) => {
                setForm((f) => ({
                  ...f,
                  propriedadeId: id,
                  terrenoId: undefined,
                  culturaId: undefined,
                  safraId: undefined,
                }));
                onPropriedadeChange?.(id);
              }}
            />
            <LinkChips
              label="Talhão"
              options={terrenos}
              value={form.terrenoId}
              colors={colors}
              onChange={(id) => setForm((f) => ({ ...f, terrenoId: id }))}
            />
            <LinkChips
              label="Cultivo"
              options={cultivos}
              value={form.culturaId}
              colors={colors}
              onChange={(id) => setForm((f) => ({ ...f, culturaId: id }))}
            />
            <LinkChips
              label="Safra"
              options={safras}
              value={form.safraId}
              colors={colors}
              onChange={(id) => setForm((f) => ({ ...f, safraId: id }))}
            />
            <LinkChips
              label="Responsável"
              options={responsaveis}
              value={form.responsavelUserId}
              colors={colors}
              onChange={(id) => setForm((f) => ({ ...f, responsavelUserId: id }))}
            />

            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
              }}
              onPress={() =>
                setForm((f) => ({ ...f, lembreteAtivo: !f.lembreteAtivo }))
              }
            >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: colors.primary,
                backgroundColor: form.lembreteAtivo ? colors.primary : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {form.lembreteAtivo ? (
                <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>✓</Text>
              ) : null}
            </View>
            <Text style={{ fontSize: 14, color: colors.foreground }}>
              Lembrete local (1 dia antes)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={() => onSave(form)}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Salvar Evento</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}
