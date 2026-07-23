-- Estoque — custo médio ponderado
ALTER TABLE `estoque_itens` ADD COLUMN `custoMedio` decimal(14,4);
--> statement-breakpoint
ALTER TABLE `estoque_movimentos` ADD COLUMN `custoUnitario` decimal(14,4);
