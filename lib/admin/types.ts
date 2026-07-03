export type SyncStatus = 'sincronizado' | 'sincronizando' | 'erro' | 'pendente';

export interface Modulo {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  ordem: number;
  ativo: boolean;
  dataCriacao: number;
  dataAtualizacao: number;
  syncStatus: SyncStatus;
  syncError?: string;
}

export interface Conteudo {
  id: string;
  moduloId: string;
  titulo: string;
  descricao: string;
  tipo: 'artigo' | 'guia' | 'pdf' | 'video' | 'imagem';
  conteudo: string;
  urlArquivo?: string;
  tags: string[];
  ordem: number;
  ativo: boolean;
  dataCriacao: number;
  dataAtualizacao: number;
  syncStatus: SyncStatus;
  syncError?: string;
}

export interface RegistroAgricola {
  id: string;
  tipo: 'plantio' | 'colheita' | 'aplicacao' | 'monitoramento';
  talhaoId: string;
  cultura: string;
  descricao: string;
  dataRegistro: number;
  dados: Record<string, any>;
  imagens: string[];
  dataCriacao: number;
  dataAtualizacao: number;
  syncStatus: SyncStatus;
  syncError?: string;
}

export interface ItemMonitoramento {
  id: string;
  registroId: string;
  tipo: 'praga' | 'doenca' | 'clima' | 'solo';
  nome: string;
  severidade: 'baixa' | 'media' | 'alta' | 'critica';
  descricao: string;
  recomendacao: string;
  dataCriacao: number;
  dataAtualizacao: number;
  syncStatus: SyncStatus;
  syncError?: string;
}

export interface SyncQueue {
  id: string;
  tipo: 'modulo' | 'conteudo' | 'registro' | 'item';
  acao: 'criar' | 'atualizar' | 'deletar';
  dados: any;
  timestamp: number;
  tentativas: number;
  ultimaTentativa?: number;
  erro?: string;
}

export interface AdminState {
  modulos: Modulo[];
  conteudos: Conteudo[];
  registros: RegistroAgricola[];
  itens: ItemMonitoramento[];
  syncQueue: SyncQueue[];
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: number;
}
