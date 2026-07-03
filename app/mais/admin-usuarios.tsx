/**
 * admin-usuarios.tsx — Gestão de Usuários (Administrador)
 * Tela funcional com CRUD real via tRPC. Protegida por RouteGuard requireAdmin.
 */
import React, { useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  Modal, ScrollView, ActivityIndicator, Alert, StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { RouteGuard } from "@/components/route-guard";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const TIPO_LABELS: Record<string, string> = {
  administrador: "Administrador", tecnico: "Técnico",
  produtor: "Produtor", parceiro: "Parceiro", comprador: "Comprador",
};
const TIPO_CORES: Record<string, string> = {
  administrador: "#7C3AED", tecnico: "#2563EB",
  produtor: "#16A34A", parceiro: "#D97706", comprador: "#DC2626",
};
const STATUS_LABELS: Record<string, string> = { ativo: "Ativo", inativo: "Inativo", suspenso: "Suspenso" };
const STATUS_CORES: Record<string, string> = { ativo: "#16A34A", inativo: "#6B7280", suspenso: "#DC2626" };

type UsuarioItem = {
  userId: number; name: string | null; email: string | null;
  role: "user" | "admin"; perfilId: number | null;
  tipoUsuario: string | null; status: string | null; lastSignedIn: Date;
};

function AdminUsuariosContent() {
  const colors = useColors();
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [filtroRole, setFiltroRole] = useState<"user" | "admin" | undefined>(undefined);
  const [filtroStatus, setFiltroStatus] = useState<"ativo" | "inativo" | "suspenso" | undefined>(undefined);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<UsuarioItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { data, isLoading, error, refetch } = trpc.auth.admin.usuarios.listar.useQuery({
    busca: busca || undefined, role: filtroRole, status: filtroStatus, limit: 100, offset: 0,
  });
  const statsQuery = trpc.auth.admin.stats.usuarios.useQuery();

  const setRoleMutation = trpc.auth.admin.usuarios.setRole.useMutation({
    onSuccess: () => { refetch(); Alert.alert("✅ Role atualizado!"); },
    onError: (err: { message: string }) => Alert.alert("Erro", err.message),
  });
  const setStatusMutation = trpc.auth.admin.usuarios.setStatus.useMutation({
    onSuccess: () => { refetch(); Alert.alert("✅ Status atualizado!"); },
    onError: (err: { message: string }) => Alert.alert("Erro", err.message),
  });
  const setTipoMutation = trpc.auth.admin.usuarios.setTipo.useMutation({
    onSuccess: () => { refetch(); Alert.alert("✅ Tipo atualizado!"); },
    onError: (err: { message: string }) => Alert.alert("Erro", err.message),
  });

  const usuarios = (data?.usuarios ?? []) as UsuarioItem[];
  const stats = statsQuery.data;

  function handlePromoverAdmin(u: UsuarioItem) {
    const novoRole = u.role === "admin" ? "user" : "admin";
    const acao = novoRole === "admin" ? "promover a administrador" : "remover como administrador";
    Alert.alert("Confirmar", `Deseja ${acao} "${u.name ?? u.email}"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Confirmar", onPress: () => setRoleMutation.mutate({ userId: u.userId, role: novoRole }) },
    ]);
  }

  function handleSetStatus(u: UsuarioItem, status: "ativo" | "inativo" | "suspenso") {
    if (!u.perfilId) { Alert.alert("Este usuário não possui perfil AFU."); return; }
    Alert.alert("Confirmar", `Alterar status para "${STATUS_LABELS[status]}"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Confirmar", onPress: () => setStatusMutation.mutate({ perfilId: u.perfilId!, status }) },
    ]);
  }

  function handleSetTipo(u: UsuarioItem, tipo: string) {
    if (!u.perfilId) { Alert.alert("Este usuário não possui perfil AFU."); return; }
    setTipoMutation.mutate({ perfilId: u.perfilId, tipoUsuario: tipo as any });
  }

  const styles = StyleSheet.create({
    searchInput: {
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
      borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
      fontSize: 14, color: colors.foreground, flex: 1,
    },
    filterBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: colors.border, marginRight: 8 },
    filterBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    card: { backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  });

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ backgroundColor: "#1B5E20", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "700" }}>Gestão de Usuários</Text>
          <Text style={{ color: "#A5D6A7", fontSize: 12, marginTop: 2 }}>{data?.total ?? 0} usuários cadastrados</Text>
        </View>
        <TouchableOpacity onPress={() => refetch()} style={{ padding: 6 }}>
          <Text style={{ color: "#A5D6A7", fontSize: 20 }}>↻</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* Stats */}
        {stats && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {[
              { label: "Total", value: stats.totalUsuarios, cor: "#1565C0" },
              { label: "Admins", value: stats.totalAdmins, cor: "#7C3AED" },
              { label: "Ativos", value: stats.totalAtivos, cor: "#16A34A" },
              { label: "Suspensos", value: stats.totalSuspensos, cor: "#DC2626" },
              { label: "Sem Perfil", value: stats.totalSemPerfil, cor: "#D97706" },
            ].map((s) => (
              <View key={s.label} style={{ backgroundColor: s.cor + "15", borderRadius: 10, padding: 12, marginRight: 10, minWidth: 80, alignItems: "center", borderWidth: 1, borderColor: s.cor + "40" }}>
                <Text style={{ fontSize: 22, fontWeight: "800", color: s.cor }}>{s.value}</Text>
                <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{s.label}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Busca */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <TextInput style={styles.searchInput} placeholder="Buscar por nome ou e-mail..." placeholderTextColor={colors.muted} value={busca} onChangeText={setBusca} />
        </View>

        {/* Filtros */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          {([undefined, "user", "admin"] as const).map((r) => (
            <TouchableOpacity key={r ?? "todos"} style={[styles.filterBtn, filtroRole === r && styles.filterBtnActive]} onPress={() => setFiltroRole(r)}>
              <Text style={{ fontSize: 12, color: filtroRole === r ? "#FFFFFF" : colors.muted, fontWeight: "600" }}>
                {r === undefined ? "Todos" : r === "admin" ? "🔑 Admin" : "👤 Usuário"}
              </Text>
            </TouchableOpacity>
          ))}
          {([undefined, "ativo", "suspenso", "inativo"] as const).map((s) => (
            <TouchableOpacity key={s ?? "todos-status"} style={[styles.filterBtn, filtroStatus === s && styles.filterBtnActive]} onPress={() => setFiltroStatus(s)}>
              <Text style={{ fontSize: 12, color: filtroStatus === s ? "#FFFFFF" : colors.muted, fontWeight: "600" }}>
                {s === undefined ? "Todos status" : STATUS_LABELS[s]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Lista */}
        {isLoading ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.muted, marginTop: 12 }}>Carregando usuários...</Text>
          </View>
        ) : error ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>⚠️</Text>
            <Text style={{ color: colors.error, textAlign: "center" }}>{error.message}</Text>
            <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 12, backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}>
              <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : usuarios.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>👥</Text>
            <Text style={{ color: colors.muted }}>Nenhum usuário encontrado</Text>
          </View>
        ) : (
          <FlatList
            data={usuarios}
            keyExtractor={(item) => String(item.userId)}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.card} onPress={() => { setUsuarioSelecionado(item); setModalVisible(true); }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>{item.name ?? "Sem nome"}</Text>
                    <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{item.email ?? "Sem e-mail"}</Text>
                  </View>
                  {item.role === "admin" && (
                    <View style={{ backgroundColor: "#7C3AED20", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 8 }}>
                      <Text style={{ color: "#7C3AED", fontSize: 11, fontWeight: "700" }}>🔑 Admin</Text>
                    </View>
                  )}
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {item.tipoUsuario ? (
                    <View style={{ backgroundColor: (TIPO_CORES[item.tipoUsuario] ?? "#6B7280") + "20", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
                      <Text style={{ color: TIPO_CORES[item.tipoUsuario] ?? "#6B7280", fontSize: 11, fontWeight: "600" }}>
                        {TIPO_LABELS[item.tipoUsuario] ?? item.tipoUsuario}
                      </Text>
                    </View>
                  ) : (
                    <View style={{ backgroundColor: "#D9770620", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
                      <Text style={{ color: "#D97706", fontSize: 11, fontWeight: "600" }}>Sem perfil</Text>
                    </View>
                  )}
                  {item.status && (
                    <View style={{ backgroundColor: (STATUS_CORES[item.status] ?? "#6B7280") + "20", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
                      <Text style={{ color: STATUS_CORES[item.status] ?? "#6B7280", fontSize: 11, fontWeight: "600" }}>
                        {STATUS_LABELS[item.status] ?? item.status}
                      </Text>
                    </View>
                  )}
                  <Text style={{ fontSize: 11, color: colors.muted, marginLeft: "auto" }}>
                    {new Date(item.lastSignedIn).toLocaleDateString("pt-BR")}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </ScrollView>

      {/* Modal de ações */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: "85%" }}>
            <ScrollView>
              {usuarioSelecionado && (
                <>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>{usuarioSelecionado.name ?? "Sem nome"}</Text>
                      <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>{usuarioSelecionado.email ?? "Sem e-mail"}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 8 }}>
                      <Text style={{ fontSize: 20, color: colors.muted }}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Info */}
                  <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 16 }}>
                    {[
                      { label: "ID", value: String(usuarioSelecionado.userId) },
                      { label: "Role OAuth", value: usuarioSelecionado.role === "admin" ? "🔑 Admin" : "👤 Usuário" },
                      { label: "Tipo AFU", value: usuarioSelecionado.tipoUsuario ? TIPO_LABELS[usuarioSelecionado.tipoUsuario] : "Sem perfil" },
                      { label: "Status", value: usuarioSelecionado.status ? STATUS_LABELS[usuarioSelecionado.status] : "Sem perfil" },
                      { label: "Último acesso", value: new Date(usuarioSelecionado.lastSignedIn).toLocaleString("pt-BR") },
                    ].map((row) => (
                      <View key={row.label} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                        <Text style={{ fontSize: 13, color: colors.muted }}>{row.label}</Text>
                        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>{row.value}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Alterar Role */}
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>Alterar Role</Text>
                  <TouchableOpacity
                    onPress={() => handlePromoverAdmin(usuarioSelecionado)}
                    style={{ backgroundColor: usuarioSelecionado.role === "admin" ? "#DC262615" : "#7C3AED15", borderRadius: 10, padding: 12, alignItems: "center", borderWidth: 1, borderColor: usuarioSelecionado.role === "admin" ? "#DC2626" : "#7C3AED", marginBottom: 16 }}
                  >
                    <Text style={{ color: usuarioSelecionado.role === "admin" ? "#DC2626" : "#7C3AED", fontWeight: "700", fontSize: 13 }}>
                      {usuarioSelecionado.role === "admin" ? "Remover Admin" : "Promover a Admin"}
                    </Text>
                  </TouchableOpacity>

                  {/* Alterar Status */}
                  {usuarioSelecionado.perfilId && (
                    <>
                      <Text style={{ fontSize: 13, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>Alterar Status</Text>
                      <View style={{ flexDirection: "row", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                        {(["ativo", "inativo", "suspenso"] as const).map((s) => (
                          <TouchableOpacity key={s} onPress={() => handleSetStatus(usuarioSelecionado, s)}
                            style={{ backgroundColor: (STATUS_CORES[s]) + "15", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: STATUS_CORES[s], opacity: usuarioSelecionado.status === s ? 0.5 : 1 }}>
                            <Text style={{ color: STATUS_CORES[s], fontWeight: "700", fontSize: 13 }}>{STATUS_LABELS[s]}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <Text style={{ fontSize: 13, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>Alterar Tipo</Text>
                      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                        {Object.entries(TIPO_LABELS).map(([tipo, label]) => (
                          <TouchableOpacity key={tipo} onPress={() => handleSetTipo(usuarioSelecionado, tipo)}
                            style={{ backgroundColor: (TIPO_CORES[tipo] ?? "#6B7280") + "15", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: TIPO_CORES[tipo] ?? "#6B7280", opacity: usuarioSelecionado.tipoUsuario === tipo ? 0.5 : 1 }}>
                            <Text style={{ color: TIPO_CORES[tipo] ?? "#6B7280", fontWeight: "600", fontSize: 12 }}>{label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

export default function AdminUsuariosScreen() {
  return (
    <RouteGuard requireAuth requireAdmin>
      <AdminUsuariosContent />
    </RouteGuard>
  );
}
