import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { AFU_STACK_REAL } from "@/constants/afu-etapas";

type AfuMvpFooterProps = {
  etapaNum?: number;
};

export function AfuMvpFooter({ etapaNum }: AfuMvpFooterProps) {
  const router = useRouter();

  return (
    <View
      style={{
        backgroundColor: "#F5F5F5",
        borderWidth: 1,
        borderColor: "#E0E0E0",
        borderRadius: 12,
        padding: 12,
        marginTop: 16,
        marginBottom: 8,
      }}
    >
      {etapaNum != null ? (
        <Text style={{ fontSize: 10, color: "#757575", marginBottom: 6 }}>
          Etapa {etapaNum} · AFU MVP 1.0 Planta Saudável
        </Text>
      ) : null}
      <Text style={{ fontSize: 11, fontWeight: "700", color: "#455A64", marginBottom: 6 }}>
        Stack real (repositório)
      </Text>
      <Text style={{ fontSize: 10, color: "#616161", lineHeight: 16 }}>
        {AFU_STACK_REAL.frontend}{"\n"}
        {AFU_STACK_REAL.backend} · {AFU_STACK_REAL.database}{"\n"}
        {AFU_STACK_REAL.auth}{"\n"}
        {AFU_STACK_REAL.deploy}
      </Text>
      <TouchableOpacity onPress={() => router.push("/mais/indice-geral")} style={{ marginTop: 10 }}>
        <Text style={{ fontSize: 12, fontWeight: "600", color: "#1565C0" }}>
          Ver Índice Geral (Etapas 1-30)
        </Text>
      </TouchableOpacity>
    </View>
  );
}
