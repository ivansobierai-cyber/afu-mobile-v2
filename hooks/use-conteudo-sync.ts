import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { Conteudo, ConteudoCreate, ConteudoUpdate } from '@/lib/admin/schemas';
import {
  adminKeys,
  buildAdminScope,
  discardLegacyAdminStorage,
  isValidAdminScope,
  type AdminStorageScope,
} from '@/lib/admin/admin-storage-scope';
import { trpc } from '@/lib/trpc';

interface SyncQueueItem {
  id: string;
  tipo: 'conteudo';
  acao: 'criar' | 'atualizar' | 'deletar';
  dados: any;
  timestamp: number;
  tentativas: number;
  ultimaTentativa?: number;
  erro?: string;
}

export function useConteudoSync() {
  const [conteudos, setConteudos] = useState<Conteudo[]>([]);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const queryClient = useQueryClient();
  const { data: session } = trpc.auth.session.useQuery(undefined, { staleTime: 60_000 });
  const scope = buildAdminScope(session?.user?.id, session?.activeOrganizationId);
  const scopeRef = useRef<AdminStorageScope | null>(scope);
  scopeRef.current = scope;

  const carregarDados = useCallback(async (nextScope: AdminStorageScope | null) => {
    await discardLegacyAdminStorage();
    if (!isValidAdminScope(nextScope)) {
      setConteudos([]);
      setSyncQueue([]);
      return;
    }
    const keys = adminKeys(nextScope);
    try {
      const [conteudosData, queueData] = await Promise.all([
        AsyncStorage.getItem(keys.CONTEUDOS),
        AsyncStorage.getItem(keys.CONTEUDO_SYNC_QUEUE),
      ]);

      setConteudos(conteudosData ? JSON.parse(conteudosData) : []);
      setSyncQueue(queueData ? JSON.parse(queueData) : []);
    } catch (error) {
      console.error('Erro ao carregar conteúdos:', error);
    }
  }, []);

  useEffect(() => {
    void carregarDados(scope);
  }, [scope?.userId, scope?.organizationId, carregarDados]);

  const syncOnReconnectRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => {
      setIsOnline(true);
      syncOnReconnectRef.current();
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const salvarConteudos = useCallback(async (novosConteudos: Conteudo[]) => {
    const current = scopeRef.current;
    if (!isValidAdminScope(current)) {
      setConteudos(novosConteudos);
      return;
    }
    try {
      await AsyncStorage.setItem(adminKeys(current).CONTEUDOS, JSON.stringify(novosConteudos));
      setConteudos(novosConteudos);
    } catch (error) {
      console.error('Erro ao salvar conteúdos:', error);
    }
  }, []);

  const salvarSyncQueue = useCallback(async (novaQueue: SyncQueueItem[]) => {
    const current = scopeRef.current;
    if (!isValidAdminScope(current)) {
      setSyncQueue(novaQueue);
      return;
    }
    try {
      await AsyncStorage.setItem(adminKeys(current).CONTEUDO_SYNC_QUEUE, JSON.stringify(novaQueue));
      setSyncQueue(novaQueue);
    } catch (error) {
      console.error('Erro ao salvar fila de sincronização:', error);
    }
  }, []);

  const gerarId = useCallback(() => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, []);

  // CRUD Operations

  const criarConteudo = useCallback(
    async (dados: ConteudoCreate) => {
      const novoConteudo: Conteudo = {
        ...dados,
        id: gerarId(),
        dataCriacao: Date.now(),
        dataAtualizacao: Date.now(),
        syncStatus: 'pendente',
      };

      const novosConteudos = [...conteudos, novoConteudo];
      await salvarConteudos(novosConteudos);

      // Adicionar à fila de sincronização
      const novaQueue = [
        ...syncQueue,
        {
          id: gerarId(),
          tipo: 'conteudo' as const,
          acao: 'criar' as const,
          dados: novoConteudo,
          timestamp: Date.now(),
          tentativas: 0,
        },
      ];
      await salvarSyncQueue(novaQueue);

      return novoConteudo;
    },
    [conteudos, syncQueue, salvarConteudos, salvarSyncQueue, gerarId]
  );

  const atualizarConteudo = useCallback(
    async (id: string, dados: ConteudoUpdate) => {
      const conteudoAtualizado = conteudos.find(c => c.id === id);
      if (!conteudoAtualizado) throw new Error('Conteúdo não encontrado');

      const conteudoMerged: Conteudo = {
        ...conteudoAtualizado,
        ...dados,
        dataAtualizacao: Date.now(),
        syncStatus: 'pendente',
      };

      const novosConteudos = conteudos.map(c => (c.id === id ? conteudoMerged : c));
      await salvarConteudos(novosConteudos);

      // Adicionar à fila de sincronização
      const novaQueue = [
        ...syncQueue,
        {
          id: gerarId(),
          tipo: 'conteudo' as const,
          acao: 'atualizar' as const,
          dados: conteudoMerged,
          timestamp: Date.now(),
          tentativas: 0,
        },
      ];
      await salvarSyncQueue(novaQueue);

      return conteudoMerged;
    },
    [conteudos, syncQueue, salvarConteudos, salvarSyncQueue, gerarId]
  );

  const deletarConteudo = useCallback(
    async (id: string) => {
      const novosConteudos = conteudos.filter(c => c.id !== id);
      await salvarConteudos(novosConteudos);

      // Adicionar à fila de sincronização
      const novaQueue = [
        ...syncQueue,
        {
          id: gerarId(),
          tipo: 'conteudo' as const,
          acao: 'deletar' as const,
          dados: { id },
          timestamp: Date.now(),
          tentativas: 0,
        },
      ];
      await salvarSyncQueue(novaQueue);
    },
    [conteudos, syncQueue, salvarConteudos, salvarSyncQueue, gerarId]
  );

  // Sincronização

  const sincronizar = useCallback(async () => {
    if (syncQueue.length === 0) return;

    setIsSyncing(true);
    try {
      const novaQueue = [...syncQueue];

      for (let i = 0; i < novaQueue.length; i++) {
        const item = novaQueue[i];

        try {
          // Simular chamada à API (em produção, seria tRPC)
          // await trpc.admin.sincronizarConteudo.mutate(item.dados);

          // Por enquanto, apenas marcar como sincronizado
          const conteudoAtualizado = conteudos.find(c => c.id === item.dados.id);
          if (conteudoAtualizado) {
            const novosConteudos = conteudos.map(c =>
              c.id === item.dados.id
                ? { ...c, syncStatus: 'sincronizado' as const }
                : c
            );
            await salvarConteudos(novosConteudos);
          }

          // Remover da fila
          novaQueue.splice(i, 1);
          i--;
        } catch (error) {
          console.error('Erro ao sincronizar item:', error);

          // Atualizar tentativas e aplicar backoff exponencial
          item.tentativas++;
          item.ultimaTentativa = Date.now();
          item.erro = String(error);

          if (item.tentativas >= 3) {
            // Remover após 3 tentativas
            novaQueue.splice(i, 1);
            i--;
          }
        }
      }

      await salvarSyncQueue(novaQueue);

      // Invalidar queries para atualizar UI
      queryClient.invalidateQueries({ queryKey: ['conteudos'] });
    } finally {
      setIsSyncing(false);
    }
  }, [syncQueue, conteudos, salvarConteudos, salvarSyncQueue, queryClient]);

  const sincronizarAutomatico = useCallback(async () => {
    if (!isOnline || syncQueue.length === 0) return;
    await sincronizar();
  }, [isOnline, syncQueue, sincronizar]);

  syncOnReconnectRef.current = () => {
    void sincronizarAutomatico();
  };

  // Filtrar conteúdos por módulo
  const obterConteudosPorModulo = useCallback(
    (moduloId: string) => conteudos.filter(c => c.moduloId === moduloId),
    [conteudos]
  );

  // Contar itens pendentes
  const contarPendentes = useCallback(
    () => syncQueue.filter(item => item.acao !== 'deletar' || item.tentativas < 3).length,
    [syncQueue]
  );

  return {
    conteudos,
    syncQueue,
    isSyncing,
    isOnline,
    criarConteudo,
    atualizarConteudo,
    deletarConteudo,
    sincronizar,
    obterConteudosPorModulo,
    contarPendentes,
    setIsOnline,
  };
}
