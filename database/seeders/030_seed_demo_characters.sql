-- Seeder 030 - personaggi demo da JSON app
-- Generato da database/seeders/generate_seeders.py
-- Importare dopo database/migrations/001_rebuild_dnd_app_v2.sql
USE `dnd_app`;
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 1;

START TRANSACTION;
SET @phb_source_id = (SELECT `id` FROM `rule_sources` WHERE `code` = 'phb_2024_it' LIMIT 1);
SET @homebrew_source_id = (SELECT `id` FROM `rule_sources` WHERE `code` = 'homebrew' LIMIT 1);

INSERT INTO `users` (`email`, `username`, `display_name`, `password_hash`, `status`) VALUES
('demo@dnd.local', 'demo', 'Demo Locale', 'not-a-real-password', 'active')
ON DUPLICATE KEY UPDATE `display_name` = VALUES(`display_name`), `status` = VALUES(`status`);
SET @demo_user_id = (SELECT `id` FROM `users` WHERE `email` = 'demo@dnd.local' LIMIT 1);

-- Personaggio demo: Escanor il Piccoletto
INSERT INTO `rule_species` (`source_id`, `code`, `name`, `traits_json`, `description`) VALUES
(@homebrew_source_id, 'import_goliath', 'Goliath', '{"imported_from":"escanor.json"}', 'Placeholder importato dai JSON demo.')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `traits_json` = VALUES(`traits_json`), `description` = VALUES(`description`);
INSERT INTO `rule_backgrounds` (`source_id`, `code`, `name`, `description`) VALUES
(@homebrew_source_id, 'import_mercante_adattato_a_taverniere_birraio_itinerante', 'Mercante adattato a taverniere/birraio itinerante', 'Placeholder importato dai JSON demo.')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `description` = VALUES(`description`);
INSERT INTO `characters` (`owner_user_id`, `name`, `concept`, `species_id`, `background_id`, `alignment`, `total_level_snapshot`, `status`, `notes`)
SELECT @demo_user_id, 'Escanor il Piccoletto', 'Frontliner solare da portata, burst e presenza scenica', (SELECT `id` FROM `rule_species` WHERE `code` = 'import_goliath' LIMIT 1), (SELECT `id` FROM `rule_backgrounds` WHERE `code` = 'import_mercante_adattato_a_taverniere_birraio_itinerante' LIMIT 1), 'Neutrale Buono', 1, 'active', 'Fonte locale: Escanor_il_Piccoletto_scheda_Lv1-3.txt.'
WHERE NOT EXISTS (SELECT 1 FROM `characters` WHERE `owner_user_id` = @demo_user_id AND `name` = 'Escanor il Piccoletto');
SET @escanor_il_piccoletto_id = (SELECT `id` FROM `characters` WHERE `owner_user_id` = @demo_user_id AND `name` = 'Escanor il Piccoletto' LIMIT 1);

INSERT INTO `character_classes` (`character_id`, `class_id`, `subclass_id`, `level`, `is_primary`) VALUES
(@escanor_il_piccoletto_id, (SELECT `id` FROM `rule_classes` WHERE `code` = 'paladino' LIMIT 1), (SELECT `id` FROM `rule_subclasses` WHERE `code` = 'paladino_giuramento_di_gloria' LIMIT 1), 1, 1)
ON DUPLICATE KEY UPDATE `subclass_id` = VALUES(`subclass_id`), `level` = VALUES(`level`), `is_primary` = VALUES(`is_primary`);
INSERT INTO `character_ability_bases` (`character_id`, `ability_id`, `base_value`, `method`, `notes`) VALUES
(@escanor_il_piccoletto_id, (SELECT `id` FROM `rule_abilities` WHERE `code` = 'str' LIMIT 1), 17, 'imported', 'Import da escanor.json'),
(@escanor_il_piccoletto_id, (SELECT `id` FROM `rule_abilities` WHERE `code` = 'dex' LIMIT 1), 8, 'imported', 'Import da escanor.json'),
(@escanor_il_piccoletto_id, (SELECT `id` FROM `rule_abilities` WHERE `code` = 'con' LIMIT 1), 14, 'imported', 'Import da escanor.json'),
(@escanor_il_piccoletto_id, (SELECT `id` FROM `rule_abilities` WHERE `code` = 'int' LIMIT 1), 8, 'imported', 'Import da escanor.json'),
(@escanor_il_piccoletto_id, (SELECT `id` FROM `rule_abilities` WHERE `code` = 'wis' LIMIT 1), 10, 'imported', 'Import da escanor.json'),
(@escanor_il_piccoletto_id, (SELECT `id` FROM `rule_abilities` WHERE `code` = 'cha' LIMIT 1), 16, 'imported', 'Import da escanor.json')
ON DUPLICATE KEY UPDATE `base_value` = VALUES(`base_value`), `method` = VALUES(`method`), `notes` = VALUES(`notes`);
INSERT INTO `character_proficiencies` (`character_id`, `proficiency_type`, `proficiency_ref`, `rank`, `origin_type`, `notes`)
SELECT @escanor_il_piccoletto_id, 'skill', 'athletics', 'proficient', 'manual', 'Import da JSON demo.'
WHERE NOT EXISTS (SELECT 1 FROM `character_proficiencies` WHERE `character_id` = @escanor_il_piccoletto_id AND `proficiency_type` = 'skill' AND `proficiency_ref` = 'athletics');
INSERT INTO `character_proficiencies` (`character_id`, `proficiency_type`, `proficiency_ref`, `rank`, `origin_type`, `notes`)
SELECT @escanor_il_piccoletto_id, 'skill', 'animal', 'proficient', 'manual', 'Import da JSON demo.'
WHERE NOT EXISTS (SELECT 1 FROM `character_proficiencies` WHERE `character_id` = @escanor_il_piccoletto_id AND `proficiency_type` = 'skill' AND `proficiency_ref` = 'animal');
INSERT INTO `character_proficiencies` (`character_id`, `proficiency_type`, `proficiency_ref`, `rank`, `origin_type`, `notes`)
SELECT @escanor_il_piccoletto_id, 'skill', 'intimidation', 'proficient', 'manual', 'Import da JSON demo.'
WHERE NOT EXISTS (SELECT 1 FROM `character_proficiencies` WHERE `character_id` = @escanor_il_piccoletto_id AND `proficiency_type` = 'skill' AND `proficiency_ref` = 'intimidation');
INSERT INTO `character_proficiencies` (`character_id`, `proficiency_type`, `proficiency_ref`, `rank`, `origin_type`, `notes`)
SELECT @escanor_il_piccoletto_id, 'skill', 'persuasion', 'proficient', 'manual', 'Import da JSON demo.'
WHERE NOT EXISTS (SELECT 1 FROM `character_proficiencies` WHERE `character_id` = @escanor_il_piccoletto_id AND `proficiency_type` = 'skill' AND `proficiency_ref` = 'persuasion');
INSERT INTO `character_proficiencies` (`character_id`, `proficiency_type`, `proficiency_ref`, `rank`, `origin_type`, `notes`)
SELECT @escanor_il_piccoletto_id, 'saving_throw', 'wis', 'proficient', 'manual', 'Import da JSON demo.'
WHERE NOT EXISTS (SELECT 1 FROM `character_proficiencies` WHERE `character_id` = @escanor_il_piccoletto_id AND `proficiency_type` = 'saving_throw' AND `proficiency_ref` = 'wis');
INSERT INTO `character_proficiencies` (`character_id`, `proficiency_type`, `proficiency_ref`, `rank`, `origin_type`, `notes`)
SELECT @escanor_il_piccoletto_id, 'saving_throw', 'cha', 'proficient', 'manual', 'Import da JSON demo.'
WHERE NOT EXISTS (SELECT 1 FROM `character_proficiencies` WHERE `character_id` = @escanor_il_piccoletto_id AND `proficiency_type` = 'saving_throw' AND `proficiency_ref` = 'cha');
INSERT INTO `character_modifiers` (`character_id`, `target_code`, `target_ref`, `operation`, `value_number`, `origin_type`, `origin_ref`, `duration_type`, `notes`)
SELECT @escanor_il_piccoletto_id, 'max_hp', NULL, 'set', 12, 'manual', 'import_escanor_max_hp_base', 'permanent', 'Valore importato dallo stato corrente del JSON demo.'
WHERE NOT EXISTS (SELECT 1 FROM `character_modifiers` WHERE `character_id` = @escanor_il_piccoletto_id AND `target_code` = 'max_hp' AND `target_ref` IS NULL AND `origin_ref` = 'import_escanor_max_hp_base');
INSERT INTO `character_modifiers` (`character_id`, `target_code`, `target_ref`, `operation`, `value_number`, `origin_type`, `origin_ref`, `duration_type`, `notes`)
SELECT @escanor_il_piccoletto_id, 'armor_class', NULL, 'set', 16, 'manual', 'import_escanor_armor_class_base', 'permanent', 'Valore importato dallo stato corrente del JSON demo.'
WHERE NOT EXISTS (SELECT 1 FROM `character_modifiers` WHERE `character_id` = @escanor_il_piccoletto_id AND `target_code` = 'armor_class' AND `target_ref` IS NULL AND `origin_ref` = 'import_escanor_armor_class_base');
INSERT INTO `character_modifiers` (`character_id`, `target_code`, `target_ref`, `operation`, `value_number`, `origin_type`, `origin_ref`, `duration_type`, `notes`)
SELECT @escanor_il_piccoletto_id, 'speed', 'walk', 'set', 10.5, 'manual', 'import_escanor_speed_walk', 'permanent', 'Valore importato dallo stato corrente del JSON demo.'
WHERE NOT EXISTS (SELECT 1 FROM `character_modifiers` WHERE `character_id` = @escanor_il_piccoletto_id AND `target_code` = 'speed' AND `target_ref` = 'walk' AND `origin_ref` = 'import_escanor_speed_walk');
INSERT INTO `character_modifiers` (`character_id`, `target_code`, `target_ref`, `operation`, `value_number`, `origin_type`, `origin_ref`, `duration_type`, `notes`)
SELECT @escanor_il_piccoletto_id, 'initiative', NULL, 'add', -1, 'manual', 'import_escanor_initiative_base', 'permanent', 'Valore importato dallo stato corrente del JSON demo.'
WHERE NOT EXISTS (SELECT 1 FROM `character_modifiers` WHERE `character_id` = @escanor_il_piccoletto_id AND `target_code` = 'initiative' AND `target_ref` IS NULL AND `origin_ref` = 'import_escanor_initiative_base');
INSERT INTO `character_resources` (`character_id`, `code`, `name`, `max_value_snapshot`, `current_value`, `recovery`, `origin_type`, `notes`)
SELECT @escanor_il_piccoletto_id, 'lay_on_hands', 'Imposizione delle Mani', 5, 5, 'long_rest', 'class', 'Import da JSON demo.'
WHERE NOT EXISTS (SELECT 1 FROM `character_resources` WHERE `character_id` = @escanor_il_piccoletto_id AND `code` = 'lay_on_hands');
INSERT INTO `character_resources` (`character_id`, `code`, `name`, `max_value_snapshot`, `current_value`, `recovery`, `origin_type`, `notes`)
SELECT @escanor_il_piccoletto_id, 'burning_fire', 'Fuoco Bruciante', 2, 2, 'long_rest', 'species', 'Import da JSON demo.'
WHERE NOT EXISTS (SELECT 1 FROM `character_resources` WHERE `character_id` = @escanor_il_piccoletto_id AND `code` = 'burning_fire');
INSERT INTO `character_spellcasting_profiles` (`character_id`, `class_id`, `source_type`, `casting_ability_id`, `preparation_mode`, `spell_list_ref`, `prepared_count_formula`, `focus_rules_json`)
SELECT @escanor_il_piccoletto_id, (SELECT `id` FROM `rule_classes` WHERE `code` = 'paladino' LIMIT 1), 'class', (SELECT `id` FROM `rule_abilities` WHERE `code` = 'cha' LIMIT 1), 'prepared', 'paladino', '2', '{"imported_from":"escanor.json"}'
WHERE NOT EXISTS (SELECT 1 FROM `character_spellcasting_profiles` WHERE `character_id` = @escanor_il_piccoletto_id AND `source_type` = 'class');
INSERT INTO `character_spells` (`character_id`, `spell_id`, `origin_type`, `is_known`, `is_prepared`, `prepared_context`)
SELECT @escanor_il_piccoletto_id, `id`, 'manual', 1, 1, 'daily'
FROM `rule_spells` WHERE `code` = 'punizione-incandescente'
AND NOT EXISTS (SELECT 1 FROM `character_spells` WHERE `character_id` = @escanor_il_piccoletto_id AND `spell_id` = `rule_spells`.`id`);
INSERT INTO `character_spells` (`character_id`, `spell_id`, `origin_type`, `is_known`, `is_prepared`, `prepared_context`)
SELECT @escanor_il_piccoletto_id, `id`, 'manual', 1, 1, 'daily'
FROM `rule_spells` WHERE `code` = 'duello-obbligato'
AND NOT EXISTS (SELECT 1 FROM `character_spells` WHERE `character_id` = @escanor_il_piccoletto_id AND `spell_id` = `rule_spells`.`id`);
INSERT INTO `character_spell_slots` (`character_id`, `slot_type`, `slot_level`, `max_slots_snapshot`, `used_slots`, `recovery`, `origin_type`)
SELECT @escanor_il_piccoletto_id, 'spellcasting', 1, 2, 0, 'long_rest', 'manual'
WHERE NOT EXISTS (SELECT 1 FROM `character_spell_slots` WHERE `character_id` = @escanor_il_piccoletto_id AND `slot_type` = 'spellcasting' AND `slot_level` = 1);
INSERT INTO `character_inventory` (`character_id`, `equipment_id`, `custom_name`, `quantity`, `origin_type`, `notes`)
SELECT @escanor_il_piccoletto_id, (SELECT `id` FROM `rule_equipment` WHERE `code` = 'alabarda' LIMIT 1), 'Alabarda', 1, 'manual', 'Arma principale. 1d10 taglienti, pesante, portata, due mani. Padronanza: Doppio Fendente.'
WHERE NOT EXISTS (SELECT 1 FROM `character_inventory` WHERE `character_id` = @escanor_il_piccoletto_id AND `custom_name` = 'Alabarda');
INSERT INTO `character_inventory` (`character_id`, `equipment_id`, `custom_name`, `quantity`, `origin_type`, `notes`)
SELECT @escanor_il_piccoletto_id, (SELECT `id` FROM `rule_equipment` WHERE `code` = 'giavellotto' LIMIT 1), 'Giavellotti', 5, 'manual', 'Opzione a distanza basata su Forza. Quantità iniziale pratica da confermare se il DM traccia i singoli giavellotti.'
WHERE NOT EXISTS (SELECT 1 FROM `character_inventory` WHERE `character_id` = @escanor_il_piccoletto_id AND `custom_name` = 'Giavellotti');
INSERT INTO `character_inventory` (`character_id`, `equipment_id`, `custom_name`, `quantity`, `origin_type`, `notes`)
SELECT @escanor_il_piccoletto_id, (SELECT `id` FROM `rule_equipment` WHERE `code` = 'cotta-di-maglia' LIMIT 1), 'Cotta di maglia', 1, 'manual', 'CA 16, richiede Forza 13, svantaggio a Furtività.'
WHERE NOT EXISTS (SELECT 1 FROM `character_inventory` WHERE `character_id` = @escanor_il_piccoletto_id AND `custom_name` = 'Cotta di maglia');
INSERT INTO `character_inventory` (`character_id`, `equipment_id`, `custom_name`, `quantity`, `origin_type`, `notes`)
SELECT @escanor_il_piccoletto_id, (SELECT `id` FROM `rule_equipment` WHERE `code` = 'strumenti-da-navigatore' LIMIT 1), 'Strumenti da navigatore', 1, 'manual', 'Competenza base del background Mercante.'
WHERE NOT EXISTS (SELECT 1 FROM `character_inventory` WHERE `character_id` = @escanor_il_piccoletto_id AND `custom_name` = 'Strumenti da navigatore');
INSERT INTO `character_inventory` (`character_id`, `equipment_id`, `custom_name`, `quantity`, `origin_type`, `notes`)
SELECT @escanor_il_piccoletto_id, (SELECT `id` FROM `rule_equipment` WHERE `code` = 'scorte-da-birraio' LIMIT 1), 'Scorte da birraio', 1, 'manual', 'Adattamento narrativo da taverniere/birraio itinerante. Da confermare col DM come sostituzione o aggiunta.'
WHERE NOT EXISTS (SELECT 1 FROM `character_inventory` WHERE `character_id` = @escanor_il_piccoletto_id AND `custom_name` = 'Scorte da birraio');
INSERT INTO `character_inventory` (`character_id`, `equipment_id`, `custom_name`, `quantity`, `origin_type`, `notes`)
SELECT @escanor_il_piccoletto_id, (SELECT `id` FROM `rule_equipment` WHERE `code` = 'simbolo-sacro' LIMIT 1), 'Simbolo sacro', 1, 'manual', NULL
WHERE NOT EXISTS (SELECT 1 FROM `character_inventory` WHERE `character_id` = @escanor_il_piccoletto_id AND `custom_name` = 'Simbolo sacro');
INSERT INTO `character_inventory` (`character_id`, `equipment_id`, `custom_name`, `quantity`, `origin_type`, `notes`)
SELECT @escanor_il_piccoletto_id, (SELECT `id` FROM `rule_equipment` WHERE `code` = 'zaino' LIMIT 1), 'Zaino', 1, 'manual', NULL
WHERE NOT EXISTS (SELECT 1 FROM `character_inventory` WHERE `character_id` = @escanor_il_piccoletto_id AND `custom_name` = 'Zaino');
INSERT INTO `character_inventory` (`character_id`, `equipment_id`, `custom_name`, `quantity`, `origin_type`, `notes`)
SELECT @escanor_il_piccoletto_id, (SELECT `id` FROM `rule_equipment` WHERE `code` = 'giaciglio' LIMIT 1), 'Giaciglio', 1, 'manual', NULL
WHERE NOT EXISTS (SELECT 1 FROM `character_inventory` WHERE `character_id` = @escanor_il_piccoletto_id AND `custom_name` = 'Giaciglio');
INSERT INTO `character_inventory` (`character_id`, `equipment_id`, `custom_name`, `quantity`, `origin_type`, `notes`)
SELECT @escanor_il_piccoletto_id, (SELECT `id` FROM `rule_equipment` WHERE `code` = 'otre' LIMIT 1), 'Otre', 1, 'manual', NULL
WHERE NOT EXISTS (SELECT 1 FROM `character_inventory` WHERE `character_id` = @escanor_il_piccoletto_id AND `custom_name` = 'Otre');
INSERT INTO `character_inventory` (`character_id`, `equipment_id`, `custom_name`, `quantity`, `origin_type`, `notes`)
SELECT @escanor_il_piccoletto_id, NULL, 'Acciarino', 1, 'manual', NULL
WHERE NOT EXISTS (SELECT 1 FROM `character_inventory` WHERE `character_id` = @escanor_il_piccoletto_id AND `custom_name` = 'Acciarino');
INSERT INTO `character_inventory` (`character_id`, `equipment_id`, `custom_name`, `quantity`, `origin_type`, `notes`)
SELECT @escanor_il_piccoletto_id, (SELECT `id` FROM `rule_equipment` WHERE `code` = 'corda' LIMIT 1), 'Corda', 1, 'manual', NULL
WHERE NOT EXISTS (SELECT 1 FROM `character_inventory` WHERE `character_id` = @escanor_il_piccoletto_id AND `custom_name` = 'Corda');
INSERT INTO `character_inventory` (`character_id`, `equipment_id`, `custom_name`, `quantity`, `origin_type`, `notes`)
SELECT @escanor_il_piccoletto_id, (SELECT `id` FROM `rule_equipment` WHERE `code` = 'abiti-da-viaggiatore' LIMIT 1), 'Abiti da viaggiatore', 1, 'manual', NULL
WHERE NOT EXISTS (SELECT 1 FROM `character_inventory` WHERE `character_id` = @escanor_il_piccoletto_id AND `custom_name` = 'Abiti da viaggiatore');
INSERT INTO `character_sheet_snapshots` (`character_id`, `snapshot_type`, `sheet_json`)
SELECT @escanor_il_piccoletto_id, 'active', '{"id":"pg_003","name":"Escanor il Piccoletto","level":1,"race":"Goliath","background":"Mercante adattato a taverniere/birraio itinerante","alignment":"Neutrale Buono","concept":"Frontliner solare da portata, burst e presenza scenica","classes":[{"name":"Paladino","level":1,"subclass":"Giuramento di Gloria previsto al livello 3"}],"combat":{"hp":{"current":12,"max":12,"temp":0},"ac":16,"speed":10.5,"initiativeBonus":-1,"hitDice":{"current":1,"max":1,"type":"d10"}},"abilities":{"str":17,"dex":8,"con":14,"int":8,"wis":10,"cha":16},"savingThrows":{"str":false,"dex":false,"con":false,"int":false,"wis":true,"cha":true},"skills":[{"id":"acrobatics","label":"Acrobazia","ability":"dex","proficient":false},{"id":"athletics","label":"Atletica","ability":"str","proficient":true},{"id":"sleight","label":"Rapidita di Mano","ability":"dex","proficient":false},{"id":"stealth","label":"Furtivita","ability":"dex","proficient":false,"disadvantage":true},{"id":"arcana","label":"Arcano","ability":"int","proficient":false},{"id":"history","label":"Storia","ability":"int","proficient":false},{"id":"investigation","label":"Indagare","ability":"int","proficient":false},{"id":"nature","label":"Natura","ability":"int","proficient":false},{"id":"religion","label":"Religione","ability":"int","proficient":false},{"id":"animal","label":"Addestrare Animali","ability":"wis","proficient":true},{"id":"insight","label":"Intuizione","ability":"wis","proficient":false},{"id":"medicine","label":"Medicina","ability":"wis","proficient":false},{"id":"perception","label":"Percezione","ability":"wis","proficient":false},{"id":"survival","label":"Sopravvivenza","ability":"wis","proficient":false},{"id":"deception","label":"Inganno","ability":"cha","proficient":false},{"id":"intimidation","label":"Intimidire","ability":"cha","proficient":true},{"id":"performance","label":"Intrattenere","ability":"cha","proficient":false},{"id":"persuasion","label":"Persuasione","ability":"cha","proficient":true}],"resources":[{"id":"lay_on_hands","label":"Imposizione delle Mani","current":5,"max":5,"resetOn":"long_rest","category":"class"},{"id":"burning_fire","label":"Fuoco Bruciante","current":2,"max":2,"resetOn":"long_rest","category":"species"}],"spellcasting":{"ability":"cha","spellSaveDc":13,"spellAttackBonus":5,"preparedCount":2,"slots":[{"id":"paladin_slot_1","level":1,"label":"Slot livello 1","current":2,"max":2,"resetOn":"long_rest"}],"spells":[{"id":"punizione-incandescente","name":"Punizione Incandescente","level":1,"school":"Invocazione","concentration":true,"prepared":true},{"id":"duello-obbligato","name":"Duello Obbligato","level":1,"school":"Ammaliamento","concentration":true,"prepared":true}]},"features":[{"id":"goliath_powerful_build","label":"Costituzione robusta","level":1,"source":"Goliath","category":"species","kind":"passive","summary":"Fisico resistente e capacita di trasporto superiore."},{"id":"burning_fire","label":"Fuoco Bruciante","level":1,"source":"Gigante del Fuoco","category":"species","kind":"resource","resourceId":"burning_fire","summary":"Aggiunge 1d10 fuoco quando colpisce e infligge danni."},{"id":"lay_on_hands","label":"Imposizione delle Mani","level":1,"source":"Paladino","category":"class","kind":"resource","resourceId":"lay_on_hands","summary":"Riserva di 5 PF per riposo lungo, usata come azione bonus."},{"id":"paladin_spellcasting","label":"Incantesimi","level":1,"source":"Paladino","category":"class","kind":"spellcasting","summary":"Incantesimi da paladino basati su Carisma."},{"id":"weapon_mastery","label":"Padronanza d''armi","level":1,"source":"Paladino","category":"class","kind":"combat","summary":"Padronanza consigliata su Alabarda e Giavellotto."}],"actions":[{"id":"halberd","name":"Alabarda","type":"attack","toHit":5,"damage":"1d10+3","notes":"Pesante, portata, due mani. Padronanza: Doppio Fendente."},{"id":"javelin","name":"Giavellotto","type":"attack","toHit":5,"damage":"1d6+3","notes":"Opzione a distanza basata su Forza."}],"notes":"Fonte locale: Escanor_il_Piccoletto_scheda_Lv1-3.txt.","equipment":{"currency":{"cp":0,"sp":0,"ep":0,"gp":0,"pp":0},"startingBudget":{"gp":150,"notes":"Opzione B del Paladino: 150 mo. Residuo dopo acquisti da confermare al tavolo."},"weapons":[{"id":"halberd","name":"Alabarda","quantity":1,"description":"Arma principale. 1d10 taglienti, pesante, portata, due mani.","notes":"Padronanza: Doppio Fendente."},{"id":"javelins","name":"Giavellotti","quantity":5,"description":"Opzione a distanza basata su Forza.","notes":"Quantità iniziale pratica da confermare se il DM traccia i singoli giavellotti.","recoverable":true}],"armor":[{"id":"chain_mail","name":"Cotta di maglia","quantity":1,"description":"CA 16, richiede Forza 13, svantaggio a Furtività."}],"tools":[{"id":"navigators_tools","name":"Strumenti da navigatore","quantity":1,"description":"Competenza base del background Mercante."},{"id":"brewers_supplies","name":"Scorte da birraio","quantity":1,"description":"Adattamento narrativo da taverniere/birraio itinerante.","notes":"Da confermare col DM come sostituzione o aggiunta."}],"adventuringGear":[{"id":"holy_symbol","name":"Simbolo sacro","quantity":1},{"id":"backpack","name":"Zaino","quantity":1},{"id":"bedroll","name":"Giaciglio","quantity":1},{"id":"waterskin","name":"Otre","quantity":1},{"id":"tinderbox","name":"Acciarino","quantity":1},{"id":"rope","name":"Corda","quantity":1},{"id":"traveler_clothes","name":"Abiti da viaggiatore","quantity":1}],"magicItems":[],"consumables":[{"id":"rations","name":"Razioni","quantity":5,"consumable":true},{"id":"torches","name":"Torce","quantity":10,"consumable":true}],"storyItems":[],"wishlist":[{"id":"plate_armor","name":"Armatura a piastre","description":"Obiettivo futuro di campagna: CA 18, richiede Forza 15, costosa."}],"notes":"Fonte: Escanor_il_Piccoletto_scheda_Lv1-3.txt."},"details":{"personalityTraits":["Fuori dal combattimento parla con voce quasi stridula e sembra piegato dal peso della corazza.","Quando viene tirata l''iniziativa, Escanor sorge: postura, voce e presenza cambiano."],"ideals":["Tornare tra i suoi come eroe amato e rispettato.","Dimostrare che il Sole Interiore vale più del giudizio della stirpe."],"bonds":["La sua identità da mercante, taverniere e birraio itinerante.","Il desiderio di riscattarsi agli occhi dei Goliath."],"flaws":["Iniziativa bassa.","Furtività pessima in armatura.","Tende a vivere ogni scontro come prova di gloria."],"catchphrase":"Non attendo mezzogiorno. Mezzogiorno attende me.","backstoryShort":"Escanor è un Goliath considerato piccolo e inadatto dalla sua gente. Viaggia come mercante e birraio itinerante, cercando la luce che in patria nessuno vedeva in lui.","campaignNotes":[]}}'
WHERE NOT EXISTS (SELECT 1 FROM `character_sheet_snapshots` WHERE `character_id` = @escanor_il_piccoletto_id AND `snapshot_type` = 'active');

-- Personaggio demo: Imbrathil
INSERT INTO `rule_species` (`source_id`, `code`, `name`, `traits_json`, `description`) VALUES
(@homebrew_source_id, 'import_elfo_dei_boschi', 'Elfo dei boschi', '{"imported_from":"imbrathil.json"}', 'Placeholder importato dai JSON demo.')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `traits_json` = VALUES(`traits_json`), `description` = VALUES(`description`);
INSERT INTO `rule_backgrounds` (`source_id`, `code`, `name`, `description`) VALUES
(@homebrew_source_id, 'import_viandante', 'Viandante', 'Placeholder importato dai JSON demo.')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `description` = VALUES(`description`);
INSERT INTO `characters` (`owner_user_id`, `name`, `concept`, `species_id`, `background_id`, `alignment`, `total_level_snapshot`, `status`, `notes`)
SELECT @demo_user_id, 'Imbrathil', 'DPS a distanza con supporto leggero e compagna bestiale Misha', (SELECT `id` FROM `rule_species` WHERE `code` = 'import_elfo_dei_boschi' LIMIT 1), (SELECT `id` FROM `rule_backgrounds` WHERE `code` = 'import_viandante' LIMIT 1), 'Neutrale', 5, 'active', 'Fonti locali: Imbrathil_Level5_con_Misha.pdf e ranger_guida.txt.'
WHERE NOT EXISTS (SELECT 1 FROM `characters` WHERE `owner_user_id` = @demo_user_id AND `name` = 'Imbrathil');
SET @imbrathil_id = (SELECT `id` FROM `characters` WHERE `owner_user_id` = @demo_user_id AND `name` = 'Imbrathil' LIMIT 1);

INSERT INTO `character_classes` (`character_id`, `class_id`, `subclass_id`, `level`, `is_primary`) VALUES
(@imbrathil_id, (SELECT `id` FROM `rule_classes` WHERE `code` = 'ranger' LIMIT 1), (SELECT `id` FROM `rule_subclasses` WHERE `code` = 'ranger_signore_delle_bestie' LIMIT 1), 5, 1)
ON DUPLICATE KEY UPDATE `subclass_id` = VALUES(`subclass_id`), `level` = VALUES(`level`), `is_primary` = VALUES(`is_primary`);
INSERT INTO `character_ability_bases` (`character_id`, `ability_id`, `base_value`, `method`, `notes`) VALUES
(@imbrathil_id, (SELECT `id` FROM `rule_abilities` WHERE `code` = 'str' LIMIT 1), 10, 'imported', 'Import da imbrathil.json'),
(@imbrathil_id, (SELECT `id` FROM `rule_abilities` WHERE `code` = 'dex' LIMIT 1), 18, 'imported', 'Import da imbrathil.json'),
(@imbrathil_id, (SELECT `id` FROM `rule_abilities` WHERE `code` = 'con' LIMIT 1), 14, 'imported', 'Import da imbrathil.json'),
(@imbrathil_id, (SELECT `id` FROM `rule_abilities` WHERE `code` = 'int' LIMIT 1), 8, 'imported', 'Import da imbrathil.json'),
(@imbrathil_id, (SELECT `id` FROM `rule_abilities` WHERE `code` = 'wis' LIMIT 1), 14, 'imported', 'Import da imbrathil.json'),
(@imbrathil_id, (SELECT `id` FROM `rule_abilities` WHERE `code` = 'cha' LIMIT 1), 10, 'imported', 'Import da imbrathil.json')
ON DUPLICATE KEY UPDATE `base_value` = VALUES(`base_value`), `method` = VALUES(`method`), `notes` = VALUES(`notes`);
INSERT INTO `character_proficiencies` (`character_id`, `proficiency_type`, `proficiency_ref`, `rank`, `origin_type`, `notes`)
SELECT @imbrathil_id, 'skill', 'athletics', 'proficient', 'manual', 'Import da JSON demo.'
WHERE NOT EXISTS (SELECT 1 FROM `character_proficiencies` WHERE `character_id` = @imbrathil_id AND `proficiency_type` = 'skill' AND `proficiency_ref` = 'athletics');
INSERT INTO `character_proficiencies` (`character_id`, `proficiency_type`, `proficiency_ref`, `rank`, `origin_type`, `notes`)
SELECT @imbrathil_id, 'skill', 'stealth', 'proficient', 'manual', 'Import da JSON demo.'
WHERE NOT EXISTS (SELECT 1 FROM `character_proficiencies` WHERE `character_id` = @imbrathil_id AND `proficiency_type` = 'skill' AND `proficiency_ref` = 'stealth');
INSERT INTO `character_proficiencies` (`character_id`, `proficiency_type`, `proficiency_ref`, `rank`, `origin_type`, `notes`)
SELECT @imbrathil_id, 'skill', 'investigation', 'proficient', 'manual', 'Import da JSON demo.'
WHERE NOT EXISTS (SELECT 1 FROM `character_proficiencies` WHERE `character_id` = @imbrathil_id AND `proficiency_type` = 'skill' AND `proficiency_ref` = 'investigation');
INSERT INTO `character_proficiencies` (`character_id`, `proficiency_type`, `proficiency_ref`, `rank`, `origin_type`, `notes`)
SELECT @imbrathil_id, 'skill', 'perception', 'proficient', 'manual', 'Import da JSON demo.'
WHERE NOT EXISTS (SELECT 1 FROM `character_proficiencies` WHERE `character_id` = @imbrathil_id AND `proficiency_type` = 'skill' AND `proficiency_ref` = 'perception');
INSERT INTO `character_proficiencies` (`character_id`, `proficiency_type`, `proficiency_ref`, `rank`, `origin_type`, `notes`)
SELECT @imbrathil_id, 'skill', 'survival', 'proficient', 'manual', 'Import da JSON demo.'
WHERE NOT EXISTS (SELECT 1 FROM `character_proficiencies` WHERE `character_id` = @imbrathil_id AND `proficiency_type` = 'skill' AND `proficiency_ref` = 'survival');
INSERT INTO `character_proficiencies` (`character_id`, `proficiency_type`, `proficiency_ref`, `rank`, `origin_type`, `notes`)
SELECT @imbrathil_id, 'saving_throw', 'str', 'proficient', 'manual', 'Import da JSON demo.'
WHERE NOT EXISTS (SELECT 1 FROM `character_proficiencies` WHERE `character_id` = @imbrathil_id AND `proficiency_type` = 'saving_throw' AND `proficiency_ref` = 'str');
INSERT INTO `character_proficiencies` (`character_id`, `proficiency_type`, `proficiency_ref`, `rank`, `origin_type`, `notes`)
SELECT @imbrathil_id, 'saving_throw', 'dex', 'proficient', 'manual', 'Import da JSON demo.'
WHERE NOT EXISTS (SELECT 1 FROM `character_proficiencies` WHERE `character_id` = @imbrathil_id AND `proficiency_type` = 'saving_throw' AND `proficiency_ref` = 'dex');
INSERT INTO `character_modifiers` (`character_id`, `target_code`, `target_ref`, `operation`, `value_number`, `origin_type`, `origin_ref`, `duration_type`, `notes`)
SELECT @imbrathil_id, 'max_hp', NULL, 'set', 52, 'manual', 'import_imbrathil_max_hp_base', 'permanent', 'Valore importato dallo stato corrente del JSON demo.'
WHERE NOT EXISTS (SELECT 1 FROM `character_modifiers` WHERE `character_id` = @imbrathil_id AND `target_code` = 'max_hp' AND `target_ref` IS NULL AND `origin_ref` = 'import_imbrathil_max_hp_base');
INSERT INTO `character_modifiers` (`character_id`, `target_code`, `target_ref`, `operation`, `value_number`, `origin_type`, `origin_ref`, `duration_type`, `notes`)
SELECT @imbrathil_id, 'armor_class', NULL, 'set', 17, 'manual', 'import_imbrathil_armor_class_base', 'permanent', 'Valore importato dallo stato corrente del JSON demo.'
WHERE NOT EXISTS (SELECT 1 FROM `character_modifiers` WHERE `character_id` = @imbrathil_id AND `target_code` = 'armor_class' AND `target_ref` IS NULL AND `origin_ref` = 'import_imbrathil_armor_class_base');
INSERT INTO `character_modifiers` (`character_id`, `target_code`, `target_ref`, `operation`, `value_number`, `origin_type`, `origin_ref`, `duration_type`, `notes`)
SELECT @imbrathil_id, 'speed', 'walk', 'set', 10.5, 'manual', 'import_imbrathil_speed_walk', 'permanent', 'Valore importato dallo stato corrente del JSON demo.'
WHERE NOT EXISTS (SELECT 1 FROM `character_modifiers` WHERE `character_id` = @imbrathil_id AND `target_code` = 'speed' AND `target_ref` = 'walk' AND `origin_ref` = 'import_imbrathil_speed_walk');
INSERT INTO `character_modifiers` (`character_id`, `target_code`, `target_ref`, `operation`, `value_number`, `origin_type`, `origin_ref`, `duration_type`, `notes`)
SELECT @imbrathil_id, 'initiative', NULL, 'add', 4, 'manual', 'import_imbrathil_initiative_base', 'permanent', 'Valore importato dallo stato corrente del JSON demo.'
WHERE NOT EXISTS (SELECT 1 FROM `character_modifiers` WHERE `character_id` = @imbrathil_id AND `target_code` = 'initiative' AND `target_ref` IS NULL AND `origin_ref` = 'import_imbrathil_initiative_base');
INSERT INTO `character_resources` (`character_id`, `code`, `name`, `max_value_snapshot`, `current_value`, `recovery`, `origin_type`, `notes`)
SELECT @imbrathil_id, 'favored_enemy', 'Nemico Prescelto', 3, 3, 'long_rest', 'class', 'Import da JSON demo.'
WHERE NOT EXISTS (SELECT 1 FROM `character_resources` WHERE `character_id` = @imbrathil_id AND `code` = 'favored_enemy');
INSERT INTO `character_spellcasting_profiles` (`character_id`, `class_id`, `source_type`, `casting_ability_id`, `preparation_mode`, `spell_list_ref`, `prepared_count_formula`, `focus_rules_json`)
SELECT @imbrathil_id, (SELECT `id` FROM `rule_classes` WHERE `code` = 'ranger' LIMIT 1), 'class', (SELECT `id` FROM `rule_abilities` WHERE `code` = 'wis' LIMIT 1), 'prepared', 'ranger', '6', '{"imported_from":"imbrathil.json"}'
WHERE NOT EXISTS (SELECT 1 FROM `character_spellcasting_profiles` WHERE `character_id` = @imbrathil_id AND `source_type` = 'class');
INSERT INTO `character_spells` (`character_id`, `spell_id`, `origin_type`, `is_known`, `is_prepared`, `prepared_context`)
SELECT @imbrathil_id, `id`, 'manual', 1, 1, 'daily'
FROM `rule_spells` WHERE `code` = 'marchio-del-cacciatore'
AND NOT EXISTS (SELECT 1 FROM `character_spells` WHERE `character_id` = @imbrathil_id AND `spell_id` = `rule_spells`.`id`);
INSERT INTO `character_spells` (`character_id`, `spell_id`, `origin_type`, `is_known`, `is_prepared`, `prepared_context`)
SELECT @imbrathil_id, `id`, 'manual', 1, 1, 'daily'
FROM `rule_spells` WHERE `code` = 'bacche-benefiche'
AND NOT EXISTS (SELECT 1 FROM `character_spells` WHERE `character_id` = @imbrathil_id AND `spell_id` = `rule_spells`.`id`);
INSERT INTO `character_spells` (`character_id`, `spell_id`, `origin_type`, `is_known`, `is_prepared`, `prepared_context`)
SELECT @imbrathil_id, `id`, 'manual', 1, 1, 'daily'
FROM `rule_spells` WHERE `code` = 'cura-ferite'
AND NOT EXISTS (SELECT 1 FROM `character_spells` WHERE `character_id` = @imbrathil_id AND `spell_id` = `rule_spells`.`id`);
INSERT INTO `character_spells` (`character_id`, `spell_id`, `origin_type`, `is_known`, `is_prepared`, `prepared_context`)
SELECT @imbrathil_id, `id`, 'manual', 1, 1, 'daily'
FROM `rule_spells` WHERE `code` = 'passo-velato'
AND NOT EXISTS (SELECT 1 FROM `character_spells` WHERE `character_id` = @imbrathil_id AND `spell_id` = `rule_spells`.`id`);
INSERT INTO `character_spells` (`character_id`, `spell_id`, `origin_type`, `is_known`, `is_prepared`, `prepared_context`)
SELECT @imbrathil_id, `id`, 'manual', 1, 1, 'daily'
FROM `rule_spells` WHERE `code` = 'passare-senza-tracce'
AND NOT EXISTS (SELECT 1 FROM `character_spells` WHERE `character_id` = @imbrathil_id AND `spell_id` = `rule_spells`.`id`);
INSERT INTO `character_spells` (`character_id`, `spell_id`, `origin_type`, `is_known`, `is_prepared`, `prepared_context`)
SELECT @imbrathil_id, `id`, 'manual', 1, 1, 'daily'
FROM `rule_spells` WHERE `code` = 'colpo-di-zefiro'
AND NOT EXISTS (SELECT 1 FROM `character_spells` WHERE `character_id` = @imbrathil_id AND `spell_id` = `rule_spells`.`id`);
INSERT INTO `character_spell_slots` (`character_id`, `slot_type`, `slot_level`, `max_slots_snapshot`, `used_slots`, `recovery`, `origin_type`)
SELECT @imbrathil_id, 'spellcasting', 1, 4, 0, 'long_rest', 'manual'
WHERE NOT EXISTS (SELECT 1 FROM `character_spell_slots` WHERE `character_id` = @imbrathil_id AND `slot_type` = 'spellcasting' AND `slot_level` = 1);
INSERT INTO `character_spell_slots` (`character_id`, `slot_type`, `slot_level`, `max_slots_snapshot`, `used_slots`, `recovery`, `origin_type`)
SELECT @imbrathil_id, 'spellcasting', 2, 2, 0, 'long_rest', 'manual'
WHERE NOT EXISTS (SELECT 1 FROM `character_spell_slots` WHERE `character_id` = @imbrathil_id AND `slot_type` = 'spellcasting' AND `slot_level` = 2);
INSERT INTO `character_inventory` (`character_id`, `equipment_id`, `custom_name`, `quantity`, `origin_type`, `notes`)
SELECT @imbrathil_id, (SELECT `id` FROM `rule_equipment` WHERE `code` = 'arco-lungo' LIMIT 1), 'Arco lungo', 1, 'manual', 'Arma principale. 1d8 perforanti. Tiro per colpire +9 già calcolato con Destrezza, competenza e Stile Tiro.'
WHERE NOT EXISTS (SELECT 1 FROM `character_inventory` WHERE `character_id` = @imbrathil_id AND `custom_name` = 'Arco lungo');
INSERT INTO `character_inventory` (`character_id`, `equipment_id`, `custom_name`, `quantity`, `origin_type`, `notes`)
SELECT @imbrathil_id, NULL, 'Frecce', 20, 'manual', 'Munizioni per arco lungo.'
WHERE NOT EXISTS (SELECT 1 FROM `character_inventory` WHERE `character_id` = @imbrathil_id AND `custom_name` = 'Frecce');
INSERT INTO `character_inventory` (`character_id`, `equipment_id`, `custom_name`, `quantity`, `origin_type`, `notes`)
SELECT @imbrathil_id, (SELECT `id` FROM `rule_equipment` WHERE `code` = 'spada-corta' LIMIT 1), 'Spade corte', 2, 'manual', 'Opzione da mischia indicata dalla guida. La guida ammette anche 2 pugnali come alternativa.'
WHERE NOT EXISTS (SELECT 1 FROM `character_inventory` WHERE `character_id` = @imbrathil_id AND `custom_name` = 'Spade corte');
INSERT INTO `character_inventory` (`character_id`, `equipment_id`, `custom_name`, `quantity`, `origin_type`, `notes`)
SELECT @imbrathil_id, (SELECT `id` FROM `rule_equipment` WHERE `code` = 'armatura-di-cuoio-borchiato' LIMIT 1), 'Armatura di cuoio borchiato', 1, 'manual', 'Base CA 12; la scheda calcola CA 17 con Destrezza e bonus elfico indicato dalla fonte.'
WHERE NOT EXISTS (SELECT 1 FROM `character_inventory` WHERE `character_id` = @imbrathil_id AND `custom_name` = 'Armatura di cuoio borchiato');
INSERT INTO `character_inventory` (`character_id`, `equipment_id`, `custom_name`, `quantity`, `origin_type`, `notes`)
SELECT @imbrathil_id, NULL, 'Kit da viandante', 1, 'manual', 'Equipaggiamento base indicato nella guida ranger.'
WHERE NOT EXISTS (SELECT 1 FROM `character_inventory` WHERE `character_id` = @imbrathil_id AND `custom_name` = 'Kit da viandante');
INSERT INTO `character_sheet_snapshots` (`character_id`, `snapshot_type`, `sheet_json`)
SELECT @imbrathil_id, 'active', '{"id":"pg_002","name":"Imbrathil","level":5,"race":"Elfo dei boschi","background":"Viandante","alignment":"Neutrale","concept":"DPS a distanza con supporto leggero e compagna bestiale Misha","classes":[{"name":"Ranger","level":5,"subclass":"Signore delle Bestie"}],"combat":{"hp":{"current":52,"max":52,"temp":0},"ac":17,"speed":10.5,"initiativeBonus":4,"hitDice":{"current":5,"max":5,"type":"d10"}},"abilities":{"str":10,"dex":18,"con":14,"int":8,"wis":14,"cha":10},"savingThrows":{"str":true,"dex":true,"con":false,"int":false,"wis":false,"cha":false},"skills":[{"id":"acrobatics","label":"Acrobazia","ability":"dex","proficient":false},{"id":"athletics","label":"Atletica","ability":"str","proficient":true},{"id":"sleight","label":"Rapidita di Mano","ability":"dex","proficient":false},{"id":"stealth","label":"Furtivita","ability":"dex","proficient":true},{"id":"arcana","label":"Arcano","ability":"int","proficient":false},{"id":"history","label":"Storia","ability":"int","proficient":false},{"id":"investigation","label":"Indagare","ability":"int","proficient":true,"bonusOverride":1},{"id":"nature","label":"Natura","ability":"int","proficient":false},{"id":"religion","label":"Religione","ability":"int","proficient":false},{"id":"animal","label":"Addestrare Animali","ability":"wis","proficient":false},{"id":"insight","label":"Intuizione","ability":"wis","proficient":false},{"id":"medicine","label":"Medicina","ability":"wis","proficient":false},{"id":"perception","label":"Percezione","ability":"wis","proficient":true},{"id":"survival","label":"Sopravvivenza","ability":"wis","proficient":true},{"id":"deception","label":"Inganno","ability":"cha","proficient":false},{"id":"intimidation","label":"Intimidire","ability":"cha","proficient":false},{"id":"performance","label":"Intrattenere","ability":"cha","proficient":false},{"id":"persuasion","label":"Persuasione","ability":"cha","proficient":false}],"resources":[{"id":"favored_enemy","label":"Nemico Prescelto","current":3,"max":3,"resetOn":"long_rest","category":"class"}],"spellcasting":{"ability":"wis","spellSaveDc":13,"spellAttackBonus":5,"preparedCount":6,"slots":[{"id":"ranger_slot_1","level":1,"label":"Slot livello 1","current":4,"max":4,"resetOn":"long_rest"},{"id":"ranger_slot_2","level":2,"label":"Slot livello 2","current":2,"max":2,"resetOn":"long_rest"}],"spells":[{"id":"marchio-del-cacciatore","name":"Marchio del Cacciatore","level":1,"school":"Divinazione","concentration":true,"prepared":true,"alwaysPrepared":true},{"id":"bacche-benefiche","name":"Bacche Benefiche","level":1,"school":"Evocazione","concentration":false,"prepared":true},{"id":"cura-ferite","name":"Cura Ferite","level":1,"school":"Abiurazione","concentration":false,"prepared":true},{"id":"passo-velato","name":"Passo Velato","level":2,"school":"Evocazione","concentration":false,"prepared":true,"optional":true},{"id":"passare-senza-tracce","name":"Passare Senza Tracce","level":2,"school":"Abiurazione","concentration":true,"prepared":true},{"id":"colpo-di-zefiro","name":"Colpo di Zefiro","level":1,"school":"Trasmutazione","concentration":true,"prepared":true,"catalogMissing":true,"notes":"Presente nelle fonti locali, ma non trovato nel catalogo incantesimi 2024 caricato."}]},"features":[{"id":"ranger_spellcasting","label":"Incantesimi","level":1,"source":"Ranger","category":"class","kind":"spellcasting","summary":"Incantesimi da ranger con Saggezza."},{"id":"favored_enemy","label":"Nemico Prescelto","level":1,"source":"Ranger","category":"class","kind":"resource","resourceId":"favored_enemy","summary":"Marchio del Cacciatore come fulcro dei danni."},{"id":"weapon_mastery","label":"Padronanza d''armi","level":1,"source":"Ranger","category":"class","kind":"combat","summary":"Padronanza su armi scelte, con focus sull''arco lungo."},{"id":"deft_explorer","label":"Esploratore Esperto","level":2,"source":"Ranger","category":"class","kind":"utility","summary":"Viaggi, competenze e presenza da esploratore del gruppo."},{"id":"archery_style","label":"Stile di Combattimento: Tiro","level":2,"source":"Ranger","category":"class","kind":"combat","summary":"+2 ai tiri per colpire con l''arco lungo, gia contato nel bonus +9."},{"id":"primal_companion","label":"Compagno Primordiale","level":3,"source":"Signore delle Bestie","category":"subclass","kind":"companion","summary":"Misha, bestia della terra ruolata come orso, agisce nel turno di Imbrathil."},{"id":"extra_attack","label":"Attacco Extra","level":5,"source":"Ranger","category":"class","kind":"combat","summary":"Due attacchi con arco lungo usando l''azione Attacco."},{"id":"second_level_spells","label":"Incantesimi di 2 livello","level":5,"source":"Ranger","category":"class","kind":"spellcasting","summary":"Sblocca slot di 2 livello e magia tattica come Passare senza Tracce."}],"actions":[{"id":"longbow","name":"Arco Lungo","type":"attack","toHit":9,"damage":"1d8+4","notes":"Con Marchio del Cacciatore aggiunge 1d6. Attacco Extra: 2 attacchi."}],"companions":[{"id":"misha","name":"Misha","kind":"Bestia della Terra","flavor":"Orso","ac":15,"hp":{"current":30,"max":30},"speed":12,"attack":{"name":"Colpo della Bestia","toHit":5,"damage":"1d8+5"},"summary":"Tank leggero: protegge caster e ranger, blocca nemici e attacca tramite bonus action."}],"notes":"Fonti locali: Imbrathil_Level5_con_Misha.pdf e ranger_guida.txt.","equipment":{"currency":{"cp":0,"sp":0,"ep":0,"gp":0,"pp":0},"weapons":[{"id":"longbow","name":"Arco lungo","quantity":1,"description":"Arma principale. 1d8 perforanti.","notes":"Tiro per colpire +9 già calcolato con Destrezza, competenza e Stile Tiro."},{"id":"arrows","name":"Frecce","quantity":20,"description":"Munizioni per arco lungo.","recoverable":true},{"id":"shortswords","name":"Spade corte","quantity":2,"description":"Opzione da mischia indicata dalla guida.","notes":"La guida ammette anche 2 pugnali come alternativa."}],"armor":[{"id":"studded_leather","name":"Armatura di cuoio borchiato","quantity":1,"description":"Base CA 12; la scheda calcola CA 17 con Destrezza e bonus elfico indicato dalla fonte."}],"tools":[],"adventuringGear":[{"id":"wanderer_kit","name":"Kit da viandante","quantity":1,"description":"Equipaggiamento base indicato nella guida ranger."}],"magicItems":[],"consumables":[],"storyItems":[{"id":"misha_bond","name":"Legame con Misha","quantity":1,"description":"Compagna bestiale ruolata come orso; gestita anche nel blocco companions."}],"notes":"Fonti: Imbrathil_Level5_con_Misha.pdf e ranger_guida.txt."},"details":{"personalityTraits":["Ranger da retrovia: mobile, prudente, sempre in riposizionamento.","Combatte insieme a Misha per creare distanza e proteggere il gruppo."],"ideals":["Sopravvivenza del party prima dell''eroismo individuale.","Preparazione, posizione e controllo del campo."],"bonds":["Misha, compagna bestiale ruolata come orso.","Legame da viandante con il territorio e le piste selvagge."],"flaws":["Non deve restare in mischia.","Dipende dal buon uso della bonus action tra Marchio del Cacciatore e comando a Misha."],"backstoryShort":"Imbrathil è un ranger elfo dei boschi di livello 5, specializzato nel combattimento a distanza e affiancato da Misha, bestia della terra ruolata come orso.","campaignNotes":[]}}'
WHERE NOT EXISTS (SELECT 1 FROM `character_sheet_snapshots` WHERE `character_id` = @imbrathil_id AND `snapshot_type` = 'active');

-- Personaggio demo: Shisui
INSERT INTO `rule_species` (`source_id`, `code`, `name`, `traits_json`, `description`) VALUES
(@homebrew_source_id, 'import_tiefling_infernale', 'Tiefling Infernale', '{"imported_from":"shisui.json"}', 'Placeholder importato dai JSON demo.')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `traits_json` = VALUES(`traits_json`), `description` = VALUES(`description`);
INSERT INTO `rule_backgrounds` (`source_id`, `code`, `name`, `description`) VALUES
(@homebrew_source_id, 'import_viandante', 'Viandante', 'Placeholder importato dai JSON demo.')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `description` = VALUES(`description`);
INSERT INTO `characters` (`owner_user_id`, `name`, `concept`, `species_id`, `background_id`, `alignment`, `total_level_snapshot`, `status`, `notes`)
SELECT @demo_user_id, 'Shisui', 'Ninja dell''Ombra, del Fuoco e della Mente', (SELECT `id` FROM `rule_species` WHERE `code` = 'import_tiefling_infernale' LIMIT 1), (SELECT `id` FROM `rule_backgrounds` WHERE `code` = 'import_viandante' LIMIT 1), 'Neutrale Buono', 3, 'active', 'Stato attuale: Shisui e giocato in campagna al livello 3. La multiclass Monaco 5 / Stregone 3 e mantenuta come piano futuro per progettare la UX.'
WHERE NOT EXISTS (SELECT 1 FROM `characters` WHERE `owner_user_id` = @demo_user_id AND `name` = 'Shisui');
SET @shisui_id = (SELECT `id` FROM `characters` WHERE `owner_user_id` = @demo_user_id AND `name` = 'Shisui' LIMIT 1);

INSERT INTO `character_classes` (`character_id`, `class_id`, `subclass_id`, `level`, `is_primary`) VALUES
(@shisui_id, (SELECT `id` FROM `rule_classes` WHERE `code` = 'monaco' LIMIT 1), (SELECT `id` FROM `rule_subclasses` WHERE `code` = 'monaco_guerriero_degli_elementi' LIMIT 1), 3, 1)
ON DUPLICATE KEY UPDATE `subclass_id` = VALUES(`subclass_id`), `level` = VALUES(`level`), `is_primary` = VALUES(`is_primary`);
INSERT INTO `character_ability_bases` (`character_id`, `ability_id`, `base_value`, `method`, `notes`) VALUES
(@shisui_id, (SELECT `id` FROM `rule_abilities` WHERE `code` = 'str' LIMIT 1), 8, 'imported', 'Import da shisui.json'),
(@shisui_id, (SELECT `id` FROM `rule_abilities` WHERE `code` = 'dex' LIMIT 1), 16, 'imported', 'Import da shisui.json'),
(@shisui_id, (SELECT `id` FROM `rule_abilities` WHERE `code` = 'con' LIMIT 1), 14, 'imported', 'Import da shisui.json'),
(@shisui_id, (SELECT `id` FROM `rule_abilities` WHERE `code` = 'int' LIMIT 1), 8, 'imported', 'Import da shisui.json'),
(@shisui_id, (SELECT `id` FROM `rule_abilities` WHERE `code` = 'wis' LIMIT 1), 14, 'imported', 'Import da shisui.json'),
(@shisui_id, (SELECT `id` FROM `rule_abilities` WHERE `code` = 'cha' LIMIT 1), 13, 'imported', 'Import da shisui.json')
ON DUPLICATE KEY UPDATE `base_value` = VALUES(`base_value`), `method` = VALUES(`method`), `notes` = VALUES(`notes`);
INSERT INTO `character_proficiencies` (`character_id`, `proficiency_type`, `proficiency_ref`, `rank`, `origin_type`, `notes`)
SELECT @shisui_id, 'skill', 'stealth', 'proficient', 'manual', 'Import da JSON demo.'
WHERE NOT EXISTS (SELECT 1 FROM `character_proficiencies` WHERE `character_id` = @shisui_id AND `proficiency_type` = 'skill' AND `proficiency_ref` = 'stealth');
INSERT INTO `character_proficiencies` (`character_id`, `proficiency_type`, `proficiency_ref`, `rank`, `origin_type`, `notes`)
SELECT @shisui_id, 'skill', 'insight', 'proficient', 'manual', 'Import da JSON demo.'
WHERE NOT EXISTS (SELECT 1 FROM `character_proficiencies` WHERE `character_id` = @shisui_id AND `proficiency_type` = 'skill' AND `proficiency_ref` = 'insight');
INSERT INTO `character_proficiencies` (`character_id`, `proficiency_type`, `proficiency_ref`, `rank`, `origin_type`, `notes`)
SELECT @shisui_id, 'skill', 'perception', 'proficient', 'manual', 'Import da JSON demo.'
WHERE NOT EXISTS (SELECT 1 FROM `character_proficiencies` WHERE `character_id` = @shisui_id AND `proficiency_type` = 'skill' AND `proficiency_ref` = 'perception');
INSERT INTO `character_proficiencies` (`character_id`, `proficiency_type`, `proficiency_ref`, `rank`, `origin_type`, `notes`)
SELECT @shisui_id, 'saving_throw', 'str', 'proficient', 'manual', 'Import da JSON demo.'
WHERE NOT EXISTS (SELECT 1 FROM `character_proficiencies` WHERE `character_id` = @shisui_id AND `proficiency_type` = 'saving_throw' AND `proficiency_ref` = 'str');
INSERT INTO `character_proficiencies` (`character_id`, `proficiency_type`, `proficiency_ref`, `rank`, `origin_type`, `notes`)
SELECT @shisui_id, 'saving_throw', 'dex', 'proficient', 'manual', 'Import da JSON demo.'
WHERE NOT EXISTS (SELECT 1 FROM `character_proficiencies` WHERE `character_id` = @shisui_id AND `proficiency_type` = 'saving_throw' AND `proficiency_ref` = 'dex');
INSERT INTO `character_modifiers` (`character_id`, `target_code`, `target_ref`, `operation`, `value_number`, `origin_type`, `origin_ref`, `duration_type`, `notes`)
SELECT @shisui_id, 'max_hp', NULL, 'set', 24, 'manual', 'import_shisui_max_hp_base', 'permanent', 'Valore importato dallo stato corrente del JSON demo.'
WHERE NOT EXISTS (SELECT 1 FROM `character_modifiers` WHERE `character_id` = @shisui_id AND `target_code` = 'max_hp' AND `target_ref` IS NULL AND `origin_ref` = 'import_shisui_max_hp_base');
INSERT INTO `character_modifiers` (`character_id`, `target_code`, `target_ref`, `operation`, `value_number`, `origin_type`, `origin_ref`, `duration_type`, `notes`)
SELECT @shisui_id, 'armor_class', NULL, 'set', 15, 'manual', 'import_shisui_armor_class_base', 'permanent', 'Valore importato dallo stato corrente del JSON demo.'
WHERE NOT EXISTS (SELECT 1 FROM `character_modifiers` WHERE `character_id` = @shisui_id AND `target_code` = 'armor_class' AND `target_ref` IS NULL AND `origin_ref` = 'import_shisui_armor_class_base');
INSERT INTO `character_modifiers` (`character_id`, `target_code`, `target_ref`, `operation`, `value_number`, `origin_type`, `origin_ref`, `duration_type`, `notes`)
SELECT @shisui_id, 'speed', 'walk', 'set', 12, 'manual', 'import_shisui_speed_walk', 'permanent', 'Valore importato dallo stato corrente del JSON demo.'
WHERE NOT EXISTS (SELECT 1 FROM `character_modifiers` WHERE `character_id` = @shisui_id AND `target_code` = 'speed' AND `target_ref` = 'walk' AND `origin_ref` = 'import_shisui_speed_walk');
INSERT INTO `character_modifiers` (`character_id`, `target_code`, `target_ref`, `operation`, `value_number`, `origin_type`, `origin_ref`, `duration_type`, `notes`)
SELECT @shisui_id, 'initiative', NULL, 'add', 3, 'manual', 'import_shisui_initiative_base', 'permanent', 'Valore importato dallo stato corrente del JSON demo.'
WHERE NOT EXISTS (SELECT 1 FROM `character_modifiers` WHERE `character_id` = @shisui_id AND `target_code` = 'initiative' AND `target_ref` IS NULL AND `origin_ref` = 'import_shisui_initiative_base');
INSERT INTO `character_resources` (`character_id`, `code`, `name`, `max_value_snapshot`, `current_value`, `recovery`, `origin_type`, `notes`)
SELECT @shisui_id, 'ki', 'Ki', 3, 3, 'short_rest', 'class', 'Import da JSON demo.'
WHERE NOT EXISTS (SELECT 1 FROM `character_resources` WHERE `character_id` = @shisui_id AND `code` = 'ki');
INSERT INTO `character_resources` (`character_id`, `code`, `name`, `max_value_snapshot`, `current_value`, `recovery`, `origin_type`, `notes`)
SELECT @shisui_id, 'hellish_rebuke', 'Intimorire Infernale', 1, 1, 'long_rest', 'species', 'Import da JSON demo.'
WHERE NOT EXISTS (SELECT 1 FROM `character_resources` WHERE `character_id` = @shisui_id AND `code` = 'hellish_rebuke');
INSERT INTO `character_resources` (`character_id`, `code`, `name`, `max_value_snapshot`, `current_value`, `recovery`, `origin_type`, `notes`)
SELECT @shisui_id, 'fortune', 'Talento: Fortunato', 2, 2, 'long_rest', 'feat', 'Import da JSON demo.'
WHERE NOT EXISTS (SELECT 1 FROM `character_resources` WHERE `character_id` = @shisui_id AND `code` = 'fortune');
INSERT INTO `character_spellcasting_profiles` (`character_id`, `class_id`, `source_type`, `casting_ability_id`, `preparation_mode`, `spell_list_ref`, `prepared_count_formula`, `focus_rules_json`)
SELECT @shisui_id, (SELECT `id` FROM `rule_classes` WHERE `code` = 'monaco' LIMIT 1), 'class', (SELECT `id` FROM `rule_abilities` WHERE `code` = 'cha' LIMIT 1), 'prepared', 'monaco', '2', '{"imported_from":"shisui.json"}'
WHERE NOT EXISTS (SELECT 1 FROM `character_spellcasting_profiles` WHERE `character_id` = @shisui_id AND `source_type` = 'class');
INSERT INTO `character_spells` (`character_id`, `spell_id`, `origin_type`, `is_known`, `is_prepared`, `prepared_context`)
SELECT @shisui_id, `id`, 'manual', 1, 1, 'daily'
FROM `rule_spells` WHERE `code` = 'dardo-di-fuoco'
AND NOT EXISTS (SELECT 1 FROM `character_spells` WHERE `character_id` = @shisui_id AND `spell_id` = `rule_spells`.`id`);
INSERT INTO `character_spells` (`character_id`, `spell_id`, `origin_type`, `is_known`, `is_prepared`, `prepared_context`)
SELECT @shisui_id, `id`, 'manual', 1, 1, 'daily'
FROM `rule_spells` WHERE `code` = 'intimorire-infernale'
AND NOT EXISTS (SELECT 1 FROM `character_spells` WHERE `character_id` = @shisui_id AND `spell_id` = `rule_spells`.`id`);
INSERT INTO `character_spells` (`character_id`, `spell_id`, `origin_type`, `is_known`, `is_prepared`, `prepared_context`)
SELECT @shisui_id, `id`, 'manual', 1, 1, 'daily'
FROM `rule_spells` WHERE `code` = 'elementalismo'
AND NOT EXISTS (SELECT 1 FROM `character_spells` WHERE `character_id` = @shisui_id AND `spell_id` = `rule_spells`.`id`);
INSERT INTO `character_inventory` (`character_id`, `equipment_id`, `custom_name`, `quantity`, `origin_type`, `notes`)
SELECT @shisui_id, (SELECT `id` FROM `rule_equipment` WHERE `code` = 'spada-corta' LIMIT 1), 'Spada corta', 1, 'manual', 'Arma da monaco usata con Destrezza. Fonte: Scheda Shisui 2024.'
WHERE NOT EXISTS (SELECT 1 FROM `character_inventory` WHERE `character_id` = @shisui_id AND `custom_name` = 'Spada corta');
INSERT INTO `character_inventory` (`character_id`, `equipment_id`, `custom_name`, `quantity`, `origin_type`, `notes`)
SELECT @shisui_id, NULL, 'Shuriken', 10, 'manual', 'Reskin dei dardi per lo stile ninja. Fonte: Scheda Shisui 2024.'
WHERE NOT EXISTS (SELECT 1 FROM `character_inventory` WHERE `character_id` = @shisui_id AND `custom_name` = 'Shuriken');
INSERT INTO `character_inventory` (`character_id`, `equipment_id`, `custom_name`, `quantity`, `origin_type`, `notes`)
SELECT @shisui_id, (SELECT `id` FROM `rule_equipment` WHERE `code` = 'pugnale' LIMIT 1), 'Pugnali', 2, 'manual', 'Equipaggiamento del background Viandante. Utili anche come kunai narrativi.'
WHERE NOT EXISTS (SELECT 1 FROM `character_inventory` WHERE `character_id` = @shisui_id AND `custom_name` = 'Pugnali');
INSERT INTO `character_inventory` (`character_id`, `equipment_id`, `custom_name`, `quantity`, `origin_type`, `notes`)
SELECT @shisui_id, NULL, 'Tunica da monaco nera', 1, 'manual', 'Abito leggero, non conta come armatura. Compatibile con Difesa senza armatura.'
WHERE NOT EXISTS (SELECT 1 FROM `character_inventory` WHERE `character_id` = @shisui_id AND `custom_name` = 'Tunica da monaco nera');
INSERT INTO `character_inventory` (`character_id`, `equipment_id`, `custom_name`, `quantity`, `origin_type`, `notes`)
SELECT @shisui_id, (SELECT `id` FROM `rule_equipment` WHERE `code` = 'arnesi-da-scasso' LIMIT 1), 'Arnesi da scasso', 1, 'manual', 'Competenza del background Viandante.'
WHERE NOT EXISTS (SELECT 1 FROM `character_inventory` WHERE `character_id` = @shisui_id AND `custom_name` = 'Arnesi da scasso');
INSERT INTO `character_inventory` (`character_id`, `equipment_id`, `custom_name`, `quantity`, `origin_type`, `notes`)
SELECT @shisui_id, NULL, 'Gioco a scelta', 1, 'manual', 'Equipaggiamento del background; scelta specifica da confermare.'
WHERE NOT EXISTS (SELECT 1 FROM `character_inventory` WHERE `character_id` = @shisui_id AND `custom_name` = 'Gioco a scelta');
INSERT INTO `character_inventory` (`character_id`, `equipment_id`, `custom_name`, `quantity`, `origin_type`, `notes`)
SELECT @shisui_id, (SELECT `id` FROM `rule_equipment` WHERE `code` = 'giaciglio' LIMIT 1), 'Giaciglio', 1, 'manual', NULL
WHERE NOT EXISTS (SELECT 1 FROM `character_inventory` WHERE `character_id` = @shisui_id AND `custom_name` = 'Giaciglio');
INSERT INTO `character_inventory` (`character_id`, `equipment_id`, `custom_name`, `quantity`, `origin_type`, `notes`)
SELECT @shisui_id, NULL, 'Borse', 2, 'manual', NULL
WHERE NOT EXISTS (SELECT 1 FROM `character_inventory` WHERE `character_id` = @shisui_id AND `custom_name` = 'Borse');
INSERT INTO `character_inventory` (`character_id`, `equipment_id`, `custom_name`, `quantity`, `origin_type`, `notes`)
SELECT @shisui_id, (SELECT `id` FROM `rule_equipment` WHERE `code` = 'abiti-da-viaggiatore' LIMIT 1), 'Abiti da viaggiatore', 1, 'manual', NULL
WHERE NOT EXISTS (SELECT 1 FROM `character_inventory` WHERE `character_id` = @shisui_id AND `custom_name` = 'Abiti da viaggiatore');
INSERT INTO `character_inventory` (`character_id`, `equipment_id`, `custom_name`, `quantity`, `origin_type`, `notes`)
SELECT @shisui_id, NULL, 'Sacca da viaggio / Kit del Viandante', 1, 'manual', NULL
WHERE NOT EXISTS (SELECT 1 FROM `character_inventory` WHERE `character_id` = @shisui_id AND `custom_name` = 'Sacca da viaggio / Kit del Viandante');
INSERT INTO `character_inventory` (`character_id`, `equipment_id`, `custom_name`, `quantity`, `origin_type`, `notes`)
SELECT @shisui_id, (SELECT `id` FROM `rule_equipment` WHERE `code` = 'corda' LIMIT 1), 'Corda', 1, 'manual', '15 metri.'
WHERE NOT EXISTS (SELECT 1 FROM `character_inventory` WHERE `character_id` = @shisui_id AND `custom_name` = 'Corda');
INSERT INTO `character_inventory` (`character_id`, `equipment_id`, `custom_name`, `quantity`, `origin_type`, `notes`)
SELECT @shisui_id, NULL, 'Rampino d''acciaio', 1, 'manual', NULL
WHERE NOT EXISTS (SELECT 1 FROM `character_inventory` WHERE `character_id` = @shisui_id AND `custom_name` = 'Rampino d''acciaio');
INSERT INTO `character_sheet_snapshots` (`character_id`, `snapshot_type`, `sheet_json`)
SELECT @shisui_id, 'active', '{"id":"pg_001","name":"Shisui","level":3,"race":"Tiefling Infernale","background":"Viandante","alignment":"Neutrale Buono","concept":"Ninja dell''Ombra, del Fuoco e della Mente","classes":[{"name":"Monaco","level":3,"subclass":"Guerriero degli Elementi"}],"combat":{"hp":{"current":24,"max":24,"temp":0},"ac":15,"speed":12,"initiativeBonus":3,"hitDice":{"current":3,"max":3,"type":"d8"}},"abilities":{"str":8,"dex":16,"con":14,"int":8,"wis":14,"cha":13},"savingThrows":{"str":true,"dex":true,"con":false,"int":false,"wis":false,"cha":false},"skills":[{"id":"acrobatics","label":"Acrobazia","ability":"dex","proficient":false},{"id":"athletics","label":"Atletica","ability":"str","proficient":false},{"id":"sleight","label":"Rapidita di Mano","ability":"dex","proficient":false},{"id":"stealth","label":"Furtivita","ability":"dex","proficient":true},{"id":"arcana","label":"Arcano","ability":"int","proficient":false},{"id":"history","label":"Storia","ability":"int","proficient":false},{"id":"investigation","label":"Investigazione","ability":"int","proficient":false},{"id":"nature","label":"Natura","ability":"int","proficient":false},{"id":"religion","label":"Religione","ability":"int","proficient":false},{"id":"animal","label":"Addestrare Animali","ability":"wis","proficient":false},{"id":"insight","label":"Intuizione","ability":"wis","proficient":true},{"id":"medicine","label":"Medicina","ability":"wis","proficient":false},{"id":"perception","label":"Percezione","ability":"wis","proficient":true},{"id":"survival","label":"Sopravvivenza","ability":"wis","proficient":false},{"id":"deception","label":"Inganno","ability":"cha","proficient":false},{"id":"intimidation","label":"Intimidire","ability":"cha","proficient":false},{"id":"performance","label":"Intrattenere","ability":"cha","proficient":false},{"id":"persuasion","label":"Persuasione","ability":"cha","proficient":false}],"resources":[{"id":"ki","label":"Ki","current":3,"max":3,"resetOn":"short_rest","category":"class"},{"id":"hellish_rebuke","label":"Intimorire Infernale","current":1,"max":1,"resetOn":"long_rest","category":"species"},{"id":"fortune","label":"Talento: Fortunato","current":2,"max":2,"resetOn":"long_rest","category":"feat"}],"feats":[{"id":"fortunato","name":"Fortunato","source":"Background","level":1}],"spellcasting":{"ability":"cha","spellSaveDc":11,"spellAttackBonus":3,"preparedCount":2,"slots":[],"spells":[{"id":"dardo-di-fuoco","name":"Dardo di Fuoco","level":0,"school":"Invocazione","source":"Tiefling","concentration":false,"prepared":true},{"id":"intimorire-infernale","name":"Intimorire Infernale","level":1,"school":"Invocazione","source":"Tiefling","concentration":false,"prepared":true},{"id":"elementalismo","name":"Elementalismo","level":0,"school":"Trasmutazione","source":"Guerriero degli Elementi","concentration":false,"prepared":true}]},"features":[{"id":"martial_arts","label":"Arti Marziali","level":1,"source":"Monaco","category":"class","kind":"combat","summary":"Usa Destrezza con colpi senz''armi e armi da monaco; colpo senz''armi come azione bonus."},{"id":"unarmored_defense","label":"Difesa senza armatura","level":1,"source":"Monaco","category":"class","kind":"passive","summary":"CA basata su Destrezza e Saggezza quando non usa armatura."},{"id":"monk_focus","label":"Concentrazione da monaco","level":2,"source":"Monaco","category":"class","kind":"resource","resourceId":"ki","summary":"Alimenta Raffica di colpi, Passo del vento, Difesa paziente e tecniche speciali."},{"id":"extraordinary_metabolism","label":"Metabolismo Straordinario","level":2,"source":"Monaco","category":"class","kind":"rest","resetOn":"long_rest","summary":"Recupero speciale legato all''iniziativa, una volta per riposo lungo."},{"id":"unarmored_movement","label":"Movimento senza armatura","level":2,"source":"Monaco","category":"class","kind":"passive","summary":"Velocita aumentata, coerente con lo stile ninja mobile."},{"id":"deflect_attacks","label":"Deviare Attacco","level":3,"source":"Monaco","category":"class","kind":"reaction","summary":"Riduce danni fisici subiti usando la reazione."},{"id":"elementalism","label":"Manipolare gli elementi","level":3,"source":"Guerriero degli Elementi","category":"subclass","kind":"spellcasting","summary":"Tecnica elementale minore, utile per il tema fuoco/ombra."},{"id":"elemental_attunement","label":"Sintonia Elementale","level":3,"source":"Guerriero degli Elementi","category":"subclass","kind":"resource","resourceId":"ki","summary":"Spende Ki per infondere energia elementale nei colpi."}],"powers":[{"id":"monk_martial_arts"},{"id":"monk_bonus_unarmed_strike"},{"id":"monk_unarmored_defense"},{"id":"monk_focus"},{"id":"monk_patient_defense"},{"id":"monk_step_of_the_wind"},{"id":"monk_flurry_of_blows"},{"id":"monk_uncanny_metabolism"},{"id":"monk_unarmored_movement"},{"id":"monk_deflect_attacks"},{"id":"monk_elements_elementalism"},{"id":"monk_elements_elemental_attunement"}],"progressionPlan":{"label":"Build futura prevista","targetLevel":8,"targetClasses":[{"name":"Monaco","level":5,"subclass":"Guerriero degli Elementi"},{"name":"Stregone","level":3,"subclass":"Aberrante Psionico"}],"milestones":[{"characterLevel":4,"class":"Monaco","feature":"Aumento caratteristica o talento"},{"characterLevel":5,"class":"Monaco","feature":"Attacco Extra, Colpo Stordente, Oscurita tiefling"},{"characterLevel":6,"class":"Stregone","feature":"Primo livello da Stregone e trucchetti psionici"},{"characterLevel":8,"class":"Stregone","feature":"Origine Aberrante Psionica e incantesimi di controllo mentale"}],"futureResources":[{"id":"sorcery_points","label":"Punti Stregoneria","max":3,"resetOn":"long_rest"},{"id":"innate_sorcery","label":"Stregoneria Innata","max":2,"resetOn":"long_rest"},{"id":"darkness","label":"Oscurita","max":1,"resetOn":"long_rest"}],"futureSpells":["Scheggia della Mente","Scudo","Globo Cromatico","Raggio di Infermita","Allucinazione di Forza","Sussurri Dissonanti"]},"notes":"Stato attuale: Shisui e giocato in campagna al livello 3. La multiclass Monaco 5 / Stregone 3 e mantenuta come piano futuro per progettare la UX.","equipment":{"currency":{"cp":0,"sp":0,"ep":0,"gp":16,"pp":0},"weapons":[{"id":"shortsword","name":"Spada corta","quantity":1,"description":"Arma da monaco usata con Destrezza.","notes":"Fonte: Scheda Shisui 2024."},{"id":"shuriken","name":"Shuriken","quantity":10,"description":"Reskin dei dardi per lo stile ninja.","notes":"Fonte: Scheda Shisui 2024.","recoverable":true},{"id":"dagger","name":"Pugnali","quantity":2,"description":"Equipaggiamento del background Viandante.","notes":"Utili anche come kunai narrativi.","recoverable":true}],"armor":[{"id":"monk_tunic","name":"Tunica da monaco nera","quantity":1,"description":"Abito leggero, non conta come armatura.","notes":"Compatibile con Difesa senza armatura."}],"tools":[{"id":"thieves_tools","name":"Arnesi da scasso","quantity":1,"description":"Competenza del background Viandante."},{"id":"game_set","name":"Gioco a scelta","quantity":1,"description":"Equipaggiamento del background; scelta specifica da confermare."}],"adventuringGear":[{"id":"bedroll","name":"Giaciglio","quantity":1},{"id":"pouches","name":"Borse","quantity":2},{"id":"traveler_clothes","name":"Abiti da viaggiatore","quantity":1},{"id":"travel_pack","name":"Sacca da viaggio / Kit del Viandante","quantity":1},{"id":"silk_rope","name":"Corda","quantity":1,"description":"15 metri."},{"id":"grappling_hook","name":"Rampino d''acciaio","quantity":1}],"magicItems":[],"consumables":[],"storyItems":[{"id":"shadow_mask","name":"Maschera dell''Ombra","quantity":1,"description":"Elemento identitario dello stile ninja di Shisui."},{"id":"clan_diary","name":"Diario criptato del clan","quantity":1,"description":"Contiene scoperte, segreti e tecniche del clan.","notes":"Legame principale del personaggio."}],"notes":"Fonti: Scheda Shisui 2024.pdf e Background e prefazione Shisui.pdf."},"details":{"personalityTraits":["Silenzioso e disciplinato.","Osservatore meticoloso.","Agisce con calma e intuito.","Presenza intensa e controllata.","Adora i bambini ed è legato al fratello scomparso."],"ideals":["Autocontrollo assoluto.","Protezione dei deboli.","Ricerca della verità.","Il fuoco come purificazione."],"bonds":["Ultimo sopravvissuto del suo clan di Tiefling.","Custodisce il diario criptato del clan.","Il fratello Sio è scomparso e Shisui non crede sia morto.","Considera il party il nucleo di un nuovo clan."],"flaws":["Si carica di troppe responsabilità.","Si fida poco.","Porta cicatrici emotive profonde.","Teme il lato oscuro dei suoi poteri."],"backstoryShort":"Shisui proviene da un antico clan di Tiefling legati al fuoco e all''ombra. Dopo lo sterminio del clan e la scomparsa del fratello Sio, vaga come viandante cercando risposte e tracce della verità.","campaignNotes":[]}}'
WHERE NOT EXISTS (SELECT 1 FROM `character_sheet_snapshots` WHERE `character_id` = @shisui_id AND `snapshot_type` = 'active');


COMMIT;
