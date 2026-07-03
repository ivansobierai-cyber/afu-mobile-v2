import { z } from 'zod';

// Schema para Conteúdo de Estudos
export const ConteudoSchema = z.object({
  id: z.string().optional(),
  moduloId: z.string().min(1, 'Módulo é obrigatório'),
  titulo: z.string().min(3, 'Título deve ter pelo menos 3 caracteres').max(200, 'Título muito longo'),
  descricao: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres').max(1000, 'Descrição muito longa'),
  tipo: z.enum(['artigo', 'guia', 'pdf', 'video', 'imagem']).default('artigo'),
  conteudo: z.string().min(1, 'Conteúdo é obrigatório'),
  urlArquivo: z.string().url('URL inválida').optional().or(z.literal('')),
  tags: z.array(z.string()).default([]),
  ordem: z.number().int().min(0, 'Ordem deve ser >= 0').default(0),
  ativo: z.boolean().default(true),
  dataCriacao: z.number().optional(),
  dataAtualizacao: z.number().optional(),
  syncStatus: z.enum(['sincronizado', 'sincronizando', 'erro', 'pendente']).default('pendente'),
  syncError: z.string().optional(),
});

export type Conteudo = z.infer<typeof ConteudoSchema>;

// Schema para criação de conteúdo (sem id, datas e syncStatus)
export const ConteudoCreateSchema = ConteudoSchema.omit({
  id: true,
  dataCriacao: true,
  dataAtualizacao: true,
  syncStatus: true,
  syncError: true,
});

export type ConteudoCreate = z.infer<typeof ConteudoCreateSchema>;

// Schema para atualização de conteúdo (tudo opcional)
export const ConteudoUpdateSchema = ConteudoCreateSchema.partial();

export type ConteudoUpdate = z.infer<typeof ConteudoUpdateSchema>;

// Schema para filtro de conteúdos
export const ConteudoFilterSchema = z.object({
  moduloId: z.string().optional(),
  tipo: z.enum(['artigo', 'guia', 'pdf', 'video', 'imagem']).optional(),
  ativo: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  searchText: z.string().optional(),
});

export type ConteudoFilter = z.infer<typeof ConteudoFilterSchema>;

// Validar conteúdo completo
export function validarConteudo(data: unknown): Conteudo {
  return ConteudoSchema.parse(data);
}

// Validar criação de conteúdo
export function validarConteudoCreate(data: unknown): ConteudoCreate {
  return ConteudoCreateSchema.parse(data);
}

// Validar atualização de conteúdo
export function validarConteudoUpdate(data: unknown): ConteudoUpdate {
  return ConteudoUpdateSchema.parse(data);
}

// Validar filtro
export function validarConteudoFilter(data: unknown): ConteudoFilter {
  return ConteudoFilterSchema.parse(data);
}
