-- D&D App DB v2 - rebuild schema
-- Target: MariaDB/MySQL, utf8mb4
-- Importabile da phpMyAdmin o CLI.
--
-- ATTENZIONE:
-- Questo file crea un database nuovo chiamato `dnd_app_v2`.
-- Non modifica il dump originale `dnd_app.sql`.
--
-- Principio v2:
-- - il catalogo regole resta separato dai personaggi;
-- - il personaggio puo nascere come bozza/livello 0;
-- - level up e creazione producono eventi e scelte;
-- - i valori finali della scheda sono spiegabili tramite modificatori centralizzati;
-- - una scheda puo avere snapshot/materializzazioni, ma la fonte dei cambi resta tracciata.

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
SET FOREIGN_KEY_CHECKS = 0;

DROP DATABASE IF EXISTS `dnd_app`;
CREATE DATABASE `dnd_app`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE `dnd_app`;

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------------
-- Account / ruoli
-- ---------------------------------------------------------------------------

CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(190) NOT NULL,
  `username` VARCHAR(80) DEFAULT NULL,
  `display_name` VARCHAR(160) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `status` ENUM('active','disabled','deleted') NOT NULL DEFAULT 'active',
  `last_login_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  UNIQUE KEY `uq_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `global_roles` (
  `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(40) NOT NULL,
  `name` VARCHAR(80) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_global_roles_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_global_roles` (
  `user_id` BIGINT UNSIGNED NOT NULL,
  `role_id` SMALLINT UNSIGNED NOT NULL,
  `assigned_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `role_id`),
  CONSTRAINT `fk_ugr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ugr_role` FOREIGN KEY (`role_id`) REFERENCES `global_roles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Catalogo regole: fonti e tassonomie base
-- ---------------------------------------------------------------------------

CREATE TABLE `rule_sources` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(80) NOT NULL,
  `name` VARCHAR(190) NOT NULL,
  `edition` VARCHAR(40) NOT NULL,
  `publisher` VARCHAR(160) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rule_sources_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `rule_abilities` (
  `id` TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(12) NOT NULL,
  `name` VARCHAR(80) NOT NULL,
  `sort_order` TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rule_abilities_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `rule_skills` (
  `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(80) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `ability_id` TINYINT UNSIGNED NOT NULL,
  `description` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rule_skills_code` (`code`),
  KEY `idx_rule_skills_ability` (`ability_id`),
  CONSTRAINT `fk_rule_skills_ability` FOREIGN KEY (`ability_id`) REFERENCES `rule_abilities` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `rule_damage_types` (
  `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(80) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `description` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rule_damage_types_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `rule_conditions` (
  `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(80) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `rules_json` JSON DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rule_conditions_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `rule_languages` (
  `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(80) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `category` ENUM('standard','exotic','special','homebrew') NOT NULL DEFAULT 'standard',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rule_languages_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Target modificabili dalla tabella centralizzata.
CREATE TABLE `modifier_targets` (
  `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(80) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `value_kind` ENUM('number','flag','dice','text') NOT NULL DEFAULT 'number',
  `description` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_modifier_targets_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Catalogo regole: entita del manuale
-- ---------------------------------------------------------------------------

CREATE TABLE `rule_species` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `source_id` BIGINT UNSIGNED NOT NULL,
  `code` VARCHAR(100) NOT NULL,
  `name` VARCHAR(140) NOT NULL,
  `size` VARCHAR(40) DEFAULT NULL,
  `base_speed` SMALLINT DEFAULT NULL,
  `traits_json` JSON DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rule_species_code` (`code`),
  KEY `idx_rule_species_source` (`source_id`),
  CONSTRAINT `fk_rule_species_source` FOREIGN KEY (`source_id`) REFERENCES `rule_sources` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `rule_feats` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `source_id` BIGINT UNSIGNED NOT NULL,
  `code` VARCHAR(100) NOT NULL,
  `name` VARCHAR(140) NOT NULL,
  `category` ENUM('origin','general','fighting_style','epic_boon','homebrew','other') NOT NULL DEFAULT 'other',
  `is_repeatable` TINYINT(1) NOT NULL DEFAULT 0,
  `prerequisites_json` JSON DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `rules_json` JSON DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rule_feats_code` (`code`),
  KEY `idx_rule_feats_source` (`source_id`),
  CONSTRAINT `fk_rule_feats_source` FOREIGN KEY (`source_id`) REFERENCES `rule_sources` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `rule_backgrounds` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `source_id` BIGINT UNSIGNED NOT NULL,
  `feat_id` BIGINT UNSIGNED DEFAULT NULL,
  `code` VARCHAR(100) NOT NULL,
  `name` VARCHAR(140) NOT NULL,
  `ability_options_json` JSON DEFAULT NULL,
  `proficiencies_json` JSON DEFAULT NULL,
  `equipment_json` JSON DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rule_backgrounds_code` (`code`),
  KEY `idx_rule_backgrounds_source` (`source_id`),
  KEY `idx_rule_backgrounds_feat` (`feat_id`),
  CONSTRAINT `fk_rule_backgrounds_source` FOREIGN KEY (`source_id`) REFERENCES `rule_sources` (`id`),
  CONSTRAINT `fk_rule_backgrounds_feat` FOREIGN KEY (`feat_id`) REFERENCES `rule_feats` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `rule_classes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `source_id` BIGINT UNSIGNED NOT NULL,
  `code` VARCHAR(100) NOT NULL,
  `name` VARCHAR(140) NOT NULL,
  `hit_die` TINYINT UNSIGNED NOT NULL,
  `primary_abilities_json` JSON DEFAULT NULL,
  `proficiencies_json` JSON DEFAULT NULL,
  `starting_equipment_json` JSON DEFAULT NULL,
  `spellcasting_json` JSON DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rule_classes_code` (`code`),
  KEY `idx_rule_classes_source` (`source_id`),
  CONSTRAINT `fk_rule_classes_source` FOREIGN KEY (`source_id`) REFERENCES `rule_sources` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `rule_subclasses` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `class_id` BIGINT UNSIGNED NOT NULL,
  `source_id` BIGINT UNSIGNED NOT NULL,
  `code` VARCHAR(120) NOT NULL,
  `name` VARCHAR(160) NOT NULL,
  `level_obtained` TINYINT UNSIGNED NOT NULL,
  `description` TEXT DEFAULT NULL,
  `rules_json` JSON DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rule_subclasses_code` (`code`),
  KEY `idx_rule_subclasses_class` (`class_id`),
  CONSTRAINT `fk_rule_subclasses_class` FOREIGN KEY (`class_id`) REFERENCES `rule_classes` (`id`),
  CONSTRAINT `fk_rule_subclasses_source` FOREIGN KEY (`source_id`) REFERENCES `rule_sources` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `rule_class_features` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `class_id` BIGINT UNSIGNED NOT NULL,
  `subclass_id` BIGINT UNSIGNED DEFAULT NULL,
  `code` VARCHAR(140) NOT NULL,
  `name` VARCHAR(180) NOT NULL,
  `level` TINYINT UNSIGNED NOT NULL,
  `feature_type` ENUM('automatic','choice','resource','spellcasting','asi_or_feat','subclass','other') NOT NULL DEFAULT 'other',
  `description` TEXT DEFAULT NULL,
  `options_json` JSON DEFAULT NULL,
  `rules_json` JSON DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rule_class_features_code` (`code`),
  KEY `idx_rule_class_features_class_level` (`class_id`, `level`),
  KEY `idx_rule_class_features_subclass` (`subclass_id`),
  CONSTRAINT `fk_rule_class_features_class` FOREIGN KEY (`class_id`) REFERENCES `rule_classes` (`id`),
  CONSTRAINT `fk_rule_class_features_subclass` FOREIGN KEY (`subclass_id`) REFERENCES `rule_subclasses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `rule_class_levels` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `class_id` BIGINT UNSIGNED NOT NULL,
  `level` TINYINT UNSIGNED NOT NULL,
  `proficiency_bonus` TINYINT UNSIGNED DEFAULT NULL,
  `features_json` JSON DEFAULT NULL,
  `resources_json` JSON DEFAULT NULL,
  `spellcasting_json` JSON DEFAULT NULL,
  `choices_json` JSON DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rule_class_levels_class_level` (`class_id`, `level`),
  CONSTRAINT `fk_rule_class_levels_class` FOREIGN KEY (`class_id`) REFERENCES `rule_classes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `rule_spells` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `source_id` BIGINT UNSIGNED NOT NULL,
  `code` VARCHAR(140) NOT NULL,
  `name` VARCHAR(180) NOT NULL,
  `level` TINYINT UNSIGNED NOT NULL,
  `school` VARCHAR(80) DEFAULT NULL,
  `casting_time` VARCHAR(120) DEFAULT NULL,
  `range_text` VARCHAR(120) DEFAULT NULL,
  `components_json` JSON DEFAULT NULL,
  `duration_text` VARCHAR(160) DEFAULT NULL,
  `is_concentration` TINYINT(1) NOT NULL DEFAULT 0,
  `is_ritual` TINYINT(1) NOT NULL DEFAULT 0,
  `description` LONGTEXT DEFAULT NULL,
  `at_higher_levels` LONGTEXT DEFAULT NULL,
  `mechanics_json` JSON DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rule_spells_code` (`code`),
  KEY `idx_rule_spells_level` (`level`),
  CONSTRAINT `fk_rule_spells_source` FOREIGN KEY (`source_id`) REFERENCES `rule_sources` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `rule_class_spell_lists` (
  `class_id` BIGINT UNSIGNED NOT NULL,
  `spell_id` BIGINT UNSIGNED NOT NULL,
  `is_optional` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`class_id`, `spell_id`),
  CONSTRAINT `fk_rule_class_spell_lists_class` FOREIGN KEY (`class_id`) REFERENCES `rule_classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rule_class_spell_lists_spell` FOREIGN KEY (`spell_id`) REFERENCES `rule_spells` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `rule_equipment` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `source_id` BIGINT UNSIGNED DEFAULT NULL,
  `code` VARCHAR(140) NOT NULL,
  `name` VARCHAR(180) NOT NULL,
  `category` ENUM('weapon','armor','shield','tool','gear','vehicle','service','magic_item','consumable','other') NOT NULL DEFAULT 'other',
  `subtype` VARCHAR(120) DEFAULT NULL,
  `cost_json` JSON DEFAULT NULL,
  `weight` DECIMAL(8,2) DEFAULT NULL,
  `properties_json` JSON DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rule_equipment_code` (`code`),
  KEY `idx_rule_equipment_category` (`category`),
  CONSTRAINT `fk_rule_equipment_source` FOREIGN KEY (`source_id`) REFERENCES `rule_sources` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `rule_resource_types` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(100) NOT NULL,
  `name` VARCHAR(140) NOT NULL,
  `category` ENUM('spell_slot','pact_slot','points','uses','dice','charges','state','other') NOT NULL DEFAULT 'other',
  `default_recovery` ENUM('never','turn_start','turn_end','short_rest','long_rest','short_or_long_rest','dawn','special') NOT NULL DEFAULT 'special',
  `description` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rule_resource_types_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Regole generali dal capitolo "Come si gioca" e dal Glossario.
CREATE TABLE `rule_actions` (
  `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(80) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `action_kind` ENUM('action','bonus_action','reaction','free','no_action','special') NOT NULL DEFAULT 'action',
  `description` TEXT DEFAULT NULL,
  `rules_json` JSON DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rule_actions_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `rule_sizes` (
  `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(40) NOT NULL,
  `name` VARCHAR(80) NOT NULL,
  `space_meters` DECIMAL(5,2) DEFAULT NULL,
  `carrying_multiplier` DECIMAL(6,2) DEFAULT NULL,
  `sort_order` TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rule_sizes_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `rule_movement_modes` (
  `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(60) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rule_movement_modes_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `rule_senses` (
  `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(80) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `has_range` TINYINT(1) NOT NULL DEFAULT 1,
  `description` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rule_senses_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `rule_area_shapes` (
  `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(80) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `origin_included_default` TINYINT(1) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rule_area_shapes_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `rule_cover_types` (
  `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(80) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `ac_bonus` TINYINT DEFAULT NULL,
  `dex_save_bonus` TINYINT DEFAULT NULL,
  `blocks_targeting` TINYINT(1) NOT NULL DEFAULT 0,
  `description` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rule_cover_types_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `rule_rest_types` (
  `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(80) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `duration_minutes` INT UNSIGNED DEFAULT NULL,
  `benefits_json` JSON DEFAULT NULL,
  `interruption_json` JSON DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rule_rest_types_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `rule_hazards` (
  `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(100) NOT NULL,
  `name` VARCHAR(140) NOT NULL,
  `hazard_type` ENUM('fall','suffocation','dehydration','malnutrition','burning','environment','object','other') NOT NULL DEFAULT 'other',
  `description` TEXT DEFAULT NULL,
  `rules_json` JSON DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rule_hazards_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Equipaggiamento piu dettagliato: proprieta armi, maestrie, strumenti e focus.
CREATE TABLE `rule_weapon_properties` (
  `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(80) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `rules_json` JSON DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rule_weapon_properties_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `rule_weapon_masteries` (
  `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(80) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `rules_json` JSON DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rule_weapon_masteries_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `rule_equipment_weapon_properties` (
  `equipment_id` BIGINT UNSIGNED NOT NULL,
  `weapon_property_id` SMALLINT UNSIGNED NOT NULL,
  `value_json` JSON DEFAULT NULL,
  PRIMARY KEY (`equipment_id`, `weapon_property_id`),
  CONSTRAINT `fk_rewp_equipment` FOREIGN KEY (`equipment_id`) REFERENCES `rule_equipment` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rewp_property` FOREIGN KEY (`weapon_property_id`) REFERENCES `rule_weapon_properties` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `rule_equipment_weapon_masteries` (
  `equipment_id` BIGINT UNSIGNED NOT NULL,
  `weapon_mastery_id` SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (`equipment_id`, `weapon_mastery_id`),
  CONSTRAINT `fk_rewm_equipment` FOREIGN KEY (`equipment_id`) REFERENCES `rule_equipment` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rewm_mastery` FOREIGN KEY (`weapon_mastery_id`) REFERENCES `rule_weapon_masteries` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `rule_tools` (
  `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `equipment_id` BIGINT UNSIGNED DEFAULT NULL,
  `code` VARCHAR(100) NOT NULL,
  `name` VARCHAR(140) NOT NULL,
  `tool_category` ENUM('artisan','gaming_set','musical_instrument','kit','vehicle','other') NOT NULL DEFAULT 'other',
  `ability_suggestions_json` JSON DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rule_tools_code` (`code`),
  KEY `idx_rule_tools_equipment` (`equipment_id`),
  CONSTRAINT `fk_rule_tools_equipment` FOREIGN KEY (`equipment_id`) REFERENCES `rule_equipment` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Progressioni di incantesimi e prerequisiti multiclasse.
CREATE TABLE `rule_spell_slot_progressions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `progression_code` VARCHAR(80) NOT NULL,
  `caster_level` TINYINT UNSIGNED NOT NULL,
  `slots_json` JSON NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rule_spell_slot_progressions` (`progression_code`, `caster_level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `rule_multiclass_prerequisites` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `class_id` BIGINT UNSIGNED NOT NULL,
  `requirements_json` JSON NOT NULL,
  `description` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rule_multiclass_prerequisites_class` (`class_id`),
  CONSTRAINT `fk_rule_multiclass_prerequisites_class` FOREIGN KEY (`class_id`) REFERENCES `rule_classes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Creature/stat block del manuale e creature evocate dagli incantesimi.
CREATE TABLE `rule_creatures` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `source_id` BIGINT UNSIGNED NOT NULL,
  `code` VARCHAR(140) NOT NULL,
  `name` VARCHAR(180) NOT NULL,
  `creature_type` VARCHAR(80) DEFAULT NULL,
  `size_id` SMALLINT UNSIGNED DEFAULT NULL,
  `alignment` VARCHAR(80) DEFAULT NULL,
  `armor_class_json` JSON DEFAULT NULL,
  `hit_points_json` JSON DEFAULT NULL,
  `speeds_json` JSON DEFAULT NULL,
  `abilities_json` JSON DEFAULT NULL,
  `saves_json` JSON DEFAULT NULL,
  `skills_json` JSON DEFAULT NULL,
  `senses_json` JSON DEFAULT NULL,
  `languages_json` JSON DEFAULT NULL,
  `challenge_rating` VARCHAR(40) DEFAULT NULL,
  `proficiency_bonus` TINYINT DEFAULT NULL,
  `traits_json` JSON DEFAULT NULL,
  `actions_json` JSON DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rule_creatures_code` (`code`),
  KEY `idx_rule_creatures_source` (`source_id`),
  KEY `idx_rule_creatures_size` (`size_id`),
  CONSTRAINT `fk_rule_creatures_source` FOREIGN KEY (`source_id`) REFERENCES `rule_sources` (`id`),
  CONSTRAINT `fk_rule_creatures_size` FOREIGN KEY (`size_id`) REFERENCES `rule_sizes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Template di effetti e modificatori del catalogo.
-- Queste righe descrivono cosa una regola PUO concedere.
-- Le righe applicate a un personaggio vivono in character_grants e character_modifiers.
CREATE TABLE `rule_effects` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(160) NOT NULL,
  `name` VARCHAR(190) NOT NULL,
  `origin_type` ENUM('species','background','class','subclass','class_feature','feat','spell','equipment','condition','resource','homebrew','other') NOT NULL,
  `origin_id` BIGINT UNSIGNED DEFAULT NULL,
  `category` ENUM('damage','healing','bonus','malus','advantage','disadvantage','condition','movement','defense','action','reaction','resource','grant','choice','other') NOT NULL DEFAULT 'other',
  `activation` ENUM('passive','action','bonus_action','reaction','no_action','on_hit','on_damage_taken','turn_start','turn_end','short_rest','long_rest','special') NOT NULL DEFAULT 'special',
  `duration_type` ENUM('instant','rounds','minutes','hours','days','until_rest','concentration','permanent','equipped','special') NOT NULL DEFAULT 'special',
  `description` TEXT DEFAULT NULL,
  `rules_json` JSON DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rule_effects_code` (`code`),
  KEY `idx_rule_effects_origin` (`origin_type`, `origin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `rule_modifier_templates` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `effect_id` BIGINT UNSIGNED NOT NULL,
  `target_code` VARCHAR(80) NOT NULL,
  `target_ref` VARCHAR(120) DEFAULT NULL,
  `operation` ENUM('add','set','multiply','grant','proficiency','expertise','advantage','disadvantage','resistance','immunity','vulnerability') NOT NULL DEFAULT 'add',
  `value_number` DECIMAL(10,2) DEFAULT NULL,
  `value_formula` VARCHAR(255) DEFAULT NULL,
  `stacking_group` VARCHAR(120) DEFAULT NULL,
  `stacking_policy` ENUM('stack','highest','lowest','replace','unique') NOT NULL DEFAULT 'stack',
  `condition_json` JSON DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_rule_modifier_templates_effect` (`effect_id`),
  KEY `idx_rule_modifier_templates_target` (`target_code`, `target_ref`),
  CONSTRAINT `fk_rule_modifier_templates_effect` FOREIGN KEY (`effect_id`) REFERENCES `rule_effects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Campagne
-- ---------------------------------------------------------------------------

CREATE TABLE `campaigns` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `owner_user_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(160) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `status` ENUM('draft','active','paused','completed','archived') NOT NULL DEFAULT 'draft',
  `visibility` ENUM('private','invite','public') NOT NULL DEFAULT 'private',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_campaigns_owner` (`owner_user_id`),
  CONSTRAINT `fk_campaigns_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `campaign_members` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `campaign_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `role` ENUM('master','player','spectator') NOT NULL DEFAULT 'player',
  `status` ENUM('invited','active','left','removed') NOT NULL DEFAULT 'active',
  `joined_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `left_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_campaign_members_campaign_user_role` (`campaign_id`, `user_id`, `role`),
  KEY `idx_campaign_members_user` (`user_id`),
  CONSTRAINT `fk_campaign_members_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_campaign_members_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Personaggi: identita, classi, scelte, progressione
-- ---------------------------------------------------------------------------

CREATE TABLE `characters` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `owner_user_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(160) NOT NULL,
  `concept` VARCHAR(255) DEFAULT NULL,
  `portrait_asset_id` BIGINT UNSIGNED DEFAULT NULL,
  `species_id` BIGINT UNSIGNED DEFAULT NULL,
  `background_id` BIGINT UNSIGNED DEFAULT NULL,
  `alignment` VARCHAR(80) DEFAULT NULL,
  `total_level_snapshot` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `status` ENUM('draft','active','archived','deleted') NOT NULL DEFAULT 'draft',
  `notes` TEXT DEFAULT NULL,
  `created_from_character_id` BIGINT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_characters_owner` (`owner_user_id`),
  KEY `idx_characters_species` (`species_id`),
  KEY `idx_characters_background` (`background_id`),
  KEY `idx_characters_created_from` (`created_from_character_id`),
  CONSTRAINT `fk_characters_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_characters_species` FOREIGN KEY (`species_id`) REFERENCES `rule_species` (`id`),
  CONSTRAINT `fk_characters_background` FOREIGN KEY (`background_id`) REFERENCES `rule_backgrounds` (`id`),
  CONSTRAINT `fk_characters_created_from` FOREIGN KEY (`created_from_character_id`) REFERENCES `characters` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `campaign_characters` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `campaign_id` BIGINT UNSIGNED NOT NULL,
  `character_id` BIGINT UNSIGNED NOT NULL,
  `player_user_id` BIGINT UNSIGNED NOT NULL,
  `status` ENUM('draft','active','dead','retired','archived') NOT NULL DEFAULT 'active',
  `entry_session_index` INT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_campaign_characters_campaign` (`campaign_id`),
  KEY `idx_campaign_characters_character` (`character_id`),
  KEY `idx_campaign_characters_player` (`player_user_id`),
  CONSTRAINT `fk_campaign_characters_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_campaign_characters_character` FOREIGN KEY (`character_id`) REFERENCES `characters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_campaign_characters_player` FOREIGN KEY (`player_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `character_classes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `character_id` BIGINT UNSIGNED NOT NULL,
  `class_id` BIGINT UNSIGNED NOT NULL,
  `subclass_id` BIGINT UNSIGNED DEFAULT NULL,
  `level` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `is_primary` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_character_classes_character_class` (`character_id`, `class_id`),
  KEY `idx_character_classes_class` (`class_id`),
  KEY `idx_character_classes_subclass` (`subclass_id`),
  CONSTRAINT `fk_character_classes_character` FOREIGN KEY (`character_id`) REFERENCES `characters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_character_classes_class` FOREIGN KEY (`class_id`) REFERENCES `rule_classes` (`id`),
  CONSTRAINT `fk_character_classes_subclass` FOREIGN KEY (`subclass_id`) REFERENCES `rule_subclasses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Valore base scelto/tirato/comprato. I bonus/malus stanno in character_modifiers.
CREATE TABLE `character_ability_bases` (
  `character_id` BIGINT UNSIGNED NOT NULL,
  `ability_id` TINYINT UNSIGNED NOT NULL,
  `base_value` TINYINT UNSIGNED NOT NULL,
  `method` ENUM('manual','standard_array','point_buy','rolled','imported','dm_override') NOT NULL DEFAULT 'manual',
  `source_event_id` BIGINT UNSIGNED DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  PRIMARY KEY (`character_id`, `ability_id`),
  CONSTRAINT `fk_character_ability_bases_character` FOREIGN KEY (`character_id`) REFERENCES `characters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_character_ability_bases_ability` FOREIGN KEY (`ability_id`) REFERENCES `rule_abilities` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Eventi permanenti/semi-permanenti della storia meccanica del PG:
-- creazione, level up, multiclass, respec, import, intervento DM.
CREATE TABLE `character_progression_events` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `character_id` BIGINT UNSIGNED NOT NULL,
  `event_type` ENUM('creation_step','level_up','multiclass','respec','dm_override','import','manual_adjustment') NOT NULL,
  `status` ENUM('draft','applied','cancelled') NOT NULL DEFAULT 'draft',
  `from_total_level` TINYINT UNSIGNED DEFAULT NULL,
  `to_total_level` TINYINT UNSIGNED DEFAULT NULL,
  `class_id` BIGINT UNSIGNED DEFAULT NULL,
  `from_class_level` TINYINT UNSIGNED DEFAULT NULL,
  `to_class_level` TINYINT UNSIGNED DEFAULT NULL,
  `summary` VARCHAR(255) DEFAULT NULL,
  `payload_json` JSON DEFAULT NULL,
  `created_by_user_id` BIGINT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `applied_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_cpe_character` (`character_id`, `status`, `created_at`),
  KEY `idx_cpe_class` (`class_id`),
  CONSTRAINT `fk_cpe_character` FOREIGN KEY (`character_id`) REFERENCES `characters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cpe_class` FOREIGN KEY (`class_id`) REFERENCES `rule_classes` (`id`),
  CONSTRAINT `fk_cpe_user` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `character_choices` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `character_id` BIGINT UNSIGNED NOT NULL,
  `progression_event_id` BIGINT UNSIGNED DEFAULT NULL,
  `choice_key` VARCHAR(160) NOT NULL,
  `choice_type` ENUM('ability_score','asi','feat','spell','skill','language','equipment','class_option','subclass','resource','hp_increase','other') NOT NULL,
  `source_type` ENUM('creation','species','background','class','subclass','class_feature','feat','spell','equipment','level_up','dm_override','other') NOT NULL DEFAULT 'other',
  `source_id` BIGINT UNSIGNED DEFAULT NULL,
  `selected_type` VARCHAR(80) DEFAULT NULL,
  `selected_id` BIGINT UNSIGNED DEFAULT NULL,
  `selected_ref` VARCHAR(160) DEFAULT NULL,
  `value_json` JSON DEFAULT NULL,
  `is_locked` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_character_choices_character` (`character_id`),
  KEY `idx_character_choices_event` (`progression_event_id`),
  KEY `idx_character_choices_key` (`choice_key`),
  CONSTRAINT `fk_character_choices_character` FOREIGN KEY (`character_id`) REFERENCES `characters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_character_choices_event` FOREIGN KEY (`progression_event_id`) REFERENCES `character_progression_events` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cose ottenute dal PG: talenti, privilegi, competenze, spell, lingue, ecc.
-- E una tabella generica, poi si possono creare viste o tabelle specializzate se serve.
CREATE TABLE `character_grants` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `character_id` BIGINT UNSIGNED NOT NULL,
  `progression_event_id` BIGINT UNSIGNED DEFAULT NULL,
  `grant_type` ENUM('class_feature','feat','spell','skill_proficiency','saving_throw_proficiency','equipment_proficiency','tool_proficiency','language','resistance','condition_immunity','resource','class_option','subclass','other') NOT NULL,
  `grant_id` BIGINT UNSIGNED DEFAULT NULL,
  `grant_ref` VARCHAR(160) DEFAULT NULL,
  `origin_type` ENUM('creation','species','background','class','subclass','class_feature','feat','spell','equipment','level_up','manual','dm_override','homebrew','other') NOT NULL DEFAULT 'other',
  `origin_id` BIGINT UNSIGNED DEFAULT NULL,
  `choice_id` BIGINT UNSIGNED DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `metadata_json` JSON DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_character_grants_character` (`character_id`, `grant_type`, `is_active`),
  KEY `idx_character_grants_event` (`progression_event_id`),
  KEY `idx_character_grants_choice` (`choice_id`),
  CONSTRAINT `fk_character_grants_character` FOREIGN KEY (`character_id`) REFERENCES `characters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_character_grants_event` FOREIGN KEY (`progression_event_id`) REFERENCES `character_progression_events` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_character_grants_choice` FOREIGN KEY (`choice_id`) REFERENCES `character_choices` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Competenza e maestria in forma unica: abilita, tiri salvezza, armi, armature, strumenti, lingue.
CREATE TABLE `character_proficiencies` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `character_id` BIGINT UNSIGNED NOT NULL,
  `proficiency_type` ENUM('skill','saving_throw','weapon','armor','shield','tool','language','equipment_category','other') NOT NULL,
  `proficiency_ref` VARCHAR(160) NOT NULL,
  `rank` ENUM('proficient','expertise','half_proficiency','double_proficiency','other') NOT NULL DEFAULT 'proficient',
  `origin_type` ENUM('species','background','class','subclass','class_feature','feat','equipment','training','manual','dm_override','other') NOT NULL DEFAULT 'other',
  `origin_id` BIGINT UNSIGNED DEFAULT NULL,
  `choice_id` BIGINT UNSIGNED DEFAULT NULL,
  `grant_id` BIGINT UNSIGNED DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `notes` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_character_proficiencies_active` (`character_id`, `proficiency_type`, `proficiency_ref`, `rank`, `origin_type`, `origin_id`),
  KEY `idx_character_proficiencies_character` (`character_id`, `proficiency_type`, `is_active`),
  KEY `idx_character_proficiencies_choice` (`choice_id`),
  KEY `idx_character_proficiencies_grant` (`grant_id`),
  CONSTRAINT `fk_character_proficiencies_character` FOREIGN KEY (`character_id`) REFERENCES `characters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_character_proficiencies_choice` FOREIGN KEY (`choice_id`) REFERENCES `character_choices` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_character_proficiencies_grant` FOREIGN KEY (`grant_id`) REFERENCES `character_grants` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Tabella centrale dei modificatori del personaggio
-- ---------------------------------------------------------------------------

CREATE TABLE `character_modifiers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `character_id` BIGINT UNSIGNED NOT NULL,
  `campaign_character_id` BIGINT UNSIGNED DEFAULT NULL,
  `progression_event_id` BIGINT UNSIGNED DEFAULT NULL,
  `choice_id` BIGINT UNSIGNED DEFAULT NULL,
  `grant_id` BIGINT UNSIGNED DEFAULT NULL,
  `target_code` VARCHAR(80) NOT NULL,
  `target_ref` VARCHAR(120) DEFAULT NULL,
  `operation` ENUM('add','set','multiply','grant','proficiency','expertise','advantage','disadvantage','resistance','immunity','vulnerability') NOT NULL DEFAULT 'add',
  `value_number` DECIMAL(10,2) DEFAULT NULL,
  `value_text` VARCHAR(255) DEFAULT NULL,
  `value_json` JSON DEFAULT NULL,
  `origin_type` ENUM('base','creation','species','background','class','subclass','class_feature','feat','spell','equipment','condition','resource','level_up','campaign','manual','dm_override','homebrew','other') NOT NULL,
  `origin_id` BIGINT UNSIGNED DEFAULT NULL,
  `origin_ref` VARCHAR(160) DEFAULT NULL,
  `duration_type` ENUM('permanent','equipped','prepared','active_effect','until_short_rest','until_long_rest','rounds','encounter','campaign','temporary','manual') NOT NULL DEFAULT 'permanent',
  `starts_at` DATETIME DEFAULT NULL,
  `ends_at` DATETIME DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `stacking_group` VARCHAR(120) DEFAULT NULL,
  `stacking_policy` ENUM('stack','highest','lowest','replace','unique') NOT NULL DEFAULT 'stack',
  `notes` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_character_modifiers_character_target` (`character_id`, `target_code`, `target_ref`, `is_active`),
  KEY `idx_character_modifiers_campaign_character` (`campaign_character_id`),
  KEY `idx_character_modifiers_origin` (`origin_type`, `origin_id`),
  KEY `idx_character_modifiers_event` (`progression_event_id`),
  KEY `idx_character_modifiers_choice` (`choice_id`),
  KEY `idx_character_modifiers_grant` (`grant_id`),
  CONSTRAINT `fk_character_modifiers_character` FOREIGN KEY (`character_id`) REFERENCES `characters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_character_modifiers_campaign_character` FOREIGN KEY (`campaign_character_id`) REFERENCES `campaign_characters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_character_modifiers_event` FOREIGN KEY (`progression_event_id`) REFERENCES `character_progression_events` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_character_modifiers_choice` FOREIGN KEY (`choice_id`) REFERENCES `character_choices` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_character_modifiers_grant` FOREIGN KEY (`grant_id`) REFERENCES `character_grants` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Stato attuale e risorse
-- ---------------------------------------------------------------------------

CREATE TABLE `character_current_state` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `campaign_character_id` BIGINT UNSIGNED NOT NULL,
  `current_hp` INT NOT NULL DEFAULT 0,
  `temp_hp` INT NOT NULL DEFAULT 0,
  `death_saves_json` JSON DEFAULT NULL,
  `used_hit_dice_json` JSON DEFAULT NULL,
  `used_spell_slots_json` JSON DEFAULT NULL,
  `currency_json` JSON DEFAULT NULL,
  `runtime_notes` TEXT DEFAULT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_character_current_state_campaign_character` (`campaign_character_id`),
  CONSTRAINT `fk_character_current_state_campaign_character` FOREIGN KEY (`campaign_character_id`) REFERENCES `campaign_characters` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `character_resources` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `character_id` BIGINT UNSIGNED NOT NULL,
  `campaign_character_id` BIGINT UNSIGNED DEFAULT NULL,
  `resource_type_id` BIGINT UNSIGNED DEFAULT NULL,
  `code` VARCHAR(140) NOT NULL,
  `name` VARCHAR(160) NOT NULL,
  `resource_level` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `max_value_snapshot` INT NOT NULL DEFAULT 0,
  `current_value` INT NOT NULL DEFAULT 0,
  `recovery` ENUM('never','turn_start','turn_end','short_rest','long_rest','short_or_long_rest','dawn','special') NOT NULL DEFAULT 'special',
  `origin_type` ENUM('class','subclass','feat','spell','species','background','equipment','manual','other') NOT NULL DEFAULT 'other',
  `origin_id` BIGINT UNSIGNED DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `notes` TEXT DEFAULT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_character_resources_character` (`character_id`, `code`, `is_active`),
  KEY `idx_character_resources_campaign_character` (`campaign_character_id`),
  KEY `idx_character_resources_type` (`resource_type_id`),
  CONSTRAINT `fk_character_resources_character` FOREIGN KEY (`character_id`) REFERENCES `characters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_character_resources_campaign_character` FOREIGN KEY (`campaign_character_id`) REFERENCES `campaign_characters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_character_resources_type` FOREIGN KEY (`resource_type_id`) REFERENCES `rule_resource_types` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `character_inventory` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `character_id` BIGINT UNSIGNED NOT NULL,
  `campaign_character_id` BIGINT UNSIGNED DEFAULT NULL,
  `equipment_id` BIGINT UNSIGNED DEFAULT NULL,
  `custom_name` VARCHAR(160) DEFAULT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `is_equipped` TINYINT(1) NOT NULL DEFAULT 0,
  `container_ref` VARCHAR(160) DEFAULT NULL,
  `origin_type` ENUM('starting_equipment','background','class','loot','purchase','gift','manual','other') NOT NULL DEFAULT 'manual',
  `origin_id` BIGINT UNSIGNED DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_character_inventory_character` (`character_id`),
  KEY `idx_character_inventory_campaign_character` (`campaign_character_id`),
  KEY `idx_character_inventory_equipment` (`equipment_id`),
  CONSTRAINT `fk_character_inventory_character` FOREIGN KEY (`character_id`) REFERENCES `characters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_character_inventory_campaign_character` FOREIGN KEY (`campaign_character_id`) REFERENCES `campaign_characters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_character_inventory_equipment` FOREIGN KEY (`equipment_id`) REFERENCES `rule_equipment` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `character_attunements` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `character_id` BIGINT UNSIGNED NOT NULL,
  `inventory_item_id` BIGINT UNSIGNED NOT NULL,
  `status` ENUM('attuned','ended') NOT NULL DEFAULT 'attuned',
  `started_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ended_at` DATETIME DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_character_attunements_character` (`character_id`, `status`),
  KEY `idx_character_attunements_item` (`inventory_item_id`),
  CONSTRAINT `fk_character_attunements_character` FOREIGN KEY (`character_id`) REFERENCES `characters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_character_attunements_item` FOREIGN KEY (`inventory_item_id`) REFERENCES `character_inventory` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `character_spells` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `character_id` BIGINT UNSIGNED NOT NULL,
  `spell_id` BIGINT UNSIGNED NOT NULL,
  `origin_type` ENUM('class','subclass','species','feat','item','manual','other') NOT NULL DEFAULT 'manual',
  `origin_id` BIGINT UNSIGNED DEFAULT NULL,
  `is_known` TINYINT(1) NOT NULL DEFAULT 1,
  `is_prepared` TINYINT(1) NOT NULL DEFAULT 0,
  `prepared_context` ENUM('always','daily','item','special') NOT NULL DEFAULT 'daily',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_character_spells_character_spell_origin` (`character_id`, `spell_id`, `origin_type`, `origin_id`),
  KEY `idx_character_spells_spell` (`spell_id`),
  CONSTRAINT `fk_character_spells_character` FOREIGN KEY (`character_id`) REFERENCES `characters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_character_spells_spell` FOREIGN KEY (`spell_id`) REFERENCES `rule_spells` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `character_spellcasting_profiles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `character_id` BIGINT UNSIGNED NOT NULL,
  `class_id` BIGINT UNSIGNED DEFAULT NULL,
  `subclass_id` BIGINT UNSIGNED DEFAULT NULL,
  `source_type` ENUM('class','subclass','species','feat','item','other') NOT NULL DEFAULT 'class',
  `source_id` BIGINT UNSIGNED DEFAULT NULL,
  `casting_ability_id` TINYINT UNSIGNED DEFAULT NULL,
  `preparation_mode` ENUM('prepared','known','always_prepared','pact_magic','innate','item','other') NOT NULL DEFAULT 'prepared',
  `spell_list_ref` VARCHAR(120) DEFAULT NULL,
  `prepared_count_formula` VARCHAR(255) DEFAULT NULL,
  `known_count_formula` VARCHAR(255) DEFAULT NULL,
  `focus_rules_json` JSON DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_character_spellcasting_profiles_character` (`character_id`, `is_active`),
  KEY `idx_character_spellcasting_profiles_class` (`class_id`),
  KEY `idx_character_spellcasting_profiles_ability` (`casting_ability_id`),
  CONSTRAINT `fk_csp_character` FOREIGN KEY (`character_id`) REFERENCES `characters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_csp_class` FOREIGN KEY (`class_id`) REFERENCES `rule_classes` (`id`),
  CONSTRAINT `fk_csp_subclass` FOREIGN KEY (`subclass_id`) REFERENCES `rule_subclasses` (`id`),
  CONSTRAINT `fk_csp_ability` FOREIGN KEY (`casting_ability_id`) REFERENCES `rule_abilities` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `character_spell_slots` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `character_id` BIGINT UNSIGNED NOT NULL,
  `campaign_character_id` BIGINT UNSIGNED DEFAULT NULL,
  `slot_type` ENUM('spellcasting','pact_magic','feature','item') NOT NULL DEFAULT 'spellcasting',
  `slot_level` TINYINT UNSIGNED NOT NULL,
  `max_slots_snapshot` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `used_slots` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `recovery` ENUM('short_rest','long_rest','short_or_long_rest','dawn','special') NOT NULL DEFAULT 'long_rest',
  `origin_type` ENUM('class','subclass','feat','item','manual','other') NOT NULL DEFAULT 'class',
  `origin_id` BIGINT UNSIGNED DEFAULT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_character_spell_slots` (`character_id`, `campaign_character_id`, `slot_type`, `slot_level`, `origin_type`, `origin_id`),
  KEY `idx_character_spell_slots_campaign_character` (`campaign_character_id`),
  CONSTRAINT `fk_character_spell_slots_character` FOREIGN KEY (`character_id`) REFERENCES `characters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_character_spell_slots_campaign_character` FOREIGN KEY (`campaign_character_id`) REFERENCES `campaign_characters` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `active_conditions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `campaign_character_id` BIGINT UNSIGNED DEFAULT NULL,
  `condition_id` SMALLINT UNSIGNED NOT NULL,
  `source_type` ENUM('spell','feature','item','environment','dm','other') NOT NULL DEFAULT 'other',
  `source_id` BIGINT UNSIGNED DEFAULT NULL,
  `expires_round` INT UNSIGNED DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_active_conditions_campaign_character` (`campaign_character_id`),
  KEY `idx_active_conditions_condition` (`condition_id`),
  CONSTRAINT `fk_active_conditions_campaign_character` FOREIGN KEY (`campaign_character_id`) REFERENCES `campaign_characters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_active_conditions_condition` FOREIGN KEY (`condition_id`) REFERENCES `rule_conditions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Snapshot opzionale per lettura veloce UI/API.
-- Non e la fonte primaria delle regole: e una cache/materializzazione aggiornabile.
CREATE TABLE `character_sheet_snapshots` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `character_id` BIGINT UNSIGNED NOT NULL,
  `campaign_character_id` BIGINT UNSIGNED DEFAULT NULL,
  `snapshot_type` ENUM('draft','active','campaign','preview') NOT NULL DEFAULT 'active',
  `sheet_json` JSON NOT NULL,
  `source_event_id` BIGINT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_character_sheet_snapshots_character` (`character_id`, `snapshot_type`, `created_at`),
  KEY `idx_character_sheet_snapshots_campaign_character` (`campaign_character_id`),
  CONSTRAINT `fk_character_sheet_snapshots_character` FOREIGN KEY (`character_id`) REFERENCES `characters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_character_sheet_snapshots_campaign_character` FOREIGN KEY (`campaign_character_id`) REFERENCES `campaign_characters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_character_sheet_snapshots_event` FOREIGN KEY (`source_event_id`) REFERENCES `character_progression_events` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Master tools / runtime leggero
-- ---------------------------------------------------------------------------

CREATE TABLE `media_assets` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uploaded_by_user_id` BIGINT UNSIGNED DEFAULT NULL,
  `storage_path` VARCHAR(500) NOT NULL,
  `original_name` VARCHAR(255) DEFAULT NULL,
  `mime_type` VARCHAR(120) NOT NULL,
  `size_bytes` BIGINT UNSIGNED DEFAULT NULL,
  `visibility` ENUM('private','campaign','public','system') NOT NULL DEFAULT 'private',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_media_assets_user` (`uploaded_by_user_id`),
  CONSTRAINT `fk_media_assets_user` FOREIGN KEY (`uploaded_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `campaign_scenes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `campaign_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(160) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `map_asset_id` BIGINT UNSIGNED DEFAULT NULL,
  `status` ENUM('draft','ready','active','archived') NOT NULL DEFAULT 'draft',
  `metadata_json` JSON DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_campaign_scenes_campaign` (`campaign_id`),
  CONSTRAINT `fk_campaign_scenes_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_campaign_scenes_map_asset` FOREIGN KEY (`map_asset_id`) REFERENCES `media_assets` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `encounters` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `campaign_id` BIGINT UNSIGNED NOT NULL,
  `scene_id` BIGINT UNSIGNED DEFAULT NULL,
  `name` VARCHAR(160) NOT NULL,
  `status` ENUM('draft','ready','active','completed','archived') NOT NULL DEFAULT 'draft',
  `metadata_json` JSON DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_encounters_campaign` (`campaign_id`),
  KEY `idx_encounters_scene` (`scene_id`),
  CONSTRAINT `fk_encounters_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_encounters_scene` FOREIGN KEY (`scene_id`) REFERENCES `campaign_scenes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `combat_sessions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `encounter_id` BIGINT UNSIGNED NOT NULL,
  `started_by_user_id` BIGINT UNSIGNED NOT NULL,
  `status` ENUM('preparing','active','paused','completed') NOT NULL DEFAULT 'preparing',
  `current_round` INT UNSIGNED NOT NULL DEFAULT 1,
  `current_turn_index` INT UNSIGNED NOT NULL DEFAULT 0,
  `started_at` DATETIME DEFAULT NULL,
  `ended_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_combat_sessions_encounter` (`encounter_id`),
  CONSTRAINT `fk_combat_sessions_encounter` FOREIGN KEY (`encounter_id`) REFERENCES `encounters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_combat_sessions_user` FOREIGN KEY (`started_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `combat_participants` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `combat_session_id` BIGINT UNSIGNED NOT NULL,
  `campaign_character_id` BIGINT UNSIGNED DEFAULT NULL,
  `creature_id` BIGINT UNSIGNED DEFAULT NULL,
  `display_name` VARCHAR(160) NOT NULL,
  `participant_type` ENUM('pc','npc','monster','summon','object','other') NOT NULL DEFAULT 'monster',
  `initiative_value` INT DEFAULT NULL,
  `turn_order` INT UNSIGNED DEFAULT NULL,
  `current_hp` INT DEFAULT NULL,
  `temp_hp` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `metadata_json` JSON DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_combat_participants_session` (`combat_session_id`, `turn_order`),
  KEY `idx_combat_participants_campaign_character` (`campaign_character_id`),
  KEY `idx_combat_participants_creature` (`creature_id`),
  CONSTRAINT `fk_combat_participants_session` FOREIGN KEY (`combat_session_id`) REFERENCES `combat_sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_combat_participants_campaign_character` FOREIGN KEY (`campaign_character_id`) REFERENCES `campaign_characters` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_combat_participants_creature` FOREIGN KEY (`creature_id`) REFERENCES `rule_creatures` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Chat
-- ---------------------------------------------------------------------------

CREATE TABLE `conversations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `campaign_id` BIGINT UNSIGNED NOT NULL,
  `type` ENUM('group','private') NOT NULL,
  `title` VARCHAR(160) DEFAULT NULL,
  `created_by_user_id` BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_conversations_campaign` (`campaign_id`),
  CONSTRAINT `fk_conversations_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_conversations_user` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `conversation_participants` (
  `conversation_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `role` ENUM('owner','participant','viewer') NOT NULL DEFAULT 'participant',
  `joined_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`conversation_id`, `user_id`),
  CONSTRAINT `fk_conversation_participants_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_conversation_participants_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `messages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `conversation_id` BIGINT UNSIGNED NOT NULL,
  `sender_user_id` BIGINT UNSIGNED NOT NULL,
  `body` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `edited_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_messages_conversation` (`conversation_id`, `created_at`),
  CONSTRAINT `fk_messages_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_messages_user` FOREIGN KEY (`sender_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Viste di supporto per i calcoli base
-- ---------------------------------------------------------------------------

CREATE VIEW `v_character_ability_totals` AS
SELECT
  cab.character_id,
  ra.code AS ability_code,
  cab.base_value,
  COALESCE(SUM(
    CASE
      WHEN cm.operation = 'add' AND cm.is_active = 1 THEN cm.value_number
      ELSE 0
    END
  ), 0) AS additive_modifier,
  cab.base_value + COALESCE(SUM(
    CASE
      WHEN cm.operation = 'add' AND cm.is_active = 1 THEN cm.value_number
      ELSE 0
    END
  ), 0) AS total_value
FROM `character_ability_bases` cab
JOIN `rule_abilities` ra ON ra.id = cab.ability_id
LEFT JOIN `character_modifiers` cm
  ON cm.character_id = cab.character_id
  AND cm.target_code = 'ability_score'
  AND cm.target_ref = ra.code
GROUP BY cab.character_id, ra.code, cab.base_value;

-- ---------------------------------------------------------------------------
-- Seed minimo lookup
-- ---------------------------------------------------------------------------

INSERT INTO `global_roles` (`id`, `code`, `name`) VALUES
(1, 'super_admin', 'SuperAdmin'),
(2, 'user', 'User');

INSERT INTO `rule_sources` (`id`, `code`, `name`, `edition`, `publisher`, `is_active`) VALUES
(1, 'phb_2024_it', 'Manuale del Giocatore 2024 (IT)', '2024', 'Wizards of the Coast', 1),
(2, 'homebrew', 'Homebrew', 'custom', NULL, 1);

INSERT INTO `rule_abilities` (`id`, `code`, `name`, `sort_order`) VALUES
(1, 'str', 'Forza', 1),
(2, 'dex', 'Destrezza', 2),
(3, 'con', 'Costituzione', 3),
(4, 'int', 'Intelligenza', 4),
(5, 'wis', 'Saggezza', 5),
(6, 'cha', 'Carisma', 6);

INSERT INTO `modifier_targets` (`code`, `name`, `value_kind`, `description`) VALUES
('ability_score', 'Punteggio caratteristica', 'number', 'Modifica il punteggio di una caratteristica. target_ref usa str/dex/con/int/wis/cha.'),
('ability_modifier', 'Modificatore caratteristica', 'number', 'Modifica direttamente il modificatore derivato di una caratteristica.'),
('saving_throw', 'Tiro salvezza', 'number', 'Bonus, competenza, vantaggio o svantaggio a un tiro salvezza.'),
('skill_check', 'Prova abilita', 'number', 'Bonus, competenza o maestria in una abilita.'),
('armor_class', 'Classe Armatura', 'number', 'Modificatori alla CA.'),
('initiative', 'Iniziativa', 'number', 'Modificatori all iniziativa.'),
('speed', 'Velocita', 'number', 'Modificatori alla velocita.'),
('max_hp', 'PF massimi', 'number', 'Modificatori ai PF massimi.'),
('resource_max', 'Massimo risorsa', 'number', 'Modificatori al massimo di una risorsa.'),
('spell_save_dc', 'CD tiro salvezza incantesimi', 'number', 'Modificatori alla CD incantesimi.'),
('spell_attack_bonus', 'Bonus attacco incantesimi', 'number', 'Modificatori al bonus di attacco incantesimi.'),
('attack_bonus', 'Bonus attacco', 'number', 'Modificatori a un tiro per colpire.'),
('damage_bonus', 'Bonus danno', 'number', 'Modificatori al danno.'),
('resistance', 'Resistenza', 'flag', 'Resistenza a un tipo di danno.'),
('immunity', 'Immunita', 'flag', 'Immunita a danni o condizioni.'),
('advantage', 'Vantaggio', 'flag', 'Vantaggio in un ambito specifico.'),
('disadvantage', 'Svantaggio', 'flag', 'Svantaggio in un ambito specifico.');

INSERT INTO `rule_actions` (`code`, `name`, `action_kind`, `description`) VALUES
('attack', 'Attacco', 'action', 'Tiro per colpire con arma o colpo senz armi.'),
('dash', 'Scatto', 'action', 'Aumenta il movimento disponibile nel turno.'),
('disengage', 'Disimpegno', 'action', 'Evita attacchi di opportunita legati al movimento.'),
('dodge', 'Schivata', 'action', 'Postura difensiva fino all inizio del prossimo turno.'),
('help', 'Aiuto', 'action', 'Aiuta una creatura in una prova o in un attacco.'),
('hide', 'Nascondersi', 'action', 'Prova a ottenere la condizione nascosto/invisibile secondo le regole.'),
('influence', 'Influenza', 'action', 'Interazione sociale meccanica.'),
('magic', 'Magia', 'action', 'Lancia un incantesimo o attiva un effetto magico con tempo di lancio appropriato.'),
('ready', 'Prepararsi', 'action', 'Prepara un azione da usare con reazione a un innesco.'),
('search', 'Ricerca', 'action', 'Cerca qualcosa non ovvio.'),
('study', 'Studio', 'action', 'Richiama conoscenze e informazioni.'),
('use', 'Utilizzo', 'action', 'Usa un oggetto o effetto che richiede una azione di utilizzo.'),
('opportunity_attack', 'Attacco di opportunita', 'reaction', 'Reazione comune quando una creatura lascia la portata.');

INSERT INTO `rule_sizes` (`code`, `name`, `space_meters`, `carrying_multiplier`, `sort_order`) VALUES
('tiny', 'Minuscola', 0.75, 0.50, 1),
('small', 'Piccola', 1.50, 1.00, 2),
('medium', 'Media', 1.50, 1.00, 3),
('large', 'Grande', 3.00, 2.00, 4),
('huge', 'Enorme', 4.50, 4.00, 5),
('gargantuan', 'Mastodontica', 6.00, 8.00, 6);

INSERT INTO `rule_movement_modes` (`code`, `name`, `description`) VALUES
('walk', 'Camminare', 'Velocita normale sul terreno.'),
('climb', 'Scalata', 'Velocita speciale per scalare.'),
('swim', 'Nuoto', 'Velocita speciale per nuotare.'),
('fly', 'Volo', 'Velocita speciale per volare.'),
('burrow', 'Scavo', 'Velocita speciale per scavare.');

INSERT INTO `rule_senses` (`code`, `name`, `has_range`, `description`) VALUES
('passive_perception', 'Percezione passiva', 0, 'Valore passivo di percezione.'),
('darkvision', 'Scurovisione', 1, 'Vedere al buio entro una distanza.'),
('blindsight', 'Vista cieca', 1, 'Percepire senza vista entro una distanza.'),
('truesight', 'Vista pura', 1, 'Vista speciale contro oscurita magica, invisibilita e illusioni.'),
('tremorsense', 'Percezione tellurica', 1, 'Percepire vibrazioni a contatto con una superficie.');

INSERT INTO `rule_area_shapes` (`code`, `name`, `origin_included_default`, `description`) VALUES
('cone', 'Cono', 0, 'Area che si estende da un punto di origine in una direzione.'),
('cube', 'Cubo', 0, 'Area cubica con punto di origine su una faccia.'),
('cylinder', 'Cilindro', 1, 'Area cilindrica con raggio e altezza.'),
('emanation', 'Emanazione', 0, 'Area che si muove con la creatura o oggetto origine.'),
('line', 'Linea', 0, 'Area lunga e stretta da un punto di origine.'),
('sphere', 'Sfera', 1, 'Area sferica centrata su un punto.');

INSERT INTO `rule_cover_types` (`code`, `name`, `ac_bonus`, `dex_save_bonus`, `blocks_targeting`, `description`) VALUES
('half', 'Mezza copertura', 2, 2, 0, 'Bonus parziale a CA e TS Destrezza.'),
('three_quarters', 'Tre quarti di copertura', 5, 5, 0, 'Bonus forte a CA e TS Destrezza.'),
('total', 'Copertura totale', NULL, NULL, 1, 'Blocca il bersaglio diretto secondo le regole.');

INSERT INTO `rule_rest_types` (`code`, `name`, `duration_minutes`, `benefits_json`, `description`) VALUES
('short_rest', 'Riposo breve', 60, JSON_OBJECT('spend_hit_dice', true, 'recover_short_rest_resources', true), 'Riposo breve di circa 1 ora.'),
('long_rest', 'Riposo lungo', 480, JSON_OBJECT('full_hp', true, 'recover_hit_dice_fraction', 'half_max_min_1', 'recover_long_rest_resources', true, 'reduce_exhaustion', 1), 'Riposo lungo di almeno 8 ore.');

INSERT INTO `rule_hazards` (`code`, `name`, `hazard_type`, `description`) VALUES
('fall', 'Caduta', 'fall', 'Danni e conseguenze da caduta.'),
('suffocation', 'Soffocamento', 'suffocation', 'Regole per mancanza d aria.'),
('dehydration', 'Disidratazione', 'dehydration', 'Pericolo da mancanza d acqua.'),
('malnutrition', 'Malnutrizione', 'malnutrition', 'Pericolo da mancanza di cibo.'),
('burning', 'In fiamme', 'burning', 'Pericolo da fuoco persistente.');

INSERT INTO `rule_weapon_masteries` (`code`, `name`, `description`) VALUES
('cleave', 'Fendere', 'Maestria arma. Effetto da catalogare nei dati regole.'),
('graze', 'Sfiorare', 'Maestria arma. Effetto da catalogare nei dati regole.'),
('nick', 'Scalfire', 'Maestria arma. Effetto da catalogare nei dati regole.'),
('push', 'Spingere', 'Maestria arma. Effetto da catalogare nei dati regole.'),
('sap', 'Fiaccare', 'Maestria arma. Effetto da catalogare nei dati regole.'),
('slow', 'Rallentare', 'Maestria arma. Effetto da catalogare nei dati regole.'),
('topple', 'Abbattere', 'Maestria arma. Effetto da catalogare nei dati regole.'),
('vex', 'Infastidire', 'Maestria arma. Effetto da catalogare nei dati regole.');

INSERT INTO `rule_weapon_properties` (`code`, `name`, `description`) VALUES
('ammunition', 'Munizioni', 'Proprieta arma.'),
('finesse', 'Accurata', 'Proprieta arma.'),
('heavy', 'Pesante', 'Proprieta arma.'),
('light', 'Leggera', 'Proprieta arma.'),
('loading', 'Ricarica', 'Proprieta arma.'),
('range', 'Gittata', 'Proprieta arma.'),
('reach', 'Portata', 'Proprieta arma.'),
('thrown', 'Lancio', 'Proprieta arma.'),
('two_handed', 'Due mani', 'Proprieta arma.'),
('versatile', 'Versatile', 'Proprieta arma.');

INSERT INTO `rule_resource_types` (`code`, `name`, `category`, `default_recovery`, `description`) VALUES
('spell_slot', 'Slot incantesimo', 'spell_slot', 'long_rest', 'Slot incantesimo standard.'),
('hit_die', 'Dado vita', 'dice', 'long_rest', 'Dadi vita del personaggio.'),
('class_points', 'Punti di classe', 'points', 'special', 'Risorsa numerica specifica di classe.'),
('uses', 'Usi', 'uses', 'special', 'Numero di usi di una capacita.'),
('charges', 'Cariche', 'charges', 'special', 'Cariche di oggetto o privilegio.');

COMMIT;
