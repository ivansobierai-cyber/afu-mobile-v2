import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useSession } from "@/hooks/use-session";
import { useAuthAPI } from "@/hooks/use-auth-api";
import { trpc } from "@/lib/trpc";

type PerfilData = {
  nome: string;
  email: string;
  telefone: string;
  funcao: string;
  cargo: string;
  empresa: string;
  registroProfissional: string;
};

const FUNCAO_OPTIONS = [
  { value: "produtor", label: "Produtor Rural", color: "#38A169" },
  { value: "tecnico", label: "Técnico / Agrônomo", color: "#3B82F6" },
  { value: "administrador", label: "Administrador", color: "#8B5CF6" },
];

export default function PerfilScreen() {
  const colors = useColors();
  const router = useRouter();
  const { perfil: sessionPerfil, user } = useSession();
  const { logout, isLoading: loggingOut } = useAuthAPI();
  const utils = trpc.useUtils();

  const upsertPerfil = trpc.auth.perfil.upsert.useMutation({
    onSuccess: async () => {
      await utils.auth.session.invalidate();
      setEditing(false);
      Alert.alert("Perfil salvo", "Suas informações foram atualizadas.");
    },
    onError: (err) => Alert.alert("Erro", err.message),
  });

  const { data: propriedades = [] } = trpc.coreData.propriedades.list.useQuery();
  const { data: cultivos = [] } = trpc.coreData.cultivos.list.useQuery();
  const { data: diagnosticos = [] } = trpc.diagnostico.historico.useQuery();
  const { data: eventos = [] } = trpc.coreData.calendario.list.useQuery();

  const stats = {
    propriedades: propriedades.length,
    cultivos: cultivos.filter((c) => c.status === "em_andamento").length,
    diagnosticos: diagnosticos.length,
    eventos: eventos.filter((e) => e.status === "pendente" || e.status === "em_andamento").length,
  };

  const [editing, setEditing] = useState(false);
  const [perfil, setPerfil] = useState<PerfilData>({
    nome: "",
    email: "",
    telefone: "",
    funcao: "produtor",
    cargo: "",
    empresa: "",
    registroProfissional: "",
  });
  const [form, setForm] = useState<PerfilData>(perfil);

  useEffect(() => {
    const merged: PerfilData = {
      nome: sessionPerfil?.nome ?? user?.name ?? "",
      email: sessionPerfil?.email ?? user?.email ?? "",
      telefone: sessionPerfil?.telefone ?? "",
      funcao: sessionPerfil?.tipoUsuario ?? "produtor",
      cargo: sessionPerfil?.cargo ?? "",
      empresa: "",
      registroProfissional: sessionPerfil?.registroProfissional ?? "",
    };
    setPerfil(merged);
    setForm(merged);
  }, [sessionPerfil, user]);

  const handleLogout = () => {
    Alert.alert("Sair da conta", "Deseja encerrar sua sessão?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/auth/login-new" as any);
        },
      },
    ]);
  };

  const handleSave = () => {
    if (!form.nome.trim()) {
      Alert.alert("Atenção", "Preencha o nome.");
      return;
    }
    setPerfil(form);
    upsertPerfil.mutate({
      nome: form.nome.trim(),
      email: form.email.trim() || undefined,
      telefone: form.telefone.trim() || undefined,
      tipoUsuario: form.funcao as "produtor" | "tecnico" | "administrador" | "parceiro" | "comprador",
      cargo: form.cargo.trim() || undefined,
      registroProfissional: form.registroProfissional.trim() || undefined,
    });
  };

  const funcaoInfo = FUNCAO_OPTIONS.find((f) => f.value === perfil.funcao) ?? FUNCAO_OPTIONS[0];

  const styles = StyleSheet.create({
    label: {
      fontSize: 12,
      color: colors.muted,
      marginBottom: 4,
      fontWeight: "600",
    },
    input: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.foreground,
      marginBottom: 14,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 12,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1,
      marginRight: 8,
      marginBottom: 8,
    },
  });

  return (
    <ScreenContainer>
      <View
        style={{
          backgroundColor: colors.primary,
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 20,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: "700", color: "#FFFFFF" }}>Meu Perfil</Text>
        </View>
        <TouchableOpacity
          style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, padding: 8 }}
          onPress={() => {
            if (editing) {
              setForm(perfil);
            }
            setEditing(!editing);
          }}
        >
          <IconSymbol name={editing ? "xmark" : "pencil"} size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={{ alignItems: "center", marginBottom: 20 }}>
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              backgroundColor: funcaoInfo.color + "20",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 3,
              borderColor: funcaoInfo.color,
            }}
          >
            <Text style={{ fontSize: 34, fontWeight: "700", color: funcaoInfo.color }}>
              {(perfil.nome || "U").charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: "700", color: colors.foreground, marginTop: 12 }}>
            {perfil.nome || "Seu Nome"}
          </Text>
          <View style={{ backgroundColor: funcaoInfo.color + "20", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, marginTop: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: funcaoInfo.color }}>{funcaoInfo.label}</Text>
          </View>
          {perfil.cargo && (
            <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>{perfil.cargo}</Text>
          )}
          {perfil.empresa && (
            <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>🏢 {perfil.empresa}</Text>
          )}
        </View>

        {/* Stats */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
          {[
            { label: "Propriedades", value: stats.propriedades, color: colors.primary },
            { label: "Cultivos Ativos", value: stats.cultivos, color: "#38A169" },
            { label: "Diagnósticos", value: stats.diagnosticos, color: "#8B5CF6" },
            { label: "Eventos Pend.", value: stats.eventos, color: "#D97706" },
          ].map((s) => (
            <View
              key={s.label}
              style={{
                flex: 1,
                backgroundColor: s.color + "10",
                borderRadius: 10,
                padding: 10,
                alignItems: "center",
                borderWidth: 1,
                borderColor: s.color + "30",
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: "700", color: s.color }}>{s.value}</Text>
              <Text style={{ fontSize: 9, color: colors.muted, textAlign: "center", marginTop: 2 }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {editing ? (
          <View>
            <Text style={styles.label}>Nome Completo *</Text>
            <TextInput
              style={styles.input}
              value={form.nome}
              onChangeText={(v) => setForm({ ...form, nome: v })}
              placeholder="Seu nome completo"
              placeholderTextColor={colors.muted}
              returnKeyType="next"
            />

            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              value={form.email}
              onChangeText={(v) => setForm({ ...form, email: v })}
              placeholder="seu@email.com"
              placeholderTextColor={colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />

            <Text style={styles.label}>Telefone / WhatsApp</Text>
            <TextInput
              style={styles.input}
              value={form.telefone}
              onChangeText={(v) => setForm({ ...form, telefone: v })}
              placeholder="(65) 99999-0000"
              placeholderTextColor={colors.muted}
              keyboardType="phone-pad"
              returnKeyType="next"
            />

            <Text style={styles.label}>Função / Perfil</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 14 }}>
              {FUNCAO_OPTIONS.map((f) => (
                <TouchableOpacity
                  key={f.value}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: form.funcao === f.value ? f.color : colors.surface,
                      borderColor: form.funcao === f.value ? f.color : colors.border,
                    },
                  ]}
                  onPress={() => setForm({ ...form, funcao: f.value })}
                >
                  <Text style={{ fontSize: 12, fontWeight: "600", color: form.funcao === f.value ? "#FFF" : colors.foreground }}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Cargo / Função</Text>
            <TextInput
              style={styles.input}
              value={form.cargo}
              onChangeText={(v) => setForm({ ...form, cargo: v })}
              placeholder="Ex: Engenheiro Agrônomo"
              placeholderTextColor={colors.muted}
              returnKeyType="next"
            />

            <Text style={styles.label}>Empresa / Propriedade</Text>
            <TextInput
              style={styles.input}
              value={form.empresa}
              onChangeText={(v) => setForm({ ...form, empresa: v })}
              placeholder="Nome da empresa ou fazenda"
              placeholderTextColor={colors.muted}
              returnKeyType="next"
            />

            <Text style={styles.label}>Registro Profissional (CREA/CRBio/CFT)</Text>
            <TextInput
              style={styles.input}
              value={form.registroProfissional}
              onChangeText={(v) => setForm({ ...form, registroProfissional: v })}
              placeholder="Ex: CREA-MT 123456"
              placeholderTextColor={colors.muted}
              returnKeyType="done"
            />

            <TouchableOpacity
              style={{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 8 }}
              onPress={handleSave}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>Salvar Perfil</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {[
              { icon: "envelope.fill", label: "E-mail", value: perfil.email || "—" },
              { icon: "phone.fill", label: "Telefone", value: perfil.telefone || "—" },
              { icon: "briefcase.fill", label: "Cargo", value: perfil.cargo || "—" },
              { icon: "building.2.fill", label: "Empresa", value: perfil.empresa || "—" },
              { icon: "doc.text.fill", label: "Registro Profissional", value: perfil.registroProfissional || "—" },
            ].map((item, idx, arr) => (
              <View
                key={item.label}
                style={[styles.infoRow, idx === arr.length - 1 && { borderBottomWidth: 0 }]}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: colors.primary + "15",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconSymbol name={item.icon as any} size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "500" }}>{item.label}</Text>
                  <Text style={{ fontSize: 15, color: colors.foreground, fontWeight: "600", marginTop: 2 }}>
                    {item.value}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Logout */}
        <TouchableOpacity
          style={{
            marginTop: 20,
            backgroundColor: colors.error + "12",
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: "center",
            borderWidth: 1,
            borderColor: colors.error + "40",
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
          }}
          onPress={handleLogout}
          disabled={loggingOut}
        >
          <IconSymbol name="arrow.right" size={18} color={colors.error} />
          <Text style={{ color: colors.error, fontWeight: "700", fontSize: 15 }}>
            {loggingOut ? "Saindo..." : "Sair da conta"}
          </Text>
        </TouchableOpacity>

        {/* App info */}
        <View
          style={{
            marginTop: 20,
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.muted, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Sobre o App
          </Text>
          <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 22 }}>
            <Text style={{ fontWeight: "700" }}>AFU Agro</Text> — Analisador Fitotécnico Universal{"\n"}
            Versão 1.0.0{"\n\n"}
            Plataforma AgTech para gestão rural integrada, diagnóstico vegetal por inteligência artificial e suporte à tomada de decisão agronômica.
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
            {["Gestão Rural", "IA Agronômica", "Diagnóstico Vegetal", "Calendário Agrícola"].map((tag) => (
              <View key={tag} style={{ backgroundColor: colors.primary + "15", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: colors.primary }}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
