import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

const TABS = [
  { id: "objetivo", label: "Objetivo" },
  { id: "dados", label: "Dados" },
  { id: "script", label: "Script" },
  { id: "schema", label: "Schema" },
  { id: "execucao", label: "Execução" },
];

function CodeBlock({ code, color = "#A5D6A7" }: { code: string; color?: string }) {
  return (
    <View style={{ backgroundColor: "#1A1A2E" }} className="rounded-xl p-4 mb-3">
      <Text style={{ color, fontFamily: "monospace", fontSize: 11, lineHeight: 18 }}>
        {code}
      </Text>
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

const CULTURAS_SEED = [
  { nome: "Café Arábica", cientifico: "Coffea arabica", familia: "Rubiaceae", tipo: "Perene", ciclo: "Perene", origem: "Etiópia", cor: "#4E342E", emoji: "☕" },
  { nome: "Couve-flor", cientifico: "Brassica oleracea var. botrytis", familia: "Brassicaceae", tipo: "Hortaliça", ciclo: "Anual", origem: "Mediterrâneo", cor: "#81C784", emoji: "🥦" },
  { nome: "Brócolis", cientifico: "Brassica oleracea var. italica", familia: "Brassicaceae", tipo: "Hortaliça", ciclo: "Anual", origem: "Mediterrâneo", cor: "#2E7D32", emoji: "🥦" },
  { nome: "Alface", cientifico: "Lactuca sativa", familia: "Asteraceae", tipo: "Hortaliça folhosa", ciclo: "Anual", origem: "Mediterrâneo/Ásia Ocidental", cor: "#66BB6A", emoji: "🥬" },
  { nome: "Tomate", cientifico: "Solanum lycopersicum", familia: "Solanaceae", tipo: "Hortaliça-fruto", ciclo: "Anual", origem: "América do Sul", cor: "#EF5350", emoji: "🍅" },
  { nome: "Repolho", cientifico: "Brassica oleracea var. capitata", familia: "Brassicaceae", tipo: "Hortaliça", ciclo: "Anual", origem: "Mediterrâneo", cor: "#7CB342", emoji: "🥬" },
  { nome: "Salsa", cientifico: "Petroselinum crispum", familia: "Apiaceae", tipo: "Erva aromática", ciclo: "Bienal", origem: "Mediterrâneo", cor: "#43A047", emoji: "🌿" },
  { nome: "Coentro", cientifico: "Coriandrum sativum", familia: "Apiaceae", tipo: "Erva aromática", ciclo: "Anual", origem: "Mediterrâneo/Ásia", cor: "#558B2F", emoji: "🌿" },
  { nome: "Morango", cientifico: "Fragaria × ananassa", familia: "Rosaceae", tipo: "Pequena fruta", ciclo: "Perene/Anual", origem: "Híbrido cultivado", cor: "#E53935", emoji: "🍓" },
  { nome: "Caqui", cientifico: "Diospyros kaki", familia: "Ebenaceae", tipo: "Frutífera perene", ciclo: "Perene", origem: "Ásia Oriental", cor: "#FF6F00", emoji: "🍊" },
  { nome: "Amora-preta", cientifico: "Rubus spp.", familia: "Rosaceae", tipo: "Pequena fruta", ciclo: "Perene", origem: "Diversas espécies Rubus", cor: "#6A1B9A", emoji: "🫐" },
  { nome: "Framboesa", cientifico: "Rubus idaeus", familia: "Rosaceae", tipo: "Pequena fruta", ciclo: "Perene", origem: "Europa/Ásia", cor: "#AD1457", emoji: "🍇" },
  { nome: "Figo", cientifico: "Ficus carica", familia: "Moraceae", tipo: "Frutífera perene", ciclo: "Perene", origem: "Mediterrâneo/Ásia Ocidental", cor: "#6D4C41", emoji: "🫐" },
  { nome: "Pêra", cientifico: "Pyrus communis", familia: "Rosaceae", tipo: "Frutífera perene", ciclo: "Perene", origem: "Europa/Ásia", cor: "#F9A825", emoji: "🍐" },
  { nome: "Inhame", cientifico: "Dioscorea spp.", familia: "Dioscoreaceae", tipo: "Tubérculo", ciclo: "Anual/semi-perene", origem: "Regiões tropicais", cor: "#795548", emoji: "🥔" },
  { nome: "Batata-doce", cientifico: "Ipomoea batatas", familia: "Convolvulaceae", tipo: "Raiz tuberosa", ciclo: "Anual", origem: "América Tropical", cor: "#E65100", emoji: "🍠" },
  { nome: "Mandioca / Aipim", cientifico: "Manihot esculenta", familia: "Euphorbiaceae", tipo: "Raiz tuberosa", ciclo: "Anual/semi-perene", origem: "América do Sul", cor: "#F57F17", emoji: "🌾" },
];

export default function SeedCulturasScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState("objetivo");

  const scriptCompleto = `import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const culturas = [
  {
    nomePopular: "Café Arábica",
    nomeCientifico: "Coffea arabica",
    familiaBotanica: "Rubiaceae",
    tipoCultura: "Perene",
    cicloVida: "Perene",
    origem: "Etiópia",
    descricao: "Cultura perene de alto valor..."
  },
  // ... 16 culturas restantes
];

async function main() {
  for (const cultura of culturas) {
    await prisma.culturaAvancada.upsert({
      where: {
        nomePopular: cultura.nomePopular
      },
      update: cultura,
      create: cultura
    });
  }
  console.log(
    "Culturas iniciais AFU cadastradas."
  );
}

main()
  .catch((error) => {
    console.error("Erro:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });`;

  const schemaPrisma = `model CulturaAvancada {
  id              String   @id @default(uuid())
  nomePopular     String   @unique
  nomeCientifico  String?
  familiaBotanica String?
  tipoCultura     String?
  cicloVida       String?
  origem          String?
  descricao       String?
  status          String   @default("ativo")
  criadoEm        DateTime @default(now())

  // Relações
  cultivos        CultivoAvancado[]
  clima           ClimaCultura[]
  irrigacao       IrrigacaoCultura[]
  crescimento     CrescimentoColheita[]
  genetica        GeneticaCultura[]
  nutrientes      NutrienteCultura[]
  pragas          ControlePragasCultura[]
  rotacoes        RotacaoCultura[]
}`;

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ backgroundColor: "#1B5E20" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-1">
          <View style={{ backgroundColor: "#2E7D32" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">🌱</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Seed Inicial das Culturas AFU</Text>
            <Text style={{ color: "#A5D6A7" }} className="text-xs">
              17 culturas · Prisma upsert · Script completo
            </Text>
          </View>
          <View style={{ backgroundColor: "#1B5E20" }} className="rounded-full px-2 py-0.5">
            <Text className="text-white text-xs font-bold">Etapa 32</Text>
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

        {/* ─── OBJETIVO ─── */}
        {activeTab === "objetivo" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Objetivo do Seed</Text>
            <Text className="text-xs text-muted mb-4">Inserir automaticamente as 17 culturas no banco agronômico</Text>

            {/* Card principal */}
            <View style={{ backgroundColor: "#1B5E20" }} className="rounded-2xl p-4 mb-4">
              <Text className="text-white text-sm font-bold mb-1">O que este seed faz?</Text>
              <Text style={{ color: "#A5D6A7" }} className="text-xs leading-5">
                Cria dados iniciais para inserir automaticamente no banco agronômico do AFU as 17 culturas selecionadas, usando o comando <Text style={{ color: "#FFB74D" }}>prisma.culturaAvancada.upsert</Text> para garantir que não haja duplicatas.
              </Text>
            </View>

            {/* Arquivo */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
              <View style={{ backgroundColor: "#1B5E2015" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">Arquivo recomendado</Text>
              </View>
              <View className="p-4 bg-surface">
                <CodeBlock code="services/api/prisma/seed-culturas.ts" color="#64B5F6" />
              </View>
            </View>

            {/* 17 culturas resumo */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
              <View style={{ backgroundColor: "#1B5E2015" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">17 Culturas do Seed</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="flex-row flex-wrap">
                  {CULTURAS_SEED.map((c) => (
                    <View key={c.nome} style={{ backgroundColor: c.cor + "15", borderWidth: 1, borderColor: c.cor + "30" }} className="rounded-full px-2 py-1 mr-2 mb-2 flex-row items-center">
                      <Text className="text-sm mr-1">{c.emoji}</Text>
                      <Text style={{ color: c.cor, fontSize: 11 }} className="font-semibold">{c.nome}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Resultado */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
              <View style={{ backgroundColor: "#1B5E2015" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">Resultado: Banco pronto para alimentar</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="flex-row flex-wrap">
                  {["Diagnóstico por IA", "Rotação de culturas", "Nutrição", "Irrigação", "Colheita", "Calendário agrícola", "Controle de pragas", "Replantio e multiplicação"].map((item) => (
                    <Tag key={item} label={item} color="#1B5E20" bg="#E8F5E9" />
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ─── DADOS ─── */}
        {activeTab === "dados" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Array de Culturas</Text>
            <Text className="text-xs text-muted mb-4">17 objetos · 7 campos por cultura</Text>

            {/* Campos do objeto */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
              <View style={{ backgroundColor: "#1B5E2015" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">Campos de cada objeto</Text>
              </View>
              <View className="p-4 bg-surface">
                {[
                  { f: "nomePopular", t: "String", d: "Nome popular da cultura", cor: "#81C784" },
                  { f: "nomeCientifico", t: "String", d: "Nome científico (binomial)", cor: "#64B5F6" },
                  { f: "familiaBotanica", t: "String", d: "Família botânica", cor: "#FFB74D" },
                  { f: "tipoCultura", t: "String", d: "Tipo: Hortaliça, Frutífera...", cor: "#CE93D8" },
                  { f: "cicloVida", t: "String", d: "Anual, Perene, Bienal...", cor: "#80CBC4" },
                  { f: "origem", t: "String", d: "País/região de origem", cor: "#EF9A9A" },
                  { f: "descricao", t: "String", d: "Descrição técnica resumida", cor: "#FFCC80" },
                ].map((f) => (
                  <View key={f.f} className="flex-row items-center py-1.5" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                    <View style={{ backgroundColor: f.cor + "20", minWidth: 100 }} className="rounded px-2 py-0.5 mr-2">
                      <Text style={{ color: f.cor }} className="text-xs font-bold">{f.f}</Text>
                    </View>
                    <View style={{ backgroundColor: "#F5F5F5", minWidth: 50 }} className="rounded px-2 py-0.5 mr-2">
                      <Text style={{ color: "#888" }} className="text-xs">{f.t}</Text>
                    </View>
                    <Text className="text-xs text-muted flex-1">{f.d}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Lista de culturas com dados */}
            <Text className="text-sm font-bold text-foreground mb-3">Dados das 17 Culturas</Text>
            {CULTURAS_SEED.map((c, i) => (
              <View key={c.nome} className="mb-2 rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: c.cor + "30" }}>
                <View style={{ backgroundColor: c.cor + "15" }} className="flex-row items-center p-3">
                  <View style={{ backgroundColor: c.cor, width: 28, height: 28 }} className="rounded-full items-center justify-center mr-2">
                    <Text className="text-white text-xs font-bold">{i + 1}</Text>
                  </View>
                  <Text className="text-base mr-2">{c.emoji}</Text>
                  <View className="flex-1">
                    <Text style={{ color: c.cor }} className="text-xs font-bold">{c.nome}</Text>
                    <Text className="text-xs text-muted italic">{c.cientifico}</Text>
                  </View>
                </View>
                <View className="px-3 py-2 bg-surface">
                  <View className="flex-row flex-wrap gap-1">
                    <View style={{ backgroundColor: "#E8F5E9" }} className="rounded px-2 py-0.5">
                      <Text style={{ color: "#2E7D32" }} className="text-xs">{c.familia}</Text>
                    </View>
                    <View style={{ backgroundColor: "#E3F2FD" }} className="rounded px-2 py-0.5">
                      <Text style={{ color: "#1565C0" }} className="text-xs">{c.tipo}</Text>
                    </View>
                    <View style={{ backgroundColor: "#FFF8E1" }} className="rounded px-2 py-0.5">
                      <Text style={{ color: "#E65100" }} className="text-xs">{c.ciclo}</Text>
                    </View>
                    <View style={{ backgroundColor: "#F3E5F5" }} className="rounded px-2 py-0.5">
                      <Text style={{ color: "#6A1B9A" }} className="text-xs">{c.origem}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ─── SCRIPT ─── */}
        {activeTab === "script" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Script Prisma Completo</Text>
            <Text className="text-xs text-muted mb-4">seed-culturas.ts · upsert · PrismaClient</Text>

            {/* Explicação do upsert */}
            <View style={{ backgroundColor: "#1B5E20" }} className="rounded-xl p-4 mb-4">
              <Text className="text-white text-sm font-bold mb-1">Por que usar upsert?</Text>
              <Text style={{ color: "#A5D6A7" }} className="text-xs leading-5">
                O <Text style={{ color: "#FFB74D" }}>upsert</Text> garante idempotência: se a cultura já existir (pelo campo <Text style={{ color: "#FFB74D" }}>nomePopular @unique</Text>), ela é atualizada; se não existir, é criada. Isso permite executar o seed múltiplas vezes sem duplicatas.
              </Text>
            </View>

            {/* Script completo */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
              <View style={{ backgroundColor: "#1A1A2E" }} className="flex-row items-center justify-between p-3">
                <Text style={{ color: "#64B5F6" }} className="text-xs font-bold">seed-culturas.ts</Text>
                <View style={{ backgroundColor: "#2E7D32" }} className="rounded px-2 py-0.5">
                  <Text className="text-white text-xs">TypeScript</Text>
                </View>
              </View>
              <View style={{ backgroundColor: "#1A1A2E" }} className="p-4">
                <Text style={{ color: "#A5D6A7", fontFamily: "monospace", fontSize: 11, lineHeight: 18 }}>
                  {scriptCompleto}
                </Text>
              </View>
            </View>

            {/* Fluxo de execução */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
              <View style={{ backgroundColor: "#1B5E2015" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">Fluxo de Execução</Text>
              </View>
              <View className="p-4 bg-surface">
                {[
                  { step: "1", desc: "PrismaClient conecta ao banco PostgreSQL", cor: "#64B5F6" },
                  { step: "2", desc: "Loop percorre as 17 culturas do array", cor: "#81C784" },
                  { step: "3", desc: "upsert verifica se nomePopular já existe", cor: "#FFB74D" },
                  { step: "4", desc: "Se existe: atualiza os dados", cor: "#CE93D8" },
                  { step: "5", desc: "Se não existe: cria novo registro", cor: "#EF9A9A" },
                  { step: "6", desc: "Desconecta o PrismaClient ao final", cor: "#80CBC4" },
                ].map((s) => (
                  <View key={s.step} className="flex-row items-center py-2" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                    <View style={{ backgroundColor: s.cor, width: 24, height: 24 }} className="rounded-full items-center justify-center mr-3">
                      <Text className="text-white text-xs font-bold">{s.step}</Text>
                    </View>
                    <Text className="text-xs text-foreground flex-1">{s.desc}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── SCHEMA ─── */}
        {activeTab === "schema" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Schema Prisma</Text>
            <Text className="text-xs text-muted mb-4">Model CulturaAvancada · @unique · Relações</Text>

            {/* Ajuste necessário */}
            <View style={{ backgroundColor: "#FFF8E1", borderWidth: 1, borderColor: "#FFB74D" }} className="rounded-xl p-3 mb-4">
              <Text style={{ color: "#E65100" }} className="text-xs font-bold mb-1">Ajuste necessário no schema.prisma</Text>
              <Text style={{ color: "#888" }} className="text-xs">
                Para o <Text style={{ color: "#E65100" }}>upsert</Text> funcionar por nome, é necessário adicionar <Text style={{ color: "#E65100" }}>@unique</Text> ao campo <Text style={{ color: "#E65100" }}>nomePopular</Text>. Após alterar o schema, executar <Text style={{ color: "#E65100" }}>npx prisma db push</Text> ou gerar uma migration.
              </Text>
            </View>

            {/* Schema completo */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
              <View style={{ backgroundColor: "#1A1A2E" }} className="flex-row items-center justify-between p-3">
                <Text style={{ color: "#CE93D8" }} className="text-xs font-bold">schema.prisma</Text>
                <View style={{ backgroundColor: "#6A1B9A" }} className="rounded px-2 py-0.5">
                  <Text className="text-white text-xs">Prisma</Text>
                </View>
              </View>
              <View style={{ backgroundColor: "#1A1A2E" }} className="p-4">
                <Text style={{ color: "#CE93D8", fontFamily: "monospace", fontSize: 11, lineHeight: 18 }}>
                  {schemaPrisma}
                </Text>
              </View>
            </View>

            {/* Campos com destaque no @unique */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
              <View style={{ backgroundColor: "#1B5E2015" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">Campos do Model</Text>
              </View>
              <View className="p-4 bg-surface">
                {[
                  { f: "id", t: "@id @default(uuid())", d: "Chave primária UUID", cor: "#64B5F6", destaque: false },
                  { f: "nomePopular", t: "String @unique", d: "Chave de upsert — deve ser único", cor: "#FFB74D", destaque: true },
                  { f: "nomeCientifico", t: "String?", d: "Nome científico opcional", cor: "#81C784", destaque: false },
                  { f: "familiaBotanica", t: "String?", d: "Família botânica", cor: "#81C784", destaque: false },
                  { f: "tipoCultura", t: "String?", d: "Tipo da cultura", cor: "#81C784", destaque: false },
                  { f: "cicloVida", t: "String?", d: "Ciclo de vida", cor: "#81C784", destaque: false },
                  { f: "origem", t: "String?", d: "País/região de origem", cor: "#81C784", destaque: false },
                  { f: "descricao", t: "String?", d: "Descrição técnica", cor: "#81C784", destaque: false },
                  { f: "status", t: "String @default(\"ativo\")", d: "Status padrão: ativo", cor: "#80CBC4", destaque: false },
                  { f: "criadoEm", t: "DateTime @default(now())", d: "Data de criação automática", cor: "#CE93D8", destaque: false },
                ].map((f) => (
                  <View key={f.f} className="flex-row items-center py-1.5" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0", backgroundColor: f.destaque ? "#FFF8E1" : "transparent" }}>
                    <View style={{ backgroundColor: f.cor + "20", minWidth: 100 }} className="rounded px-2 py-0.5 mr-2">
                      <Text style={{ color: f.cor }} className="text-xs font-bold">{f.f}</Text>
                    </View>
                    <Text className="text-xs text-muted flex-1">{f.d}</Text>
                    {f.destaque && (
                      <View style={{ backgroundColor: "#FFB74D20" }} className="rounded px-1">
                        <Text style={{ color: "#E65100" }} className="text-xs font-bold">@unique</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── EXECUÇÃO ─── */}
        {activeTab === "execucao" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Execução do Seed</Text>
            <Text className="text-xs text-muted mb-4">Comandos · Pré-requisitos · Resultado final</Text>

            {/* Pré-requisitos */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
              <View style={{ backgroundColor: "#1B5E2015" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">Pré-requisitos</Text>
              </View>
              <View className="p-4 bg-surface">
                {[
                  { item: "PostgreSQL rodando (Docker ou cloud)", cor: "#64B5F6" },
                  { item: "Schema migrado com npx prisma db push", cor: "#81C784" },
                  { item: "Campo nomePopular com @unique no schema", cor: "#FFB74D" },
                  { item: "Variável DATABASE_URL configurada no .env", cor: "#CE93D8" },
                ].map((r) => (
                  <View key={r.item} className="flex-row items-center py-1.5" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                    <View style={{ backgroundColor: r.cor + "30", width: 8, height: 8 }} className="rounded-full mr-3" />
                    <Text className="text-xs text-foreground">{r.item}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Comandos */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#E5E7EB" }}>
              <View style={{ backgroundColor: "#1B5E2015" }} className="p-3">
                <Text className="text-sm font-bold text-foreground">Comandos de Execução</Text>
              </View>
              <View className="p-4 bg-surface">
                <Text className="text-xs text-muted mb-2">Opção 1 — via package.json seed:</Text>
                <CodeBlock code='npx prisma db seed' color="#81C784" />
                <Text className="text-xs text-muted mb-2">Opção 2 — diretamente:</Text>
                <CodeBlock code='npx ts-node prisma/seed-culturas.ts' color="#64B5F6" />
                <Text className="text-xs text-muted mb-2">Configurar no package.json:</Text>
                <CodeBlock code={`"prisma": {\n  "seed": "ts-node prisma/seed-culturas.ts"\n}`} color="#FFB74D" />
              </View>
            </View>

            {/* Resultado final */}
            <View style={{ backgroundColor: "#1B5E20" }} className="rounded-xl p-4">
              <Text className="text-white text-sm font-bold mb-2">Resultado Final</Text>
              <Text style={{ color: "#A5D6A7" }} className="text-xs mb-3">
                Após executar o seed, o AFU terá o primeiro banco de culturas pronto para alimentar:
              </Text>
              <View className="flex-row flex-wrap">
                {[
                  { label: "Diagnóstico por IA", emoji: "🤖" },
                  { label: "Rotação de culturas", emoji: "🔄" },
                  { label: "Nutrição", emoji: "🌿" },
                  { label: "Irrigação", emoji: "💧" },
                  { label: "Colheita", emoji: "🌾" },
                  { label: "Calendário agrícola", emoji: "📅" },
                  { label: "Controle de pragas", emoji: "🐛" },
                  { label: "Replantio e multiplicação", emoji: "🌱" },
                ].map((item) => (
                  <View key={item.label} style={{ backgroundColor: "#388E3C" }} className="rounded-full px-2 py-1 mr-2 mb-2 flex-row items-center">
                    <Text className="text-sm mr-1">{item.emoji}</Text>
                    <Text style={{ color: "#E8F5E9" }} className="text-xs">{item.label}</Text>
                  </View>
                ))}
              </View>
              <View style={{ backgroundColor: "#2E7D32", borderRadius: 8 }} className="p-3 mt-2">
                <Text style={{ color: "#FFFFFF" }} className="text-xs font-bold text-center">
                  17 culturas · 7 campos cada · Idempotente
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
