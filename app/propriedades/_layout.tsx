import { Stack } from "expo-router";

export default function PropriedadesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]" />
      <Stack.Screen name="terrenos" />
      <Stack.Screen name="mapa" />
    </Stack>
  );
}
