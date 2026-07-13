import { View, Text } from "react-native";
import { AFU_STACK_REAL } from "@/constants/afu-etapas";

type AfuStackBannerProps = {
  /** Texto opcional sobre divergência documental */
  note?: string;
};

/**
 * Banner padrão em telas de documentação que ainda citam NestJS/Prisma/PostgreSQL.
 */
export function AfuStackBanner({ note }: AfuStackBannerProps) {
  return (
    <View
      style={{
        backgroundColor: "#1B5E2012",
        borderWidth: 1,
        borderColor: "#2E7D3240",
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: "700", color: "#1B5E20", marginBottom: 6 }}>
        Stack implementada (MVP jul/2026)
      </Text>
      <Text style={{ fontSize: 11, color: "#2E7D32", lineHeight: 18 }}>
        {AFU_STACK_REAL.frontend}{"\n"}
        {AFU_STACK_REAL.backend} · {AFU_STACK_REAL.database}{"\n"}
        {AFU_STACK_REAL.auth}{"\n"}
        {AFU_STACK_REAL.deploy}
      </Text>
      {note ? (
        <Text style={{ fontSize: 10, color: "#558B2F", marginTop: 8, lineHeight: 16 }}>
          {note}
        </Text>
      ) : null}
    </View>
  );
}
