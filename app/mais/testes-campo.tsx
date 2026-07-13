import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const TABS = [
  { id: "homologacao", label: "Homologação" },
  { id: "piloto", label: "Piloto" },
  { id: "escopo", label: "Escopo" },
  { id: "funcionalidades", label: "Funcionalidades" },
  { id: "ia", label: "IA & Métricas" },
  { id: "negocio", label: "Negócio" },
  { id: "correcoes", label: "Correções" },
  { id: "aprovacao", label: "Aprovação" },
];

type SectionKey =
  | "metas" | "participantes" | "regioes" | "culturas"
  | "app" | "portal" | "admin" | "fluxoIA" | "bancoImagens"
  | "metricas" | "metaIA" | "indicadoresTec"
  | "adocao" | "satisfacao" | "feedback" | "questionario"
  | "niveis" | "ajustesIA" | "treinamento" | "relatorio"
  | "criterios" | "entregaveis";

function ExpandableSection({
  title,
  subtitle,
  color,
  sectionKey,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  subtitle?: string;
  color: string;
  sectionKey: SectionKey;
  expanded: boolean;
  onToggle: (key: SectionKey) => void;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-3 rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
      <TouchableOpacity
        onPress={() => onToggle(sectionKey)}
        style={{ backgroundColor: color + "15" }}
        className="flex-row items-center justify-between p-4"
      >
        <View className="flex-1">
          <Text className="text-sm font-bold text-foreground">{title}</Text>
          {subtitle ? (
            <Text className="text-xs text-muted mt-0.5">{subtitle}</Text>
          ) : null}
        </View>
        <Text style={{ color }} className="text-base font-bold ml-2">
          {expanded ? "▲" : "▼"}
        </Text>
      </TouchableOpacity>
      {expanded && (
        <View className="p-4 bg-surface">{children}</View>
      )}
    </View>
  );
}

function Tag({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <View style={{ backgroundColor: bg }} className="rounded-full px-3 py-1 mr-2 mb-2">
      <Text style={{ color }} className="text-xs font-semibold">{label}</Text>
    </View>
  );
}

export default function TestesCampoScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState("homologacao");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [regiao, setRegiao] = useState("");
  const [cultura, setCultura] = useState("");
  const [notaNps, setNotaNps] = useState("8");
  const [comentario, setComentario] = useState("");
  const [participanteId, setParticipanteId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: resumo } = trpc.piloto.metricas.resumo.useQuery();
  const createParticipante = trpc.piloto.participantes.create.useMutation({
    onSuccess: (r) => {
      setParticipanteId(r.id);
      utils.piloto.metricas.resumo.invalidate();
      Alert.alert("Sucesso", "Participante cadastrado no piloto.");
    },
  });
  const submitFeedback = trpc.piloto.feedback.submit.useMutation({
    onSuccess: () => {
      utils.piloto.metricas.resumo.invalidate();
      Alert.alert("Obrigado", "Feedback registrado.");
    },
  });

  const toggle = (key: SectionKey) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ backgroundColor: "#2E7D32" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-1">
          <View
            style={{ backgroundColor: "#388E3C" }}
            className="w-10 h-10 rounded-xl items-center justify-center"
          >
            <Text className="text-white text-xl">🌱</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Testes de Campo — Piloto AFU 1.0</Text>
            <Text style={{ color: "#A5D6A7" }} className="text-xs">
              10-50 produtores · 6 culturas · IA 85%+ · Satisfação 4,5+
            </Text>
          </View>
          <View style={{ backgroundColor: "#1B5E20" }} className="rounded-full px-2 py-0.5">
            <Text className="text-white text-xs font-bold">Etapa 29</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={{ backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-2">
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              className="mr-1 py-3 px-3"
            >
              <Text
                style={{
                  color: activeTab === tab.id ? "#2E7D32" : colors.muted,
                  fontWeight: activeTab === tab.id ? "700" : "400",
                  fontSize: 13,
                }}
              >
                {tab.label}
              </Text>
              {activeTab === tab.id && (
                <View style={{ backgroundColor: "#2E7D32", height: 2 }} className="rounded-full mt-1" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">

        {/* ─── HOMOLOGAÇÃO STAGING ─── */}
        {activeTab === "homologacao" && (
          <View className="pb-8 gap-2">
            <Text className="text-base font-bold text-foreground mb-1">Checklist de Homologação (pré-piloto)</Text>
            <Text className="text-xs text-muted mb-4">
              Validação técnica antes da etapa 29 — campo com produtores reais
            </Text>
            {[
              { item: "Login demo staging (web + API Railway)", ok: true },
              { item: "CRUD propriedades, cultivos e terrenos", ok: true },
              { item: "Diagnóstico IA — foto → laudo", ok: true },
              { item: "Mapa GPS com tiles OSM (web)", ok: true },
              { item: "Relatórios / laudos PDF", ok: true },
              { item: "CI GitHub Actions (lint, tsc, test)", ok: true },
              { item: "Deploy Vercel web verde", ok: true },
              { item: "Vitest — suites auth-flow e resend-email", ok: true },
              { item: "Onboarding 10 produtores piloto", ok: (resumo?.totalParticipantes ?? 0) >= 1 },
              { item: "Coleta NPS e feedback campo", ok: (resumo?.totalFeedback ?? 0) >= 1 },
            ].map((row) => (
              <View
                key={row.item}
                className="flex-row items-center rounded-xl p-3"
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: row.ok ? "#2E7D3240" : "#F57F1740",
                }}
              >
                <Text className="text-base mr-2">{row.ok ? "✅" : "⏳"}</Text>
                <Text className="text-xs flex-1 text-foreground">{row.item}</Text>
                <Text style={{ color: row.ok ? "#2E7D32" : "#F57F17", fontSize: 10, fontWeight: "700" }}>
                  {row.ok ? "OK" : "Pendente"}
                </Text>
              </View>
            ))}
            <View style={{ backgroundColor: "#2E7D3215", borderRadius: 12, padding: 12, marginTop: 8 }}>
              <Text style={{ color: "#1B5E20", fontSize: 12, fontWeight: "700" }}>Próximo passo — Piloto</Text>
              <Text className="text-xs text-muted mt-1 leading-relaxed">
                Após 7/10 itens críticos OK, iniciar recrutamento de 10–50 produtores, questionário NPS e ajustes de IA com agrônomo responsável.
              </Text>
            </View>
          </View>
        )}

        {/* ─── PILOTO (Etapa 29) ─── */}
        {activeTab === "piloto" && (
          <View className="pb-8 gap-3">
            <View style={{ backgroundColor: "#2E7D3215", borderRadius: 12, padding: 12 }}>
              <Text style={{ color: "#1B5E20", fontWeight: "700" }}>Resumo do piloto</Text>
              <Text className="text-xs text-muted mt-1">
                Participantes: {resumo?.totalParticipantes ?? 0} · Feedbacks: {resumo?.totalFeedback ?? 0} · NPS médio: {resumo?.mediaNps ?? 0}
              </Text>
            </View>

            <Text className="text-sm font-bold text-foreground">Cadastrar participante</Text>
            {(["nome", "email", "regiao", "cultura"] as const).map((field) => (
              <TextInput
                key={field}
                placeholder={field === "nome" ? "Nome completo" : field === "email" ? "E-mail" : field === "regiao" ? "Região" : "Cultura principal"}
                value={field === "nome" ? nome : field === "email" ? email : field === "regiao" ? regiao : cultura}
                onChangeText={field === "nome" ? setNome : field === "email" ? setEmail : field === "regiao" ? setRegiao : setCultura}
                style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, color: colors.foreground }}
              />
            ))}
            <TouchableOpacity
              onPress={() => createParticipante.mutate({ nome, email: email || null, regiao: regiao || null, cultura: cultura || null })}
              style={{ backgroundColor: "#2E7D32", borderRadius: 12, padding: 14, alignItems: "center" }}
              disabled={!nome.trim() || createParticipante.isPending}
            >
              <Text className="text-white font-bold">Cadastrar no piloto</Text>
            </TouchableOpacity>

            {participanteId != null && (
              <View className="gap-2 mt-4">
                <Text className="text-sm font-bold text-foreground">Enviar feedback (NPS 0–10)</Text>
                <TextInput
                  placeholder="Nota NPS"
                  keyboardType="number-pad"
                  value={notaNps}
                  onChangeText={setNotaNps}
                  style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, color: colors.foreground }}
                />
                <TextInput
                  placeholder="Comentário (opcional)"
                  value={comentario}
                  onChangeText={setComentario}
                  multiline
                  style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, color: colors.foreground, minHeight: 80 }}
                />
                <TouchableOpacity
                  onPress={() =>
                    submitFeedback.mutate({
                      participanteId,
                      notaNps: Math.min(10, Math.max(0, Number(notaNps) || 0)),
                      comentario: comentario || null,
                    })
                  }
                  style={{ backgroundColor: "#1565C0", borderRadius: 12, padding: 14, alignItems: "center" }}
                >
                  <Text className="text-white font-bold">Enviar feedback</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ─── ESCOPO ─── */}
        {activeTab === "escopo" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Escopo do Projeto Piloto</Text>
            <Text className="text-xs text-muted mb-4">
              6 metas · Participantes · Regiões · 6 culturas
            </Text>

            <ExpandableSection
              title="Metas do Projeto Piloto"
              subtitle="6 objetivos de validação"
              color="#2E7D32"
              sectionKey="metas"
              expanded={!!expanded.metas}
              onToggle={toggle}
            >
              {[
                { meta: "Estabilidade do sistema", desc: "Zero falhas críticas durante o período piloto", cor: "#81C784" },
                { meta: "Experiência do usuário", desc: "Interface intuitiva para produtores sem experiência técnica", cor: "#64B5F6" },
                { meta: "Qualidade dos diagnósticos", desc: "Precisão mínima de 85% validada por técnicos especialistas", cor: "#FFB74D" },
                { meta: "Desempenho da IA", desc: "Tempo de resposta < 5s para diagnóstico visual", cor: "#CE93D8" },
                { meta: "Eficiência operacional", desc: "Redução de 30% no tempo de diagnóstico vs método tradicional", cor: "#EF9A9A" },
                { meta: "Aceitação pelos produtores", desc: "Satisfação média ≥ 4,5 estrelas no questionário piloto", cor: "#80CBC4" },
              ].map((m) => (
                <View key={m.meta} style={{ borderLeftWidth: 4, borderLeftColor: m.cor, backgroundColor: m.cor + "10" }} className="rounded-r-xl px-3 py-2 mb-1.5">
                  <Text style={{ color: m.cor }} className="text-xs font-bold">{m.meta}</Text>
                  <Text className="text-xs text-muted mt-0.5">{m.desc}</Text>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="Participantes do Piloto"
              subtitle="Escopo inicial de validação"
              color="#1565C0"
              sectionKey="participantes"
              expanded={!!expanded.participantes}
              onToggle={toggle}
            >
              <View className="flex-row gap-2 mb-3">
                {[
                  { tipo: "Produtores", min: "10", max: "50", cor: "#81C784" },
                  { tipo: "Técnicos", min: "3", max: "10", cor: "#64B5F6" },
                  { tipo: "Propriedades", min: "20", max: "100", cor: "#FFB74D" },
                ].map((p) => (
                  <View key={p.tipo} style={{ backgroundColor: p.cor + "15", borderWidth: 1, borderColor: p.cor + "40" }} className="flex-1 rounded-xl p-3 items-center">
                    <Text style={{ color: p.cor }} className="text-lg font-bold">{p.min}–{p.max}</Text>
                    <Text style={{ color: p.cor }} className="text-xs font-bold mt-1">{p.tipo}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Regiões Piloto"
              subtitle="Critérios de diversidade agrícola"
              color="#EF6C00"
              sectionKey="regioes"
              expanded={!!expanded.regioes}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Critérios de Seleção:</Text>
              <View className="flex-row flex-wrap mb-3">
                {["Diversidade climática", "Diferentes tipos de solo", "Diferentes culturas"].map((c) => (
                  <Tag key={c} label={c} color="#EF6C00" bg="#FFF3E0" />
                ))}
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Escopo Inicial:</Text>
              {[
                { item: "1 município", desc: "Concentração geográfica para suporte técnico eficiente", cor: "#FFB74D" },
                { item: "1 região agrícola", desc: "Foco em cultura predominante da região", cor: "#81C784" },
                { item: "1 instituição parceira", desc: "Cooperativa ou EMATER local para validação técnica", cor: "#64B5F6" },
              ].map((r) => (
                <View key={r.item} style={{ backgroundColor: r.cor + "15", borderWidth: 1, borderColor: r.cor + "40" }} className="rounded-xl p-3 mb-2">
                  <Text style={{ color: r.cor }} className="text-xs font-bold mb-1">{r.item}</Text>
                  <Text style={{ color: "#888" }} className="text-xs">{r.desc}</Text>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="Culturas Avaliadas"
              subtitle="6 culturas prioritárias"
              color="#1B5E20"
              sectionKey="culturas"
              expanded={!!expanded.culturas}
              onToggle={toggle}
            >
              <View className="flex-row flex-wrap gap-2">
                {[
                  { cult: "Milho", cor: "#FFB74D" },
                  { cult: "Soja", cor: "#81C784" },
                  { cult: "Feijão", cor: "#EF9A9A" },
                  { cult: "Tomate", cor: "#F48FB1" },
                  { cult: "Mandioca", cor: "#FFCC80" },
                  { cult: "Hortaliças", cor: "#80CBC4" },
                ].map((c) => (
                  <View key={c.cult} style={{ backgroundColor: c.cor + "20", borderWidth: 1, borderColor: c.cor + "40", width: "30%" }} className="rounded-xl p-3 items-center">
                    <Text style={{ color: c.cor }} className="text-xs font-bold">{c.cult}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>
          </View>
        )}

        {/* ─── FUNCIONALIDADES ─── */}
        {activeTab === "funcionalidades" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Funcionalidades Avaliadas</Text>
            <Text className="text-xs text-muted mb-4">
              App · Portal Web · Admin · Fluxo IA · Banco de Imagens
            </Text>

            <ExpandableSection
              title="Aplicativo Mobile"
              subtitle="4 funcionalidades avaliadas"
              color="#1B5E20"
              sectionKey="app"
              expanded={!!expanded.app}
              onToggle={toggle}
            >
              <View className="flex-row flex-wrap">
                {[
                  { func: "Login", desc: "Autenticação e acesso", cor: "#81C784" },
                  { func: "Cadastro", desc: "Registro de produtor", cor: "#64B5F6" },
                  { func: "Upload de Imagens", desc: "Câmera e galeria", cor: "#FFB74D" },
                  { func: "Histórico", desc: "Diagnósticos anteriores", cor: "#CE93D8" },
                ].map((f) => (
                  <View key={f.func} style={{ backgroundColor: f.cor + "15", borderWidth: 1, borderColor: f.cor + "40", width: "47%" }} className="rounded-xl p-3 mr-2 mb-2">
                    <Text style={{ color: f.cor }} className="text-xs font-bold mb-1">{f.func}</Text>
                    <Text style={{ color: "#888" }} className="text-xs">{f.desc}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Portal Web do Produtor"
              subtitle="3 funcionalidades avaliadas"
              color="#0D47A1"
              sectionKey="portal"
              expanded={!!expanded.portal}
              onToggle={toggle}
            >
              <View className="flex-row flex-wrap">
                {[
                  { func: "Propriedades", desc: "Gestão de áreas e talhões", cor: "#64B5F6" },
                  { func: "Culturas", desc: "Cadastro e acompanhamento", cor: "#81C784" },
                  { func: "Relatórios", desc: "Geração e download PDF", cor: "#FFB74D" },
                ].map((f) => (
                  <View key={f.func} style={{ backgroundColor: f.cor + "15", borderWidth: 1, borderColor: f.cor + "40", width: "47%" }} className="rounded-xl p-3 mr-2 mb-2">
                    <Text style={{ color: f.cor }} className="text-xs font-bold mb-1">{f.func}</Text>
                    <Text style={{ color: "#888" }} className="text-xs">{f.desc}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Painel Administrativo"
              subtitle="2 funcionalidades avaliadas"
              color="#37474F"
              sectionKey="admin"
              expanded={!!expanded.admin}
              onToggle={toggle}
            >
              <View className="flex-row gap-2">
                {[
                  { func: "Revisão Técnica", desc: "Validação de diagnósticos pela equipe técnica", cor: "#EF9A9A" },
                  { func: "Emissão de Relatórios", desc: "Geração de laudos técnicos oficiais", cor: "#CE93D8" },
                ].map((f) => (
                  <View key={f.func} style={{ backgroundColor: f.cor + "15", borderWidth: 1, borderColor: f.cor + "40" }} className="flex-1 rounded-xl p-3">
                    <Text style={{ color: f.cor }} className="text-xs font-bold mb-1">{f.func}</Text>
                    <Text style={{ color: "#888" }} className="text-xs">{f.desc}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Fluxo de Validação da IA"
              subtitle="5 etapas do processo de diagnóstico"
              color="#6A1B9A"
              sectionKey="fluxoIA"
              expanded={!!expanded.fluxoIA}
              onToggle={toggle}
            >
              <View style={{ backgroundColor: "#1A1A2E" }} className="rounded-xl p-4">
                {[
                  { step: "Produtor envia imagem", desc: "Foto da planta via app (câmera ou galeria)", cor: "#81C784" },
                  { step: "IA gera diagnóstico", desc: "Processamento em < 5s + confiança percentual", cor: "#64B5F6" },
                  { step: "Técnico revisa", desc: "Agrônomo valida ou corrige o diagnóstico da IA", cor: "#FFB74D" },
                  { step: "Resultado validado", desc: "Diagnóstico final confirmado e enviado ao produtor", cor: "#CE93D8" },
                  { step: "Imagem entra no banco", desc: "Adicionada ao dataset para retreinamento da IA", cor: "#EF9A9A" },
                ].map((s, i) => (
                  <View key={s.step} className="items-start mb-1">
                    <View style={{ backgroundColor: s.cor + "20", borderWidth: 1, borderColor: s.cor }} className="rounded-xl px-3 py-2 w-full">
                      <Text style={{ color: s.cor }} className="text-xs font-bold">{s.step}</Text>
                      <Text style={{ color: "#999" }} className="text-xs mt-0.5">{s.desc}</Text>
                    </View>
                    {i < 4 && <Text style={{ color: "#555" }} className="text-sm ml-4">↓</Text>}
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Banco de Imagens Reais"
              subtitle="5 tipos de imagem + 4 informações associadas"
              color="#1B5E20"
              sectionKey="bancoImagens"
              expanded={!!expanded.bancoImagens}
              onToggle={toggle}
            >
              <Text className="text-xs font-semibold text-foreground mb-2">Tipos de Imagem Coletadas:</Text>
              <View className="flex-row flex-wrap mb-3">
                {[
                  { tipo: "Folhas", cor: "#81C784" },
                  { tipo: "Frutos", cor: "#FFB74D" },
                  { tipo: "Raízes", cor: "#FFCC80" },
                  { tipo: "Caules", cor: "#EF9A9A" },
                  { tipo: "Plantas inteiras", cor: "#64B5F6" },
                ].map((t) => (
                  <Tag key={t.tipo} label={t.tipo} color={t.cor} bg={t.cor + "20"} />
                ))}
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Informações Associadas:</Text>
              {["Cultura (soja, milho, etc.)", "Localização (GPS + município)", "Problema confirmado (técnico)", "Data de coleta"].map((i) => (
                <View key={i} className="flex-row items-center py-1.5" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                  <View style={{ backgroundColor: "#E8F5E9", width: 8, height: 8 }} className="rounded-full mr-3" />
                  <Text className="text-xs text-foreground">{i}</Text>
                </View>
              ))}
            </ExpandableSection>
          </View>
        )}

        {/* ─── IA & MÉTRICAS ─── */}
        {activeTab === "ia" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Validação da IA & Indicadores</Text>
            <Text className="text-xs text-muted mb-4">
              Precisão 85%+ · Métricas técnicas · App · Mobile · Backend
            </Text>

            <ExpandableSection
              title="Métricas de Avaliação da IA"
              subtitle="IA vs Técnico Especialista"
              color="#6A1B9A"
              sectionKey="metricas"
              expanded={!!expanded.metricas}
              onToggle={toggle}
            >
              <View style={{ backgroundColor: "#1A1A2E" }} className="rounded-xl p-4 mb-3">
                <View className="flex-row items-center justify-center gap-4 mb-3">
                  <View style={{ backgroundColor: "#81C784" + "20", borderWidth: 1, borderColor: "#81C784" }} className="rounded-xl px-4 py-2">
                    <Text style={{ color: "#81C784" }} className="text-sm font-bold text-center">IA</Text>
                    <Text style={{ color: "#999" }} className="text-xs text-center">Diagnóstico automático</Text>
                  </View>
                  <Text style={{ color: "#555" }} className="text-base font-bold">vs</Text>
                  <View style={{ backgroundColor: "#64B5F6" + "20", borderWidth: 1, borderColor: "#64B5F6" }} className="rounded-xl px-4 py-2">
                    <Text style={{ color: "#64B5F6" }} className="text-sm font-bold text-center">Técnico</Text>
                    <Text style={{ color: "#999" }} className="text-xs text-center">Especialista humano</Text>
                  </View>
                </View>
              </View>
              <Text className="text-xs font-semibold text-foreground mb-2">Métricas de Avaliação:</Text>
              {[
                { metrica: "Precisão", desc: "% de diagnósticos corretos sobre o total de diagnósticos positivos", cor: "#81C784" },
                { metrica: "Recall", desc: "% de casos reais identificados corretamente pela IA", cor: "#64B5F6" },
                { metrica: "F1 Score", desc: "Média harmônica entre Precisão e Recall", cor: "#FFB74D" },
                { metrica: "Taxa de Acerto", desc: "% de diagnósticos corretos sobre o total de casos testados", cor: "#CE93D8" },
              ].map((m) => (
                <View key={m.metrica} style={{ borderLeftWidth: 4, borderLeftColor: m.cor, backgroundColor: m.cor + "10" }} className="rounded-r-xl px-3 py-2 mb-1.5">
                  <Text style={{ color: m.cor }} className="text-xs font-bold">{m.metrica}</Text>
                  <Text className="text-xs text-muted mt-0.5">{m.desc}</Text>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="Meta de Precisão da IA"
              subtitle="85% mínimo → 90%+ desejado"
              color="#1B5E20"
              sectionKey="metaIA"
              expanded={!!expanded.metaIA}
              onToggle={toggle}
            >
              <View className="flex-row gap-3 mb-3">
                {[
                  { label: "Meta Mínima", valor: "85%", desc: "Precisão operacional para aprovação", cor: "#FFB74D" },
                  { label: "Meta Desejada", valor: "90%+", desc: "Excelência em diagnóstico", cor: "#81C784" },
                ].map((m) => (
                  <View key={m.label} style={{ backgroundColor: m.cor + "15", borderWidth: 1, borderColor: m.cor + "40" }} className="flex-1 rounded-xl p-3 items-center">
                    <Text style={{ color: m.cor }} className="text-2xl font-bold">{m.valor}</Text>
                    <Text style={{ color: m.cor }} className="text-xs font-bold mt-1">{m.label}</Text>
                    <Text style={{ color: "#888" }} className="text-xs mt-1 text-center">{m.desc}</Text>
                  </View>
                ))}
              </View>
              <View style={{ backgroundColor: "#E8F5E9" }} className="rounded-xl p-3">
                <Text style={{ color: "#2E7D32" }} className="text-xs font-bold mb-1">Após validação do piloto:</Text>
                {["Reclassificação de diagnósticos incorretos", "Novos treinamentos com imagens reais", "Ajuste de prompts e parâmetros", "Ampliação da base de conhecimento"].map((a) => (
                  <View key={a} className="flex-row items-center py-0.5">
                    <View style={{ backgroundColor: "#81C784", width: 6, height: 6 }} className="rounded-full mr-2" />
                    <Text style={{ color: "#2E7D32" }} className="text-xs">{a}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Indicadores Técnicos"
              subtitle="App · Mobile · Backend"
              color="#37474F"
              sectionKey="indicadoresTec"
              expanded={!!expanded.indicadoresTec}
              onToggle={toggle}
            >
              {[
                {
                  cat: "Aplicação",
                  items: ["Tempo de resposta (< 500ms)", "Disponibilidade (> 99%)", "Taxa de erro (< 0,1%)"],
                  cor: "#64B5F6",
                },
                {
                  cat: "Mobile",
                  items: ["Falhas e crashes (zero críticos)", "Travamentos de UI", "Consumo de bateria (< 5%/hora)"],
                  cor: "#81C784",
                },
                {
                  cat: "Backend",
                  items: ["CPU (< 70% em pico)", "Memória (< 80%)", "Banco de dados (queries < 100ms)", "Uploads (< 5s para 10MB)"],
                  cor: "#FFB74D",
                },
              ].map((c) => (
                <View key={c.cat} className="mb-3">
                  <View style={{ backgroundColor: c.cor + "20" }} className="rounded px-2 py-0.5 mb-2 self-start">
                    <Text style={{ color: c.cor }} className="text-xs font-bold">{c.cat}</Text>
                  </View>
                  {c.items.map((item) => (
                    <View key={item} className="flex-row items-center py-1" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                      <View style={{ backgroundColor: c.cor + "30", width: 8, height: 8 }} className="rounded-full mr-3" />
                      <Text className="text-xs text-foreground">{item}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </ExpandableSection>
          </View>
        )}

        {/* ─── NEGÓCIO ─── */}
        {activeTab === "negocio" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Indicadores de Negócio</Text>
            <Text className="text-xs text-muted mb-4">
              Adoção · Satisfação 4,5+ · Feedback · Questionário
            </Text>

            <ExpandableSection
              title="Indicadores de Adoção"
              subtitle="3 métricas de engajamento"
              color="#1565C0"
              sectionKey="adocao"
              expanded={!!expanded.adocao}
              onToggle={toggle}
            >
              {[
                { ind: "Usuários ativos", desc: "% de participantes que usam o app ≥ 3x por semana", cor: "#64B5F6" },
                { ind: "Retenção", desc: "% de usuários que continuam após 30 dias do piloto", cor: "#81C784" },
                { ind: "Frequência de uso", desc: "Média de diagnósticos por produtor por semana", cor: "#FFB74D" },
              ].map((i) => (
                <View key={i.ind} style={{ borderLeftWidth: 4, borderLeftColor: i.cor, backgroundColor: i.cor + "10" }} className="rounded-r-xl px-3 py-2 mb-1.5">
                  <Text style={{ color: i.cor }} className="text-xs font-bold">{i.ind}</Text>
                  <Text className="text-xs text-muted mt-0.5">{i.desc}</Text>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="Satisfação dos Usuários"
              subtitle="Escala 1-5 · Meta ≥ 4,5 estrelas"
              color="#EF6C00"
              sectionKey="satisfacao"
              expanded={!!expanded.satisfacao}
              onToggle={toggle}
            >
              <View className="items-center mb-4">
                <View style={{ backgroundColor: "#FFF3E0", borderWidth: 2, borderColor: "#FFB74D" }} className="rounded-2xl px-6 py-4 items-center">
                  <Text style={{ color: "#FFB74D" }} className="text-4xl font-bold">4,5+</Text>
                  <Text className="text-xs text-muted mt-1">Meta de satisfação</Text>
                  <View className="flex-row mt-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Text key={s} style={{ color: s <= 4 ? "#FFB74D" : "#E5E7EB" }} className="text-xl mr-1">★</Text>
                    ))}
                  </View>
                </View>
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Categorias de Feedback"
              subtitle="6 dimensões de avaliação"
              color="#6A1B9A"
              sectionKey="feedback"
              expanded={!!expanded.feedback}
              onToggle={toggle}
            >
              <View className="flex-row flex-wrap gap-2">
                {[
                  { cat: "Interface", cor: "#CE93D8" },
                  { cat: "Facilidade de uso", cor: "#64B5F6" },
                  { cat: "Diagnóstico", cor: "#81C784" },
                  { cat: "Relatórios", cor: "#FFB74D" },
                  { cat: "Velocidade", cor: "#EF9A9A" },
                  { cat: "Recursos desejados", cor: "#80CBC4" },
                ].map((c) => (
                  <View key={c.cat} style={{ backgroundColor: c.cor + "20", borderWidth: 1, borderColor: c.cor + "40", width: "47%" }} className="rounded-xl p-3 items-center">
                    <Text style={{ color: c.cor }} className="text-xs font-bold text-center">{c.cat}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Questionário Piloto"
              subtitle="4 perguntas de validação"
              color="#1B5E20"
              sectionKey="questionario"
              expanded={!!expanded.questionario}
              onToggle={toggle}
            >
              {[
                { pergunta: "O sistema foi fácil de usar?", tipo: "Usabilidade", cor: "#81C784" },
                { pergunta: "O diagnóstico ajudou na tomada de decisão?", tipo: "Eficácia", cor: "#64B5F6" },
                { pergunta: "Você utilizaria o AFU novamente?", tipo: "Retenção", cor: "#FFB74D" },
                { pergunta: "Indicaria para outros produtores?", tipo: "NPS", cor: "#CE93D8" },
              ].map((q, i) => (
                <View key={q.pergunta} className="flex-row items-start py-3" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                  <View style={{ backgroundColor: q.cor + "20", width: 24, height: 24 }} className="rounded-full items-center justify-center mr-3 mt-0.5">
                    <Text style={{ color: q.cor }} className="text-xs font-bold">{i + 1}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-semibold text-foreground">{q.pergunta}</Text>
                    <View style={{ backgroundColor: q.cor + "20" }} className="rounded px-2 py-0.5 mt-1 self-start">
                      <Text style={{ color: q.cor }} className="text-xs">{q.tipo}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </ExpandableSection>
          </View>
        )}

        {/* ─── CORREÇÕES ─── */}
        {activeTab === "correcoes" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Correções & Ajustes</Text>
            <Text className="text-xs text-muted mb-4">
              4 níveis · Ajustes IA · Treinamento · Relatório Piloto
            </Text>

            <ExpandableSection
              title="Classificação de Correções"
              subtitle="4 níveis de prioridade"
              color="#C62828"
              sectionKey="niveis"
              expanded={!!expanded.niveis}
              onToggle={toggle}
            >
              {[
                { nivel: "Crítica", desc: "Bloqueiam o uso do sistema · Correção imediata (< 24h)", cor: "#EF9A9A" },
                { nivel: "Alta", desc: "Afetam a operação principal · Correção em 48h", cor: "#FFB74D" },
                { nivel: "Média", desc: "Afetam a experiência do usuário · Correção no sprint", cor: "#64B5F6" },
                { nivel: "Baixa", desc: "Melhorias futuras · Backlog do produto", cor: "#81C784" },
              ].map((n) => (
                <View key={n.nivel} style={{ backgroundColor: n.cor + "15", borderWidth: 1, borderColor: n.cor + "40" }} className="rounded-xl p-3 mb-2">
                  <View style={{ backgroundColor: n.cor }} className="rounded px-2 py-0.5 mb-1 self-start">
                    <Text className="text-white text-xs font-bold">{n.nivel}</Text>
                  </View>
                  <Text style={{ color: "#888" }} className="text-xs">{n.desc}</Text>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="Ajustes da IA Após Validação"
              subtitle="4 ações de refinamento"
              color="#6A1B9A"
              sectionKey="ajustesIA"
              expanded={!!expanded.ajustesIA}
              onToggle={toggle}
            >
              {[
                { acao: "Reclassificação", desc: "Corrigir diagnósticos incorretos identificados pelos técnicos", cor: "#CE93D8" },
                { acao: "Novos treinamentos", desc: "Retreinar o modelo com imagens reais coletadas no campo", cor: "#64B5F6" },
                { acao: "Ajuste de prompts", desc: "Refinar as instruções do modelo para maior precisão", cor: "#FFB74D" },
                { acao: "Ampliação da base", desc: "Adicionar novas culturas, pragas e doenças ao banco de conhecimento", cor: "#81C784" },
              ].map((a) => (
                <View key={a.acao} style={{ borderLeftWidth: 4, borderLeftColor: a.cor, backgroundColor: a.cor + "10" }} className="rounded-r-xl px-3 py-2 mb-1.5">
                  <Text style={{ color: a.cor }} className="text-xs font-bold">{a.acao}</Text>
                  <Text className="text-xs text-muted mt-0.5">{a.desc}</Text>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="Treinamento dos Usuários"
              subtitle="3 conteúdos de capacitação"
              color="#1565C0"
              sectionKey="treinamento"
              expanded={!!expanded.treinamento}
              onToggle={toggle}
            >
              <View className="flex-row flex-wrap gap-2">
                {[
                  { cont: "Uso do aplicativo", desc: "Navegação, cadastro, diagnóstico", cor: "#64B5F6" },
                  { cont: "Captura correta de imagens", desc: "Iluminação, ângulo, foco, distância", cor: "#81C784" },
                  { cont: "Interpretação de diagnósticos", desc: "Leitura do resultado, confiança, recomendações", cor: "#FFB74D" },
                ].map((c) => (
                  <View key={c.cont} style={{ backgroundColor: c.cor + "15", borderWidth: 1, borderColor: c.cor + "40", width: "47%" }} className="rounded-xl p-3">
                    <Text style={{ color: c.cor }} className="text-xs font-bold mb-1">{c.cont}</Text>
                    <Text style={{ color: "#888" }} className="text-xs">{c.desc}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection
              title="Relatório do Projeto Piloto"
              subtitle="5 seções do documento final"
              color="#37474F"
              sectionKey="relatorio"
              expanded={!!expanded.relatorio}
              onToggle={toggle}
            >
              {["Participantes (lista, perfis, regiões)", "Resultados (diagnósticos, métricas, satisfação)", "Desempenho (indicadores técnicos, uptime)", "Problemas encontrados (bugs, feedbacks negativos)", "Melhorias recomendadas (prioridades, roadmap)"].map((s) => (
                <View key={s} className="flex-row items-center py-1.5" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                  <View style={{ backgroundColor: "#ECEFF1", width: 8, height: 8 }} className="rounded-full mr-3" />
                  <Text className="text-xs text-foreground">{s}</Text>
                </View>
              ))}
            </ExpandableSection>
          </View>
        )}

        {/* ─── APROVAÇÃO ─── */}
        {activeTab === "aprovacao" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Aprovação & Entregáveis</Text>
            <Text className="text-xs text-muted mb-4">
              5 critérios · 5 entregáveis · Próxima Etapa 30
            </Text>

            <ExpandableSection
              title="Critérios de Aprovação do AFU 1.0"
              subtitle="5 critérios obrigatórios"
              color="#1B5E20"
              sectionKey="criterios"
              expanded={!!expanded.criterios}
              onToggle={toggle}
            >
              {[
                { crit: "Disponibilidade > 99%", desc: "Uptime durante todo o período piloto", cor: "#81C784" },
                { crit: "Precisão IA > 85%", desc: "Validada por técnicos especialistas em campo", cor: "#64B5F6" },
                { crit: "Satisfação > 4,5", desc: "Média do questionário piloto com todos os participantes", cor: "#FFB74D" },
                { crit: "Sem falhas críticas", desc: "Zero bugs que bloqueiem o uso do sistema", cor: "#EF9A9A" },
                { crit: "Fluxos principais funcionando", desc: "Login, diagnóstico, relatório e histórico 100% operacionais", cor: "#CE93D8" },
              ].map((c) => (
                <View key={c.crit} className="flex-row items-start py-2" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                  <View style={{ backgroundColor: "#E8F5E9", width: 20, height: 20 }} className="rounded items-center justify-center mr-3 mt-0.5">
                    <Text style={{ color: "#2E7D32" }} className="text-xs font-bold">✓</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-semibold text-foreground">{c.crit}</Text>
                    <Text className="text-xs text-muted">{c.desc}</Text>
                  </View>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection
              title="Entregáveis da Etapa 29"
              subtitle="5 artefatos de conclusão"
              color="#0D47A1"
              sectionKey="entregaveis"
              expanded={!!expanded.entregaveis}
              onToggle={toggle}
            >
              <View className="flex-row flex-wrap gap-2">
                {[
                  { ent: "Relatório Piloto", cor: "#64B5F6" },
                  { ent: "Banco de Imagens Reais", cor: "#81C784" },
                  { ent: "Métricas de IA", cor: "#FFB74D" },
                  { ent: "Plano de Correções", cor: "#EF9A9A" },
                  { ent: "Versão RC", cor: "#CE93D8" },
                ].map((e) => (
                  <View key={e.ent} style={{ backgroundColor: e.cor + "20", borderWidth: 1, borderColor: e.cor + "40", width: "47%" }} className="rounded-xl p-3 items-center">
                    <Text style={{ color: e.cor }} className="text-xs font-bold text-center">{e.ent}</Text>
                  </View>
                ))}
              </View>

              {/* Próxima Etapa */}
              <View style={{ backgroundColor: "#2E7D32" }} className="rounded-xl p-4 mt-4">
                <Text className="text-white text-sm font-bold mb-1">Próxima Etapa: 30</Text>
                <Text style={{ color: "#A5D6A7" }} className="text-xs mb-2">Lançamento Oficial AFU 1.0</Text>
                {[
                  "Publicação Android (Google Play)",
                  "Publicação iOS (App Store)",
                  "Portal web público",
                  "Campanha de marketing",
                  "Suporte ao usuário",
                  "Documentação oficial",
                  "Início da operação comercial",
                ].map((item) => (
                  <View key={item} className="flex-row items-center py-0.5">
                    <View style={{ backgroundColor: "#388E3C", width: 6, height: 6 }} className="rounded-full mr-2" />
                    <Text style={{ color: "#C8E6C9" }} className="text-xs">{item}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
