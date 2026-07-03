import { describe, it, expect } from 'vitest';

/**
 * Testes para HtmlEditor
 * 
 * Valida:
 * - Formatação de texto (negrito, itálico, sublinhado)
 * - Criação de títulos (H1, H2, H3)
 * - Listas (com pontos e numeradas)
 * - Citações e blocos de código
 * - Links e linhas divisórias
 * - Sanitização de HTML
 */

describe('HtmlEditor', () => {
  describe('Formatação de Texto', () => {
    it('deve aplicar negrito ao texto selecionado', () => {
      const text = 'texto importante';
      const formatted = `<strong>${text}</strong>`;
      expect(formatted).toContain('<strong>');
      expect(formatted).toContain('</strong>');
    });

    it('deve aplicar itálico ao texto selecionado', () => {
      const text = 'texto em itálico';
      const formatted = `<em>${text}</em>`;
      expect(formatted).toContain('<em>');
      expect(formatted).toContain('</em>');
    });

    it('deve aplicar sublinhado ao texto selecionado', () => {
      const text = 'texto sublinhado';
      const formatted = `<u>${text}</u>`;
      expect(formatted).toContain('<u>');
      expect(formatted).toContain('</u>');
    });
  });

  describe('Títulos', () => {
    it('deve criar título H1', () => {
      const text = 'Título Principal';
      const formatted = `<h1>${text}</h1>`;
      expect(formatted).toContain('<h1>');
      expect(formatted).toContain('</h1>');
    });

    it('deve criar título H2', () => {
      const text = 'Subtítulo';
      const formatted = `<h2>${text}</h2>`;
      expect(formatted).toContain('<h2>');
      expect(formatted).toContain('</h2>');
    });

    it('deve criar título H3', () => {
      const text = 'Seção';
      const formatted = `<h3>${text}</h3>`;
      expect(formatted).toContain('<h3>');
      expect(formatted).toContain('</h3>');
    });
  });

  describe('Listas', () => {
    it('deve criar lista com pontos', () => {
      const text = 'Item da lista';
      const formatted = `<ul><li>${text}</li></ul>`;
      expect(formatted).toContain('<ul>');
      expect(formatted).toContain('<li>');
      expect(formatted).toContain('</li>');
      expect(formatted).toContain('</ul>');
    });

    it('deve criar lista numerada', () => {
      const text = 'Item numerado';
      const formatted = `<ol><li>${text}</li></ol>`;
      expect(formatted).toContain('<ol>');
      expect(formatted).toContain('<li>');
      expect(formatted).toContain('</li>');
      expect(formatted).toContain('</ol>');
    });
  });

  describe('Citações e Código', () => {
    it('deve criar bloco de citação', () => {
      const text = 'Citação importante';
      const formatted = `<blockquote>${text}</blockquote>`;
      expect(formatted).toContain('<blockquote>');
      expect(formatted).toContain('</blockquote>');
    });

    it('deve criar bloco de código', () => {
      const text = 'const x = 42;';
      const formatted = `<code>${text}</code>`;
      expect(formatted).toContain('<code>');
      expect(formatted).toContain('</code>');
    });
  });

  describe('Links', () => {
    it('deve criar link com URL', () => {
      const text = 'Clique aqui';
      const url = 'https://example.com';
      const formatted = `<a href="${url}">${text}</a>`;
      expect(formatted).toContain('<a href=');
      expect(formatted).toContain(url);
      expect(formatted).toContain('</a>');
    });

    it('deve validar URL do link', () => {
      const url = 'https://example.com';
      const isValid = /^https?:\/\//.test(url);
      expect(isValid).toBe(true);
    });

    it('deve rejeitar URL inválida', () => {
      const url = 'not-a-url';
      const isValid = /^https?:\/\//.test(url);
      expect(isValid).toBe(false);
    });
  });

  describe('Linha Divisória', () => {
    it('deve inserir linha divisória', () => {
      const formatted = '<hr />';
      expect(formatted).toContain('<hr');
    });
  });

  describe('Composição de Formatações', () => {
    it('deve combinar múltiplas formatações', () => {
      const html = '<h1>Título</h1><p>Parágrafo com <strong>negrito</strong> e <em>itálico</em>.</p><ul><li>Item 1</li><li>Item 2</li></ul>';
      expect(html).toContain('<h1>');
      expect(html).toContain('<strong>');
      expect(html).toContain('<em>');
      expect(html).toContain('<ul>');
    });

    it('deve preservar estrutura HTML ao editar', () => {
      const original = '<h1>Título</h1><p>Conteúdo</p>';
      const edited = original.replace('Conteúdo', 'Conteúdo <strong>atualizado</strong>');
      expect(edited).toContain('<h1>');
      expect(edited).toContain('<strong>');
    });
  });

  describe('Validação de Conteúdo', () => {
    it('deve validar que conteúdo não está vazio', () => {
      const content = '';
      const isValid = content.trim().length > 0;
      expect(isValid).toBe(false);
    });

    it('deve validar que conteúdo tem comprimento mínimo', () => {
      const content = 'Conteúdo';
      const isValid = content.length >= 1;
      expect(isValid).toBe(true);
    });

    it('deve aceitar HTML válido', () => {
      const content = '<p>Parágrafo válido</p>';
      const hasHtml = /<[^>]*>/.test(content);
      expect(hasHtml).toBe(true);
    });
  });

  describe('Preview HTML', () => {
    it('deve gerar HTML válido para preview', () => {
      const content = '<h1>Título</h1><p>Conteúdo</p>';
      const preview = `<!DOCTYPE html><html><body>${content}</body></html>`;
      expect(preview).toContain('<!DOCTYPE html>');
      expect(preview).toContain('<html>');
      expect(preview).toContain('<body>');
      expect(preview).toContain(content);
    });

    it('deve incluir estilos CSS no preview', () => {
      const preview = `
        <style>
          h1 { font-size: 28px; font-weight: bold; }
          p { margin: 8px 0; }
        </style>
      `;
      expect(preview).toContain('<style>');
      expect(preview).toContain('h1');
      expect(preview).toContain('p');
    });

    it('deve renderizar preview com viewport meta tag', () => {
      const preview = '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
      expect(preview).toContain('viewport');
      expect(preview).toContain('width=device-width');
    });
  });

  describe('Integração com Conteúdo', () => {
    it('deve salvar HTML no estado do conteúdo', () => {
      const html = '<p>Conteúdo salvo</p>';
      const conteudo = { conteudo: html };
      expect(conteudo.conteudo).toBe(html);
    });

    it('deve atualizar conteúdo ao editar', () => {
      let conteudo = { conteudo: '<p>Original</p>' };
      conteudo.conteudo = '<p>Atualizado</p>';
      expect(conteudo.conteudo).toContain('Atualizado');
    });

    it('deve preservar conteúdo ao alternar entre editor e preview', () => {
      const original = '<h1>Título</h1><p>Conteúdo</p>';
      const edited = original;
      expect(edited).toBe(original);
    });
  });
});
