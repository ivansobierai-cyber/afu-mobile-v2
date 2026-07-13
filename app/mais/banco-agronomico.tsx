import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { AfuStackBanner } from "@/components/afu-stack-banner";
import { trpc } from "@/lib/trpc";

const TABS = [
  { id: "tabelas", label: "Tabelas" },
  { id: "genetica", label: "Genética" },
  { id: "nutrientes", label: "Nutrientes" },
  { id: "pragas", label: "Pragas & Doenças" },
  { id: "ia", label: "IA & Consultas" },
  { id: "schema", label: "Schema" },
];

type SectionKey =
  | "culturas" | "cultivos" | "terrenos" | "clima" | "irrigacao"
  | "crescimento" | "estrutura" | "multiplicacao" | "rotacao"
  | "g1" | "g2" | "g3" | "g4" | "g5"
  | "macro" | "micro" | "deficiencias"
  | "insetos" | "doencas" | "controle"
  | "perguntas" | "exemplo"
  | "schema1" | "schema2" | "relacoes";

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
          {subtitle ? <Text className="text-xs text-muted mt-0.5">{subtitle}</Text> : null}
        </View>
        <Text style={{ color }} className="text-base font-bold ml-2">
          {expanded ? "▲" : "▼"}
        </Text>
      </TouchableOpacity>
      {expanded && <View className="p-4 bg-surface">{children}</View>}
    </View>
  );
}

function FieldRow({ field, type, desc, cor }: { field: string; type: string; desc: string; cor: string }) {
  return (
    <View className="flex-row items-center py-1.5" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
      <View style={{ backgroundColor: cor + "20", minWidth: 80 }} className="rounded px-2 py-0.5 mr-2">
        <Text style={{ color: cor }} className="text-xs font-bold">{field}</Text>
      </View>
      <View style={{ backgroundColor: "#F5F5F5", minWidth: 60 }} className="rounded px-2 py-0.5 mr-2">
        <Text style={{ color: "#888" }} className="text-xs">{type}</Text>
      </View>
      <Text className="text-xs text-muted flex-1">{desc}</Text>
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

export default function BancoAgronomico() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState("tabelas");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { data: stats } = trpc.bancoAgronomico.stats.useQuery();

  const criterios = [
    { label: "Schema Drizzle (culturas_catalogo + filhas)", ok: true },
    { label: "API tRPC bancoAgronomico", ok: true },
    { label: "Seed agronômico idempotente", ok: (stats?.totalCulturas ?? 0) > 0 },
    { label: "Catálogo UI conectado ao MySQL", ok: (stats?.totalCulturas ?? 0) > 0 },
    { label: "Consulta composta (clima + pragas)", ok: true },
  ];

  const toggle = (key: SectionKey) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ backgroundColor: "#1B5E20" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-1">
          <View style={{ backgroundColor: "#2E7D32" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">🌿</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Banco de Dados Agronômico Avançado</Text>
            <Text style={{ color: "#A5D6A7" }} className="text-xs">
              13 tabelas · G1→G5 · 12 nutrientes · Pragas · IA inteligente
            </Text>
          </View>
          <View style={{ backgroundColor: "#1B5E20" }} className="rounded-full px-2 py-0.5">
            <Text className="text-white text-xs font-bold">Etapa 30</Text>
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
              <Text style={{ color: activeTab === tab.id ? "#1B5E20" : colors.muted, fontWeight: activeTab === tab.id ? "700" : "400", fontSize: 13 }}>
                {tab.label}
              </Text>
              {activeTab === tab.id && (
                <View style={{ backgroundColor: "#1B5E20", height: 2 }} className="rounded-full mt-1" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        <AfuStackBanner note="Schema de referência abaixo usa nomenclatura Prisma. Implementação real: Drizzle/MySQL em drizzle/schema.ts." />

        <View style={{ backgroundColor: "#1B5E2012", borderWidth: 1, borderColor: "#2E7D3240", borderRadius: 12, padding: 12, marginBottom: 12 }}>
          <Text style={{ color: "#1B5E20", fontWeight: "700", fontSize: 12, marginBottom: 8 }}>Critérios de aceitação (live)</Text>
          {criterios.map((c) => (
            <View key={c.label} className="flex-row items-center py-1">
              <Text className="text-sm mr-2">{c.ok ? "✅" : "⏳"}</Text>
              <Text className="text-xs flex-1 text-foreground">{c.label}</Text>
            </View>
          ))}
          <Text className="text-xs text-muted mt-2">Culturas no catálogo: {stats?.totalCulturas ?? 0}</Text>
        </View>

        {/* ─── TABELAS ─── */}
        {activeTab === "tabelas" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Estrutura do Banco de Dados</Text>
            <Text className="text-xs text-muted mb-4">13 tabelas · Campos · Exemplos · Relações</Text>

            {/* Resumo visual */}
            <View className="flex-row flex-wrap gap-2 mb-4">
              {[
                { t: "culturas", cor: "#81C784" }, { t: "cultivos", cor: "#64B5F6" },
                { t: "terrenos", cor: "#FFCC80" }, { t: "clima_cultura", cor: "#80CBC4" },
                { t: "irrigacao_cultura", cor: "#90CAF9" }, { t: "crescimento_colheita", cor: "#A5D6A7" },
                { t: "genetica_cultura", cor: "#CE93D8" }, { t: "epocas_plantio", cor: "#FFB74D" },
                { t: "estrutura_biologica", cor: "#EF9A9A" }, { t: "nutrientes_cultura", cor: "#80CBC4" },
                { t: "multiplicacao_heranca", cor: "#FFCC80" }, { t: "rotacao_culturas", cor: "#A5D6A7" },
                { t: "controle_pragas", cor: "#EF9A9A" },
              ].map((tb) => (
                <View key={tb.t} style={{ backgroundColor: tb.cor + "20", borderWidth: 1, borderColor: tb.cor + "40" }} className="rounded-lg px-2 py-1">
                  <Text style={{ color: tb.cor, fontSize: 10 }} className="font-semibold">{tb.t}</Text>
                </View>
              ))}
            </View>

            <ExpandableSection title="culturas" subtitle="9 campos · 8 exemplos de culturas" color="#2E7D32" sectionKey="culturas" expanded={!!expanded.culturas} onToggle={toggle}>
              {[
                { f: "id", t: "UUID", d: "Identificador único" },
                { f: "nome_popular", t: "String", d: "Ex: Milho, Soja, Feijão" },
                { f: "nome_cientifico", t: "String?", d: "Ex: Zea mays" },
                { f: "familia_botanica", t: "String?", d: "Ex: Poaceae" },
                { f: "tipo_cultura", t: "String?", d: "Grão, Hortaliça, Fruta..." },
                { f: "ciclo_vida", t: "String?", d: "Anual, Perene, Bienal" },
                { f: "origem", t: "String?", d: "País/região de origem" },
                { f: "descricao", t: "Text?", d: "Descrição técnica completa" },
                { f: "status", t: "String", d: "ativo | inativo" },
              ].map((f) => <FieldRow key={f.f} field={f.f} type={f.t} desc={f.d} cor="#81C784" />)}
              <Text className="text-xs font-semibold text-foreground mt-3 mb-1">Exemplos:</Text>
              <View className="flex-row flex-wrap">
                {["Milho", "Feijão", "Soja", "Mandioca", "Tomate", "Alface", "Banana", "Café"].map((c) => (
                  <Tag key={c} label={c} color="#2E7D32" bg="#E8F5E9" />
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection title="cultivos" subtitle="10 campos · 8 sistemas de cultivo" color="#1565C0" sectionKey="cultivos" expanded={!!expanded.cultivos} onToggle={toggle}>
              {[
                { f: "id", t: "UUID", d: "Identificador único" },
                { f: "cultura_id", t: "FK", d: "Referência à tabela culturas" },
                { f: "propriedade_id", t: "FK?", d: "Referência à propriedade" },
                { f: "nome_cultivo", t: "String", d: "Nome do lote/talhão" },
                { f: "variedade", t: "String?", d: "Ex: TMG 7062 IPRO" },
                { f: "data_plantio", t: "Date?", d: "Data de plantio" },
                { f: "fase_atual", t: "String?", d: "Germinação, Floração..." },
                { f: "area_plantada", t: "Decimal?", d: "Em hectares" },
                { f: "sistema_cultivo", t: "String?", d: "Convencional, Orgânico..." },
                { f: "status", t: "String", d: "ativo | colhido | perdido" },
              ].map((f) => <FieldRow key={f.f} field={f.f} type={f.t} desc={f.d} cor="#64B5F6" />)}
              <Text className="text-xs font-semibold text-foreground mt-3 mb-1">Sistemas de Cultivo:</Text>
              <View className="flex-row flex-wrap">
                {["Convencional", "Orgânico", "Hidropônico", "Agroflorestal", "Estufa", "Campo aberto", "Irrigado", "Sequeiro"].map((s) => (
                  <Tag key={s} label={s} color="#1565C0" bg="#E3F2FD" />
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection title="terrenos" subtitle="13 campos · 6 tipos de solo" color="#EF6C00" sectionKey="terrenos" expanded={!!expanded.terrenos} onToggle={toggle}>
              {[
                { f: "id", t: "UUID", d: "Identificador único" },
                { f: "propriedade_id", t: "FK?", d: "Referência à propriedade" },
                { f: "nome_talhao", t: "String", d: "Nome do talhão/área" },
                { f: "area", t: "Decimal?", d: "Área em hectares" },
                { f: "tipo_solo", t: "String?", d: "Arenoso, Argiloso, Franco..." },
                { f: "textura_solo", t: "String?", d: "Textura física do solo" },
                { f: "ph_medio", t: "Decimal?", d: "pH médio do solo" },
                { f: "materia_organica", t: "Decimal?", d: "% de matéria orgânica" },
                { f: "fertilidade", t: "String?", d: "Alta, Média, Baixa" },
                { f: "latitude", t: "Decimal?", d: "Coordenada GPS" },
                { f: "longitude", t: "Decimal?", d: "Coordenada GPS" },
              ].map((f) => <FieldRow key={f.f} field={f.f} type={f.t} desc={f.d} cor="#FFCC80" />)}
              <Text className="text-xs font-semibold text-foreground mt-3 mb-1">Tipos de Solo:</Text>
              <View className="flex-row flex-wrap">
                {["Arenoso", "Argiloso", "Franco", "Franco-arenoso", "Franco-argiloso", "Orgânico"].map((s) => (
                  <Tag key={s} label={s} color="#EF6C00" bg="#FFF3E0" />
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection title="clima_cultura" subtitle="10 campos · Exigências climáticas" color="#00838F" sectionKey="clima" expanded={!!expanded.clima} onToggle={toggle}>
              {[
                { f: "temperatura_minima", t: "Decimal?", d: "°C mínima tolerada" },
                { f: "temperatura_ideal", t: "Decimal?", d: "°C ideal para crescimento" },
                { f: "temperatura_maxima", t: "Decimal?", d: "°C máxima tolerada" },
                { f: "umidade_ideal", t: "Decimal?", d: "% umidade relativa ideal" },
                { f: "precipitacao_ideal", t: "Decimal?", d: "mm/ano ideal" },
                { f: "altitude_ideal", t: "Decimal?", d: "Metros de altitude ideal" },
                { f: "luminosidade", t: "String?", d: "Pleno sol, Meia sombra..." },
                { f: "sensibilidade_geada", t: "Boolean", d: "Sensível a geadas?" },
                { f: "sensibilidade_seca", t: "Boolean", d: "Sensível à seca?" },
              ].map((f) => <FieldRow key={f.f} field={f.f} type={f.t} desc={f.d} cor="#80CBC4" />)}
            </ExpandableSection>

            <ExpandableSection title="irrigacao_cultura" subtitle="9 campos · 6 tipos de irrigação" color="#1565C0" sectionKey="irrigacao" expanded={!!expanded.irrigacao} onToggle={toggle}>
              {[
                { f: "fase_cultura", t: "String", d: "Fase do ciclo da planta" },
                { f: "necessidade_agua_mm_dia", t: "Decimal?", d: "mm de água por dia" },
                { f: "frequencia_irrigacao", t: "String?", d: "Diária, 2x semana..." },
                { f: "tipo_irrigacao_recomendada", t: "String?", d: "Gotejamento, Aspersão..." },
                { f: "risco_excesso_agua", t: "String?", d: "Descrição do risco" },
                { f: "risco_falta_agua", t: "String?", d: "Descrição do risco" },
              ].map((f) => <FieldRow key={f.f} field={f.f} type={f.t} desc={f.d} cor="#90CAF9" />)}
              <Text className="text-xs font-semibold text-foreground mt-3 mb-1">Tipos de Irrigação:</Text>
              <View className="flex-row flex-wrap">
                {["Gotejamento", "Aspersão", "Microaspersão", "Sulco", "Pivô central", "Manual"].map((t) => (
                  <Tag key={t} label={t} color="#1565C0" bg="#E3F2FD" />
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection title="crescimento_colheita" subtitle="8 campos · 8 fases do ciclo" color="#2E7D32" sectionKey="crescimento" expanded={!!expanded.crescimento} onToggle={toggle}>
              {[
                { f: "fase", t: "String", d: "Germinação, Floração..." },
                { f: "dias_inicio", t: "Int?", d: "Dia de início da fase" },
                { f: "dias_fim", t: "Int?", d: "Dia de fim da fase" },
                { f: "descricao_fase", t: "Text?", d: "Descrição técnica" },
                { f: "cuidados", t: "Text?", d: "Cuidados necessários" },
                { f: "indicador_colheita", t: "String?", d: "Como saber que está pronto" },
              ].map((f) => <FieldRow key={f.f} field={f.f} type={f.t} desc={f.d} cor="#A5D6A7" />)}
              <Text className="text-xs font-semibold text-foreground mt-3 mb-1">Fases do Ciclo:</Text>
              <View className="flex-row flex-wrap">
                {["Germinação", "Muda", "Crescimento vegetativo", "Floração", "Frutificação", "Maturação", "Colheita", "Pós-colheita"].map((f) => (
                  <Tag key={f} label={f} color="#2E7D32" bg="#E8F5E9" />
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection title="estrutura_biologica" subtitle="7 campos · 8 partes da planta" color="#6A1B9A" sectionKey="estrutura" expanded={!!expanded.estrutura} onToggle={toggle}>
              {[
                { f: "parte_planta", t: "String", d: "Raiz, Caule, Folha..." },
                { f: "funcao_biologica", t: "Text?", d: "Função fisiológica" },
                { f: "problemas_comuns", t: "Text?", d: "Problemas frequentes" },
                { f: "sinais_diagnostico", t: "Text?", d: "Sinais visuais para IA" },
                { f: "imagens_referencia", t: "String?", d: "URLs de imagens de referência" },
              ].map((f) => <FieldRow key={f.f} field={f.f} type={f.t} desc={f.d} cor="#CE93D8" />)}
              <Text className="text-xs font-semibold text-foreground mt-3 mb-1">Partes da Planta:</Text>
              <View className="flex-row flex-wrap">
                {["Raiz", "Caule", "Folha", "Flor", "Fruto", "Semente", "Tubérculo", "Rizoma"].map((p) => (
                  <Tag key={p} label={p} color="#6A1B9A" bg="#F3E5F5" />
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection title="rotacao_culturas" subtitle="8 campos · 5 tipos · 4 exemplos" color="#EF6C00" sectionKey="rotacao" expanded={!!expanded.rotacao} onToggle={toggle}>
              {[
                { f: "cultura_principal_id", t: "FK", d: "Cultura atual" },
                { f: "cultura_recomendada_id", t: "FK", d: "Cultura para rotacionar" },
                { f: "tipo_rotacao", t: "String?", d: "Rotação, Consórcio..." },
                { f: "beneficio", t: "Text?", d: "Benefício agronômico" },
                { f: "intervalo_recomendado", t: "String?", d: "Tempo entre cultivos" },
                { f: "risco_incompatibilidade", t: "Text?", d: "Riscos se não respeitado" },
              ].map((f) => <FieldRow key={f.f} field={f.f} type={f.t} desc={f.d} cor="#FFCC80" />)}
              <Text className="text-xs font-semibold text-foreground mt-3 mb-1">Exemplos de Rotação:</Text>
              {[
                { de: "Milho", para: "Feijão", cor: "#FFB74D" },
                { de: "Soja", para: "Milheto", cor: "#81C784" },
                { de: "Tomate", para: "Alface", cor: "#EF9A9A" },
                { de: "Mandioca", para: "Amendoim", cor: "#FFCC80" },
              ].map((r) => (
                <View key={r.de} style={{ backgroundColor: r.cor + "15" }} className="flex-row items-center rounded-xl px-3 py-2 mb-1">
                  <Text style={{ color: r.cor }} className="text-xs font-bold">{r.de}</Text>
                  <Text style={{ color: "#888" }} className="text-xs mx-2">→</Text>
                  <Text style={{ color: r.cor }} className="text-xs font-bold">{r.para}</Text>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection title="multiplicacao_heranca" subtitle="10 campos · 8 tipos de propagação" color="#37474F" sectionKey="multiplicacao" expanded={!!expanded.multiplicacao} onToggle={toggle}>
              {[
                { f: "tipo_multiplicacao", t: "String", d: "Semente, Muda, Estaquia..." },
                { f: "material_usado", t: "String?", d: "Material de propagação" },
                { f: "geracao_origem", t: "String?", d: "G1, G2, G3..." },
                { f: "geracao_destino", t: "String?", d: "Geração resultante" },
                { f: "taxa_multiplicacao", t: "Decimal?", d: "Fator de multiplicação" },
                { f: "viabilidade", t: "String?", d: "Alta, Média, Baixa" },
                { f: "risco_degeneracao", t: "String?", d: "Risco de perda de qualidade" },
                { f: "recomendacao_replantio", t: "Text?", d: "Quando e como replantar" },
              ].map((f) => <FieldRow key={f.f} field={f.f} type={f.t} desc={f.d} cor="#90A4AE" />)}
              <Text className="text-xs font-semibold text-foreground mt-3 mb-1">Tipos de Multiplicação:</Text>
              <View className="flex-row flex-wrap">
                {["Semente", "Muda", "Estaquia", "Enxertia", "Bulbo", "Tubérculo", "Rizoma", "Clone"].map((t) => (
                  <Tag key={t} label={t} color="#37474F" bg="#ECEFF1" />
                ))}
              </View>
            </ExpandableSection>
          </View>
        )}

        {/* ─── GENÉTICA ─── */}
        {activeTab === "genetica" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Controle Genético G1 → G5</Text>
            <Text className="text-xs text-muted mb-4">Herança genética · Linhagens · Produtividade · Resistências</Text>

            {/* Diagrama G1→G5 */}
            <View style={{ backgroundColor: "#1A1A2E" }} className="rounded-xl p-4 mb-4">
              <Text style={{ color: "#A5D6A7" }} className="text-xs font-bold mb-3 text-center">Fluxo de Gerações Genéticas</Text>
              {[
                { g: "G1", label: "Matriz genética original", desc: "Semente certificada, origem controlada", cor: "#81C784" },
                { g: "G2", label: "Primeira multiplicação", desc: "Reprodução da G1, alta viabilidade", cor: "#64B5F6" },
                { g: "G3", label: "Segunda multiplicação", desc: "Uso produtivo, boa resistência", cor: "#FFB74D" },
                { g: "G4", label: "Terceira multiplicação", desc: "Início de degeneração possível", cor: "#CE93D8" },
                { g: "G5", label: "Lote produtivo/replantio", desc: "Limite recomendado para replantio", cor: "#EF9A9A" },
              ].map((gen, i) => (
                <View key={gen.g} className="items-start mb-1">
                  <View style={{ backgroundColor: gen.cor + "20", borderWidth: 1, borderColor: gen.cor, flexDirection: "row", alignItems: "center" }} className="rounded-xl px-3 py-2 w-full">
                    <View style={{ backgroundColor: gen.cor, width: 28, height: 28 }} className="rounded-full items-center justify-center mr-3">
                      <Text className="text-white text-xs font-bold">{gen.g}</Text>
                    </View>
                    <View className="flex-1">
                      <Text style={{ color: gen.cor }} className="text-xs font-bold">{gen.label}</Text>
                      <Text style={{ color: "#999" }} className="text-xs">{gen.desc}</Text>
                    </View>
                  </View>
                  {i < 4 && <Text style={{ color: "#555" }} className="text-sm ml-8">↓</Text>}
                </View>
              ))}
            </View>

            {/* Campos da tabela genetica_cultura */}
            <View className="mb-3 rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
              <View style={{ backgroundColor: "#6A1B9A15" }} className="p-4">
                <Text className="text-sm font-bold text-foreground">Tabela: genetica_cultura</Text>
                <Text className="text-xs text-muted mt-0.5">11 campos de controle genético</Text>
              </View>
              <View className="p-4 bg-surface">
                {[
                  { f: "geracao", t: "String", d: "G1, G2, G3, G4 ou G5" },
                  { f: "codigo_linhagem", t: "String?", d: "Código de identificação da linhagem" },
                  { f: "origem_genetica", t: "String?", d: "Empresa, instituição ou produtor" },
                  { f: "caracteristicas", t: "Text?", d: "Descrição das características" },
                  { f: "produtividade_estimada", t: "Decimal?", d: "Produtividade esperada (kg/ha)" },
                  { f: "resistencia_pragas", t: "String?", d: "Alta, Média, Baixa" },
                  { f: "resistencia_doencas", t: "String?", d: "Alta, Média, Baixa" },
                  { f: "adaptacao_climatica", t: "String?", d: "Regiões de melhor adaptação" },
                  { f: "qualidade_semente", t: "String?", d: "Certificada, Fiscalizada, S2" },
                ].map((f) => <FieldRow key={f.f} field={f.f} type={f.t} desc={f.d} cor="#CE93D8" />)}
              </View>
            </View>

            {/* Comparativo de gerações */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
              <View style={{ backgroundColor: "#1B5E2015" }} className="p-4">
                <Text className="text-sm font-bold text-foreground">Comparativo de Qualidade por Geração</Text>
              </View>
              <View className="p-4 bg-surface">
                {[
                  { g: "G1", prod: "100%", resist: "Alta", viab: "Máxima", cor: "#81C784" },
                  { g: "G2", prod: "95%", resist: "Alta", viab: "Excelente", cor: "#64B5F6" },
                  { g: "G3", prod: "88%", resist: "Média", viab: "Boa", cor: "#FFB74D" },
                  { g: "G4", prod: "78%", resist: "Média", viab: "Regular", cor: "#CE93D8" },
                  { g: "G5", prod: "65%", resist: "Baixa", viab: "Limite", cor: "#EF9A9A" },
                ].map((row) => (
                  <View key={row.g} className="flex-row items-center py-2" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                    <View style={{ backgroundColor: row.cor, width: 28, height: 28 }} className="rounded-full items-center justify-center mr-3">
                      <Text className="text-white text-xs font-bold">{row.g}</Text>
                    </View>
                    <Text className="text-xs font-semibold text-foreground w-12">{row.prod}</Text>
                    <Text className="text-xs text-muted w-16">{row.resist}</Text>
                    <Text style={{ color: row.cor }} className="text-xs font-semibold flex-1">{row.viab}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── NUTRIENTES ─── */}
        {activeTab === "nutrientes" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Nutrição das Culturas</Text>
            <Text className="text-xs text-muted mb-4">12 nutrientes · Deficiência · Excesso · Correção</Text>

            <ExpandableSection title="Macronutrientes Primários" subtitle="N · P · K — os mais exigidos" color="#2E7D32" sectionKey="macro" expanded={!!expanded.macro} onToggle={toggle}>
              {[
                { n: "N — Nitrogênio", def: "Folhas amarelas, crescimento lento", exc: "Crescimento excessivo, suscetível a doenças", cor: "#81C784" },
                { n: "P — Fósforo", def: "Folhas roxas/avermelhadas, raízes fracas", exc: "Bloqueio de zinco e ferro", cor: "#64B5F6" },
                { n: "K — Potássio", def: "Bordas das folhas queimadas, frutos pequenos", exc: "Bloqueio de magnésio e cálcio", cor: "#FFB74D" },
              ].map((nut) => (
                <View key={nut.n} style={{ backgroundColor: nut.cor + "10", borderWidth: 1, borderColor: nut.cor + "30" }} className="rounded-xl p-3 mb-2">
                  <Text style={{ color: nut.cor }} className="text-xs font-bold mb-1">{nut.n}</Text>
                  <View className="flex-row gap-2">
                    <View style={{ backgroundColor: "#EF9A9A20", flex: 1 }} className="rounded p-2">
                      <Text style={{ color: "#C62828" }} className="text-xs font-semibold mb-0.5">Deficiência</Text>
                      <Text style={{ color: "#888" }} className="text-xs">{nut.def}</Text>
                    </View>
                    <View style={{ backgroundColor: "#FFB74D20", flex: 1 }} className="rounded p-2">
                      <Text style={{ color: "#E65100" }} className="text-xs font-semibold mb-0.5">Excesso</Text>
                      <Text style={{ color: "#888" }} className="text-xs">{nut.exc}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection title="Macronutrientes Secundários" subtitle="Ca · Mg · S" color="#1565C0" sectionKey="micro" expanded={!!expanded.micro} onToggle={toggle}>
              {[
                { n: "Ca — Cálcio", def: "Morte do ápice, frutos deformados", exc: "Raro, pode bloquear Mg e K", cor: "#90CAF9" },
                { n: "Mg — Magnésio", def: "Clorose internerval nas folhas velhas", exc: "Raro em solos naturais", cor: "#80CBC4" },
                { n: "S — Enxofre", def: "Folhas jovens amarelas, crescimento lento", exc: "Raro, pode acidificar o solo", cor: "#FFCC80" },
              ].map((nut) => (
                <View key={nut.n} style={{ backgroundColor: nut.cor + "10", borderWidth: 1, borderColor: nut.cor + "30" }} className="rounded-xl p-3 mb-2">
                  <Text style={{ color: nut.cor }} className="text-xs font-bold mb-1">{nut.n}</Text>
                  <View className="flex-row gap-2">
                    <View style={{ backgroundColor: "#EF9A9A20", flex: 1 }} className="rounded p-2">
                      <Text style={{ color: "#C62828" }} className="text-xs font-semibold mb-0.5">Deficiência</Text>
                      <Text style={{ color: "#888" }} className="text-xs">{nut.def}</Text>
                    </View>
                    <View style={{ backgroundColor: "#FFB74D20", flex: 1 }} className="rounded p-2">
                      <Text style={{ color: "#E65100" }} className="text-xs font-semibold mb-0.5">Excesso</Text>
                      <Text style={{ color: "#888" }} className="text-xs">{nut.exc}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection title="Micronutrientes" subtitle="B · Zn · Cu · Fe · Mn · Mo" color="#6A1B9A" sectionKey="deficiencias" expanded={!!expanded.deficiencias} onToggle={toggle}>
              {[
                { n: "B — Boro", def: "Morte do broto terminal, frutos deformados", cor: "#CE93D8" },
                { n: "Zn — Zinco", def: "Folhas pequenas, entrenós curtos", cor: "#64B5F6" },
                { n: "Cu — Cobre", def: "Folhas azuladas, murcha apical", cor: "#FFCC80" },
                { n: "Fe — Ferro", def: "Clorose internerval em folhas jovens", cor: "#EF9A9A" },
                { n: "Mn — Manganês", def: "Manchas cloróticas entre nervuras", cor: "#A5D6A7" },
                { n: "Mo — Molibdênio", def: "Folhas em concha, bordas queimadas", cor: "#80CBC4" },
              ].map((nut) => (
                <View key={nut.n} className="flex-row items-center py-1.5" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                  <View style={{ backgroundColor: nut.cor + "20", minWidth: 80 }} className="rounded px-2 py-0.5 mr-2">
                    <Text style={{ color: nut.cor }} className="text-xs font-bold">{nut.n}</Text>
                  </View>
                  <Text className="text-xs text-muted flex-1">{nut.def}</Text>
                </View>
              ))}
            </ExpandableSection>

            {/* Tabela nutrientes_cultura */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
              <View style={{ backgroundColor: "#1B5E2015" }} className="p-4">
                <Text className="text-sm font-bold text-foreground">Tabela: nutrientes_cultura</Text>
                <Text className="text-xs text-muted mt-0.5">9 campos por nutriente × fase</Text>
              </View>
              <View className="p-4 bg-surface">
                {[
                  { f: "nutriente", t: "String", d: "N, P, K, Ca, Mg, S, B, Zn..." },
                  { f: "fase_cultura", t: "String?", d: "Germinação, Floração..." },
                  { f: "necessidade_baixa", t: "Decimal?", d: "kg/ha mínimo" },
                  { f: "necessidade_media", t: "Decimal?", d: "kg/ha médio" },
                  { f: "necessidade_alta", t: "Decimal?", d: "kg/ha máximo" },
                  { f: "sintoma_deficiencia", t: "Text?", d: "Sintomas visuais" },
                  { f: "sintoma_excesso", t: "Text?", d: "Sintomas de excesso" },
                  { f: "forma_correcao", t: "Text?", d: "Como corrigir" },
                ].map((f) => <FieldRow key={f.f} field={f.f} type={f.t} desc={f.d} cor="#81C784" />)}
              </View>
            </View>
          </View>
        )}

        {/* ─── PRAGAS & DOENÇAS ─── */}
        {activeTab === "pragas" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Controle de Pragas e Doenças</Text>
            <Text className="text-xs text-muted mb-4">6 grupos de pragas · 6 tipos de doenças · Controle integrado</Text>

            <ExpandableSection title="Tabela: pragas" subtitle="8 campos · 6 grupos" color="#C62828" sectionKey="insetos" expanded={!!expanded.insetos} onToggle={toggle}>
              {[
                { f: "nome_popular", t: "String", d: "Ex: Lagarta-do-cartucho" },
                { f: "nome_cientifico", t: "String?", d: "Ex: Spodoptera frugiperda" },
                { f: "grupo", t: "String", d: "Inseto, Ácaro, Nematóide..." },
                { f: "descricao", t: "Text?", d: "Descrição da praga" },
                { f: "ciclo_vida", t: "String?", d: "Ciclo de vida em dias" },
                { f: "danos", t: "Text?", d: "Danos causados à cultura" },
                { f: "imagens", t: "String?", d: "URLs de imagens de referência" },
              ].map((f) => <FieldRow key={f.f} field={f.f} type={f.t} desc={f.d} cor="#EF9A9A" />)}
              <Text className="text-xs font-semibold text-foreground mt-3 mb-1">Grupos de Pragas:</Text>
              <View className="flex-row flex-wrap">
                {[
                  { g: "Inseto", cor: "#EF9A9A" },
                  { g: "Ácaro", cor: "#FFB74D" },
                  { g: "Nematóide", cor: "#FFCC80" },
                  { g: "Molusco", cor: "#80CBC4" },
                  { g: "Roedor", cor: "#CE93D8" },
                  { g: "Ave", cor: "#64B5F6" },
                ].map((g) => <Tag key={g.g} label={g.g} color={g.cor} bg={g.cor + "20"} />)}
              </View>
            </ExpandableSection>

            <ExpandableSection title="Tabela: doencas" subtitle="8 campos · 6 tipos" color="#6A1B9A" sectionKey="doencas" expanded={!!expanded.doencas} onToggle={toggle}>
              {[
                { f: "nome", t: "String", d: "Ex: Ferrugem asiática" },
                { f: "agente_causal", t: "String?", d: "Fungo, bactéria, vírus..." },
                { f: "tipo", t: "String", d: "Fúngica, Bacteriana, Viral..." },
                { f: "sintomas", t: "Text?", d: "Sintomas visuais na planta" },
                { f: "condicoes_favoraveis", t: "Text?", d: "Temperatura, umidade, etc." },
                { f: "controle", t: "Text?", d: "Métodos de controle" },
                { f: "imagens", t: "String?", d: "URLs de imagens de referência" },
              ].map((f) => <FieldRow key={f.f} field={f.f} type={f.t} desc={f.d} cor="#CE93D8" />)}
              <Text className="text-xs font-semibold text-foreground mt-3 mb-1">Tipos de Doenças:</Text>
              <View className="flex-row flex-wrap">
                {[
                  { t: "Fúngica", cor: "#CE93D8" },
                  { t: "Bacteriana", cor: "#EF9A9A" },
                  { t: "Viral", cor: "#64B5F6" },
                  { t: "Nematoide", cor: "#FFCC80" },
                  { t: "Fisiológica", cor: "#80CBC4" },
                  { t: "Nutricional", cor: "#81C784" },
                ].map((tp) => <Tag key={tp.t} label={tp.t} color={tp.cor} bg={tp.cor + "20"} />)}
              </View>
            </ExpandableSection>

            <ExpandableSection title="controle_pragas_cultura" subtitle="11 campos · Controle integrado" color="#1B5E20" sectionKey="controle" expanded={!!expanded.controle} onToggle={toggle}>
              {[
                { f: "fase_mais_suscetivel", t: "String?", d: "Fase de maior risco" },
                { f: "nivel_risco", t: "String?", d: "Alto, Médio, Baixo" },
                { f: "sintomas", t: "Text?", d: "Sintomas visíveis na planta" },
                { f: "controle_biologico", t: "Text?", d: "Predadores naturais, bioinseticidas" },
                { f: "controle_organico", t: "Text?", d: "Caldas, extratos vegetais" },
                { f: "controle_quimico", t: "Text?", d: "Produtos registrados no MAPA" },
                { f: "prevencao", t: "Text?", d: "Medidas preventivas" },
                { f: "periodo_monitoramento", t: "String?", d: "Frequência de monitoramento" },
              ].map((f) => <FieldRow key={f.f} field={f.f} type={f.t} desc={f.d} cor="#A5D6A7" />)}
            </ExpandableSection>
          </View>
        )}

        {/* ─── IA & CONSULTAS ─── */}
        {activeTab === "ia" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">IA & Consultas Inteligentes</Text>
            <Text className="text-xs text-muted mb-4">9 perguntas respondidas · Exemplo completo · Cruzamento de dados</Text>

            <ExpandableSection title="Perguntas que a IA Responde" subtitle="9 consultas agronômicas inteligentes" color="#1B5E20" sectionKey="perguntas" expanded={!!expanded.perguntas} onToggle={toggle}>
              {[
                { q: "Qual cultura plantar neste terreno?", tabelas: "terrenos + clima_cultura + epocas_plantio", cor: "#81C784" },
                { q: "Qual a melhor época de plantio?", tabelas: "epocas_plantio + clima_cultura", cor: "#64B5F6" },
                { q: "Quanto tempo falta para colher?", tabelas: "crescimento_colheita + cultivos", cor: "#FFB74D" },
                { q: "Qual nutriente está faltando?", tabelas: "nutrientes_cultura + estrutura_biologica", cor: "#CE93D8" },
                { q: "Essa cultura pode ser replantada?", tabelas: "multiplicacao_heranca + genetica_cultura", cor: "#EF9A9A" },
                { q: "Qual geração genética está mais forte?", tabelas: "genetica_cultura", cor: "#80CBC4" },
                { q: "Qual rotação é recomendada?", tabelas: "rotacao_culturas", cor: "#FFCC80" },
                { q: "Qual praga ameaça essa fase?", tabelas: "controle_pragas_cultura + pragas", cor: "#90CAF9" },
                { q: "Qual irrigação ideal para esta cultura?", tabelas: "irrigacao_cultura + clima_cultura", cor: "#A5D6A7" },
              ].map((item) => (
                <View key={item.q} style={{ borderLeftWidth: 4, borderLeftColor: item.cor, backgroundColor: item.cor + "10" }} className="rounded-r-xl px-3 py-2 mb-1.5">
                  <Text style={{ color: item.cor }} className="text-xs font-bold">{item.q}</Text>
                  <Text style={{ color: "#888" }} className="text-xs mt-0.5">Tabelas: {item.tabelas}</Text>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection title="Exemplo de Consulta Inteligente" subtitle="Milho · Nordeste · G3 · Floração" color="#6A1B9A" sectionKey="exemplo" expanded={!!expanded.exemplo} onToggle={toggle}>
              {/* Entrada */}
              <View style={{ backgroundColor: "#1A1A2E" }} className="rounded-xl p-4 mb-3">
                <Text style={{ color: "#A5D6A7" }} className="text-xs font-bold mb-2">Entrada:</Text>
                {[
                  { k: "Cultura", v: "Milho" },
                  { k: "Região", v: "Nordeste" },
                  { k: "Solo", v: "Franco-arenoso" },
                  { k: "Temperatura", v: "32°C" },
                  { k: "Fase", v: "Floração" },
                  { k: "Geração", v: "G3" },
                ].map((row) => (
                  <View key={row.k} className="flex-row py-0.5">
                    <Text style={{ color: "#64B5F6", width: 90 }} className="text-xs font-semibold">{row.k}:</Text>
                    <Text style={{ color: "#E0E0E0" }} className="text-xs">{row.v}</Text>
                  </View>
                ))}
              </View>
              {/* Saída */}
              <View style={{ backgroundColor: "#1A2E1A" }} className="rounded-xl p-4">
                <Text style={{ color: "#A5D6A7" }} className="text-xs font-bold mb-2">Saída Esperada:</Text>
                {[
                  { k: "Risco hídrico", v: "Alto — estresse hídrico na floração", cor: "#EF9A9A" },
                  { k: "Irrigação", v: "Diária ou a cada 2 dias", cor: "#64B5F6" },
                  { k: "Nutrientes críticos", v: "Nitrogênio e Potássio", cor: "#FFB74D" },
                  { k: "Pragas prováveis", v: "Lagarta-do-cartucho e percevejo", cor: "#CE93D8" },
                  { k: "Tempo até colheita", v: "35 a 50 dias", cor: "#81C784" },
                  { k: "Rotação recomendada", v: "Feijão, crotalária ou milheto", cor: "#80CBC4" },
                ].map((row) => (
                  <View key={row.k} className="flex-row py-0.5 items-start">
                    <Text style={{ color: row.cor, width: 110 }} className="text-xs font-semibold">{row.k}:</Text>
                    <Text style={{ color: "#E0E0E0" }} className="text-xs flex-1">{row.v}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>

            {/* Cruzamento de dados */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
              <View style={{ backgroundColor: "#1B5E2015" }} className="p-4">
                <Text className="text-sm font-bold text-foreground">Cruzamento de Dados</Text>
                <Text className="text-xs text-muted mt-0.5">O banco transforma o AFU em base agronômica inteligente</Text>
              </View>
              <View className="p-4 bg-surface">
                <View style={{ backgroundColor: "#1A1A2E" }} className="rounded-xl p-3">
                  <Text style={{ color: "#A5D6A7" }} className="text-xs font-bold mb-2 text-center">Dados Cruzados pela IA</Text>
                  <View className="flex-row flex-wrap justify-center gap-2">
                    {["cultura", "solo", "clima", "irrigação", "genética", "nutrientes", "pragas", "rotação"].map((d) => (
                      <View key={d} style={{ backgroundColor: "#81C784" + "20", borderWidth: 1, borderColor: "#81C784" + "40" }} className="rounded-full px-3 py-1">
                        <Text style={{ color: "#81C784" }} className="text-xs font-semibold">{d}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={{ color: "#999" }} className="text-xs text-center mt-3">
                    → Recomendações avançadas de plantio, manejo, replantio, colheita e controle fitossanitário
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ─── SCHEMA ─── */}
        {activeTab === "schema" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Schema Prisma</Text>
            <Text className="text-xs text-muted mb-4">Modelos completos · Relações · Tipos de dados</Text>

            <ExpandableSection title="Modelos Principais" subtitle="CulturaAvancada · CultivoAvancado · Terreno" color="#1B5E20" sectionKey="schema1" expanded={!!expanded.schema1} onToggle={toggle}>
              <View style={{ backgroundColor: "#1A1A2E" }} className="rounded-xl p-3">
                <Text style={{ color: "#A5D6A7", fontFamily: "monospace" }} className="text-xs leading-5">
                  {`model CulturaAvancada {\n  id              String   @id\n  nomePopular     String\n  nomeCientifico  String?\n  familiaBotanica String?\n  tipoCultura     String?\n  cicloVida       String?\n  status          String\n\n  cultivos        CultivoAvancado[]\n  clima           ClimaCultura[]\n  irrigacao       IrrigacaoCultura[]\n  crescimento     CrescimentoColheita[]\n  genetica        GeneticaCultura[]\n  nutrientes      NutrienteCultura[]\n}`}
                </Text>
              </View>
              <View style={{ backgroundColor: "#1A1A2E" }} className="rounded-xl p-3 mt-2">
                <Text style={{ color: "#64B5F6", fontFamily: "monospace" }} className="text-xs leading-5">
                  {`model Terreno {\n  id              String   @id\n  nomeTalhao      String\n  tipoSolo        String?\n  phMedio         Decimal?\n  fertilidade     String?\n  latitude        Decimal?\n  longitude       Decimal?\n\n  cultivos        CultivoAvancado[]\n}`}
                </Text>
              </View>
            </ExpandableSection>

            <ExpandableSection title="Modelos de Controle" subtitle="GeneticaCultura · NutrienteCultura · RotacaoCultura" color="#6A1B9A" sectionKey="schema2" expanded={!!expanded.schema2} onToggle={toggle}>
              <View style={{ backgroundColor: "#1A1A2E" }} className="rounded-xl p-3">
                <Text style={{ color: "#CE93D8", fontFamily: "monospace" }} className="text-xs leading-5">
                  {`model GeneticaCultura {\n  id                    String @id\n  culturaId             String\n  geracao               String  // G1-G5\n  produtividadeEstimada Decimal?\n  resistenciaPragas     String?\n  resistenciaDoencas    String?\n  qualidadeSemente      String?\n}`}
                </Text>
              </View>
              <View style={{ backgroundColor: "#1A1A2E" }} className="rounded-xl p-3 mt-2">
                <Text style={{ color: "#81C784", fontFamily: "monospace" }} className="text-xs leading-5">
                  {`model NutrienteCultura {\n  id                 String @id\n  culturaId          String\n  nutriente          String  // N,P,K...\n  faseCultura        String?\n  sintomaDeficiencia String?\n  sintomaExcesso     String?\n  formaCorrecao      String?\n}`}
                </Text>
              </View>
              <View style={{ backgroundColor: "#1A1A2E" }} className="rounded-xl p-3 mt-2">
                <Text style={{ color: "#FFB74D", fontFamily: "monospace" }} className="text-xs leading-5">
                  {`model RotacaoCultura {\n  id                     String @id\n  culturaPrincipalId     String\n  culturaRecomendadaId   String\n  tipoRotacao            String?\n  beneficio              String?\n  riscoIncompatibilidade String?\n}`}
                </Text>
              </View>
            </ExpandableSection>

            <ExpandableSection title="Relações Principais" subtitle="Diagrama de relacionamentos" color="#37474F" sectionKey="relacoes" expanded={!!expanded.relacoes} onToggle={toggle}>
              <View style={{ backgroundColor: "#1A1A2E" }} className="rounded-xl p-4">
                {[
                  { rel: "cultura → muitos cultivos", cor: "#81C784" },
                  { rel: "cultura → muitas exigências climáticas", cor: "#64B5F6" },
                  { rel: "cultura → muitas fases de crescimento", cor: "#FFB74D" },
                  { rel: "cultura → muitas gerações genéticas", cor: "#CE93D8" },
                  { rel: "cultura → muitos nutrientes", cor: "#80CBC4" },
                  { rel: "cultura → muitas pragas", cor: "#EF9A9A" },
                  { rel: "cultura → muitas doenças", cor: "#FFCC80" },
                  { rel: "cultura → muitas rotações", cor: "#A5D6A7" },
                  { rel: "terreno → muitos cultivos", cor: "#90CAF9" },
                  { rel: "cultivo → histórico de irrigação", cor: "#64B5F6" },
                  { rel: "cultivo → histórico de colheita", cor: "#81C784" },
                ].map((r) => (
                  <View key={r.rel} className="flex-row items-center py-0.5">
                    <View style={{ backgroundColor: r.cor, width: 6, height: 6 }} className="rounded-full mr-2" />
                    <Text style={{ color: r.cor }} className="text-xs">{r.rel}</Text>
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
