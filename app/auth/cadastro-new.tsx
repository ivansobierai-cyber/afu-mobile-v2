import { Redirect } from "expo-router";

/** @deprecated Use /auth/cadastro — redirecionamento de compatibilidade */
export default function LegacyCadastroNewRedirect() {
  return <Redirect href="/auth/cadastro" />;
}
