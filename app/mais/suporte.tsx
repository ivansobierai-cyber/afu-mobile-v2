import { useState } from "react";
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
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

type AbaSuporte = "chat" | "chamado" | "duvida" | "visita";

interface Chamado {
  id: string;
  titulo: string;
  descricao: string;
  status: "aberto" | "em_andamento" | "resolvido";
  prioridade: "baixa" | "normal" | "alta";
  createdAt: string;
}

const CHAMADOS_DEMO: Chamado[] = [
  {
    id: "c1",
    titulo: "Manchas amarelas nas folhas de soja",
    descricao: "Apareceram manchas amarelas nas folhas superiores após a última chuva.",
    status: "em_andamento",
    prioridade: "alta",
    createdAt: "2026-06-10T10:00:00Z",
  },
  {
    id: "c2",
    titulo: "Dúvida sobre adubação de cobertura",
    descricao: "Quando devo aplicar a ureia no milho em estágio V4?",
    status: "resolvido",
    prioridade: "normal",
    createdAt: "2026-06-05T14:30:00Z",
  },
];

const MENSAGENS_DEMO = [
  { id: "1", autor: "sistema", texto: "Olá! Sou o assistente técnico do AFU. Como posso ajudar você hoje?", hora: "09:00" },
  { id: "2", autor: "usuario", texto: "Tenho dúvidas sobre o diagnóstico que fiz ontem na soja.", hora: "09:01" },
  { id: "3", autor: "sistema", texto: "Claro! Pode me descrever o que observou nas plantas? Qual parte estava com problema?", hora: "09:01" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  aberto: { label: "Aberto", color: "#D97706", bg: "#FEF3C7" },
  em_andamento: { label: "Em andamento", color: "#2563EB", bg: "#DBEAFE" },
  resolvido: { label: "Resolvido", color: "#16A34A", bg: "#D1FAE5" },
};

const PRIORIDADE_CONFIG: Record<string, { label: string; color: string }> = {
  baixa: { label: "Baixa", color: "#6B7280" },
  normal: { label: "Normal", color: "#2563EB" },
  alta: { label: "Alta", color: "#EF4444" },
};

export default function SuporteScreen() {
  const colors = useColors();
  const router = useRouter();
  const [aba, setAba] = useState<AbaSuporte>("chat");
  const [mensagem, setMensagem] = useState("");
  const [mensagens, setMensagens] = useState(MENSAGENS_DEMO);

  // Formulário de chamado
  const [tituloChamado, setTituloChamado] = useState("");
  const [descChamado, setDescChamado] = useState("");
  const [prioridade, setPrioridade] = useState<"baixa" | "normal" | "alta">("normal");

  // Formulário de dúvida
  const [duvida, setDuvida] = useState("");
  const [culturaDuvida, setCulturaDuvida] = useState("");

  // Formulário de visita
  const [dataVisita, setDataVisita] = useState("");
  const [motivoVisita, setMotivoVisita] = useState("");

  const enviarMensagem = () => {
    if (!mensagem.trim()) return;
    const nova = { id: Date.now().toString(), autor: "usuario", texto: mensagem.trim(), hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) };
    setMensagens((prev) => [...prev, nova]);
    setMensagem("");
    // Simulated response
    setTimeout(() => {
      setMensagens((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), autor: "sistema", texto: "Obrigado pela informação! Um técnico especializado irá analisar seu caso e responder em breve.", hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) },
      ]);
    }, 1200);
  };

  const abrirChamado = () => {
    if (!tituloChamado.trim() || !descChamado.trim()) {
      Alert.alert("Preencha o título e a descrição do chamado.");
      return;
    }
    Alert.alert("Chamado aberto!", "Seu chamado foi registrado com sucesso. Um técnico entrará em contato em até 24 horas.", [
      { text: "OK", onPress: () => { setTituloChamado(""); setDescChamado(""); setAba("chamado"); } },
    ]);
  };

  const enviarDuvida = () => {
    if (!duvida.trim()) {
      Alert.alert("Descreva sua dúvida.");
      return;
    }
    Alert.alert("Dúvida enviada!", "Sua dúvida foi enviada para nossa equipe técnica. Você receberá uma resposta por e-mail em até 48 horas.");
    setDuvida("");
    setCulturaDuvida("");
  };

  const agendarVisita = () => {
    if (!dataVisita.trim() || !motivoVisita.trim()) {
      Alert.alert("Preencha a data e o motivo da visita.");
      return;
    }
    Alert.alert("Visita agendada!", `Sua visita técnica foi solicitada para ${dataVisita}. Um técnico confirmará o agendamento em breve.`);
    setDataVisita("");
    setMotivoVisita("");
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

  return (
    <ScreenContainer>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* Header */}
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

        {/* Abas */}
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

        {/* Conteúdo das abas */}
        {aba === "chat" && (
          <View style={{ flex: 1 }}>
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
                    borderWidth: msg.autor === "sistema" ? 1 : 0,
                    borderColor: colors.border,
                  }}
                >
                  {msg.autor === "sistema" && (
                    <View style={{ flexDirection: "row", gap: 6, alignItems: "center", marginBottom: 4 }}>
                      <IconSymbol name="leaf.fill" size={12} color={colors.primary} />
                      <Text style={{ fontSize: 11, fontWeight: "700", color: colors.primary }}>Assistente AFU</Text>
                    </View>
                  )}
                  <Text style={{ fontSize: 14, color: msg.autor === "usuario" ? "#FFFFFF" : colors.foreground, lineHeight: 20 }}>{msg.texto}</Text>
                  <Text style={{ fontSize: 10, color: msg.autor === "usuario" ? "rgba(255,255,255,0.7)" : colors.muted, marginTop: 4, textAlign: "right" }}>{msg.hora}</Text>
                </View>
              ))}
            </ScrollView>
            <View style={{ flexDirection: "row", gap: 10, padding: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background }}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0, paddingVertical: 10 }]}
                value={mensagem}
                onChangeText={setMensagem}
                placeholder="Digite sua mensagem..."
                placeholderTextColor={colors.muted}
                returnKeyType="send"
                onSubmitEditing={enviarMensagem}
              />
              <TouchableOpacity
                style={{ backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" }}
                onPress={enviarMensagem}
              >
                <IconSymbol name="paperplane.fill" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {aba === "chamado" && (
          <ScrollView contentContainerStyle={{ padding: 16 }}>
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

            <TouchableOpacity style={{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center" }} onPress={abrirChamado}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>Abrir Chamado</Text>
            </TouchableOpacity>

            {/* Chamados existentes */}
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginTop: 28, marginBottom: 12 }}>Meus Chamados</Text>
            {CHAMADOS_DEMO.map((c) => (
              <View key={c.id} style={styles.card}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, flex: 1, marginRight: 8 }}>{c.titulo}</Text>
                  <View style={{ backgroundColor: STATUS_CONFIG[c.status].bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: STATUS_CONFIG[c.status].color }}>{STATUS_CONFIG[c.status].label}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 18 }} numberOfLines={2}>{c.descricao}</Text>
                <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
                  <Text style={{ fontSize: 11, color: PRIORIDADE_CONFIG[c.prioridade].color, fontWeight: "600" }}>● {PRIORIDADE_CONFIG[c.prioridade].label}</Text>
                  <Text style={{ fontSize: 11, color: colors.muted }}>{new Date(c.createdAt).toLocaleDateString("pt-BR")}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {aba === "duvida" && (
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <View style={{ backgroundColor: colors.primary + "10", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.primary + "30", marginBottom: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary, marginBottom: 4 }}>Enviar Dúvida Técnica</Text>
              <Text style={{ fontSize: 13, color: colors.foreground, lineHeight: 20 }}>Nossa equipe de agrônomos responde em até 48 horas por e-mail.</Text>
            </View>

            <Text style={styles.label}>Cultura relacionada</Text>
            <TextInput style={styles.input} value={culturaDuvida} onChangeText={setCulturaDuvida} placeholder="Ex: Soja, Milho, Cana..." placeholderTextColor={colors.muted} returnKeyType="next" />

            <Text style={styles.label}>Sua dúvida *</Text>
            <TextInput style={[styles.input, { height: 120, textAlignVertical: "top" }]} value={duvida} onChangeText={setDuvida} placeholder="Descreva sua dúvida técnica com o máximo de detalhes possível..." placeholderTextColor={colors.muted} multiline />

            <TouchableOpacity style={{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center" }} onPress={enviarDuvida}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>Enviar Dúvida</Text>
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

            <TouchableOpacity style={{ backgroundColor: "#16A34A", borderRadius: 12, paddingVertical: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }} onPress={agendarVisita}>
              <IconSymbol name="calendar" size={18} color="#FFFFFF" />
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>Agendar Visita</Text>
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
