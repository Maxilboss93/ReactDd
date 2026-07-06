-- Seeder 010 - regole core manuale
-- Generato da database/seeders/generate_seeders.py
-- Importare dopo database/migrations/001_rebuild_dnd_app_v2.sql
USE `dnd_app`;
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 1;

START TRANSACTION;
SET @phb_source_id = (SELECT `id` FROM `rule_sources` WHERE `code` = 'phb_2024_it' LIMIT 1);
SET @homebrew_source_id = (SELECT `id` FROM `rule_sources` WHERE `code` = 'homebrew' LIMIT 1);

INSERT INTO `rule_skills` (`code`, `name`, `ability_id`) VALUES
('acrobatics', 'Acrobazia', (SELECT `id` FROM `rule_abilities` WHERE `code` = 'dex' LIMIT 1)),
('animal', 'Addestrare Animali', (SELECT `id` FROM `rule_abilities` WHERE `code` = 'wis' LIMIT 1)),
('arcana', 'Arcano', (SELECT `id` FROM `rule_abilities` WHERE `code` = 'int' LIMIT 1)),
('athletics', 'Atletica', (SELECT `id` FROM `rule_abilities` WHERE `code` = 'str' LIMIT 1)),
('deception', 'Inganno', (SELECT `id` FROM `rule_abilities` WHERE `code` = 'cha' LIMIT 1)),
('history', 'Storia', (SELECT `id` FROM `rule_abilities` WHERE `code` = 'int' LIMIT 1)),
('insight', 'Intuizione', (SELECT `id` FROM `rule_abilities` WHERE `code` = 'wis' LIMIT 1)),
('intimidation', 'Intimidire', (SELECT `id` FROM `rule_abilities` WHERE `code` = 'cha' LIMIT 1)),
('investigation', 'Investigazione', (SELECT `id` FROM `rule_abilities` WHERE `code` = 'int' LIMIT 1)),
('medicine', 'Medicina', (SELECT `id` FROM `rule_abilities` WHERE `code` = 'wis' LIMIT 1)),
('nature', 'Natura', (SELECT `id` FROM `rule_abilities` WHERE `code` = 'int' LIMIT 1)),
('perception', 'Percezione', (SELECT `id` FROM `rule_abilities` WHERE `code` = 'wis' LIMIT 1)),
('performance', 'Intrattenere', (SELECT `id` FROM `rule_abilities` WHERE `code` = 'cha' LIMIT 1)),
('persuasion', 'Persuasione', (SELECT `id` FROM `rule_abilities` WHERE `code` = 'cha' LIMIT 1)),
('religion', 'Religione', (SELECT `id` FROM `rule_abilities` WHERE `code` = 'int' LIMIT 1)),
('sleight', 'Rapidita di Mano', (SELECT `id` FROM `rule_abilities` WHERE `code` = 'dex' LIMIT 1)),
('stealth', 'Furtivita', (SELECT `id` FROM `rule_abilities` WHERE `code` = 'dex' LIMIT 1)),
('survival', 'Sopravvivenza', (SELECT `id` FROM `rule_abilities` WHERE `code` = 'wis' LIMIT 1))
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `ability_id` = VALUES(`ability_id`);

INSERT INTO `rule_damage_types` (`code`, `name`) VALUES
('acido', 'Acido'),
('contundenti', 'Contundenti'),
('forza', 'Forza'),
('freddo', 'Freddo'),
('fuoco', 'Fuoco'),
('fulmine', 'Fulmine'),
('necrotici', 'Necrotici'),
('perforanti', 'Perforanti'),
('psichici', 'Psichici'),
('radiosi', 'Radiosi'),
('taglienti', 'Taglienti'),
('tuono', 'Tuono'),
('veleno', 'Veleno')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `rule_conditions` (`code`, `name`, `rules_json`) VALUES
('accecato', 'Accecato', '{"seeded_as":"lookup","details_source":"manuale"}'),
('affascinato', 'Affascinato', '{"seeded_as":"lookup","details_source":"manuale"}'),
('afferrato', 'Afferrato', '{"seeded_as":"lookup","details_source":"manuale"}'),
('assordato', 'Assordato', '{"seeded_as":"lookup","details_source":"manuale"}'),
('avvelenato', 'Avvelenato', '{"seeded_as":"lookup","details_source":"manuale"}'),
('incapacitato', 'Incapacitato', '{"seeded_as":"lookup","details_source":"manuale"}'),
('intralciato', 'Intralciato', '{"seeded_as":"lookup","details_source":"manuale"}'),
('invisibile', 'Invisibile', '{"seeded_as":"lookup","details_source":"manuale"}'),
('paralizzato', 'Paralizzato', '{"seeded_as":"lookup","details_source":"manuale"}'),
('pietrificato', 'Pietrificato', '{"seeded_as":"lookup","details_source":"manuale"}'),
('privo_di_sensi', 'Privo di sensi', '{"seeded_as":"lookup","details_source":"manuale"}'),
('prono', 'Prono', '{"seeded_as":"lookup","details_source":"manuale"}'),
('spaventato', 'Spaventato', '{"seeded_as":"lookup","details_source":"manuale"}'),
('stordito', 'Stordito', '{"seeded_as":"lookup","details_source":"manuale"}'),
('sfinimento', 'Sfinimento', '{"seeded_as":"lookup","details_source":"manuale"}')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `rules_json` = VALUES(`rules_json`);

INSERT INTO `rule_languages` (`code`, `name`, `category`) VALUES
('comune', 'Comune', 'standard'),
('draconico', 'Draconico', 'standard'),
('nanico', 'Nanico', 'standard'),
('elfico', 'Elfico', 'standard'),
('gigante', 'Gigante', 'standard'),
('gnomico', 'Gnomico', 'standard'),
('goblin', 'Goblin', 'standard'),
('halfling', 'Halfling', 'standard'),
('orchesco', 'Orchesco', 'standard'),
('abissale', 'Abissale', 'exotic'),
('celestiale', 'Celestiale', 'exotic'),
('profondo', 'Gergo delle Profondita', 'exotic'),
('infernale', 'Infernale', 'exotic'),
('primordiale', 'Primordiale', 'exotic'),
('silvano', 'Silvano', 'exotic'),
('sottocomune', 'Sottocomune', 'exotic'),
('druidico', 'Druidico', 'special'),
('cant_ladro', 'Gergo Ladresco', 'special')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `category` = VALUES(`category`);

INSERT INTO `rule_spell_slot_progressions` (`progression_code`, `caster_level`, `slots_json`) VALUES
('full_caster', 1, '{"1":2}'),
('full_caster', 2, '{"1":3}'),
('full_caster', 3, '{"1":4,"2":2}'),
('full_caster', 4, '{"1":4,"2":3}'),
('full_caster', 5, '{"1":4,"2":3,"3":2}'),
('full_caster', 6, '{"1":4,"2":3,"3":3}'),
('full_caster', 7, '{"1":4,"2":3,"3":3,"4":1}'),
('full_caster', 8, '{"1":4,"2":3,"3":3,"4":2}'),
('full_caster', 9, '{"1":4,"2":3,"3":3,"4":3,"5":1}'),
('full_caster', 10, '{"1":4,"2":3,"3":3,"4":3,"5":2}'),
('full_caster', 11, '{"1":4,"2":3,"3":3,"4":3,"5":2,"6":1}'),
('full_caster', 12, '{"1":4,"2":3,"3":3,"4":3,"5":2,"6":1}'),
('full_caster', 13, '{"1":4,"2":3,"3":3,"4":3,"5":2,"6":1,"7":1}'),
('full_caster', 14, '{"1":4,"2":3,"3":3,"4":3,"5":2,"6":1,"7":1}'),
('full_caster', 15, '{"1":4,"2":3,"3":3,"4":3,"5":2,"6":1,"7":1,"8":1}'),
('full_caster', 16, '{"1":4,"2":3,"3":3,"4":3,"5":2,"6":1,"7":1,"8":1}'),
('full_caster', 17, '{"1":4,"2":3,"3":3,"4":3,"5":2,"6":1,"7":1,"8":1,"9":1}'),
('full_caster', 18, '{"1":4,"2":3,"3":3,"4":3,"5":3,"6":1,"7":1,"8":1,"9":1}'),
('full_caster', 19, '{"1":4,"2":3,"3":3,"4":3,"5":3,"6":2,"7":1,"8":1,"9":1}'),
('full_caster', 20, '{"1":4,"2":3,"3":3,"4":3,"5":3,"6":2,"7":2,"8":1,"9":1}'),
('half_caster_class_level', 1, '{}'),
('half_caster_class_level', 2, '{"1":2}'),
('half_caster_class_level', 3, '{"1":3}'),
('half_caster_class_level', 4, '{"1":3}'),
('half_caster_class_level', 5, '{"1":4,"2":2}'),
('half_caster_class_level', 6, '{"1":4,"2":2}'),
('half_caster_class_level', 7, '{"1":4,"2":3}'),
('half_caster_class_level', 8, '{"1":4,"2":3}'),
('half_caster_class_level', 9, '{"1":4,"2":3,"3":2}'),
('half_caster_class_level', 10, '{"1":4,"2":3,"3":2}'),
('half_caster_class_level', 11, '{"1":4,"2":3,"3":3}'),
('half_caster_class_level', 12, '{"1":4,"2":3,"3":3}'),
('half_caster_class_level', 13, '{"1":4,"2":3,"3":3,"4":1}'),
('half_caster_class_level', 14, '{"1":4,"2":3,"3":3,"4":1}'),
('half_caster_class_level', 15, '{"1":4,"2":3,"3":3,"4":2}'),
('half_caster_class_level', 16, '{"1":4,"2":3,"3":3,"4":2}'),
('half_caster_class_level', 17, '{"1":4,"2":3,"3":3,"4":3,"5":1}'),
('half_caster_class_level', 18, '{"1":4,"2":3,"3":3,"4":3,"5":1}'),
('half_caster_class_level', 19, '{"1":4,"2":3,"3":3,"4":3,"5":2}'),
('half_caster_class_level', 20, '{"1":4,"2":3,"3":3,"4":3,"5":2}'),
('pact_magic', 1, '{"slot_level":1,"slots":1}'),
('pact_magic', 2, '{"slot_level":1,"slots":2}'),
('pact_magic', 3, '{"slot_level":2,"slots":2}'),
('pact_magic', 4, '{"slot_level":2,"slots":2}'),
('pact_magic', 5, '{"slot_level":3,"slots":2}'),
('pact_magic', 6, '{"slot_level":3,"slots":2}'),
('pact_magic', 7, '{"slot_level":4,"slots":2}'),
('pact_magic', 8, '{"slot_level":4,"slots":2}'),
('pact_magic', 9, '{"slot_level":5,"slots":2}'),
('pact_magic', 10, '{"slot_level":5,"slots":2}'),
('pact_magic', 11, '{"slot_level":5,"slots":3}'),
('pact_magic', 12, '{"slot_level":5,"slots":3}'),
('pact_magic', 13, '{"slot_level":5,"slots":3}'),
('pact_magic', 14, '{"slot_level":5,"slots":3}'),
('pact_magic', 15, '{"slot_level":5,"slots":3}'),
('pact_magic', 16, '{"slot_level":5,"slots":3}'),
('pact_magic', 17, '{"slot_level":5,"slots":4}'),
('pact_magic', 18, '{"slot_level":5,"slots":4}'),
('pact_magic', 19, '{"slot_level":5,"slots":4}'),
('pact_magic', 20, '{"slot_level":5,"slots":4}')
ON DUPLICATE KEY UPDATE `slots_json` = VALUES(`slots_json`);

COMMIT;
