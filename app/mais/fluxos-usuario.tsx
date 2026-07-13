import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { AfuMvpFooter } from "@/components/afu-mvp-footer";
import { RelatedLinks } from "@/components/related-links";
import { RELATED_LINKS_MAP } from "@/constants/related-links-map";

const TABS = ["Jornadas", "Fluxos Core", "Edge Cases", "Navegação", "Métricas UX"];

export default function FluxosUsuarioScreen() {
  const colors = useColors();
  const [tab, setTab] = useState(0);

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: "#00838F" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-2">
          <View style={{ backgroundColor: "#0097A7" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">🗺️</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Fluxos de Usuário</Text>
            <Text style={{ color: "#B2EBF2" }} className="text-xs">Etapa 15 · Design e UX/UI</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 pt-1">
            {TABS.map((t, i) => (
              <TouchableOpacity key={t} onPress={() => setTab(i)}
                style={{ backgroundColor: tab === i ? "#fff" : "rgba(255,255,255,0.15)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 }}>
                <Text style={{ color: tab === i ? "#00838F" : "#fff" }} className="text-xs font-bold">{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {tab === 0 && (
          <View className="gap-4">
            {[
              { persona: "João — Pequeno Produtor", emoji: "👨‍🌾", cor: "#1B5E20", jornada: [
                { fase: "Descoberta", desc: "Vê post no Instagram sobre diagnóstico de praga por foto" },
                { fase: "Consideração", desc: "Baixa o app, testa o diagnóstico gratuito" },
                { fase: "Ativação", desc: "Diagnostica a praga corretamente, aplica tratamento" },
                { fase: "Retenção", desc: "Usa o calendário agrícola toda semana" },
                { fase: "Conversão", desc: "Assina o plano Produtor após 30 dias" },
                { fase: "Indicação", desc: "Recomenda para vizinhos na cooperativa" },
              ]},
              { persona: "Ana — Técnica Agrícola", emoji: "👩‍🔬", cor: "#1565C0", jornada: [
                { fase: "Descoberta", desc: "Parceiro da EMATER indica o AFU" },
                { fase: "Consideração", desc: "Testa com 3 produtores clientes" },
                { fase: "Ativação", desc: "Gera laudos digitais para os produtores" },
                { fase: "Retenção", desc: "Usa o banco agronômico como referência" },
                { fase: "Conversão", desc: "Assina plano Profissional" },
                { fase: "Indicação", desc: "Apresenta o AFU em reunião da cooperativa" },
              ]},
            ].map((p) => (
              <View key={p.persona} style={{ backgroundColor: p.cor + "12", borderWidth: 1, borderColor: p.cor + "30" }} className="rounded-xl p-4">
                <View className="flex-row items-center gap-2 mb-3">
                  <Text className="text-2xl">{p.emoji}</Text>
                  <Text style={{ color: p.cor }} className="text-sm font-bold">{p.persona}</Text>
                </View>
                {p.jornada.map((j) => (
                  <View key={j.fase} className="flex-row gap-3 mb-2">
                    <View style={{ backgroundColor: p.cor + "20", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" }}>
                      <Text style={{ color: p.cor }} className="text-xs font-bold">{j.fase}</Text>
                    </View>
                    <Text className="text-xs text-muted flex-1 leading-relaxed">{j.desc}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {tab === 1 && (
          <View className="gap-4">
            {[
              { t: "Primeiro Diagnóstico", cor: "#1B5E20", passos: [
                "Abrir app → Home",
                "Tocar em 'Diagnosticar' (botão principal)",
                "Câmera abre automaticamente",
                "Fotografar a planta afetada",
                "Confirmar envio para IA",
                "Aguardar resultado (< 10s)",
                "Ver diagnóstico + confiança + recomendação",
                "Salvar ou compartilhar resultado",
              ]},
              { t: "Consultar Banco Agronômico", cor: "#1565C0", passos: [
                "Home → Aba 'Banco'",
                "Buscar cultura pelo nome",
                "Selecionar cultura",
                "Navegar pelas abas: Clima, Solo, Pragas, Doenças",
                "Tocar em praga/doença para detalhes",
                "Ver controles recomendados",
              ]},
              { t: "Cadastrar Propriedade", cor: "#7B1FA2", passos: [
                "Mais → Propriedades",
                "Tocar em '+ Nova Propriedade'",
                "Preencher: nome, município, área",
                "Marcar talhões no mapa",
                "Adicionar cultivo atual",
                "Salvar e ver dashboard da propriedade",
              ]},
            ].map((f) => (
              <View key={f.t} style={{ backgroundColor: f.cor + "12", borderWidth: 1, borderColor: f.cor + "30" }} className="rounded-xl p-4">
                <Text style={{ color: f.cor }} className="text-sm font-bold mb-3">{f.t}</Text>
                {f.passos.map((p, i) => (
                  <View key={p} className="flex-row items-center gap-2 mb-2">
                    <View style={{ backgroundColor: f.cor, width: 20, height: 20, borderRadius: 10 }} className="items-center justify-center flex-shrink-0">
                      <Text className="text-white text-xs">{i + 1}</Text>
                    </View>
                    <Text className="text-xs text-muted flex-1">{p}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {tab === 2 && (
          <View className="gap-4">
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#00838F" }} className="text-sm font-bold mb-3">⚠️ Edge Cases Mapeados</Text>
              {[
                { caso: "Foto de baixa qualidade", trat: "Solicitar nova foto com orientações de iluminação e ângulo." },
                { caso: "Planta não identificada", trat: "Mostrar as 3 culturas mais próximas com % de confiança." },
                { caso: "Sem internet no campo", trat: "Modo offline: banco agronômico local, diagnóstico na fila." },
                { caso: "IA indisponível", trat: "Fallback para banco de pragas por sintomas descritos." },
                { caso: "Usuário sem propriedade", trat: "Onboarding guiado para cadastrar primeira propriedade." },
                { caso: "Plano expirado", trat: "Banner de renovação, funcionalidades básicas mantidas." },
                { caso: "Erro de pagamento", trat: "Notificação clara com link para atualizar cartão." },
                { caso: "Diagnóstico incorreto", trat: "Botão 'Reportar erro' → feedback para melhoria da IA." },
              ].map((r) => (
                <View key={r.caso} style={{ borderBottomWidth: 1, borderBottomColor: colors.border }} className="py-3">
                  <Text style={{ color: "#C62828" }} className="text-xs font-bold">⚠️ {r.caso}</Text>
                  <Text className="text-xs text-muted mt-1">✅ {r.trat}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {tab === 3 && (
          <View className="gap-4">
            <View style={{ backgroundColor: "#00838F15", borderWidth: 1, borderColor: "#00838F30" }} className="rounded-xl p-4">
              <Text style={{ color: "#00838F" }} className="text-sm font-bold mb-3">🧭 Estrutura de Navegação</Text>
              {[
                { nivel: "Tab Bar (Nível 1)", items: ["Home (Dashboard)", "Diagnóstico", "Banco Agronômico", "Propriedades", "Mais"] },
                { nivel: "Mais → Stack (Nível 2)", items: ["Índice Geral (46 etapas)", "Laboratório Digital", "IoT e Automação", "Marketplace", "NOC Agrícola", "Configurações"] },
                { nivel: "Modais e Sheets", items: ["Resultado de diagnóstico", "Detalhes de praga/doença", "Checkout do marketplace", "Configurações de notificação"] },
              ].map((g) => (
                <View key={g.nivel} style={{ borderBottomWidth: 1, borderBottomColor: "#00838F20" }} className="py-3">
                  <Text style={{ color: "#00838F" }} className="text-xs font-bold mb-2">{g.nivel}</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {g.items.map((item) => (
                      <View key={item} style={{ backgroundColor: "#00838F20", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                        <Text style={{ color: "#00838F" }} className="text-xs">{item}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {tab === 4 && (
          <View className="gap-4">
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#00838F" }} className="text-sm font-bold mb-3">📊 Métricas de UX</Text>
              {[
                { k: "Time to First Value", meta: "< 3 minutos (cadastro → primeiro diagnóstico)" },
                { k: "Task Completion Rate", meta: "> 90% para fluxos core" },
                { k: "Error Rate", meta: "< 5% em formulários" },
                { k: "Tempo médio de diagnóstico", meta: "< 2 minutos (foto → resultado)" },
                { k: "NPS (Net Promoter Score)", meta: "> 50 (meta MVP)" },
                { k: "CSAT (Satisfação)", meta: "> 4,2/5,0" },
                { k: "Telas por sessão", meta: "> 4 telas/sessão" },
                { k: "Retenção D30", meta: "> 40%" },
              ].map((r) => (
                <View key={r.k} className="flex-row py-2" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text className="text-xs text-muted flex-1">{r.k}</Text>
                  <Text style={{ color: "#00838F" }} className="text-xs font-bold">{r.meta}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        <AfuMvpFooter etapaNum={15} />
        <RelatedLinks links={RELATED_LINKS_MAP["/mais/fluxos-usuario"]} />
      </ScrollView>
    </ScreenContainer>
  );
}
