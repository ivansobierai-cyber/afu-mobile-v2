import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

type AbaSuporte = "chat" | "chamado" | "duvida" | "visita";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  aberto: { label: "Aberto", color: "#D97706", bg: "#FEF3C7" },
  em_andamento: { label: "Em andamento", color: "#2563EB", bg: "#DBEAFE" },
  resolvido: { label: "Resolvido", color: "#16A34A", bg: "#D1FAE5" },
  cancelado: { label: "Cancelado", color: "#6B7280", bg: "#F3F4F6" },
};

const PRIORIDADE_CONFIG: Record<string, { label: string; color: string }> = {
  baixa: { label: "Baixa", color: "#6B7280" },
  normal: { label: "Normal", color: "#2563EB" },
  alta: { label: "Alta", color: "#EF4444" },
};

const WELCOME_MSG = {
  id: "welcome",
  autor: "sistema" as const,
  texto: "Olá! Sou o assistente técnico do AFU. Como posso ajudar você hoje?",
  hora: "—",
};

export default function SuporteScreen() {
  const colors = useColors();
  const router = useRouter();
  const utils = trpc.useUtils();
  const [aba, setAba] = useState<AbaSuporte>("chat");
  const [mensagem, setMensagem] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [saving, setSaving] = useState(false);

  const [tituloChamado, setTituloChamado] = useState("");
  const [descChamado, setDescChamado] = useState("");
  const [prioridade, setPrioridade] = useState<"baixa" | "normal" | "alta">("normal");

  const [duvida, setDuvida] = useState("");
  const [culturaDuvida, setCulturaDuvida] = useState("");

  const [dataVisita, setDataVisita] = useState("");
  const [motivoVisita, setMotivoVisita] = useState("");

  const { data: tickets = [], isLoading: loadingTickets, refetch: refetchTickets } =
    trpc.secondaryData.suporte.listTickets.useQuery();
  const { data: mensagensDb = [], isLoading: loadingMsgs, refetch: refetchMsgs } =
    trpc.secondaryData.suporte.listMensagens.useQuery();

  const createTicket = trpc.secondaryData.suporte.createTicket.useMutation({
    onSuccess: () => utils.secondaryData.suporte.listTickets.invalidate(),
  });
  const enviarMensagemMutation = trpc.secondaryData.suporte.enviarMensagem.useMutation({
    onSuccess: () => utils.secondaryData.suporte.listMensagens.invalidate(),
  });

  const chamados = tickets.filter((t) => t.tipo === "chamado" || t.tipo === "duvida" || t.tipo === "visita");

  const mensagens = mensagensDb.length === 0
    ? [WELCOME_MSG]
    : mensagensDb.map((m) => ({
        id: String(m.id),
        autor: m.autor as "usuario" | "sistema" | "tecnico",
        texto: m.texto,
        hora: m.createdAt
          ? new Date(m.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
          : "—",
      }));

  useEffect(() => {
    if (aba === "chamado") refetchTickets();
    if (aba === "chat") refetchMsgs();
  }, [aba, refetchTickets, refetchMsgs]);

  const enviarMensagem = async () => {
    if (!mensagem.trim() || sendingChat) return;
    setSendingChat(true);
    try {
      await enviarMensagemMutation.mutateAsync({ texto: mensagem.trim() });
      setMensagem("");
    } catch (e: any) {
      Alert.alert("Erro", e.message ?? "Não foi possível enviar a mensagem.");
    } finally {
      setSendingChat(false);
    }
  };

  const abrirChamado = async () => {
    if (!tituloChamado.trim() || !descChamado.trim()) {
      Alert.alert("Preencha o título e a descrição do chamado.");
      return;
    }
    setSaving(true);
    try {
      await createTicket.mutateAsync({
        tipo: "chamado",
        titulo: tituloChamado.trim(),
        descricao: descChamado.trim(),
        prioridade,
      });
      setTituloChamado("");
      setDescChamado("");
      setPrioridade("normal");
      Alert.alert("Chamado aberto!", "Seu chamado foi registrado. Um técnico entrará em contato em até 24 horas.");
    } catch (e: any) {
      Alert.alert("Erro", e.message ?? "Não foi possível abrir o chamado.");
    } finally {
      setSaving(false);
    }
  };

  const enviarDuvida = async () => {
    if (!duvida.trim()) {
      Alert.alert("Descreva sua dúvida.");
      return;
    }
    setSaving(true);
    try {
      await createTicket.mutateAsync({
        tipo: "duvida",
        titulo: culturaDuvida.trim() ? `Dúvida: ${culturaDuvida.trim()}` : "Dúvida técnica",
        descricao: duvida.trim(),
        prioridade: "normal",
        culturaRelacionada: culturaDuvida.trim() || undefined,
      });
      setDuvida("");
      setCulturaDuvida("");
      Alert.alert("Dúvida enviada!", "Sua dúvida foi registrada. Nossa equipe responderá em até 48 horas.");
    } catch (e: any) {
      Alert.alert("Erro", e.message ?? "Não foi possível enviar a dúvida.");
    } finally {
      setSaving(false);
    }
  };

  const agendarVisita = async () => {
    if (!dataVisita.trim() || !motivoVisita.trim()) {
      Alert.alert("Preencha a data e o motivo da visita.");
      return;
    }
    setSaving(true);
    try {
      await createTicket.mutateAsync({
        tipo: "visita",
        titulo: `Visita técnica — ${dataVisita.trim()}`,
        descricao: motivoVisita.trim(),
        prioridade: "alta",
        dataVisita: dataVisita.trim(),
      });
      setDataVisita("");
      setMotivoVisita("");
      Alert.alert("Visita agendada!", `Sua visita técnica foi solicitada para ${dataVisita}. Um técnico confirmará em breve.`);
    } catch (e: any) {
      Alert.alert("Erro", e.message ?? "Não foi possível agendar a visita.");
    } finally {
      setSaving(false);
    }
  };

  const styles = StyleSheet.create({
    abaBtn: {
      flex: 1,
      paddingVertical: 10,
      alignItems: "center",
      borderBottomWidth: 2,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
      color: colors.foreground,
      marginBottom: 14,
    },
    label: { fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 6 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 10,
    },
  });

  const ABAS: { value: AbaSuporte; label: string; icon: string }[] = [
    { value: "chat", label: "Chat", icon: "paperplane.fill" },
    { value: "chamado", label: "Chamados", icon: "exclamationmark.triangle.fill" },
    { value: "duvida", label: "Dúvida", icon: "info.circle" },
    { value: "visita", label: "Visita", icon: "calendar" },
  ];

  const tipoLabel = (tipo: string) => {
    if (tipo === "duvida") return "Dúvida";
    if (tipo === "visita") return "Visita";
    return "Chamado";
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={{ backgroundColor: colors.primary, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 22, fontWeight: "700", color: "#FFFFFF" }}>Suporte Técnico</Text>
            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>Atendimento especializado</Text>
          </View>
          <View style={{ backgroundColor: "#22C55E", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#FFFFFF" }}>Online</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          {ABAS.map((a) => (
            <TouchableOpacity
              key={a.value}
              style={[styles.abaBtn, { borderBottomColor: aba === a.value ? colors.primary : "transparent" }]}
              onPress={() => setAba(a.value)}
            >
              <IconSymbol name={a.icon as any} size={16} color={aba === a.value ? colors.primary : colors.muted} />
              <Text style={{ fontSize: 11, fontWeight: "600", color: aba === a.value ? colors.primary : colors.muted, marginTop: 3 }}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {aba === "chat" && (
          <View style={{ flex: 1 }}>
            {loadingMsgs ? (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : (
              <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
                {mensagens.map((msg) => (
                  <View
                    key={msg.id}
                    style={{
                      alignSelf: msg.autor === "usuario" ? "flex-end" : "flex-start",
                      maxWidth: "80%",
                      backgroundColor: msg.autor === "usuario" ? colors.primary : colors.surface,
                      borderRadius: 14,
                      padding: 12,
                      borderWidth: msg.autor !== "usuario" ? 1 : 0,
                      borderColor: colors.border,
                    }}
                  >
                    {msg.autor !== "usuario" && (
                      <View style={{ flexDirection: "row", gap: 6, alignItems: "center", marginBottom: 4 }}>
                        <IconSymbol name="leaf.fill" size={12} color={colors.primary} />
                        <Text style={{ fontSize: 11, fontWeight: "700", color: colors.primary }}>
                          {msg.autor === "tecnico" ? "Técnico AFU" : "Assistente AFU"}
                        </Text>
                      </View>
                    )}
                    <Text style={{ fontSize: 14, color: msg.autor === "usuario" ? "#FFFFFF" : colors.foreground, lineHeight: 20 }}>{msg.texto}</Text>
                    <Text style={{ fontSize: 10, color: msg.autor === "usuario" ? "rgba(255,255,255,0.7)" : colors.muted, marginTop: 4, textAlign: "right" }}>{msg.hora}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
            <View style={{ flexDirection: "row", gap: 10, padding: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background }}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0, paddingVertical: 10 }]}
                value={mensagem}
                onChangeText={setMensagem}
                placeholder="Digite sua mensagem..."
                placeholderTextColor={colors.muted}
                returnKeyType="send"
                onSubmitEditing={enviarMensagem}
                editable={!sendingChat}
              />
              <TouchableOpacity
                style={{ backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 16, alignItems: "center", justifyContent: "center", opacity: sendingChat ? 0.7 : 1 }}
                onPress={enviarMensagem}
                disabled={sendingChat}
              >
                {sendingChat ? <ActivityIndicator color="#fff" size="small" /> : <IconSymbol name="paperplane.fill" size={18} color="#FFFFFF" />}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {aba === "chamado" && (
          <ScrollView
            contentContainerStyle={{ padding: 16 }}
            refreshControl={<RefreshControl refreshing={loadingTickets} onRefresh={refetchTickets} />}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 16 }}>Abrir Novo Chamado</Text>

            <Text style={styles.label}>Título do problema *</Text>
            <TextInput style={styles.input} value={tituloChamado} onChangeText={setTituloChamado} placeholder="Ex: Manchas nas folhas de soja" placeholderTextColor={colors.muted} returnKeyType="next" />

            <Text style={styles.label}>Descrição detalhada *</Text>
            <TextInput style={[styles.input, { height: 100, textAlignVertical: "top" }]} value={descChamado} onChangeText={setDescChamado} placeholder="Descreva o problema com detalhes: quando começou, onde está, o que já tentou..." placeholderTextColor={colors.muted} multiline />

            <Text style={styles.label}>Prioridade</Text>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
              {(["baixa", "normal", "alta"] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={{ flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, alignItems: "center", backgroundColor: prioridade === p ? PRIORIDADE_CONFIG[p].color + "15" : colors.surface, borderColor: prioridade === p ? PRIORIDADE_CONFIG[p].color : colors.border }}
                  onPress={() => setPrioridade(p)}
                >
                  <Text style={{ fontSize: 13, fontWeight: "700", color: prioridade === p ? PRIORIDADE_CONFIG[p].color : colors.muted, textTransform: "capitalize" }}>{PRIORIDADE_CONFIG[p].label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center", opacity: saving ? 0.7 : 1 }} onPress={abrirChamado} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>Abrir Chamado</Text>}
            </TouchableOpacity>

            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginTop: 28, marginBottom: 12 }}>Meus Tickets</Text>
            {loadingTickets ? (
              <ActivityIndicator color={colors.primary} />
            ) : chamados.length === 0 ? (
              <Text style={{ fontSize: 13, color: colors.muted }}>Nenhum ticket registrado ainda.</Text>
            ) : (
              chamados.map((c) => {
                const status = STATUS_CONFIG[c.status ?? "aberto"] ?? STATUS_CONFIG.aberto;
                const prio = PRIORIDADE_CONFIG[c.prioridade ?? "normal"] ?? PRIORIDADE_CONFIG.normal;
                return (
                  <View key={c.id} style={styles.card}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={{ fontSize: 11, fontWeight: "700", color: colors.primary, marginBottom: 2 }}>{tipoLabel(c.tipo)}</Text>
                        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>{c.titulo}</Text>
                      </View>
                      <View style={{ backgroundColor: status.bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Text style={{ fontSize: 11, fontWeight: "700", color: status.color }}>{status.label}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 18 }} numberOfLines={2}>{c.descricao}</Text>
                    <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
                      <Text style={{ fontSize: 11, color: prio.color, fontWeight: "600" }}>● {prio.label}</Text>
                      <Text style={{ fontSize: 11, color: colors.muted }}>
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString("pt-BR") : ""}
                      </Text>
                    </View>
                    {c.resposta && (
                      <View style={{ marginTop: 8, padding: 10, backgroundColor: colors.primary + "10", borderRadius: 8 }}>
                        <Text style={{ fontSize: 12, fontWeight: "700", color: colors.primary, marginBottom: 2 }}>Resposta técnica</Text>
                        <Text style={{ fontSize: 13, color: colors.foreground }}>{c.resposta}</Text>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>
        )}

        {aba === "duvida" && (
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <View style={{ backgroundColor: colors.primary + "10", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.primary + "30", marginBottom: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary, marginBottom: 4 }}>Enviar Dúvida Técnica</Text>
              <Text style={{ fontSize: 13, color: colors.foreground, lineHeight: 20 }}>Nossa equipe de agrônomos responde em até 48 horas.</Text>
            </View>

            <Text style={styles.label}>Cultura relacionada</Text>
            <TextInput style={styles.input} value={culturaDuvida} onChangeText={setCulturaDuvida} placeholder="Ex: Soja, Milho, Cana..." placeholderTextColor={colors.muted} returnKeyType="next" />

            <Text style={styles.label}>Sua dúvida *</Text>
            <TextInput style={[styles.input, { height: 120, textAlignVertical: "top" }]} value={duvida} onChangeText={setDuvida} placeholder="Descreva sua dúvida técnica com o máximo de detalhes possível..." placeholderTextColor={colors.muted} multiline />

            <TouchableOpacity style={{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center", opacity: saving ? 0.7 : 1 }} onPress={enviarDuvida} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>Enviar Dúvida</Text>}
            </TouchableOpacity>
          </ScrollView>
        )}

        {aba === "visita" && (
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <View style={{ backgroundColor: "#D1FAE5", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#BBF7D0", marginBottom: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#15803D", marginBottom: 4 }}>Agendar Visita Técnica</Text>
              <Text style={{ fontSize: 13, color: "#166534", lineHeight: 20 }}>Um técnico agrônomo visitará sua propriedade para análise in loco. Disponível de segunda a sexta, das 7h às 17h.</Text>
            </View>

            <Text style={styles.label}>Data desejada</Text>
            <TextInput style={styles.input} value={dataVisita} onChangeText={setDataVisita} placeholder="DD/MM/AAAA" placeholderTextColor={colors.muted} keyboardType="numeric" returnKeyType="next" />

            <Text style={styles.label}>Motivo da visita *</Text>
            <TextInput style={[styles.input, { height: 100, textAlignVertical: "top" }]} value={motivoVisita} onChangeText={setMotivoVisita} placeholder="Descreva o motivo da visita: problema identificado, análise preventiva, etc." placeholderTextColor={colors.muted} multiline />

            <TouchableOpacity style={{ backgroundColor: "#16A34A", borderRadius: 12, paddingVertical: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8, opacity: saving ? 0.7 : 1 }} onPress={agendarVisita} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : (
                <>
                  <IconSymbol name="calendar" size={18} color="#FFFFFF" />
                  <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>Agendar Visita</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={{ marginTop: 24, gap: 10 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 4 }}>Informações de Contato</Text>
              <View style={[styles.card, { flexDirection: "row", gap: 12, alignItems: "center" }]}>
                <IconSymbol name="phone.fill" size={20} color={colors.primary} />
                <View>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>Central de Atendimento</Text>
                  <Text style={{ fontSize: 13, color: colors.muted }}>(00) 0000-0000 · Seg–Sex 7h–17h</Text>
                </View>
              </View>
              <View style={[styles.card, { flexDirection: "row", gap: 12, alignItems: "center" }]}>
                <IconSymbol name="envelope.fill" size={20} color={colors.primary} />
                <View>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>E-mail Técnico</Text>
                  <Text style={{ fontSize: 13, color: colors.muted }}>suporte@afuagro.com.br</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
