import { SyncQueue, Modulo, Conteudo } from './types';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 segundo
const BACKOFF_MULTIPLIER = 2;

export class SyncService {
  private isRunning = false;
  private queue: SyncQueue[] = [];

  async processQueue(
    queue: SyncQueue[],
    onProgress?: (item: SyncQueue, status: 'sucesso' | 'erro') => void
  ): Promise<{ sucesso: SyncQueue[]; erro: SyncQueue[] }> {
    const sucesso: SyncQueue[] = [];
    const erro: SyncQueue[] = [];

    for (const item of queue) {
      try {
        await this.processItem(item);
        sucesso.push(item);
        onProgress?.(item, 'sucesso');
      } catch (error) {
        if (item.tentativas < MAX_RETRIES) {
          // Retry com backoff exponencial
          const delay = RETRY_DELAY * Math.pow(BACKOFF_MULTIPLIER, item.tentativas);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Incrementar tentativas
          item.tentativas++;
          item.ultimaTentativa = Date.now();
          item.erro = String(error);
          erro.push(item);
        } else {
          // Máximo de tentativas atingido
          item.erro = `Falha após ${MAX_RETRIES} tentativas: ${String(error)}`;
          erro.push(item);
          onProgress?.(item, 'erro');
        }
      }
    }

    return { sucesso, erro };
  }

  private async processItem(item: SyncQueue): Promise<void> {
    // Simular chamada ao backend
    // Em produção, isso seria uma chamada real à API
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simular 90% de sucesso, 10% de erro
        if (Math.random() > 0.1) {
          resolve();
        } else {
          reject(new Error('Erro na sincronização com o servidor'));
        }
      }, 500);
    });
  }

  async sincronizarComConflitos(
    local: (Modulo | Conteudo)[],
    remoto: (Modulo | Conteudo)[]
  ): Promise<(Modulo | Conteudo)[]> {
    // Estratégia: versão local vence em caso de conflito (last-write-wins)
    const mapa = new Map<string, Modulo | Conteudo>();

    // Adicionar remoto primeiro
    remoto.forEach(item => mapa.set(item.id, item));

    // Sobrescrever com local (mais recente)
    local.forEach(item => {
      const remotoItem = mapa.get(item.id);
      if (!remotoItem || item.dataAtualizacao > remotoItem.dataAtualizacao) {
        mapa.set(item.id, item);
      }
    });

    return Array.from(mapa.values());
  }

  gerarRelatorioSync(sucesso: SyncQueue[], erro: SyncQueue[]): string {
    const total = sucesso.length + erro.length;
    const taxa = total > 0 ? ((sucesso.length / total) * 100).toFixed(1) : '0';

    return `
Relatório de Sincronização
==========================
Data: ${new Date().toLocaleString('pt-BR')}
Total de itens: ${total}
Sucesso: ${sucesso.length}
Erro: ${erro.length}
Taxa de sucesso: ${taxa}%

Itens com erro:
${erro.map(e => `- ${e.tipo} (${e.acao}): ${e.erro}`).join('\n')}
    `.trim();
  }
}

export const syncService = new SyncService();
