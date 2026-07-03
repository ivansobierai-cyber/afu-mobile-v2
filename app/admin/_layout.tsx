import React from "react";
import { Stack } from "expo-router";
import { AdminProvider } from "@/lib/admin/admin-context";

export default function AdminLayout(): React.ReactNode {
  return (
    <AdminProvider>
      <Stack
        initialRouteName="conteudos-offline"
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* Rotas do fluxo admin */}
        <Stack.Screen name="conteudos-offline" />
        <Stack.Screen name="modulos-offline" />

        {/* 
          Exemplo: adicionar tela com opções específicas
          <Stack.Screen 
            name="detalhe" 
            options={{ headerShown: true, title: "Detalhe" }} 
          />
        */}
      </Stack>
    </AdminProvider>
  );
}
