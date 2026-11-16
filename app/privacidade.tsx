import { Redirect } from "expo-router";

/** Alias Play Store / institucional → `/legal/privacidade` (PR #60 URLs). */
export default function PrivacidadeRedirect() {
  return <Redirect href={"/legal/privacidade" as any} />;
}
