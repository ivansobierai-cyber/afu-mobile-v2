CREATE TABLE `analises_fitotecnicas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuarioId` int,
	`propriedadeId` int,
	`culturaId` int,
	`tipoAnalise` enum('solo','agua','foliar','completa') DEFAULT 'solo',
	`phSolo` decimal(4,2),
	`phAgua` decimal(4,2),
	`nitrogenio` decimal(8,3),
	`fosforo` decimal(8,3),
	`potassio` decimal(8,3),
	`calcio` decimal(8,3),
	`magnesio` decimal(8,3),
	`materiaOrganica` decimal(6,2),
	`umidade` decimal(6,2),
	`condutividadeEletrica` decimal(8,4),
	`resultadoTecnico` text,
	`recomendacao` text,
	`dataAnalise` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analises_fitotecnicas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calendario_cuidados` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuarioId` int,
	`propriedadeId` int,
	`culturaId` int,
	`tipoAtividade` enum('plantio','irrigacao','adubacao','pulverizacao','monitoramento','colheita','analise','manutencao','outro') NOT NULL,
	`titulo` varchar(200) NOT NULL,
	`descricao` text,
	`dataProgramada` timestamp NOT NULL,
	`recorrencia` enum('nenhuma','diaria','semanal','quinzenal','mensal') DEFAULT 'nenhuma',
	`prioridade` enum('baixa','normal','alta','critica') DEFAULT 'normal',
	`status` enum('pendente','em_andamento','concluido','cancelado') DEFAULT 'pendente',
	`lembreteAtivo` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calendario_cuidados_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `culturas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propriedadeId` int NOT NULL,
	`terrenoId` int,
	`nomeCultura` varchar(100) NOT NULL,
	`variedade` varchar(100),
	`dataPlantio` date,
	`faseAtual` varchar(100),
	`areaPlantada` decimal(12,2),
	`previsaoColheita` date,
	`producaoEstimada` decimal(12,2),
	`unidadeProducao` varchar(30),
	`status` enum('planejado','em_andamento','colhido','perdido') DEFAULT 'em_andamento',
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `culturas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `diagnosticos_ia` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuarioId` int,
	`propriedadeId` int,
	`culturaId` int,
	`imagemUrl` text,
	`partePlanta` varchar(50),
	`sintomasInformados` text,
	`resultado` text,
	`pragaProvavel` varchar(150),
	`doencaProvavel` varchar(150),
	`deficienciaNutricional` varchar(150),
	`gravidade` enum('saudavel','leve','moderada','grave','critica') DEFAULT 'saudavel',
	`confiancaIa` int,
	`recomendacao` text,
	`statusRevisao` enum('pendente','revisado','confirmado','descartado') DEFAULT 'pendente',
	`dataDiagnostico` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `diagnosticos_ia_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leituras_sensores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sensorId` int NOT NULL,
	`valor` decimal(10,4) NOT NULL,
	`unidade` varchar(20),
	`dataLeitura` timestamp NOT NULL DEFAULT (now()),
	`alertaGerado` boolean DEFAULT false,
	`alertaMensagem` varchar(255),
	CONSTRAINT `leituras_sensores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `materiais_didaticos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`tipoMaterial` enum('video','audio','apostila','guia','checklist','infografico') NOT NULL,
	`tema` varchar(100),
	`descricao` text,
	`arquivoUrl` text,
	`videoUrl` text,
	`idioma` varchar(20) DEFAULT 'pt-BR',
	`publicoAlvo` enum('produtor','tecnico','todos') DEFAULT 'todos',
	`nivel` enum('iniciante','intermediario','avancado') DEFAULT 'iniciante',
	`status` enum('ativo','inativo','rascunho') DEFAULT 'ativo',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `materiais_didaticos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parceiros` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(200) NOT NULL,
	`tipo` enum('laboratorio','cooperativa','consultoria','revendedor','instituicao','outro') NOT NULL,
	`descricao` text,
	`cidade` varchar(100),
	`estado` varchar(100),
	`telefone` varchar(30),
	`email` varchar(150),
	`website` varchar(255),
	`servicosOferecidos` text,
	`status` enum('ativo','inativo') DEFAULT 'ativo',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `parceiros_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pedidos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`compradorId` int NOT NULL,
	`vendedorId` int NOT NULL,
	`produtoId` int NOT NULL,
	`quantidade` decimal(10,2) NOT NULL,
	`valorUnitario` decimal(12,2),
	`valorTotal` decimal(12,2),
	`statusPedido` enum('aguardando','confirmado','em_preparo','enviado','entregue','cancelado') DEFAULT 'aguardando',
	`statusPagamento` enum('pendente','pago','estornado','cancelado') DEFAULT 'pendente',
	`enderecoEntrega` text,
	`observacoes` text,
	`dataPedido` timestamp NOT NULL DEFAULT (now()),
	`dataEntrega` timestamp,
	CONSTRAINT `pedidos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pragas_doencas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(150) NOT NULL,
	`nomeCientifico` varchar(200),
	`tipo` enum('praga','doenca','deficiencia') NOT NULL,
	`culturaAfetada` varchar(200),
	`sintomas` text,
	`causas` text,
	`tratamento` text,
	`prevencao` text,
	`imagensReferencia` text,
	`nivelRisco` enum('baixo','medio','alto','critico') NOT NULL DEFAULT 'medio',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pragas_doencas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `produtores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuarioId` int NOT NULL,
	`documento` varchar(50),
	`cidade` varchar(100),
	`estado` varchar(100),
	`pais` varchar(100) DEFAULT 'Brasil',
	`regiao` varchar(100),
	`tipoProdutor` enum('familiar','comercial','organico','cooperado','empresarial') DEFAULT 'comercial',
	`cadastroAtivo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `produtores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `produtos_marketplace` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vendedorId` int NOT NULL,
	`nomeProduto` varchar(200) NOT NULL,
	`categoria` enum('sementes','fertilizantes','defensivos','equipamentos','servicos','producao_propria','outro') NOT NULL,
	`descricao` text,
	`preco` decimal(12,2),
	`estoque` decimal(12,2),
	`unidade` varchar(30),
	`imagemUrl` text,
	`status` enum('disponivel','indisponivel','pausado') DEFAULT 'disponivel',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `produtos_marketplace_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `propriedades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`produtorId` int NOT NULL,
	`nome` varchar(150) NOT NULL,
	`cidade` varchar(100),
	`estado` varchar(100),
	`pais` varchar(100) DEFAULT 'Brasil',
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`tamanhoArea` decimal(12,2),
	`unidadeArea` enum('ha','alqueire','m2') DEFAULT 'ha',
	`tipoSolo` varchar(100),
	`fonteAgua` varchar(100),
	`sistemaIrrigacao` varchar(100),
	`tipoProducao` enum('graos','hortifruti','fruticultura','cana','cafe','pecuaria','misto','outro') DEFAULT 'graos',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `propriedades_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `relatorios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuarioId` int,
	`diagnosticoId` int,
	`analiseId` int,
	`titulo` varchar(255) NOT NULL,
	`tipoRelatorio` enum('diagnostico','analise_solo','historico','certificado','recomendacao') DEFAULT 'diagnostico',
	`arquivoPdfUrl` text,
	`status` enum('rascunho','emitido','assinado','cancelado') DEFAULT 'emitido',
	`tecnicoResponsavelId` int,
	`conteudo` text,
	`dataEmissao` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `relatorios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sensores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propriedadeId` int NOT NULL,
	`tipoSensor` enum('temperatura','umidade_solo','umidade_ar','ph','condutividade','chuva','vento','luminosidade','co2','outro') NOT NULL,
	`codigoSensor` varchar(100),
	`localInstalacao` varchar(200),
	`status` enum('ativo','inativo','manutencao','falha') DEFAULT 'ativo',
	`ultimaLeitura` decimal(10,4),
	`unidadeLeitura` varchar(20),
	`dataInstalacao` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sensores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `terrenos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propriedadeId` int NOT NULL,
	`nome` varchar(100) NOT NULL,
	`area` decimal(10,2),
	`tipoSolo` varchar(100),
	`sistemaIrrigacao` varchar(100),
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `terrenos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `usuarios_afu` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`nome` varchar(150) NOT NULL,
	`email` varchar(150),
	`telefone` varchar(30),
	`tipoUsuario` enum('administrador','tecnico','produtor','parceiro','comprador') NOT NULL DEFAULT 'produtor',
	`status` enum('ativo','inativo','suspenso') NOT NULL DEFAULT 'ativo',
	`registroProfissional` varchar(50),
	`cargo` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `usuarios_afu_id` PRIMARY KEY(`id`)
);
