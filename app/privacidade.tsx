import { Redirect } from "expo-router";

/** Alias Play Store / institucional → `/legal/privacidade` (URL pública https://afuagro.tech/privacidade). */
export default function PrivacidadeRedirect() {
  return <Redirect href={"/legal/privacidade" as any} />;
}
