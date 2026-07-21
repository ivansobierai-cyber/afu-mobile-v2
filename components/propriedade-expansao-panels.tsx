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

const GRAVIDADE_COLOR: Record<string, string> = {
  critico: "#B71C1C",
  alto: "#EF6C00",
  atencao: "#F9A825",
  info: "#1565C0",
};

type AlertasFeedProps = {
  propriedadeId: number;
  onOpenOperacoes?: () => void;
};

export function PropriedadeAlertasFeed({ propriedadeId, onOpenOperacoes }: AlertasFeedProps) {
  const colors = useColors();
  const { data: alertas = [], isLoading, isError, refetch } = trpc.coreData.expansao.alertas.useQuery({
    propriedadeId,
  });
  const { data: atividades = [] } = trpc.coreData.expansao.atividades.useQuery({
    propriedadeId,
    limit: 8,
  });

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
        {alertas.length === 0 ? (
          <Text style={{ fontSize: 13, color: colors.muted }}>
            Nenhum alerta ativo. Propriedade em dia.
          </Text>
        ) : (
          alertas.slice(0, 8).map((a) => (
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
  readOnly?: boolean;
  /** Incrementar para focar o formulário de ocorrência (menu + Registrar) */
  openCreateNonce?: number;
  onCreateOpened?: () => void;
};

export function PropriedadeMonitoramentoPanel({
  propriedadeId,
  terrenos,
  safraId,
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

  const { data: ocorrencias = [], isLoading, isError, refetch } =
    trpc.coreData.expansao.ocorrencias.list.useQuery({ propriedadeId, safraId });

  const create = trpc.coreData.expansao.ocorrencias.create.useMutation({
    onSuccess: async () => {
      await utils.coreData.expansao.ocorrencias.list.invalidate({ propriedadeId, safraId });
      await utils.coreData.expansao.alertas.invalidate({ propriedadeId, cacheScope });
      await utils.coreData.expansao.atividades.invalidate({ propriedadeId, cacheScope });
      await utils.coreData.expansao.overview.invalidate({ propriedadeId, safraId });
    },
  });
  const criarTarefa = trpc.coreData.expansao.ocorrencias.criarTarefa.useMutation({
    onSuccess: async () => {
      await utils.coreData.expansao.ocorrencias.list.invalidate({ propriedadeId, safraId });
      await utils.coreData.tarefas.listByPropriedade.invalidate({ propriedadeId, safraId });
      await utils.coreData.expansao.alertas.invalidate({ propriedadeId, cacheScope });
    },
  });
  const resolver = trpc.coreData.expansao.ocorrencias.resolver.useMutation({
    onSuccess: async () => {
      await utils.coreData.expansao.ocorrencias.list.invalidate({ propriedadeId, safraId });
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

export function PropriedadeEstoquePanel({ propriedadeId }: EstoqueProps) {
  const colors = useColors();
  const utils = trpc.useUtils();
  const [nome, setNome] = useState("");
  const [saldo, setSaldo] = useState("0");
  const [minimo, setMinimo] = useState("0");

  const { data: itens = [], isLoading, isError, refetch } =
    trpc.coreData.expansao.estoque.list.useQuery({ propriedadeId });
  const createItem = trpc.coreData.expansao.estoque.createItem.useMutation({
    onSuccess: async () => {
      await utils.coreData.expansao.estoque.list.invalidate({ propriedadeId });
      await utils.coreData.expansao.alertas.invalidate({ propriedadeId });
    },
  });
  const movimento = trpc.coreData.expansao.estoque.movimento.useMutation({
    onSuccess: async () => {
      await utils.coreData.expansao.estoque.list.invalidate({ propriedadeId });
      await utils.coreData.expansao.alertas.invalidate({ propriedadeId });
    },
  });

  if (isLoading) return <ScreenState status="loading" compact />;
  if (isError) return <ScreenState status="error" compact onAction={() => void refetch()} />;

  return (
    <View>
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
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            padding: 10,
            marginBottom: 8,
            color: colors.foreground,
            minHeight: 44,
          }}
          placeholder="Nome (ex.: Ureia)"
          placeholderTextColor={colors.muted}
          value={nome}
          onChangeText={setNome}
        />
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              padding: 10,
              color: colors.foreground,
              minHeight: 44,
            }}
            placeholder="Saldo inicial"
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
            value={saldo}
            onChangeText={setSaldo}
          />
          <TextInput
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              padding: 10,
              color: colors.foreground,
              minHeight: 44,
            }}
            placeholder="Mínimo"
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
            value={minimo}
            onChangeText={setMinimo}
          />
        </View>
        <TouchableOpacity
          style={{
            marginTop: 10,
            minHeight: 44,
            borderRadius: 12,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
          onPress={() => {
            if (!nome.trim()) return Alert.alert("Informe o nome");
            void createItem
              .mutateAsync({
                propriedadeId,
                nome: nome.trim(),
                saldoInicial: Number(saldo) || 0,
                estoqueMinimo: Number(minimo) || 0,
                categoria: "fertilizante",
              })
              .then(() => {
                setNome("");
                setSaldo("0");
              })
              .catch((e) => Alert.alert("Erro", e?.message ?? "Falha"));
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Adicionar item</Text>
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
              <Text style={{ fontSize: 13, color: baixo ? "#EF6C00" : colors.muted, marginTop: 2 }}>
                Saldo {item.saldo} {item.unidadeBase}
                {baixo ? " · abaixo do mínimo" : ""}
              </Text>
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
                        tipo: "consumo",
                        quantidade: 1,
                        motivo: "Consumo rápido -1",
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
                  <Text style={{ color: "#EF6C00", fontWeight: "700", fontSize: 13 }}>-1 consumo</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
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

  const { data, isLoading, isError, refetch } = trpc.coreData.expansao.custos.list.useQuery({
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

  if (isLoading) return <ScreenState status="loading" compact />;
  if (isError) return <ScreenState status="error" compact onAction={() => void refetch()} />;

  const orcamentos = data?.orcamentos ?? [];
  const custos = data?.custos ?? [];
  const orcAtual = orcamentos[0];

  return (
    <View>
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

  if (isLoading) return <ScreenState status="loading" compact />;
  if (isError) return <ScreenState status="error" compact onAction={() => void refetch()} />;
  if (!data) return null;

  return (
    <View>
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
