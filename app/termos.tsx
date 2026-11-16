import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

/** Alias Play Store / institucional → `/legal/termos` (PR #60 URLs). */
export default function TermosRedirect() {
  const router = useRouter();
  const colors = useColors();
  useEffect(() => {
    router.replace("/legal/termos" as any);
  }, [router]);
  return (
    <ScreenContainer>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    </ScreenContainer>
  );
}
