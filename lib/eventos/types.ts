import type { CalendarioCuidado } from "@/drizzle/schema";

/** Item de lista retornado por `coreData.calendario.list`. */
export type EventoItem = CalendarioCuidado;

export type EventoTipoAtividade = NonNullable<EventoItem["tipoAtividade"]>;
export type EventoPrioridade = NonNullable<EventoItem["prioridade"]>;
export type EventoStatus = NonNullable<EventoItem["status"]>;
