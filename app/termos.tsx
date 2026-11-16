import { Redirect } from "expo-router";

/** Alias Play Store / institucional → `/legal/termos` (PR #60 URLs). */
export default function TermosRedirect() {
  return <Redirect href={"/legal/termos" as any} />;
}
