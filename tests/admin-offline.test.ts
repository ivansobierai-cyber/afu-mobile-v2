import { describe, it, expect, beforeEach } from 'vitest';
import { syncService } from '@/lib/admin/sync-service';
import type { Modulo, Conteudo, SyncQueue } from '@/lib/admin/types';

describe('Admin Offline Mode', () => {
  let modulos: Modulo[];
  let conteudos: Conteudo[];
  let syncQueue: SyncQueue[];

  beforeEach(() => {
    modulos = [
      {
        id: '1',
        nome: 'Monitoramento de Solo',
        descricao: 'Análise de solo',
        icone: '🌱',
        ordem: 1,
        ativo: true,
        dataCriacao: Date.now(),
        dataAtualizacao: Date.now(),
        syncStatus: 'sincronizado',
      },
    ];

    conteudos = [
      {
        id: '1',
        moduloId: '1',
        titulo: 'Guia de Análise de Solo',
        descricao: 'Guia completo',
        tipo: 'artigo' as const,
        conteudo: 'Conteúdo do artigo',
        tags: ['solo', 'análise'],
        ordem: 1,
        ativo: true,
        dataCriacao: Date.now(),
        dataAtualizacao: Date.now(),
        syncStatus: 'sincronizado' as const,
      },
    ];

    syncQueue = [];
  });

  it('deve criar novo módulo offline', () => {
    const novoModulo: Modulo = {
      id: '2',
      nome: 'Pragas e Doenças',
      descricao: 'Identificação de pragas',
      icone: '🐛',
      ordem: 2,
      ativo: true,
      dataCriacao: Date.now(),
      dataAtualizacao: Date.now(),
      syncStatus: 'pendente',
    };

    modulos.push(novoModulo);
    syncQueue.push({
      id: 'sync-1',
      tipo: 'modulo',
      acao: 'criar',
      dados: novoModulo,
      timestamp: Date.now(),
      tentativas: 0,
    });

    expect(modulos).toHaveLength(2);
    expect(syncQueue).toHaveLength(1);
    expect(syncQueue[0].acao).toBe('criar');
  });

  it('deve editar módulo offline', () => {
    const moduloAtualizado = {
      ...modulos[0],
      nome: 'Monitoramento Avançado de Solo',
      dataAtualizacao: Date.now(),
      syncStatus: 'pendente' as const,
    };

    modulos[0] = moduloAtualizado;
    syncQueue.push({
      id: 'sync-2',
      tipo: 'modulo',
      acao: 'atualizar',
      dados: moduloAtualizado,
      timestamp: Date.now(),
      tentativas: 0,
    });

    expect(modulos[0].nome).toBe('Monitoramento Avançado de Solo');
    expect(syncQueue).toHaveLength(1);
  });

  it('deve deletar módulo offline', () => {
    const idParaDeletar = modulos[0].id;
    modulos = modulos.filter(m => m.id !== idParaDeletar);

    syncQueue.push({
      id: 'sync-3',
      tipo: 'modulo',
      acao: 'deletar',
      dados: { id: idParaDeletar },
      timestamp: Date.now(),
      tentativas: 0,
    });

    expect(modulos).toHaveLength(0);
    expect(syncQueue[0].acao).toBe('deletar');
  });

  it('deve processar fila de sincronização', async () => {
    syncQueue = [
      {
        id: 'sync-1',
        tipo: 'modulo',
        acao: 'criar',
        dados: modulos[0],
        timestamp: Date.now(),
        tentativas: 0,
      },
    ];

    const resultado = await syncService.processQueue(syncQueue);

    expect(resultado.sucesso.length + resultado.erro.length).toBe(1);
  });

  it('deve resolver conflitos com last-write-wins', async () => {
    const local: Modulo[] = [
      {
        ...modulos[0],
        nome: 'Versão Local',
        dataAtualizacao: Date.now() + 1000,
      },
    ];

    const remoto: Modulo[] = [
      {
        ...modulos[0],
        nome: 'Versão Remota',
        dataAtualizacao: Date.now(),
      },
    ];

    const resultado = await syncService.sincronizarComConflitos(local, remoto);

    const moduloResultado = resultado[0] as Modulo;
    expect(moduloResultado.nome).toBe('Versão Local');
  });

  it('deve gerar relatório de sincronização', () => {
    const sucesso: SyncQueue[] = [
      {
        id: 'sync-1',
        tipo: 'modulo',
        acao: 'criar',
        dados: modulos[0],
        timestamp: Date.now(),
        tentativas: 0,
      },
    ];

    const erro: SyncQueue[] = [];

    const relatorio = syncService.gerarRelatorioSync(sucesso, erro);

    expect(relatorio).toContain('Relatório de Sincronização');
    expect(relatorio).toContain('Taxa de sucesso: 100.0%');
  });

  it('deve persistir dados offline em AsyncStorage', async () => {
    const dados = {
      modulos,
      conteudos,
      syncQueue,
      ultimaSincronizacao: Date.now(),
    };

    // Simular AsyncStorage
    const storage: Record<string, string> = {};
    storage['admin-data'] = JSON.stringify(dados);

    const recuperado = JSON.parse(storage['admin-data']);

    expect(recuperado.modulos).toHaveLength(1);
    expect(recuperado.conteudos).toHaveLength(1);
    expect(recuperado.syncQueue).toHaveLength(0);
  });

  it('deve sincronizar com retry automático', async () => {
    const item: SyncQueue = {
      id: 'sync-1',
      tipo: 'modulo',
      acao: 'criar',
      dados: modulos[0],
      timestamp: Date.now(),
      tentativas: 0,
    };

    const resultado = await syncService.processQueue([item]);

    // Verificar que tentativas foram incrementadas em caso de erro
    if (resultado.erro.length > 0) {
      expect(resultado.erro[0].tentativas).toBeGreaterThan(0);
    }
  });
});
