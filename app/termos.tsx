import { Redirect } from "expo-router";

/** Alias Play Store / institucional → `/legal/termos` (URL pública https://afuagro.tech/termos). */
export default function TermosRedirect() {
  return <Redirect href={"/legal/termos" as any} />;
}
