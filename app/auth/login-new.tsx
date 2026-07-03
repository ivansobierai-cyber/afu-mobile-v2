import { Redirect } from "expo-router";

/** @deprecated Use /auth/login — redirecionamento de compatibilidade */
export default function LegacyLoginNewRedirect() {
  return <Redirect href="/auth/login" />;
}
