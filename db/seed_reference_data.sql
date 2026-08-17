-- ============================================================================
-- Seed das tabelas de referência (Fase 0 do plano de migração)
--
-- Espelha src/data/seed/{setores,tiposEquipamento,fabricantes,modelos,
-- funcoes,problemas}.ts. Só as 6 tabelas de pré-cadastro — usuários, ativos
-- e OSs ficam para as fases próprias (1, 4 e 5), que têm modelagem/lógica
-- de vínculo específica (auth, status, snapshots).
--
-- IDs explícitos preservam a mesma numeração usada hoje no frontend, pra
-- facilitar comparação durante a transição. OVERRIDING SYSTEM VALUE é
-- necessário porque as colunas são `generated always as identity`; os
-- setval() no fim recolocam cada sequence depois do maior id inserido, pra
-- não colidir com o próximo insert "normal" feito pela aplicação.
--
-- Rodar depois de aplicar db/schema.sql.
-- ============================================================================

insert into setores (id, name) overriding system value values
  (1, 'Produção'),
  (2, 'Manutenção'),
  (3, 'Embalagem'),
  (4, 'Expedição'),
  (5, 'Almoxarifado');

insert into tipos_equipamento (id, name) overriding system value values
  (1, 'Compressor de Ar'),
  (2, 'Motor Elétrico'),
  (3, 'Bomba Centrífuga'),
  (4, 'Esteira Transportadora'),
  (5, 'Prensa Hidráulica'),
  (6, 'Empilhadeira');

insert into fabricantes (id, name) overriding system value values
  (1, 'WEG'),
  (2, 'Atlas Copco'),
  (3, 'Bosch'),
  (4, 'Siemens'),
  (5, 'SKF');

insert into modelos (id, name, manufacturer_id) overriding system value values
  (1, 'W22 Premium', 1),
  (2, 'W21', 1),
  (3, 'GA 22', 2),
  (4, 'GA 30', 2),
  (5, 'GKS 240', 3),
  (6, 'CB 2200', 3),
  (7, 'SIMOTICS SD100', 4),
  (8, 'SY 511', 5);

insert into funcoes (id, name) overriding system value values
  (1, 'Técnico Júnior'),
  (2, 'Técnico Pleno'),
  (3, 'Técnico Sênior'),
  (4, 'Eletricista'),
  (5, 'Líder de Manutenção');

insert into tipos_problema (id, name) overriding system value values
  (1, 'Vazamento'),
  (2, 'Ruído Anormal'),
  (3, 'Superaquecimento'),
  (4, 'Vibração Excessiva'),
  (5, 'Falha Elétrica'),
  (6, 'Desgaste de Peça'),
  (7, 'Parada Total');

-- Realinha as sequences de identity com o maior id inserido acima.
select setval(pg_get_serial_sequence('setores', 'id'), (select max(id) from setores));
select setval(pg_get_serial_sequence('tipos_equipamento', 'id'), (select max(id) from tipos_equipamento));
select setval(pg_get_serial_sequence('fabricantes', 'id'), (select max(id) from fabricantes));
select setval(pg_get_serial_sequence('modelos', 'id'), (select max(id) from modelos));
select setval(pg_get_serial_sequence('funcoes', 'id'), (select max(id) from funcoes));
select setval(pg_get_serial_sequence('tipos_problema', 'id'), (select max(id) from tipos_problema));
