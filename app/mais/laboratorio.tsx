import { ScrollView } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { LaboratorioPanel } from "@/components/home-lab-card";
import { ScreenHeader } from "@/components/screen-header";
import { MODULE_COLORS } from "@/constants/module-colors";
import { useTenantQueryScope } from "@/hooks/use-tenant-query-scope";
import { trpc } from "@/lib/trpc";

export default function LaboratorioScreen() {
  const { cacheInput, activeOrganizationId, tenantReady } = useTenantQueryScope();
  const enabled = tenantReady;
  const { data: diagnosticos = [] } = trpc.diagnostico.historico.useQuery(cacheInput, { enabled });
  const { data: analises = [] } = trpc.secondaryData.analises.list.useQuery(cacheInput, { enabled });
  const { data: relatorios = [] } = trpc.secondaryData.relatorios.list.useQuery(cacheInput, {
    enabled,
  });

  return (
    <ScreenContainer>
      <ScreenHeader
        title="Laboratório"
        subtitle="Diagnósticos · análises · laudos · dados"
        accentColor={MODULE_COLORS.laboratorio}
      />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <LaboratorioPanel
          diagnosticos={diagnosticos.length}
          analises={analises.length}
          laudos={relatorios.length}
        />
      </ScrollView>
    </ScreenContainer>
  );
}
