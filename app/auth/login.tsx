import { Redirect } from "expo-router";

/** @deprecated Use /auth/login-new — redirecionamento de compatibilidade */
export default function LegacyLoginRedirect() {
  return <Redirect href="/auth/login-new" />;
}
