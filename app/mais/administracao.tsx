import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

export default function AdministracaoScreen() {
  const router = useRouter();
  const colors = useColors();

  useEffect(() => {
    router.replace("/mais/admin-usuarios" as any);
  }, [router]);

  return (
    <ScreenContainer>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    </ScreenContainer>
  );
}
