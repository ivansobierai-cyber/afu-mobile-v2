import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Modulo, Conteudo, AdminState, SyncStatus } from './types';
import {
  adminKeys,
  buildAdminScope,
  discardLegacyAdminStorage,
  isValidAdminScope,
  type AdminStorageScope,
} from './admin-storage-scope';
import { trpc } from '@/lib/trpc';

interface AdminContextType {
  state: AdminState;
  // Módulos
  adicionarModulo: (modulo: Omit<Modulo, 'id' | 'dataCriacao' | 'dataAtualizacao' | 'syncStatus'>) => Promise<void>;
  atualizarModulo: (id: string, modulo: Partial<Modulo>) => Promise<void>;
  deletarModulo: (id: string) => Promise<void>;
  // Conteúdos
  adicionarConteudo: (conteudo: Omit<Conteudo, 'id' | 'dataCriacao' | 'dataAtualizacao' | 'syncStatus'>) => Promise<void>;
  atualizarConteudo: (id: string, conteudo: Partial<Conteudo>) => Promise<void>;
  deletarConteudo: (id: string) => Promise<void>;
  // Sincronização
  sincronizar: () => Promise<void>;
  limparFila: () => Promise<void>;
  setIsOnline: (online: boolean) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const EMPTY_STATE: AdminState = {
  modulos: [],
  conteudos: [],
  registros: [],
  itens: [],
  syncQueue: [],
  isOnline: true,
  isSyncing: false,
  lastSync: 0,
};

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = trpc.auth.session.useQuery(undefined, { staleTime: 60_000 });
  const scope = buildAdminScope(session?.user?.id, session?.activeOrganizationId);
  const scopeRef = useRef<AdminStorageScope | null>(scope);
  scopeRef.current = scope;

  const [state, setState] = useState<AdminState>(EMPTY_STATE);

  const carregarDados = useCallback(async (nextScope: AdminStorageScope | null) => {
    await discardLegacyAdminStorage();
    if (!isValidAdminScope(nextScope)) {
      setState((prev) => ({ ...EMPTY_STATE, isOnline: prev.isOnline }));
      return;
    }
    const keys = adminKeys(nextScope);
    try {
      const [modulos, conteudos, registros, itens, syncQueue, lastSync] = await Promise.all([
        AsyncStorage.getItem(keys.MODULOS),
        AsyncStorage.getItem(keys.CONTEUDOS),
        AsyncStorage.getItem(keys.REGISTROS),
        AsyncStorage.getItem(keys.ITENS),
        AsyncStorage.getItem(keys.SYNC_QUEUE),
        AsyncStorage.getItem(keys.LAST_SYNC),
      ]);

      setState((prev) => ({
        ...prev,
        modulos: modulos ? JSON.parse(modulos) : [],
        conteudos: conteudos ? JSON.parse(conteudos) : [],
        registros: registros ? JSON.parse(registros) : [],
        itens: itens ? JSON.parse(itens) : [],
        syncQueue: syncQueue ? JSON.parse(syncQueue) : [],
        lastSync: lastSync ? parseInt(lastSync, 10) : 0,
        isSyncing: false,
      }));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setState((prev) => ({ ...EMPTY_STATE, isOnline: prev.isOnline }));
    }
  }, []);

  useEffect(() => {
    void carregarDados(scope);
  }, [scope?.userId, scope?.organizationId, carregarDados]);

  const salvarDados = useCallback(async (novoState: AdminState) => {
    const current = scopeRef.current;
    if (!isValidAdminScope(current)) {
      setState(novoState);
      return;
    }
    const keys = adminKeys(current);
    try {
      await Promise.all([
        AsyncStorage.setItem(keys.MODULOS, JSON.stringify(novoState.modulos)),
        AsyncStorage.setItem(keys.CONTEUDOS, JSON.stringify(novoState.conteudos)),
        AsyncStorage.setItem(keys.REGISTROS, JSON.stringify(novoState.registros)),
        AsyncStorage.setItem(keys.ITENS, JSON.stringify(novoState.itens)),
        AsyncStorage.setItem(keys.SYNC_QUEUE, JSON.stringify(novoState.syncQueue)),
        AsyncStorage.setItem(keys.LAST_SYNC, novoState.lastSync.toString()),
      ]);
      setState(novoState);
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
    }
  }, []);

  const gerarId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Módulos
  const adicionarModulo = useCallback(async (modulo: Omit<Modulo, 'id' | 'dataCriacao' | 'dataAtualizacao' | 'syncStatus'>) => {
    const novoModulo: Modulo = {
      ...modulo,
      id: gerarId(),
      dataCriacao: Date.now(),
      dataAtualizacao: Date.now(),
      syncStatus: 'pendente',
    };

    const novoState = {
      ...state,
      modulos: [...state.modulos, novoModulo],
      syncQueue: [...state.syncQueue, {
        id: gerarId(),
        tipo: 'modulo' as const,
        acao: 'criar' as const,
        dados: novoModulo,
        timestamp: Date.now(),
        tentativas: 0,
      }],
    };

    await salvarDados(novoState);
  }, [state, salvarDados]);

  const atualizarModulo = useCallback(async (id: string, modulo: Partial<Modulo>) => {
    const novoState = {
      ...state,
      modulos: state.modulos.map(m => m.id === id ? {
        ...m,
        ...modulo,
        dataAtualizacao: Date.now(),
        syncStatus: 'pendente' as SyncStatus,
      } : m),
      syncQueue: [...state.syncQueue, {
        id: gerarId(),
        tipo: 'modulo' as const,
        acao: 'atualizar' as const,
        dados: { id, ...modulo },
        timestamp: Date.now(),
        tentativas: 0,
      }],
    };

    await salvarDados(novoState);
  }, [state, salvarDados]);

  const deletarModulo = useCallback(async (id: string) => {
    const novoState = {
      ...state,
      modulos: state.modulos.filter(m => m.id !== id),
      conteudos: state.conteudos.filter(c => c.moduloId !== id),
      syncQueue: [...state.syncQueue, {
        id: gerarId(),
        tipo: 'modulo' as const,
        acao: 'deletar' as const,
        dados: { id },
        timestamp: Date.now(),
        tentativas: 0,
      }],
    };

    await salvarDados(novoState);
  }, [state, salvarDados]);

  // Conteúdos
  const adicionarConteudo = useCallback(async (conteudo: Omit<Conteudo, 'id' | 'dataCriacao' | 'dataAtualizacao' | 'syncStatus'>) => {
    const novoConteudo: Conteudo = {
      ...conteudo,
      id: gerarId(),
      dataCriacao: Date.now(),
      dataAtualizacao: Date.now(),
      syncStatus: 'pendente',
    };

    const novoState = {
      ...state,
      conteudos: [...state.conteudos, novoConteudo],
      syncQueue: [...state.syncQueue, {
        id: gerarId(),
        tipo: 'conteudo' as const,
        acao: 'criar' as const,
        dados: novoConteudo,
        timestamp: Date.now(),
        tentativas: 0,
      }],
    };

    await salvarDados(novoState);
  }, [state, salvarDados]);

  const atualizarConteudo = useCallback(async (id: string, conteudo: Partial<Conteudo>) => {
    const novoState = {
      ...state,
      conteudos: state.conteudos.map(c => c.id === id ? {
        ...c,
        ...conteudo,
        dataAtualizacao: Date.now(),
        syncStatus: 'pendente' as SyncStatus,
      } : c),
      syncQueue: [...state.syncQueue, {
        id: gerarId(),
        tipo: 'conteudo' as const,
        acao: 'atualizar' as const,
        dados: { id, ...conteudo },
        timestamp: Date.now(),
        tentativas: 0,
      }],
    };

    await salvarDados(novoState);
  }, [state, salvarDados]);

  const deletarConteudo = useCallback(async (id: string) => {
    const novoState = {
      ...state,
      conteudos: state.conteudos.filter(c => c.id !== id),
      syncQueue: [...state.syncQueue, {
        id: gerarId(),
        tipo: 'conteudo' as const,
        acao: 'deletar' as const,
        dados: { id },
        timestamp: Date.now(),
        tentativas: 0,
      }],
    };

    await salvarDados(novoState);
  }, [state, salvarDados]);

  // Sincronização
  const sincronizar = useCallback(async () => {
    if (!state.isOnline || state.syncQueue.length === 0) return;

    setState(prev => ({ ...prev, isSyncing: true }));

    try {
      // Simular sincronização com backend
      await new Promise(resolve => setTimeout(resolve, 1000));

      const novoState = {
        ...state,
        syncQueue: [],
        lastSync: Date.now(),
        modulos: state.modulos.map(m => ({ ...m, syncStatus: 'sincronizado' as SyncStatus })),
        conteudos: state.conteudos.map(c => ({ ...c, syncStatus: 'sincronizado' as SyncStatus })),
      };

      await salvarDados(novoState);
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      setState(prev => ({ ...prev, isSyncing: false }));
    }

    setState(prev => ({ ...prev, isSyncing: false }));
  }, [state, salvarDados]);

  const limparFila = useCallback(async () => {
    const novoState = { ...state, syncQueue: [] };
    await salvarDados(novoState);
  }, [state, salvarDados]);

  const setIsOnline = useCallback((online: boolean) => {
    setState(prev => ({ ...prev, isOnline: online }));
    if (online) {
      sincronizar();
    }
  }, [sincronizar]);

  return (
    <AdminContext.Provider
      value={{
        state,
        adicionarModulo,
        atualizarModulo,
        deletarModulo,
        adicionarConteudo,
        atualizarConteudo,
        deletarConteudo,
        sincronizar,
        limparFila,
        setIsOnline,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin deve ser usado dentro de AdminProvider');
  }
  return context;
}
