-- Etapa 3 Eventos — tipos inteligentes inspeção e laboratório
ALTER TABLE `calendario_cuidados`
  MODIFY COLUMN `tipoAtividade` ENUM(
    'plantio',
    'irrigacao',
    'adubacao',
    'pulverizacao',
    'monitoramento',
    'colheita',
    'analise',
    'manutencao',
    'inspecao',
    'laboratorio',
    'outro'
  ) NOT NULL;
