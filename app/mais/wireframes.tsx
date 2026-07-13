import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { AfuMvpFooter } from "@/components/afu-mvp-footer";
import { RelatedLinks } from "@/components/related-links";
import { RELATED_LINKS_MAP } from "@/constants/related-links-map";

const TABS = ["App Mobile", "Portal Web", "Painel Admin", "Fluxos", "Anotações"];

export default function WireframesScreen() {
  const colors = useColors();
  const [tab, setTab] = useState(0);

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: "#4527A0" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-2">
          <View style={{ backgroundColor: "#512DA8" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">📐</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Wireframes</Text>
            <Text style={{ color: "#D1C4E9" }} className="text-xs">Etapa 14 · Design e UX/UI</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 pt-1">
            {TABS.map((t, i) => (
              <TouchableOpacity key={t} onPress={() => setTab(i)}
                style={{ backgroundColor: tab === i ? "#fff" : "rgba(255,255,255,0.15)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 }}>
                <Text style={{ color: tab === i ? "#4527A0" : "#fff" }} className="text-xs font-bold">{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {tab === 0 && (
          <View className="gap-4">
            <Text style={{ color: "#4527A0" }} className="text-sm font-bold">📱 Telas do App Mobile (Expo)</Text>
            {[
              { tela: "Onboarding (3 slides)", desc: "Apresentação do AFU, benefícios e CTA de cadastro. Fundo verde com ilustrações de plantas.", status: "Definido" },
              { tela: "Login / Cadastro", desc: "E-mail + senha ou OAuth (Google/Apple). Validação inline. Recuperação de senha.", status: "Definido" },
              { tela: "Home (Dashboard)", desc: "Resumo da propriedade: clima atual, alertas ativos, últimos diagnósticos, atalhos rápidos.", status: "Definido" },
              { tela: "Diagnóstico", desc: "Câmera + galeria. Preview da foto. Resultado com barra de confiança e recomendações.", status: "Definido" },
              { tela: "Banco Agronômico", desc: "Lista de culturas com busca. Ficha técnica com abas: Clima, Solo, Pragas, Doenças, Calendário.", status: "Definido" },
              { tela: "Propriedades", desc: "Mapa + lista de talhões. CRUD de propriedades. Histórico de cultivos.", status: "Definido" },
              { tela: "Mais (Menu)", desc: "Acesso a todas as funcionalidades: Lab, IoT, Marketplace, NOC, Índice Geral.", status: "Implementado" },
              { tela: "Perfil e Configurações", desc: "Dados do produtor, plano atual, notificações, tema, idioma.", status: "Definido" },
            ].map((t) => (
              <View key={t.tela} style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
                <View className="flex-row items-center gap-2 mb-1">
                  <Text style={{ color: "#4527A0" }} className="text-xs font-bold flex-1">{t.tela}</Text>
                  <View style={{ backgroundColor: t.status === "Implementado" ? "#1B5E2020" : "#4527A020", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ color: t.status === "Implementado" ? "#1B5E20" : "#4527A0" }} className="text-xs">{t.status}</Text>
                  </View>
                </View>
                <Text className="text-xs text-muted leading-relaxed">{t.desc}</Text>
              </View>
            ))}
          </View>
        )}

        {tab === 1 && (
          <View className="gap-4">
            <Text style={{ color: "#4527A0" }} className="text-sm font-bold">🌐 Telas do Portal Web (Next.js)</Text>
            {[
              { tela: "Landing Page", desc: "Hero com CTA, benefícios, depoimentos, planos e rodapé. SEO otimizado.", status: "Planejado" },
              { tela: "Dashboard do Produtor", desc: "Visão geral: propriedades, cultivos ativos, alertas, gráficos de produção.", status: "Planejado" },
              { tela: "Diagnósticos (Web)", desc: "Upload de foto, histórico em tabela, filtros por cultura e data.", status: "Planejado" },
              { tela: "Relatórios", desc: "Geração de PDF: laudo de solo, relatório de produção, análise econômica.", status: "Planejado" },
              { tela: "Marketplace (Web)", desc: "Catálogo com filtros, carrinho, checkout e rastreamento de pedidos.", status: "Planejado" },
              { tela: "Configurações", desc: "Dados da empresa, usuários vinculados, integrações, faturamento.", status: "Planejado" },
            ].map((t) => (
              <View key={t.tela} style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
                <View className="flex-row items-center gap-2 mb-1">
                  <Text style={{ color: "#4527A0" }} className="text-xs font-bold flex-1">{t.tela}</Text>
                  <View style={{ backgroundColor: "#4527A020", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ color: "#4527A0" }} className="text-xs">{t.status}</Text>
                  </View>
                </View>
                <Text className="text-xs text-muted leading-relaxed">{t.desc}</Text>
              </View>
            ))}
          </View>
        )}

        {tab === 2 && (
          <View className="gap-4">
            <Text style={{ color: "#4527A0" }} className="text-sm font-bold">⚙️ Painel Administrativo</Text>
            {[
              { tela: "Dashboard Admin", desc: "Métricas globais: usuários ativos, diagnósticos/dia, receita MRR, churn." },
              { tela: "Gestão de Usuários", desc: "Tabela de produtores com filtros, busca, ações de moderação." },
              { tela: "Banco Agronômico (Admin)", desc: "CRUD completo de culturas, pragas, doenças, clima e genética." },
              { tela: "Marketplace Admin", desc: "Aprovação de produtos, gestão de vendedores, disputas." },
              { tela: "NOC Admin", desc: "Centro de comando: alertas críticos, logs de sistema, saúde da API." },
              { tela: "Financeiro", desc: "Receita por plano, inadimplência, projeções, exportação contábil." },
            ].map((t) => (
              <View key={t.tela} style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
                <Text style={{ color: "#4527A0" }} className="text-xs font-bold mb-1">{t.tela}</Text>
                <Text className="text-xs text-muted leading-relaxed">{t.desc}</Text>
              </View>
            ))}
          </View>
        )}

        {tab === 3 && (
          <View className="gap-4">
            {[
              { t: "Fluxo de Diagnóstico", cor: "#1B5E20", steps: ["Home → Botão 'Diagnosticar'", "Câmera ou galeria → Selecionar foto", "Preview → Confirmar envio", "Loading (IA processando)", "Resultado: diagnóstico + confiança", "Recomendação de tratamento", "Salvar no histórico"] },
              { t: "Fluxo de Cadastro", cor: "#1565C0", steps: ["Landing Page → 'Começar grátis'", "Formulário: nome, e-mail, senha", "Verificação de e-mail", "Onboarding: tipo de produtor", "Cadastrar primeira propriedade", "Home (dashboard inicial)"] },
              { t: "Fluxo de Compra (Marketplace)", cor: "#C62828", steps: ["Catálogo → Selecionar produto", "Detalhes do produto + QR Code", "Adicionar ao carrinho", "Checkout: endereço + pagamento", "Confirmação + rastreamento", "Recebimento + avaliação"] },
            ].map((f) => (
              <View key={f.t} style={{ backgroundColor: f.cor + "12", borderWidth: 1, borderColor: f.cor + "30" }} className="rounded-xl p-4">
                <Text style={{ color: f.cor }} className="text-sm font-bold mb-3">{f.t}</Text>
                {f.steps.map((s, i) => (
                  <View key={s} className="flex-row items-center gap-2 mb-2">
                    <View style={{ backgroundColor: f.cor, width: 20, height: 20, borderRadius: 10 }} className="items-center justify-center flex-shrink-0">
                      <Text className="text-white text-xs">{i + 1}</Text>
                    </View>
                    <Text className="text-xs text-muted flex-1">{s}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {tab === 4 && (
          <View className="gap-4">
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#4527A0" }} className="text-sm font-bold mb-3">📝 Anotações de Wireframe</Text>
              {[
                { t: "Ferramenta de Design", v: "Figma (wireframes + protótipos)" },
                { t: "Fidelidade", v: "Lo-fi (wireframes) → Hi-fi (mockups) → Protótipo" },
                { t: "Grid Mobile", v: "4 colunas, gutter 16px, margem 16px" },
                { t: "Grid Web", v: "12 colunas, gutter 24px, max-width 1280px" },
                { t: "Breakpoints", v: "Mobile 375px · Tablet 768px · Desktop 1280px" },
                { t: "Toque mínimo", v: "44×44px (Apple HIG)" },
                { t: "Acessibilidade", v: "WCAG 2.1 AA, contraste 4,5:1 mínimo" },
              ].map((r) => (
                <View key={r.t} className="flex-row py-2" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text className="text-xs text-muted w-36">{r.t}</Text>
                  <Text style={{ color: "#4527A0" }} className="text-xs font-bold flex-1">{r.v}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        <AfuMvpFooter etapaNum={14} />
        <RelatedLinks links={RELATED_LINKS_MAP["/mais/wireframes"]} />
      </ScrollView>
    </ScreenContainer>
  );
}
