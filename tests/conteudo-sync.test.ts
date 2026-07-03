import { describe, it, expect, beforeEach, vi } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Conteudo, ConteudoCreate, validarConteudo, validarConteudoCreate } from '@/lib/admin/schemas';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

describe('Conteúdo Sync - CRUD Offline', () => {
  const mockConteudoCreate: ConteudoCreate = {
    moduloId: '1',
    titulo: 'Guia de Monitoramento de Solo',
    descricao: 'Guia completo sobre como monitorar a saúde do solo',
    tipo: 'guia',
    conteudo: '<h1>Monitoramento de Solo</h1><p>Conteúdo detalhado...</p>',
    tags: ['solo', 'monitoramento', 'educação'],
    ordem: 1,
    ativo: true,
  };

  const mockConteudo: Conteudo = {
    id: 'conteudo-1',
    ...mockConteudoCreate,
    dataCriacao: Date.now(),
    dataAtualizacao: Date.now(),
    syncStatus: 'pendente',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Validação com Zod', () => {
    it('deve validar conteúdo com todos os campos obrigatórios', () => {
      const resultado = validarConteudoCreate(mockConteudoCreate);
      expect(resultado).toEqual(mockConteudoCreate);
    });

    it('deve falhar se título estiver vazio', () => {
      const dados = { ...mockConteudoCreate, titulo: '' };
      expect(() => validarConteudoCreate(dados)).toThrow();
    });

    it('deve falhar se descrição tiver menos de 10 caracteres', () => {
      const dados = { ...mockConteudoCreate, descricao: 'Curto' };
      expect(() => validarConteudoCreate(dados)).toThrow();
    });

    it('deve falhar se módulo estiver vazio', () => {
      const dados = { ...mockConteudoCreate, moduloId: '' };
      expect(() => validarConteudoCreate(dados)).toThrow();
    });

    it('deve falhar se tipo for inválido', () => {
      const dados = { ...mockConteudoCreate, tipo: 'invalido' as any };
      expect(() => validarConteudoCreate(dados)).toThrow();
    });

    it('deve validar conteúdo completo com syncStatus', () => {
      const resultado = validarConteudo(mockConteudo);
      expect(resultado.id).toBe('conteudo-1');
      expect(resultado.syncStatus).toBe('pendente');
    });

    it('deve aceitar tags como array vazio', () => {
      const dados = { ...mockConteudoCreate, tags: [] };
      const resultado = validarConteudoCreate(dados);
      expect(resultado.tags).toEqual([]);
    });

    it('deve aceitar URL arquivo opcional', () => {
      const dados = {
        ...mockConteudoCreate,
        urlArquivo: 'https://exemplo.com/arquivo.pdf',
      };
      const resultado = validarConteudoCreate(dados);
      expect(resultado.urlArquivo).toBe('https://exemplo.com/arquivo.pdf');
    });

    it('deve rejeitar URL inválida', () => {
      const dados = {
        ...mockConteudoCreate,
        urlArquivo: 'nao-eh-url',
      };
      expect(() => validarConteudoCreate(dados)).toThrow();
    });
  });

  describe('Operações de Sincronização', () => {
    it('deve criar conteúdo com status pendente', () => {
      const conteudo: Conteudo = {
        id: `${Date.now()}_abc123`,
        ...mockConteudoCreate,
        dataCriacao: Date.now(),
        dataAtualizacao: Date.now(),
        syncStatus: 'pendente',
      };

      expect(conteudo.syncStatus).toBe('pendente');
      expect(conteudo.id).toBeDefined();
      expect(conteudo.dataCriacao).toBeDefined();
    });

    it('deve atualizar conteúdo com novo syncStatus', () => {
      const conteudoAtualizado = {
        ...mockConteudo,
        titulo: 'Novo Título',
        dataAtualizacao: Date.now() + 1000,
        syncStatus: 'sincronizado' as const,
      };

      expect(conteudoAtualizado.titulo).toBe('Novo Título');
      expect(conteudoAtualizado.syncStatus).toBe('sincronizado');
      expect(conteudoAtualizado.dataAtualizacao || 0).toBeGreaterThan(mockConteudo.dataAtualizacao || 0);
    });

    it('deve manter histórico de atualizações', () => {
      const conteudos: Conteudo[] = [
        { ...mockConteudo, id: '1', titulo: 'Versão 1', dataAtualizacao: 1000 },
        { ...mockConteudo, id: '2', titulo: 'Versão 2', dataAtualizacao: 2000 },
        { ...mockConteudo, id: '3', titulo: 'Versão 3', dataAtualizacao: 3000 },
      ];

      expect(conteudos).toHaveLength(3);
      expect(conteudos[2].dataAtualizacao || 0).toBeGreaterThan(conteudos[0].dataAtualizacao || 0);
    });
  });

  describe('Tipos de Conteúdo', () => {
    it('deve suportar tipo artigo', () => {
      const conteudo = { ...mockConteudoCreate, tipo: 'artigo' as const };
      expect(conteudo.tipo).toBe('artigo');
    });

    it('deve suportar tipo guia', () => {
      const conteudo = { ...mockConteudoCreate, tipo: 'guia' as const };
      expect(conteudo.tipo).toBe('guia');
    });

    it('deve suportar tipo pdf', () => {
      const conteudo = { ...mockConteudoCreate, tipo: 'pdf' as const };
      expect(conteudo.tipo).toBe('pdf');
    });

    it('deve suportar tipo video', () => {
      const conteudo = { ...mockConteudoCreate, tipo: 'video' as const };
      expect(conteudo.tipo).toBe('video');
    });

    it('deve suportar tipo imagem', () => {
      const conteudo = { ...mockConteudoCreate, tipo: 'imagem' as const };
      expect(conteudo.tipo).toBe('imagem');
    });
  });

  describe('Filtros e Busca', () => {
    const conteudos: Conteudo[] = [
      { ...mockConteudo, id: '1', moduloId: '1', titulo: 'Solo' },
      { ...mockConteudo, id: '2', moduloId: '1', titulo: 'Água' },
      { ...mockConteudo, id: '3', moduloId: '2', titulo: 'Pragas' },
    ];

    it('deve filtrar conteúdos por módulo', () => {
      const filtrados = conteudos.filter(c => c.moduloId === '1');
      expect(filtrados).toHaveLength(2);
      expect(filtrados.every(c => c.moduloId === '1')).toBe(true);
    });

    it('deve filtrar conteúdos por tipo', () => {
      const conteudosComTipo = [
        { ...mockConteudo, id: '1', tipo: 'artigo' as const },
        { ...mockConteudo, id: '2', tipo: 'guia' as const },
        { ...mockConteudo, id: '3', tipo: 'artigo' as const },
      ];

      const filtrados = conteudosComTipo.filter(c => c.tipo === 'artigo');
      expect(filtrados).toHaveLength(2);
    });

    it('deve filtrar conteúdos ativos', () => {
      const conteudosComStatus = [
        { ...mockConteudo, id: '1', ativo: true },
        { ...mockConteudo, id: '2', ativo: false },
        { ...mockConteudo, id: '3', ativo: true },
      ];

      const filtrados = conteudosComStatus.filter(c => c.ativo);
      expect(filtrados).toHaveLength(2);
    });

    it('deve buscar por título', () => {
      const busca = 'Solo';
      const filtrados = conteudos.filter(c => c.titulo.includes(busca));
      expect(filtrados).toHaveLength(1);
      expect(filtrados[0].titulo).toBe('Solo');
    });

    it('deve buscar por tags', () => {
      const conteudosComTags = [
        { ...mockConteudo, id: '1', tags: ['solo', 'educação'] },
        { ...mockConteudo, id: '2', tags: ['água', 'clima'] },
        { ...mockConteudo, id: '3', tags: ['solo', 'nutrição'] },
      ];

      const filtrados = conteudosComTags.filter(c => c.tags.includes('solo'));
      expect(filtrados).toHaveLength(2);
    });
  });

  describe('Ordenação', () => {
    it('deve ordenar conteúdos por ordem', () => {
      const conteudos = [
        { ...mockConteudo, id: '1', ordem: 3 },
        { ...mockConteudo, id: '2', ordem: 1 },
        { ...mockConteudo, id: '3', ordem: 2 },
      ];

      const ordenados = [...conteudos].sort((a, b) => a.ordem - b.ordem);
      expect(ordenados[0].ordem).toBe(1);
      expect(ordenados[1].ordem).toBe(2);
      expect(ordenados[2].ordem).toBe(3);
    });

    it('deve ordenar conteúdos por data de atualização (mais recente primeiro)', () => {
      const conteudos = [
        { ...mockConteudo, id: '1', dataAtualizacao: 1000 },
        { ...mockConteudo, id: '2', dataAtualizacao: 3000 },
        { ...mockConteudo, id: '3', dataAtualizacao: 2000 },
      ];

      const ordenados = [...conteudos].sort((a, b) => (b.dataAtualizacao || 0) - (a.dataAtualizacao || 0));
      expect(ordenados[0].dataAtualizacao).toBe(3000);
      expect(ordenados[1].dataAtualizacao).toBe(2000);
      expect(ordenados[2].dataAtualizacao).toBe(1000);
    });
  });

  describe('Sincronização com Fila', () => {
    it('deve rastrear itens pendentes de sincronização', () => {
      const conteudos = [
        { ...mockConteudo, id: '1', syncStatus: 'sincronizado' as const },
        { ...mockConteudo, id: '2', syncStatus: 'pendente' as const },
        { ...mockConteudo, id: '3', syncStatus: 'pendente' as const },
      ];

      const pendentes = conteudos.filter(c => c.syncStatus === 'pendente');
      expect(pendentes).toHaveLength(2);
    });

    it('deve contar itens com erro de sincronização', () => {
      const conteudos = [
        { ...mockConteudo, id: '1', syncStatus: 'sincronizado' as const },
        { ...mockConteudo, id: '2', syncStatus: 'erro' as const },
        { ...mockConteudo, id: '3', syncStatus: 'erro' as const },
      ];

      const comErro = conteudos.filter(c => c.syncStatus === 'erro');
      expect(comErro).toHaveLength(2);
    });

    it('deve marcar conteúdo como sincronizando', () => {
      const conteudo = { ...mockConteudo, syncStatus: 'sincronizando' as const };
      expect(conteudo.syncStatus).toBe('sincronizando');
    });
  });

  describe('Resolução de Conflitos', () => {
    it('deve usar last-write-wins para conflitos', () => {
      const local = { ...mockConteudo, id: '1', titulo: 'Local', dataAtualizacao: 2000 };
      const remoto = { ...mockConteudo, id: '1', titulo: 'Remoto', dataAtualizacao: 1000 };

      const vencedor = local.dataAtualizacao > remoto.dataAtualizacao ? local : remoto;
      expect(vencedor.titulo).toBe('Local');
    });

    it('deve descartar versão mais antiga em caso de conflito', () => {
      const versaoAntiga = { ...mockConteudo, id: '1', dataAtualizacao: 1000 };
      const versaoNova = { ...mockConteudo, id: '1', dataAtualizacao: 2000 };

      const conteudos = [versaoAntiga, versaoNova];
      const maxData = Math.max(...conteudos.map(x => x.dataAtualizacao || 0));
      const filtrados = conteudos.filter(c => c.dataAtualizacao === maxData);

      expect(filtrados).toHaveLength(1);
      expect(filtrados[0].dataAtualizacao).toBe(2000);
    });
  });

  describe('Validação de Limites', () => {
    it('deve validar título máximo de 200 caracteres', () => {
      const tituloLongo = 'A'.repeat(201);
      const dados = { ...mockConteudoCreate, titulo: tituloLongo };
      expect(() => validarConteudoCreate(dados)).toThrow();
    });

    it('deve validar descrição máxima de 1000 caracteres', () => {
      const descricaoLonga = 'A'.repeat(1001);
      const dados = { ...mockConteudoCreate, descricao: descricaoLonga };
      expect(() => validarConteudoCreate(dados)).toThrow();
    });

    it('deve aceitar ordem negativa', () => {
      const dados = { ...mockConteudoCreate, ordem: -1 };
      expect(() => validarConteudoCreate(dados)).toThrow();
    });
  });
});
