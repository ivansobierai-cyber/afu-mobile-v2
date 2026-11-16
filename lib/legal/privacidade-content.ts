/**
 * Conteúdo da Política de Privacidade (LGPD) — fonte única para rota in-app e docs/playstore.
 * Última revisão editorial: 2026-11-16.
 */

export const PRIVACY_POLICY_URL = "https://afuagro.tech/privacidade";
export const TERMS_URL = "https://afuagro.tech/termos";
export const PRIVACY_CONTACT_EMAIL = "suporte@afuagro.com.br";
export const PRIVACY_LAST_UPDATED = "16 de novembro de 2026";

export type LegalSection = {
  title: string;
  paragraphs: string[];
};

export const PRIVACY_INTRO =
  "Esta Política de Privacidade descreve como o AFU Agro (Analisador Fitotécnico Universal) trata dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).";

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    title: "1. Controlador",
    paragraphs: [
      "O controlador dos dados é a operação AFU Agro. Contato para privacidade e direitos do titular: " +
        PRIVACY_CONTACT_EMAIL +
        ".",
    ],
  },
  {
    title: "2. Dados que coletamos",
    paragraphs: [
      "Conta: nome, e-mail, senha (armazenada como hash), telefone opcional, tipo de perfil (produtor, técnico etc.).",
      "Perfil produtor: documento (quando informado), cidade, estado, região e tipo de produtor.",
      "Operação agrícola: propriedades (incluindo latitude/longitude quando marcadas), safras, cultivos, estoque, custos, operações, eventos e anexos.",
      "Diagnóstico: fotos de plantas enviadas para análise e resultados associados à conta/organização.",
      "Dispositivo: token de push (Expo), plataforma, nome do dispositivo e identificador local usado na sincronização offline.",
      "Suporte: conteúdo de tickets e mensagens enviadas ao suporte.",
    ],
  },
  {
    title: "3. Finalidades e bases legais",
    paragraphs: [
      "Prestação do serviço (execução de contrato): autenticação, gestão de propriedades/cultivos, diagnóstico, calendário, estoque, financeiro operacional e marketplace.",
      "Notificações (consentimento / legítimo interesse do serviço): lembretes de calendário e alertas agrícolas via notificações locais ou push.",
      "Localização sob demanda (consentimento): marcar propriedades no mapa — o app solicita permissão em tempo de uso e não rastreia em segundo plano.",
      "Fotos (consentimento): câmera ou galeria apenas quando o usuário inicia diagnóstico ou anexa evidências.",
      "Segurança e auditoria (legítimo interesse / obrigação legal): logs de acesso, isolamento multi-tenant e prevenção a abuso.",
    ],
  },
  {
    title: "4. Compartilhamento",
    paragraphs: [
      "Não vendemos dados pessoais.",
      "Dados podem ser processados por provedores de infraestrutura necessários ao serviço (hospedagem de API, banco de dados, armazenamento de arquivos e, quando configurado, provedor de e-mail e modelo de IA para diagnóstico).",
      "Dentro de uma organização, membros autorizados veem dados conforme papéis (RBAC).",
    ],
  },
  {
    title: "5. Armazenamento e segurança",
    paragraphs: [
      "Trânsito: HTTPS na API de produção (api.afuagro.tech).",
      "Mobile: tokens de sessão em armazenamento seguro do dispositivo (SecureStore) quando disponível; fila offline cifrada no dispositivo.",
      "Senhas: armazenadas apenas como hash; tokens de recuperação têm validade limitada.",
    ],
  },
  {
    title: "6. Retenção e direitos do titular",
    paragraphs: [
      "Mantemos os dados enquanto a conta estiver ativa e pelo tempo necessário às finalidades ou obrigações legais.",
      "Você pode solicitar acesso, correção, portabilidade, oposição e exclusão (direito ao esquecimento) pelo e-mail " +
        PRIVACY_CONTACT_EMAIL +
        ". Solicitações de exclusão são tratadas em até 30 dias úteis, salvo retenção legal.",
      "Ainda não há autoatendimento completo de exclusão no app; o canal oficial é o e-mail de suporte.",
    ],
  },
  {
    title: "7. Crianças e adolescentes",
    paragraphs: [
      "O AFU Agro é voltado a produtores e profissionais rurais. Não destinamos o serviço a menores de 18 anos.",
    ],
  },
  {
    title: "8. Permissões do dispositivo (Android/iOS)",
    paragraphs: [
      "Câmera e fotos: diagnóstico e anexos.",
      "Localização (quando em uso): coordenadas de propriedades.",
      "Notificações: lembretes e alertas do app.",
      "Não solicitamos microfone nem acesso amplo a arquivos do dispositivo.",
    ],
  },
  {
    title: "9. Alterações",
    paragraphs: [
      "Podemos atualizar esta política. A data de revisão aparece no topo da página. Mudanças relevantes serão comunicadas no app ou por e-mail quando apropriado.",
    ],
  },
];

export const TERMS_INTRO =
  "Estes Termos de Uso regem o acesso e o uso do aplicativo e da plataforma web AFU Agro.";

export const TERMS_SECTIONS: LegalSection[] = [
  {
    title: "1. Objeto",
    paragraphs: [
      "O AFU Agro oferece ferramentas digitais de gestão agrícola e diagnóstico assistido por IA. Os resultados de diagnóstico são apoio técnico e não substituem laudo agronômico presencial quando exigido.",
    ],
  },
  {
    title: "2. Conta",
    paragraphs: [
      "Você é responsável pela veracidade dos dados cadastrais e pela confidencialidade da senha.",
      "Contas podem ser suspensas em caso de uso abusivo, fraude ou violação destes termos.",
    ],
  },
  {
    title: "3. Uso aceitável",
    paragraphs: [
      "É proibido tentar acessar dados de outras organizações, explorar falhas de segurança, sobrecarregar a API ou usar o serviço para fins ilícitos.",
    ],
  },
  {
    title: "4. Propriedade intelectual",
    paragraphs: [
      "Marca, interface e código do AFU Agro pertencem aos seus titulares. Conteúdo que você envia (fotos, dados de propriedade) permanece sob sua responsabilidade; você concede licença necessária para processá-lo no serviço.",
    ],
  },
  {
    title: "5. Limitação",
    paragraphs: [
      "O serviço é fornecido “como está”, dentro do razoável. Não garantimos disponibilidade ininterrupta nem que recomendações de IA sejam exaustivas para todas as culturas e regiões.",
    ],
  },
  {
    title: "6. Privacidade",
    paragraphs: [
      "O tratamento de dados pessoais segue a Política de Privacidade disponível em " + PRIVACY_POLICY_URL + ".",
    ],
  },
  {
    title: "7. Contato",
    paragraphs: ["Dúvidas: " + PRIVACY_CONTACT_EMAIL + "."],
  },
];
