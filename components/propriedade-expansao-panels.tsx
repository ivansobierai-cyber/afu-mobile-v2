import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { ScreenState } from "@/components/screen-state";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import {
  DEFAULT_ALERTA_PREFS,
  filtrarAlertasPorPreferencias,
  loadAlertaPreferencias,
  saveAlertaPreferencias,
  type AlertaPreferencias,
} from "@/lib/propriedades/alerta-preferencias";
import type { AlertaGravidade } from "@/lib/propriedades/alertas-engine";

const GRAVIDADE_COLOR: Record<string, string> = {
  critico: "#B71C1C",
  alto: "#EF6C00",
  atencao: "#F9A825",
  info: "#1565C0",
};

const MAQUINA_TIPOS = [
  "trator",
  "pulverizador",
  "colheitadeira",
  "caminhao",
  "implemento",
  "irrigacao",
  "outro",
] as const;

const MAQUINA_TIPO_LABEL: Record<(typeof MAQUINA_TIPOS)[number], string> = {
  trator: "Trator",
  pulverizador: "Pulverizador",
  colheitadeira: "Colheitadeira",
  caminhao: "Caminhão",
  implemento: "Implemento",
  irrigacao: "Irrigação",
  outro: "Outro",
};

const MAQUINA_STATUS_LABEL: Record<string, string> = {
  disponivel: "Disponível",
  em_uso: "Em uso",
  manutencao: "Manutenção",
  inativa: "Inativa",
};

const MAQUINA_STATUS_COLOR: Record<string, string> = {
  disponivel: "#2E7D32",
  em_uso: "#1565C0",
  manutencao: "#EF6C00",
  inativa: "#6B7280",
};

type AlertasFeedProps = {
  propriedadeId: number;
  onOpenOperacoes?: () => void;
};

export function PropriedadeAlertasFeed({ propriedadeId, onOpenOperacoes }: AlertasFeedProps) {
  const colors = useColors();
  const { data: session } = trpc.auth.session.useQuery(undefined, { staleTime: 60_000 });
  const userId = session?.user?.id;
  const organizationId = session?.activeOrganizationId;
  const [prefs, setPrefs] = useState<AlertaPreferencias>(DEFAULT_ALERTA_PREFS);
  const { data: alertas = [], isLoading, isError, refetch } = trpc.coreData.expansao.alertas.useQuery({
    propriedadeId,
  });
  const { data: atividades = [] } = trpc.coreData.expansao.atividades.useQuery({
    propriedadeId,
    limit: 8,
  });

  useEffect(() => {
    if (!userId || !organizationId) return;
    let mounted = true;
    void loadAlertaPreferencias(userId, organizationId).then((loaded) => {
      if (mounted) setPrefs(loaded);
    });
    return () => {
      mounted = false;
    };
  }, [userId, organizationId]);

  const updatePrefs = (next: AlertaPreferencias) => {
    setPrefs(next);
    if (userId && organizationId) {
      void saveAlertaPreferencias(userId, organizationId, next);
    }
  };

  const alertasFiltrados = useMemo(
    () => filtrarAlertasPorPreferencias(alertas, prefs),
    [alertas, prefs],
  );

  if (isLoading) return <ScreenState status="loading" compact message="Carregando alertas…" />;
  if (isError) {
    return (
      <ScreenState status="error" compact onAction={() => void refetch()} />
    );
  }

  return (
    <View style={{ gap: 12 }}>
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 14,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
          Atenção necessária
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 8 }}>
          {(["info", "atencao", "alto"] as AlertaGravidade[]).map((g) => {
            const active = prefs.gravidadeMinima === g;
            return (
              <TouchableOpacity
                key={g}
                onPress={() => updatePrefs({ ...prefs, gravidadeMinima: g })}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={{
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderRadius: 999,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  marginRight: 6,
                  marginBottom: 6,
                }}
              >
                <Text style={{ color: active ? "#FFF" : colors.foreground, fontSize: 11, fontWeight: "700" }}>
                  Min. {g}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {alertasFiltrados.length === 0 ? (
          <Text style={{ fontSize: 13, color: colors.muted }}>
            Nenhum alerta ativo. Propriedade em dia.
          </Text>
        ) : (
          alertasFiltrados.slice(0, 8).map((a) => (
            <View
              key={a.id}
              style={{
                marginBottom: 10,
                paddingBottom: 10,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: GRAVIDADE_COLOR[a.gravidade] ?? colors.foreground,
                }}
              >
                [{a.gravidade}] {a.titulo}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{a.motivo}</Text>
              <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                Fonte: {a.fonte}
              </Text>
              <Text style={{ fontSize: 12, color: colors.foreground, marginTop: 4 }}>
                → {a.acaoRecomendada}
              </Text>
              {a.gravidade !== "critico" ? (
                <TouchableOpacity
                  onPress={() =>
                    updatePrefs({
                      ...prefs,
                      snoozedIds: Array.from(new Set([...prefs.snoozedIds, a.id])),
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Adiar alerta ${a.titulo}`}
                  style={{ marginTop: 6, alignSelf: "flex-start" }}
                >
                  <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 12 }}>
                    Adiar
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))
        )}
        {onOpenOperacoes ? (
          <TouchableOpacity onPress={onOpenOperacoes} accessibilityRole="button" style={{ marginTop: 4 }}>
            <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>
              Ir para Operações →
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 14,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
          Atividade recente
        </Text>
        {atividades.length === 0 ? (
          <Text style={{ fontSize: 13, color: colors.muted }}>
            Sem eventos recentes nesta propriedade.
          </Text>
        ) : (
          atividades.map((act) => (
            <View key={act.id} style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>
                {act.titulo}
              </Text>
              <Text style={{ fontSize: 11, color: colors.muted }}>
                {new Date(act.createdAt).toLocaleString("pt-BR")} · {act.tipo}
              </Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

type MonitoramentoProps = {
  propriedadeId: number;
  terrenos: { id: number; nome: string }[];
  safraId?: number;
  /** Cultivos V2 — filtra e pré-preenche ocorrências deste cultivo */
  culturaId?: number;
  readOnly?: boolean;
  /** Incrementar para focar o formulário de ocorrência (menu + Registrar) */
  openCreateNonce?: number;
  onCreateOpened?: () => void;
};

export function PropriedadeMonitoramentoPanel({
  propriedadeId,
  terrenos,
  safraId,
  culturaId,
  readOnly = false,
  openCreateNonce = 0,
  onCreateOpened,
}: MonitoramentoProps) {
  const colors = useColors();
  const utils = trpc.useUtils();
  const { data: session } = trpc.auth.session.useQuery(undefined, { staleTime: 60_000 });
  const cacheScope = session?.activeOrganizationId ?? undefined;
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState<"praga" | "doenca" | "nutricao" | "clima" | "solo" | "outro">(
    "praga",
  );
  const [severidade, setSeveridade] = useState<"baixa" | "media" | "alta" | "critica">("media");
  const [terrenoId, setTerrenoId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [formHighlight, setFormHighlight] = useState(false);
  const tituloRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!openCreateNonce || readOnly) return;
    setFormHighlight(true);
    const t = setTimeout(() => {
      tituloRef.current?.focus?.();
      onCreateOpened?.();
    }, 80);
    return () => clearTimeout(t);
  }, [openCreateNonce, readOnly, onCreateOpened]);

  const listInput = { propriedadeId, safraId, culturaId };
  const { data: ocorrencias = [], isLoading, isError, refetch } =
    trpc.coreData.expansao.ocorrencias.list.useQuery(listInput);

  const create = trpc.coreData.expansao.ocorrencias.create.useMutation({
    onSuccess: async () => {
      await utils.coreData.expansao.ocorrencias.list.invalidate(listInput);
      await utils.coreData.expansao.alertas.invalidate({ propriedadeId, cacheScope });
      await utils.coreData.expansao.atividades.invalidate({ propriedadeId, cacheScope });
      await utils.coreData.expansao.overview.invalidate({ propriedadeId, safraId });
    },
  });
  const criarTarefa = trpc.coreData.expansao.ocorrencias.criarTarefa.useMutation({
    onSuccess: async () => {
      await utils.coreData.expansao.ocorrencias.list.invalidate(listInput);
      await utils.coreData.tarefas.listByPropriedade.invalidate({ propriedadeId, safraId });
      await utils.coreData.expansao.alertas.invalidate({ propriedadeId, cacheScope });
    },
  });
  const resolver = trpc.coreData.expansao.ocorrencias.resolver.useMutation({
    onSuccess: async () => {
      await utils.coreData.expansao.ocorrencias.list.invalidate(listInput);
      await utils.coreData.expansao.alertas.invalidate({ propriedadeId, cacheScope });
    },
  });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 14,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 10,
        },
        input: {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          color: colors.foreground,
          marginBottom: 8,
          minHeight: 44,
        },
        chip: {
          borderRadius: 10,
          borderWidth: 1,
          paddingHorizontal: 10,
          paddingVertical: 6,
          marginRight: 6,
          marginBottom: 6,
        },
      }),
    [colors],
  );

  const onCreate = async () => {
    if (readOnly) {
      Alert.alert("Somente leitura", "Safra histórica — não é possível registrar ocorrências.");
      return;
    }
    if (!titulo.trim()) {
      Alert.alert("Informe um título");
      return;
    }
    setSaving(true);
    try {
      await create.mutateAsync({
        propriedadeId,
        safraId,
        culturaId,
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
        categoria,
        severidade,
        terrenoId: terrenoId ?? undefined,
      });
      setTitulo("");
      setDescricao("");
      setFormHighlight(false);
    } catch (e: any) {
      Alert.alert("Erro", e?.message ?? "Falha ao criar ocorrência");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <ScreenState status="loading" compact />;
  if (isError) return <ScreenState status="error" compact onAction={() => void refetch()} />;

  return (
    <View>
      <View
        style={[
          styles.card,
          formHighlight && !readOnly
            ? { borderColor: colors.primary, borderWidth: 2 }
            : null,
        ]}
      >
        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
          Nova ocorrência de campo
        </Text>
        {formHighlight && !readOnly ? (
          <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "600", marginBottom: 8 }}>
            Preencha os campos abaixo — propriedade e safra já estão vinculadas.
          </Text>
        ) : (
          <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 8 }}>
            Diagnóstico automatizado é apoio à decisão — não confirmação absoluta.
          </Text>
        )}
        <TextInput
          ref={tituloRef}
          style={styles.input}
          placeholder="Título (ex.: Mancha foliar no talhão 2)"
          placeholderTextColor={colors.muted}
          value={titulo}
          onChangeText={setTitulo}
          accessibilityLabel="Título da ocorrência"
        />
        <TextInput
          style={[styles.input, { minHeight: 72 }]}
          placeholder="Descrição / observações"
          placeholderTextColor={colors.muted}
          value={descricao}
          onChangeText={setDescricao}
          multiline
          accessibilityLabel="Descrição da ocorrência"
        />
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {(["praga", "doenca", "nutricao", "clima", "solo", "outro"] as const).map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.chip,
                {
                  borderColor: categoria === c ? colors.primary : colors.border,
                  backgroundColor: categoria === c ? colors.primary + "18" : "transparent",
                },
              ]}
              onPress={() => setCategoria(c)}
              accessibilityRole="button"
              accessibilityState={{ selected: categoria === c }}
            >
              <Text style={{ fontSize: 12, color: colors.foreground }}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 4 }}>
          {(["baixa", "media", "alta", "critica"] as const).map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.chip,
                {
                  borderColor: severidade === s ? "#EF6C00" : colors.border,
                  backgroundColor: severidade === s ? "#EF6C0018" : "transparent",
                },
              ]}
              onPress={() => setSeveridade(s)}
            >
              <Text style={{ fontSize: 12, color: colors.foreground }}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {terrenos.length > 0 ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 4 }}>
            <TouchableOpacity
              style={[
                styles.chip,
                {
                  borderColor: terrenoId === null ? colors.primary : colors.border,
                  backgroundColor: terrenoId === null ? colors.primary + "18" : "transparent",
                },
              ]}
              onPress={() => setTerrenoId(null)}
            >
              <Text style={{ fontSize: 12, color: colors.foreground }}>Sem talhão</Text>
            </TouchableOpacity>
            {terrenos.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.chip,
                  {
                    borderColor: terrenoId === t.id ? colors.primary : colors.border,
                    backgroundColor: terrenoId === t.id ? colors.primary + "18" : "transparent",
                  },
                ]}
                onPress={() => setTerrenoId(t.id)}
              >
                <Text style={{ fontSize: 12, color: colors.foreground }}>{t.nome}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
        <TouchableOpacity
          onPress={() => void onCreate()}
          disabled={saving}
          accessibilityRole="button"
          style={{
            marginTop: 8,
            minHeight: 44,
            borderRadius: 12,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "700" }}>Registrar ocorrência</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
        Ocorrências ({ocorrencias.length})
      </Text>
      {ocorrencias.length === 0 ? (
        <ScreenState
          status="empty"
          compact
          title="Nenhuma ocorrência"
          message="Registre problemas de campo para gerar tarefas e acompanhamento."
        />
      ) : (
        ocorrencias.map((oc) => (
          <View key={oc.id} style={styles.card}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
              {oc.titulo}
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
              {oc.categoria} · {oc.severidade} · {oc.status}
            </Text>
            {oc.descricao ? (
              <Text style={{ fontSize: 13, color: colors.foreground, marginTop: 6 }}>
                {oc.descricao}
              </Text>
            ) : null}
            <View style={{ flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              {!oc.tarefaId && oc.status !== "resolvida" && oc.status !== "descartada" ? (
                <TouchableOpacity
                  onPress={() =>
                    void criarTarefa.mutateAsync({ ocorrenciaId: oc.id }).catch((e) =>
                      Alert.alert("Erro", e?.message ?? "Falha"),
                    )
                  }
                  style={{
                    minHeight: 40,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    backgroundColor: colors.primary + "18",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>
                    Criar tarefa
                  </Text>
                </TouchableOpacity>
              ) : null}
              {oc.status !== "resolvida" ? (
                <TouchableOpacity
                  onPress={() =>
                    void resolver
                      .mutateAsync({ id: oc.id, resultado: "resolvido" })
                      .catch((e) => Alert.alert("Erro", e?.message ?? "Falha"))
                  }
                  style={{
                    minHeight: 40,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    backgroundColor: colors.success + "18",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: colors.success, fontWeight: "700", fontSize: 13 }}>
                    Resolver
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ))
      )}
    </View>
  );
}

type EstoqueProps = { propriedadeId: number };

const ESTOQUE_CATEGORIAS = [
  "fertilizante",
  "defensivo",
  "herbicida",
  "fungicida",
  "inseticida",
  "semente",
  "combustivel",
  "peca",
  "ferramenta",
  "outro",
] as const;

const ESTOQUE_CATEGORIA_LABEL: Record<(typeof ESTOQUE_CATEGORIAS)[number], string> = {
  fertilizante: "Fertilizante",
  defensivo: "Defensivo",
  herbicida: "Herbicida",
  fungicida: "Fungicida",
  inseticida: "Inseticida",
  semente: "Semente",
  combustivel: "Combustível",
  peca: "Peça",
  ferramenta: "Ferramenta",
  outro: "Diversos",
};

const ESTOQUE_UNIDADES = ["kg", "L", "un", "sc", "t", "mL", "g"] as const;

export function PropriedadeEstoquePanel({ propriedadeId }: EstoqueProps) {
  const colors = useColors();
  const utils = trpc.useUtils();
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState<(typeof ESTOQUE_CATEGORIAS)[number]>("fertilizante");
  const [unidadeBase, setUnidadeBase] = useState<(typeof ESTOQUE_UNIDADES)[number]>("kg");
  const [saldo, setSaldo] = useState("0");
  const [minimo, setMinimo] = useState("0");
  const [fabricante, setFabricante] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const styles = useMemo(
    () =>
      StyleSheet.create({
        input: {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 10,
          padding: 10,
          marginBottom: 8,
          color: colors.foreground,
          minHeight: 44,
        },
        chip: {
          borderWidth: 1,
          borderRadius: 999,
          paddingHorizontal: 10,
          paddingVertical: 6,
          marginRight: 6,
          marginBottom: 6,
        },
      }),
    [colors.border, colors.foreground],
  );

  const { data: itens = [], isLoading, isError, refetch } =
    trpc.coreData.expansao.estoque.list.useQuery({ propriedadeId });
  const { data: historico = [] } = trpc.coreData.expansao.estoque.historico.useQuery({
    propriedadeId,
    limit: 12,
  });
  const { data: dash } = trpc.coreData.expansao.estoque.dashboard.useQuery({ propriedadeId });
  const createItem = trpc.coreData.expansao.estoque.createItem.useMutation({
    onSuccess: async () => {
      await utils.coreData.expansao.estoque.list.invalidate({ propriedadeId });
      await utils.coreData.expansao.estoque.historico.invalidate({ propriedadeId });
      await utils.coreData.expansao.estoque.dashboard.invalidate({ propriedadeId });
      await utils.coreData.expansao.alertas.invalidate({ propriedadeId });
    },
  });
  const movimento = trpc.coreData.expansao.estoque.movimento.useMutation({
    onSuccess: async () => {
      await utils.coreData.expansao.estoque.list.invalidate({ propriedadeId });
      await utils.coreData.expansao.estoque.historico.invalidate({ propriedadeId });
      await utils.coreData.expansao.estoque.dashboard.invalidate({ propriedadeId });
      await utils.coreData.expansao.alertas.invalidate({ propriedadeId });
    },
  });

  if (isLoading) return <ScreenState status="loading" compact />;
  if (isError) return <ScreenState status="error" compact onAction={() => void refetch()} />;

  return (
    <View>
      {dash ? (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 14,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
            Dashboard de estoque
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 2 }}>
            Itens {dash.estoqueAtual.itens} · Saldo total {dash.estoqueAtual.saldoTotal}
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 2 }}>
            Consumo no mês {dash.consumoMensal} · Perdas {dash.perdasMensal}
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 2 }}>
            Reservas ativas {dash.reservas.ativas} ({dash.reservas.quantidade})
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 2 }}>
            Críticos {dash.itensCriticos.length}
            {dash.valorDisponivel
              ? ` · Valor R$ ${dash.valorTotalEstoque.toFixed(2)}`
              : " · Valor monetário indisponível (sem custo médio)"}
          </Text>
        </View>
      ) : null}
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 14,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
          Novo item de estoque agrícola
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Nome (ex.: Ureia 45%)"
          placeholderTextColor={colors.muted}
          value={nome}
          onChangeText={setNome}
          accessibilityLabel="Nome do insumo"
        />
        <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Categoria</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 4 }}>
          {ESTOQUE_CATEGORIAS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.chip,
                {
                  borderColor: categoria === c ? colors.primary : colors.border,
                  backgroundColor: categoria === c ? colors.primary + "18" : "transparent",
                },
              ]}
              onPress={() => setCategoria(c)}
              accessibilityRole="button"
              accessibilityState={{ selected: categoria === c }}
            >
              <Text style={{ fontSize: 12, color: colors.foreground }}>{ESTOQUE_CATEGORIA_LABEL[c]}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Unidade padrão</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 4 }}>
          {ESTOQUE_UNIDADES.map((u) => (
            <TouchableOpacity
              key={u}
              style={[
                styles.chip,
                {
                  borderColor: unidadeBase === u ? colors.primary : colors.border,
                  backgroundColor: unidadeBase === u ? colors.primary + "18" : "transparent",
                },
              ]}
              onPress={() => setUnidadeBase(u)}
              accessibilityRole="button"
              accessibilityState={{ selected: unidadeBase === u }}
            >
              <Text style={{ fontSize: 12, color: colors.foreground }}>{u}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Saldo inicial"
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
            value={saldo}
            onChangeText={setSaldo}
            accessibilityLabel="Saldo inicial"
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Estoque mínimo"
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
            value={minimo}
            onChangeText={setMinimo}
            accessibilityLabel="Estoque mínimo"
          />
        </View>
        <TextInput
          style={styles.input}
          placeholder="Fabricante (opcional)"
          placeholderTextColor={colors.muted}
          value={fabricante}
          onChangeText={setFabricante}
          accessibilityLabel="Fabricante"
        />
        <TextInput
          style={[styles.input, { minHeight: 64 }]}
          placeholder="Observações (opcional)"
          placeholderTextColor={colors.muted}
          value={observacoes}
          onChangeText={setObservacoes}
          multiline
          accessibilityLabel="Observações do insumo"
        />
        <TouchableOpacity
          style={{
            marginTop: 2,
            minHeight: 44,
            borderRadius: 12,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            opacity: createItem.isPending ? 0.7 : 1,
          }}
          disabled={createItem.isPending}
          onPress={() => {
            if (!nome.trim()) return Alert.alert("Informe o nome");
            if (!unidadeBase.trim()) return Alert.alert("Informe a unidade padrão");
            void createItem
              .mutateAsync({
                propriedadeId,
                nome: nome.trim(),
                categoria,
                unidadeBase,
                saldoInicial: Number(saldo) || 0,
                estoqueMinimo: Number(minimo) || 0,
                fabricante: fabricante.trim() || undefined,
                observacoes: observacoes.trim() || undefined,
              })
              .then(() => {
                setNome("");
                setSaldo("0");
                setMinimo("0");
                setFabricante("");
                setObservacoes("");
              })
              .catch((e) => Alert.alert("Erro", e?.message ?? "Falha"));
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>
            {createItem.isPending ? "Salvando…" : "Adicionar item"}
          </Text>
        </TouchableOpacity>
      </View>

      {itens.length === 0 ? (
        <ScreenState
          status="empty"
          compact
          title="Estoque vazio"
          message="Cadastre insumos da fazenda (diferente do marketplace)."
        />
      ) : (
        itens.map((item) => {
          const baixo = Number(item.saldo) <= Number(item.estoqueMinimo ?? 0);
          return (
            <View
              key={item.id}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 14,
                borderWidth: 1,
                borderColor: baixo ? "#EF6C00" : colors.border,
                marginBottom: 8,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
                {item.nome}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                {ESTOQUE_CATEGORIA_LABEL[item.categoria as keyof typeof ESTOQUE_CATEGORIA_LABEL] ??
                  item.categoria}
                {item.fabricante ? ` · ${item.fabricante}` : ""}
              </Text>
              <Text style={{ fontSize: 13, color: baixo ? "#EF6C00" : colors.muted, marginTop: 2 }}>
                Saldo {item.saldo} {item.unidadeBase}
                {baixo ? " · abaixo do mínimo" : ""}
              </Text>
              {item.observacoes ? (
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }} numberOfLines={2}>
                  {item.observacoes}
                </Text>
              ) : null}
              <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                <TouchableOpacity
                  onPress={() =>
                    void movimento
                      .mutateAsync({
                        itemId: item.id,
                        propriedadeId,
                        tipo: "entrada",
                        quantidade: 10,
                        motivo: "Entrada rápida +10",
                      })
                      .catch((e) => Alert.alert("Erro", e?.message ?? "Falha"))
                  }
                  style={{
                    minHeight: 40,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    backgroundColor: colors.success + "18",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: colors.success, fontWeight: "700", fontSize: 13 }}>+10</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    void movimento
                      .mutateAsync({
                        itemId: item.id,
                        propriedadeId,
                        tipo: "saida",
                        quantidade: 1,
                        motivo: "Saída rápida -1",
                      })
                      .catch((e) => Alert.alert("Erro", e?.message ?? "Falha"))
                  }
                  style={{
                    minHeight: 40,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    backgroundColor: "#EF6C0018",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "#EF6C00", fontWeight: "700", fontSize: 13 }}>-1 saída</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

      {historico.length > 0 ? (
        <View style={{ marginTop: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
            Histórico de movimentos
          </Text>
          {historico.map((m) => (
            <Text
              key={m.id}
              style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}
              numberOfLines={2}
            >
              {m.tipo} · {m.quantidade}
              {m.motivo ? ` — ${m.motivo}` : ""}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

type CustosProps = { propriedadeId: number; safraLabel: string; safraId?: number };

export function PropriedadeCustosPanel({ propriedadeId, safraLabel, safraId }: CustosProps) {
  const colors = useColors();
  const utils = trpc.useUtils();
  const { data: session } = trpc.auth.session.useQuery(undefined, { staleTime: 60_000 });
  const cacheScope = session?.activeOrganizationId ?? undefined;
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [orcamentoValor, setOrcamentoValor] = useState("10000");
  const [finTipo, setFinTipo] = useState<"despesa" | "receita" | "custo" | "investimento">("despesa");
  const [finDesc, setFinDesc] = useState("");
  const [finValor, setFinValor] = useState("");

  const { data, isLoading, isError, refetch } = trpc.coreData.expansao.custos.list.useQuery({
    propriedadeId,
    safraId,
  });
  const { data: lancamentos = [] } = trpc.coreData.expansao.financeiro.list.useQuery({
    propriedadeId,
    safraId,
  });
  const { data: dashFin } = trpc.coreData.expansao.financeiro.dashboard.useQuery({
    propriedadeId,
    safraId,
  });
  const createOrc = trpc.coreData.expansao.custos.createOrcamento.useMutation({
    onSuccess: async () => {
      await utils.coreData.expansao.custos.list.invalidate({ propriedadeId, safraId });
      await utils.coreData.expansao.alertas.invalidate({ propriedadeId, cacheScope });
    },
  });
  const createCusto = trpc.coreData.expansao.custos.createCusto.useMutation({
    onSuccess: async () => {
      await utils.coreData.expansao.custos.list.invalidate({ propriedadeId, safraId });
      await utils.coreData.expansao.alertas.invalidate({ propriedadeId, cacheScope });
      await utils.coreData.expansao.metricas.invalidate({
        propriedadeId,
        nomeSafra: safraLabel,
        safraId,
        cacheScope,
      });
    },
  });
  const createFin = trpc.coreData.expansao.financeiro.create.useMutation({
    onSuccess: async () => {
      await utils.coreData.expansao.financeiro.list.invalidate({ propriedadeId, safraId });
    },
  });

  if (isLoading) return <ScreenState status="loading" compact />;
  if (isError) return <ScreenState status="error" compact onAction={() => void refetch()} />;

  const orcamentos = data?.orcamentos ?? [];
  const custos = data?.custos ?? [];
  const orcAtual = orcamentos[0];

  return (
    <View>
      {dashFin ? (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 14,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
            Dashboard financeiro
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>
            Planejado R$ {dashFin.planejado.toFixed(2)} · Executado R$ {dashFin.executado.toFixed(2)}
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>
            Receita R$ {dashFin.receita.toFixed(2)} · Despesas R$ {dashFin.despesas.toFixed(2)} · Custos R${" "}
            {dashFin.custos.toFixed(2)}
          </Text>
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.foreground, marginTop: 4 }}>
            Resultado R$ {dashFin.resultado.toFixed(2)}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 10, gap: 8 }}>
            {dashFin.series.map((s) => {
              const max = Math.max(...dashFin.series.map((x) => Math.abs(x.valor)), 1);
              const h = Math.max(8, Math.round((Math.abs(s.valor) / max) * 48));
              return (
                <View key={s.label} style={{ alignItems: "center", width: 52 }}>
                  <View
                    style={{
                      width: 28,
                      height: h,
                      borderRadius: 4,
                      backgroundColor: s.valor < 0 ? "#C62828" : colors.primary,
                    }}
                  />
                  <Text style={{ fontSize: 9, color: colors.muted, marginTop: 4 }} numberOfLines={1}>
                    {s.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}
      {orcamentos.length === 0 ? (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 14,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
            Orçamento da safra
          </Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              padding: 10,
              color: colors.foreground,
              minHeight: 44,
              marginBottom: 8,
            }}
            keyboardType="decimal-pad"
            value={orcamentoValor}
            onChangeText={setOrcamentoValor}
            placeholder="Valor previsto (BRL)"
            placeholderTextColor={colors.muted}
          />
          <TouchableOpacity
            style={{
              minHeight: 44,
              borderRadius: 12,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={() =>
              void createOrc
                .mutateAsync({
                  propriedadeId,
                  nomeSafra: safraLabel,
                  safraId,
                  orcamentoPrevisto: Number(orcamentoValor) || 0,
                })
                .catch((e) => Alert.alert("Erro", e?.message ?? "Falha"))
            }
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>Criar orçamento {safraLabel}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 14,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>
            {orcAtual.nomeSafra}
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
            Previsto R$ {Number(orcAtual.orcamentoPrevisto).toFixed(2)} · Realizado R${" "}
            {Number(orcAtual.custoRealizado).toFixed(2)}
          </Text>
        </View>
      )}

      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 14,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
          Registrar custo
        </Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            padding: 10,
            color: colors.foreground,
            minHeight: 44,
            marginBottom: 8,
          }}
          placeholder="Descrição"
          placeholderTextColor={colors.muted}
          value={descricao}
          onChangeText={setDescricao}
        />
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            padding: 10,
            color: colors.foreground,
            minHeight: 44,
            marginBottom: 8,
          }}
          placeholder="Valor (BRL)"
          placeholderTextColor={colors.muted}
          keyboardType="decimal-pad"
          value={valor}
          onChangeText={setValor}
        />
        <TouchableOpacity
          style={{
            minHeight: 44,
            borderRadius: 12,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
          onPress={() => {
            if (!descricao.trim() || !valor) return Alert.alert("Preencha descrição e valor");
            void createCusto
              .mutateAsync({
                propriedadeId,
                safraId,
                orcamentoId: orcAtual?.id,
                descricao: descricao.trim(),
                valor: Number(valor),
                categoria: "insumo",
              })
              .then(() => {
                setDescricao("");
                setValor("");
              })
              .catch((e) => Alert.alert("Erro", e?.message ?? "Falha"));
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Salvar custo</Text>
        </TouchableOpacity>
      </View>

      {custos.map((c) => (
        <View
          key={c.id}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 12,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 8,
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>
              {c.descricao}
            </Text>
            <Text style={{ fontSize: 11, color: colors.muted }}>{c.categoria}</Text>
          </View>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
            R$ {Number(c.valor).toFixed(2)}
          </Text>
        </View>
      ))}

      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 14,
          borderWidth: 1,
          borderColor: colors.border,
          marginTop: 12,
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
          Lançamento financeiro
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 8 }}>
          {(["despesa", "receita", "custo", "investimento"] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setFinTipo(t)}
              style={{
                borderWidth: 1,
                borderColor: finTipo === t ? colors.primary : colors.border,
                backgroundColor: finTipo === t ? colors.primary + "18" : "transparent",
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 6,
                marginRight: 6,
                marginBottom: 6,
              }}
            >
              <Text style={{ fontSize: 12, color: colors.foreground }}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            padding: 10,
            color: colors.foreground,
            minHeight: 44,
            marginBottom: 8,
          }}
          placeholder="Descrição (classificação automática)"
          placeholderTextColor={colors.muted}
          value={finDesc}
          onChangeText={setFinDesc}
        />
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            padding: 10,
            color: colors.foreground,
            minHeight: 44,
            marginBottom: 8,
          }}
          placeholder="Valor (BRL)"
          placeholderTextColor={colors.muted}
          keyboardType="decimal-pad"
          value={finValor}
          onChangeText={setFinValor}
        />
        <TouchableOpacity
          style={{
            minHeight: 44,
            borderRadius: 12,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
          onPress={() => {
            if (!finDesc.trim() || !finValor) return Alert.alert("Preencha descrição e valor");
            void createFin
              .mutateAsync({
                propriedadeId,
                safraId,
                tipo: finTipo,
                descricao: finDesc.trim(),
                valor: Number(finValor),
              })
              .then((r) => {
                setFinDesc("");
                setFinValor("");
                Alert.alert("Salvo", `Categoria: ${r.categoriaAuto}`);
              })
              .catch((e) => Alert.alert("Erro", e?.message ?? "Falha"));
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Salvar lançamento</Text>
        </TouchableOpacity>
      </View>

      {lancamentos.slice(0, 8).map((l) => (
        <View
          key={`fin-${l.id}`}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 12,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 8,
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>
              {l.descricao}
            </Text>
            <Text style={{ fontSize: 11, color: colors.muted }}>
              {l.tipo} · {l.categoriaAuto}
            </Text>
          </View>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
            R$ {Number(l.valor).toFixed(2)}
          </Text>
        </View>
      ))}
    </View>
  );
}

type MaquinasPanelProps = {
  propriedadeId: number;
  readOnly?: boolean;
};

export function PropriedadeMaquinasPanel({
  propriedadeId,
  readOnly = false,
}: MaquinasPanelProps) {
  const colors = useColors();
  const utils = trpc.useUtils();
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<(typeof MAQUINA_TIPOS)[number]>("trator");
  const [identificador, setIdentificador] = useState("");
  const { data: maquinas = [], isLoading, isError, refetch } =
    trpc.coreData.expansao.maquinas.list.useQuery({ propriedadeId });

  const create = trpc.coreData.expansao.maquinas.create.useMutation({
    onSuccess: async () => {
      await utils.coreData.expansao.maquinas.list.invalidate({ propriedadeId });
    },
  });
  const update = trpc.coreData.expansao.maquinas.update.useMutation({
    onSuccess: async () => {
      await utils.coreData.expansao.maquinas.list.invalidate({ propriedadeId });
    },
  });
  const remove = trpc.coreData.expansao.maquinas.remove.useMutation({
    onSuccess: async () => {
      await utils.coreData.expansao.maquinas.list.invalidate({ propriedadeId });
    },
  });
  const setDisp = trpc.coreData.expansao.maquinas.setDisponibilidade.useMutation({
    onSuccess: async () => {
      await utils.coreData.expansao.maquinas.list.invalidate({ propriedadeId });
    },
  });
  const regHorimetro = trpc.coreData.expansao.maquinas.registrarHorimetro.useMutation({
    onSuccess: async () => {
      await utils.coreData.expansao.maquinas.list.invalidate({ propriedadeId });
    },
  });
  const regCombustivel = trpc.coreData.expansao.maquinas.registrarCombustivel.useMutation({
    onSuccess: async () => {
      await utils.coreData.expansao.maquinas.list.invalidate({ propriedadeId });
    },
  });
  const regManutencao = trpc.coreData.expansao.maquinas.registrarManutencao.useMutation({
    onSuccess: async () => {
      await utils.coreData.expansao.maquinas.list.invalidate({ propriedadeId });
    },
  });

  const salvar = () => {
    if (!nome.trim()) {
      Alert.alert("Informe o nome", "Dê um nome para a máquina ou equipamento.");
      return;
    }
    void create
      .mutateAsync({
        propriedadeId,
        nome: nome.trim(),
        tipo,
        identificador: identificador.trim() || undefined,
      })
      .then(() => {
        setNome("");
        setIdentificador("");
        setTipo("trator");
      })
      .catch((e) => Alert.alert("Erro", e?.message ?? "Falha ao salvar máquina"));
  };

  const excluir = (id: number, machineName: string) => {
    Alert.alert("Excluir máquina", `Remover ${machineName}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () =>
          void remove
            .mutateAsync({ id })
            .catch((e) => Alert.alert("Erro", e?.message ?? "Falha ao excluir")),
      },
    ]);
  };

  if (isLoading) return <ScreenState status="loading" compact message="Carregando máquinas…" />;
  if (isError) return <ScreenState status="error" compact onAction={() => void refetch()} />;

  return (
    <View style={{ gap: 12 }}>
      {!readOnly ? (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 14,
            padding: 14,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
            Nova máquina/equipamento
          </Text>
          <TextInput
            value={nome}
            onChangeText={setNome}
            placeholder="Nome (ex.: Trator Massey 4292)"
            placeholderTextColor={colors.muted}
            style={{
              minHeight: 44,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              paddingHorizontal: 12,
              color: colors.foreground,
              marginBottom: 8,
            }}
          />
          <TextInput
            value={identificador}
            onChangeText={setIdentificador}
            placeholder="Placa ou série (opcional)"
            placeholderTextColor={colors.muted}
            style={{
              minHeight: 44,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              paddingHorizontal: 12,
              color: colors.foreground,
              marginBottom: 8,
            }}
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            {MAQUINA_TIPOS.map((item) => {
              const active = tipo === item;
              return (
                <TouchableOpacity
                  key={item}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setTipo(item)}
                  style={{
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: active ? colors.primary : colors.border,
                    backgroundColor: active ? colors.primary : colors.surface,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                  }}
                >
                  <Text style={{ color: active ? "#FFF" : colors.foreground, fontSize: 12, fontWeight: "700" }}>
                    {MAQUINA_TIPO_LABEL[item]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={salvar}
            disabled={create.isPending}
            style={{
              minHeight: 44,
              borderRadius: 12,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
              opacity: create.isPending ? 0.7 : 1,
            }}
          >
            <Text style={{ color: "#FFF", fontWeight: "700" }}>
              {create.isPending ? "Salvando…" : "Cadastrar máquina"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {maquinas.length === 0 ? (
        <ScreenState
          status="empty"
          compact
          title="Nenhuma máquina cadastrada"
          message="Cadastre tratores, pulverizadores, colheitadeiras e implementos da propriedade."
        />
      ) : (
        maquinas.map((m) => {
          const statusColor = MAQUINA_STATUS_COLOR[m.status] ?? colors.muted;
          return (
            <View
              key={m.id}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 14,
                borderWidth: 1,
                borderColor: colors.border,
                gap: 8,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "800", color: colors.foreground }}>
                    {m.nome}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                    {MAQUINA_TIPO_LABEL[m.tipo as (typeof MAQUINA_TIPOS)[number]] ?? m.tipo}
                    {m.identificador ? ` · ${m.identificador}` : ""}
                    {m.horasUso != null ? ` · ${Number(m.horasUso).toFixed(1)} h` : ""}
                    {m.combustivelLitros != null
                      ? ` · ${Number(m.combustivelLitros).toFixed(1)} L`
                      : ""}
                  </Text>
                </View>
                <View
                  style={{
                    borderRadius: 999,
                    backgroundColor: statusColor + "20",
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    alignSelf: "flex-start",
                  }}
                >
                  <Text style={{ color: statusColor, fontSize: 11, fontWeight: "800" }}>
                    {MAQUINA_STATUS_LABEL[m.status] ?? m.status}
                  </Text>
                </View>
              </View>
              {m.notas ? (
                <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 18 }}>{m.notas}</Text>
              ) : null}
              {!readOnly ? (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => {
                      const atual = Number(m.horasUso ?? 0);
                      void regHorimetro
                        .mutateAsync({ maquinaId: m.id, horas: atual + 1 })
                        .catch((e) => Alert.alert("Erro", e?.message ?? "Falha"));
                    }}
                  >
                    <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 12 }}>
                      +1h horímetro
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() =>
                      void regCombustivel
                        .mutateAsync({ maquinaId: m.id, litros: 50, sentido: "entrada" })
                        .catch((e) => Alert.alert("Erro", e?.message ?? "Falha"))
                    }
                  >
                    <Text style={{ color: colors.foreground, fontWeight: "700", fontSize: 12 }}>
                      +50 L
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() =>
                      void regManutencao
                        .mutateAsync({
                          maquinaId: m.id,
                          descricao: "Manutenção registrada",
                          colocarEmManutencao: true,
                        })
                        .catch((e) => Alert.alert("Erro", e?.message ?? "Falha"))
                    }
                  >
                    <Text style={{ color: "#EF6C00", fontWeight: "700", fontSize: 12 }}>
                      Manutenção
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() =>
                      void setDisp
                        .mutateAsync({ maquinaId: m.id, status: "disponivel" })
                        .catch((e) => Alert.alert("Erro", e?.message ?? "Falha"))
                    }
                  >
                    <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 12 }}>
                      Disponível
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() =>
                      void setDisp
                        .mutateAsync({ maquinaId: m.id, status: "em_uso" })
                        .catch((e) => Alert.alert("Erro", e?.message ?? "Falha"))
                    }
                  >
                    <Text style={{ color: "#1565C0", fontWeight: "700", fontSize: 12 }}>
                      Em uso
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => excluir(m.id, m.nome)}
                  >
                    <Text style={{ color: "#C62828", fontWeight: "700", fontSize: 12 }}>
                      Excluir
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          );
        })
      )}
    </View>
  );
}

type MetricasProps = { propriedadeId: number; nomeSafra?: string; safraId?: number };

export function PropriedadeMetricasPanel({ propriedadeId, nomeSafra, safraId }: MetricasProps) {
  const colors = useColors();
  const { data: session } = trpc.auth.session.useQuery(undefined, { staleTime: 60_000 });
  const orgId = session?.activeOrganizationId ?? undefined;
  const { data, isLoading, isError, refetch } = trpc.coreData.expansao.metricas.useQuery({
    propriedadeId,
    nomeSafra,
    safraId,
    cacheScope: orgId,
  });
  const { data: ind } = trpc.coreData.expansao.indicadores.useQuery({
    propriedadeId,
    safraId,
  });

  if (isLoading) return <ScreenState status="loading" compact />;
  if (isError) return <ScreenState status="error" compact onAction={() => void refetch()} />;
  if (!data) return null;

  return (
    <View>
      {ind ? (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 14,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
            Indicadores financeiros
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>
            Receita R$ {ind.receita.toFixed(2)} · Despesas R$ {ind.despesas.toFixed(2)}
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>
            Custos R$ {ind.custosOperacionais.toFixed(2)}
            {ind.custoPorHectare != null ? ` · R$ ${ind.custoPorHectare.toFixed(2)}/ha` : ""}
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>
            Lucro R$ {ind.lucro.toFixed(2)} · Margem {ind.margemPct.toFixed(1)}% · ROI {ind.roiPct.toFixed(1)}%
          </Text>
        </View>
      ) : null}
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 14,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>
          Qualidade dos dados: {data.qualidadeDados.score}%
        </Text>
        {data.qualidadeDados.notas.map((n) => (
          <Text key={n} style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
            · {n}
          </Text>
        ))}
      </View>
      {data.catalogo.map((m) => (
        <View
          key={m.id}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 14,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 8,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>{m.nome}</Text>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.primary }}>
              {m.valor == null
                ? "—"
                : m.id === "custo_ha"
                  ? `R$ ${Number(m.valor).toFixed(2)}`
                  : Number(m.valor).toLocaleString("pt-BR")}
            </Text>
          </View>
          <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>
            {m.unidade} · {m.tipo} · {m.formula}
          </Text>
          <Text style={{ fontSize: 11, color: colors.muted }}>Fonte: {m.fonte}</Text>
        </View>
      ))}
    </View>
  );
}
