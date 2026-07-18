# Inventário técnico — Propriedades (Etapa 1)

Atualizado na onda de fundação do Plano Mestre de Propriedades.

## Matriz existe / parcial / ausente

| Feature | Status | Paths |
|---------|--------|-------|
| Lista propriedades | existe | `app/(tabs)/propriedades.tsx` |
| Detalhe / painel | parcial → abas Etapa 2 | `app/propriedades/[id].tsx` |
| Talhões CRUD | existe | `app/propriedades/terrenos.tsx` |
| Mapa marcadores | existe | `app/propriedades/mapa.tsx`, `components/property-map.tsx` |
| Cultivos CRUD | existe | `app/(tabs)/cultivos.tsx` |
| API coreData | existe | `server/routers/core-data-router.ts` |
| Isolamento por produtor | corrigido Etapa 1 | `server/db.ts` `getPropriedades` / `getCulturas` |
| ScreenState reutilizável | existe | `components/screen-state.tsx` |
| Gate de sessão | existe | `app/_layout.tsx` SessionGate |
| Safra (entidade) | parcial | seletor UI + tabela `safras` Etapa 2 |
| Tarefas/operações | ausente | Etapa 3 |
| Polígonos GeoJSON | ausente | Etapa 5 |
| Estoque agrícola | ausente | Etapa 7 (≠ marketplace) |

## tRPC (`coreData`)

- `propriedades.list|get|create|update|delete|stats`
- `terrenos.listByPropriedade|create|update|delete`
- `cultivos.list|listByPropriedade|create|update|delete|stats`
- `calendario.*`

## Componentes reutilizáveis

- `ScreenContainer`, `ScreenHeader`, `ScreenState`
- `PropertyMap`, `WeatherCard`, `AreaValidationAlert`
- Offline: `use-run-core-mutation`, `CoreOfflineSyncManager`
