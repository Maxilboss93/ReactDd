

import {
  findFeatById,
  getAvailableFeats,
} from './featsCatalog.js'
import {
  applyFeatDraftToCharacter,
  buildFeatChoiceDraft,
} from './featChoiceService.js'
import { findSpellById } from './spellsCatalog.js'
import {
  getClassResourceEntries,
  getClassResourceEntry,
} from './classScalingService.js'
import powersCatalog from '../../generated/catalogo_powers_tutte_classi_dnd2024_it.json'
import spellsCatalog from '../../generated/dnd2024_spells_it.json'
import startingEquipmentCatalog from '../../generated/dnd5e2024_rules_catalogs_it/rules/equipment/starting_equipment.json'

const CLASS_HIT_DICE = {
  Barbaro: 'd12',
  Bardo: 'd8',
  Chierico: 'd8',
  Druido: 'd8',
  Guerriero: 'd10',
  Ladro: 'd8',
  Mago: 'd6',
  Monaco: 'd8',
  Paladino: 'd10',
  Ranger: 'd10',
  Stregone: 'd6',
  Warlock: 'd8',
}

const ABILITY_LABELS = {
  str: 'FOR',
  dex: 'DES',
  con: 'COS',
  int: 'INT',
  wis: 'SAG',
  cha: 'CAR',
}

const SKILL_OPTIONS = [
  { id: 'acrobatics', label: 'Acrobazia', ability: 'dex' },
  { id: 'athletics', label: 'Atletica', ability: 'str' },
  { id: 'sleight', label: 'Rapidita di Mano', ability: 'dex' },
  { id: 'stealth', label: 'Furtivita', ability: 'dex' },
  { id: 'arcana', label: 'Arcano', ability: 'int' },
  { id: 'history', label: 'Storia', ability: 'int' },
  { id: 'investigation', label: 'Indagare', ability: 'int' },
  { id: 'nature', label: 'Natura', ability: 'int' },
  { id: 'religion', label: 'Religione', ability: 'int' },
  { id: 'animal', label: 'Addestrare Animali', ability: 'wis' },
  { id: 'insight', label: 'Intuizione', ability: 'wis' },
  { id: 'medicine', label: 'Medicina', ability: 'wis' },
  { id: 'perception', label: 'Percezione', ability: 'wis' },
  { id: 'survival', label: 'Sopravvivenza', ability: 'wis' },
  { id: 'deception', label: 'Inganno', ability: 'cha' },
  { id: 'intimidation', label: 'Intimidire', ability: 'cha' },
  { id: 'performance', label: 'Intrattenere', ability: 'cha' },
  { id: 'persuasion', label: 'Persuasione', ability: 'cha' },
]

const SKILL_LABELS = Object.fromEntries(
  SKILL_OPTIONS.map((skill) => [skill.id, skill.label])
)

const WEAPON_MASTERY_OPTIONS = [
  { id: 'dagger', label: 'Pugnale' },
  { id: 'light_crossbow', label: 'Balestra leggera' },
  { id: 'rapier', label: 'Stocco' },
  { id: 'shortsword', label: 'Spada corta' },
  { id: 'scimitar', label: 'Scimitarra' },
]

const LANGUAGE_OPTIONS = [
  { id: 'elfico', label: 'Elfico' },
  { id: 'nanico', label: 'Nanico' },
  { id: 'orchesco', label: 'Orchesco' },
  { id: 'gigante', label: 'Gigante' },
  { id: 'goblin', label: 'Goblin' },
  { id: 'celestiale', label: 'Celestiale' },
  { id: 'infernale', label: 'Infernale' },
]

const FIGHTING_STYLE_OPTIONS = [
  { id: 'archery', label: 'Tiro' },
  { id: 'defense', label: 'Difesa' },
  { id: 'dueling', label: 'Duellare' },
  { id: 'great_weapon_fighting', label: 'Combattere con Armi Possenti' },
  { id: 'protection', label: 'Protezione' },
  { id: 'two_weapon_fighting', label: 'Combattere con Due Armi' },
]

const METAMAGIC_OPTIONS = [
  { id: 'careful_spell', label: 'Incantesimo Preciso' },
  { id: 'distant_spell', label: 'Incantesimo Distante' },
  { id: 'empowered_spell', label: 'Incantesimo Potenziato' },
  { id: 'extended_spell', label: 'Incantesimo Esteso' },
  { id: 'heightened_spell', label: 'Incantesimo Intensificato' },
  { id: 'quickened_spell', label: 'Incantesimo Rapido' },
  { id: 'subtle_spell', label: 'Incantesimo Celato' },
  { id: 'twinned_spell', label: 'Incantesimo Raddoppiato' },
]

const METAMAGIC_CHOICE_POWER_IDS = {
  careful_spell: 'stregone_incantesimo_preciso',
  distant_spell: 'stregone_incantesimo_distante',
  empowered_spell: 'stregone_incantesimo_potenziato',
  extended_spell: 'stregone_incantesimo_esteso',
  heightened_spell: 'stregone_incantesimo_intensificato',
  quickened_spell: 'stregone_incantesimo_rapido',
  subtle_spell: 'stregone_incantesimo_celato',
  twinned_spell: 'stregone_incantesimo_raddoppiato',
}

const METAMAGIC_POWER_IDS = new Set([
  ...Object.values(METAMAGIC_CHOICE_POWER_IDS),
  'stregone_incantesimo_mirato',
  'stregone_incantesimo_tramutato',
])

const CLASS_SPELL_LIST_IDS = {
  Bardo: 'bardo',
  Chierico: 'chierico',
  Druido: 'druido',
  Mago: 'mago',
  Paladino: 'paladino',
  Ranger: 'ranger',
  Stregone: 'stregone',
  Warlock: 'warlock',
}

const THIRD_CASTER_PREPARED_SPELLS = {
  3: 3,
  4: 4,
  5: 4,
  6: 4,
  7: 5,
  8: 6,
  9: 6,
  10: 7,
  11: 8,
  12: 8,
  13: 9,
  14: 10,
  15: 10,
  16: 11,
  17: 11,
  18: 11,
  19: 12,
  20: 13,
}

const SUBCLASS_SPELLCASTING_RULES = {
  'Guerriero:Cavaliere Mistico': {
    spellcasting: 'third',
    spellListClass: 'Mago',
    ability: 'int',
    cantripsKnown: { 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2, 10: 3, 11: 3, 12: 3, 13: 3, 14: 3, 15: 3, 16: 3, 17: 3, 18: 3, 19: 3, 20: 3 },
    preparedSpells: THIRD_CASTER_PREPARED_SPELLS,
  },
  'Ladro:Mistificatore Arcano': {
    spellcasting: 'third',
    spellListClass: 'Mago',
    ability: 'int',
    fixedCantrips: [{ id: 'mano-magica', name: 'Mano Magica' }],
    cantripsKnown: { 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 4, 11: 4, 12: 4, 13: 4, 14: 4, 15: 4, 16: 4, 17: 4, 18: 4, 19: 4, 20: 4 },
    preparedSpells: THIRD_CASTER_PREPARED_SPELLS,
  },
}

const SPELLCASTING_CHOICE_RULES = {
  Bardo: {
    cantripsKnown: { 1: 2, 2: 2, 3: 2, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 4, 11: 4, 12: 4, 13: 4, 14: 4, 15: 4, 16: 4, 17: 4, 18: 4, 19: 4, 20: 4 },
    preparedSpells: { 1: 4, 2: 5, 3: 6, 4: 7, 5: 9, 6: 10, 7: 11, 8: 12, 9: 14, 10: 15, 11: 16, 12: 16, 13: 17, 14: 17, 15: 18, 16: 18, 17: 19, 18: 20, 19: 21, 20: 22 },
  },
  Chierico: {
    cantripsKnown: { 1: 3, 2: 3, 3: 3, 4: 4, 5: 4, 6: 4, 7: 4, 8: 4, 9: 4, 10: 5, 11: 5, 12: 5, 13: 5, 14: 5, 15: 5, 16: 5, 17: 5, 18: 5, 19: 5, 20: 5 },
    preparedSpells: { 1: 4, 2: 5, 3: 6, 4: 7, 5: 9, 6: 10, 7: 11, 8: 12, 9: 14, 10: 15, 11: 16, 12: 16, 13: 17, 14: 17, 15: 18, 16: 18, 17: 19, 18: 20, 19: 21, 20: 22 },
  },
  Druido: {
    cantripsKnown: { 1: 2, 2: 2, 3: 2, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 4, 11: 4, 12: 4, 13: 4, 14: 4, 15: 4, 16: 4, 17: 4, 18: 4, 19: 4, 20: 4 },
    preparedSpells: { 1: 4, 2: 5, 3: 6, 4: 7, 5: 9, 6: 10, 7: 11, 8: 12, 9: 14, 10: 15, 11: 16, 12: 16, 13: 17, 14: 17, 15: 18, 16: 18, 17: 19, 18: 20, 19: 21, 20: 22 },
  },
  Mago: {
    cantripsKnown: { 1: 3, 2: 3, 3: 3, 4: 4, 5: 4, 6: 4, 7: 4, 8: 4, 9: 4, 10: 5, 11: 5, 12: 5, 13: 5, 14: 5, 15: 5, 16: 5, 17: 5, 18: 5, 19: 5, 20: 5 },
    preparedSpells: { 1: 4, 2: 5, 3: 6, 4: 7, 5: 9, 6: 10, 7: 11, 8: 12, 9: 14, 10: 15, 11: 16, 12: 16, 13: 17, 14: 18, 15: 19, 16: 21, 17: 22, 18: 23, 19: 24, 20: 25 },
  },
  Paladino: {
    preparedSpells: { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 6, 7: 7, 8: 7, 9: 9, 10: 9, 11: 10, 12: 10, 13: 11, 14: 11, 15: 12, 16: 12, 17: 14, 18: 14, 19: 15, 20: 15 },
  },
  Ranger: {
    preparedSpells: { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 6, 7: 7, 8: 7, 9: 9, 10: 9, 11: 10, 12: 10, 13: 11, 14: 11, 15: 12, 16: 12, 17: 14, 18: 14, 19: 15, 20: 15 },
  },
  Stregone: {
    cantripsKnown: { 1: 4, 2: 4, 3: 4, 4: 5, 5: 5, 6: 5, 7: 5, 8: 5, 9: 5, 10: 6, 11: 6, 12: 6, 13: 6, 14: 6, 15: 6, 16: 6, 17: 6, 18: 6, 19: 6, 20: 6 },
    preparedSpells: { 1: 2, 2: 4, 3: 6, 4: 7, 5: 9, 6: 10, 7: 11, 8: 12, 9: 14, 10: 15, 11: 16, 12: 16, 13: 17, 14: 17, 15: 18, 16: 18, 17: 19, 18: 20, 19: 21, 20: 22 },
  },
  Warlock: {
    cantripsKnown: { 1: 2, 2: 2, 3: 2, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 4, 11: 4, 12: 4, 13: 4, 14: 4, 15: 4, 16: 4, 17: 4, 18: 4, 19: 4, 20: 4 },
    preparedSpells: { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 10, 11: 11, 12: 11, 13: 12, 14: 12, 15: 13, 16: 13, 17: 14, 18: 14, 19: 15, 20: 15 },
  },
}

const SPELL_REPLACEMENT_RULES = {
  Bardo: {
    levelUp: {
      cantrips: { mode: 'up_to', count: 1 },
      preparedSpells: { mode: 'up_to', count: 1 },
    },
  },
  Chierico: {
    levelUp: {
      cantrips: { mode: 'up_to', count: 1 },
    },
    longRest: {
      preparedSpells: { mode: 'all' },
    },
  },
  Druido: {
    levelUp: {
      cantrips: { mode: 'up_to', count: 1 },
    },
    longRest: {
      preparedSpells: { mode: 'all' },
    },
  },
  Mago: {
    levelUp: {
      spellbookAdditions: { count: 2 },
    },
    longRest: {
      cantrips: { mode: 'up_to', count: 1 },
      preparedSpells: { mode: 'all', from: 'spellbook' },
    },
  },
  Paladino: {
    longRest: {
      preparedSpells: { mode: 'up_to', count: 1 },
    },
  },
  Ranger: {
    longRest: {
      preparedSpells: { mode: 'up_to', count: 1 },
    },
  },
  Stregone: {
    levelUp: {
      cantrips: { mode: 'up_to', count: 1 },
      preparedSpells: { mode: 'up_to', count: 1 },
    },
  },
  Warlock: {
    levelUp: {
      cantrips: { mode: 'up_to', count: 1 },
      preparedSpells: { mode: 'up_to', count: 1 },
    },
  },
}

const SUBCLASS_GRANTED_SPELLS = {
  Stregone: {
    'Stregoneria Aberrante': [
      {
        minLevel: 3,
        spells: [
          { id: 'braccia-di-hadar', name: 'Braccia di Hadar', level: 1 },
          { id: 'calmare-emozioni', name: 'Calmare Emozioni', level: 2 },
          { id: 'individuazione-dei-pensieri', name: 'Individuazione dei Pensieri', level: 2 },
          { id: 'sussurri-dissonanti', name: 'Sussurri Dissonanti', level: 1 },
          { id: 'scheggia-della-mente', name: 'Scheggia della Mente', level: 0 },
        ],
      },
      {
        minLevel: 5,
        spells: [
          { id: 'fame-di-hadar', name: 'Fame di Hadar', level: 3 },
          { id: 'inviare', name: 'Inviare', level: 3 },
        ],
      },
      {
        minLevel: 7,
        spells: [
          { id: 'tentacoli-neri-di-evard', name: 'Tentacoli Neri di Evard', level: 4 },
          { id: 'richiama-aberrazione', name: 'Richiama Aberrazione', level: 4 },
        ],
      },
      {
        minLevel: 9,
        spells: [
          { id: 'legame-telepatico-di-rary', name: 'Legame Telepatico di Rary', level: 5 },
          { id: 'telecinesi', name: 'Telecinesi', level: 5 },
        ],
      },
    ],
  },
}

const CLASS_RULES = {
  Barbaro: {
    id: 'barbaro',
    multiclassPrerequisites: [{ ability: 'str', min: 13 }],
    levelFeatures: {
      2: [
        { id: 'barbaro_attacco_irruento', label: 'Attacco Irruento', powerId: 'barbaro_attacco_irruento' },
        { id: 'barbaro_percezione_del_pericolo', label: 'Percezione del Pericolo', powerId: 'barbaro_percezione_del_pericolo' },
      ],
      5: [
        { id: 'barbaro_attacco_extra', label: 'Attacco Extra', powerId: 'barbaro_attacco_extra' },
        { id: 'barbaro_movimento_veloce', label: 'Movimento Veloce', powerId: 'barbaro_movimento_veloce' },
      ],
    },
  },
  Bardo: {
    id: 'bardo',
    multiclassPrerequisites: [{ ability: 'cha', min: 13 }],
    spellcasting: 'full',
    levelFeatures: {
      1: [
        { id: 'bardo_incantesimi', label: 'Incantesimi', powerId: 'bardo_incantesimi' },
        { id: 'bardo_ispirazione_bardica', label: 'Ispirazione Bardica', powerId: 'bardo_ispirazione_bardica' },
      ],
      2: [
        { id: 'bardo_factotum', label: 'Factotum', powerId: 'bardo_factotum' },
        { id: 'bardo_maestria', label: 'Maestria', powerId: 'bardo_maestria' },
      ],
      5: [
        { id: 'bardo_fonte_di_ispirazione', label: 'Fonte di Ispirazione', powerId: 'bardo_fonte_di_ispirazione' },
      ],
    },
    levelChoices: {
      2: [
        {
          id: 'bardo_2_expertise',
          label: 'Maestria da Bardo',
          type: 'expertise_choice',
          count: 2,
          optionSource: 'proficient_skills',
          summary: 'Scegli due abilita competenti in cui raddoppiare il bonus competenza.',
        },
      ],
    },
  },
  Chierico: {
    id: 'chierico',
    multiclassPrerequisites: [{ ability: 'wis', min: 13 }],
    spellcasting: 'full',
    levelFeatures: {
      2: [
        { id: 'chierico_incanalare_divinita', label: 'Incanalare Divinita', powerId: 'chierico_incanalare_divinita' },
        { id: 'chierico_scacciare_non_morti', label: 'Scacciare Non Morti', powerId: 'chierico_scacciare_non_morti' },
      ],
      5: [
        { id: 'chierico_bruciare_i_non_morti', label: 'Bruciare i Non Morti', powerId: 'chierico_bruciare_i_non_morti' },
      ],
    },
    levelChoices: {
      7: [
        {
          id: 'chierico_7_colpi_benedetti',
          label: 'Colpi Benedetti',
          type: 'simple_choice',
          sourcePowerId: 'chierico_colpi_benedetti',
          count: 1,
          options: ['colpo_divino', 'incantesimi_potenti'],
          optionLabels: {
            colpo_divino: 'Colpo Divino',
            incantesimi_potenti: 'Incantesimi Potenti',
          },
          summary: 'Scegli se potenziare i colpi con arma o i trucchetti da Chierico.',
        },
      ],
    },
  },
  Druido: {
    id: 'druido',
    multiclassPrerequisites: [{ ability: 'wis', min: 13 }],
    spellcasting: 'full',
    levelFeatures: {
      2: [
        { id: 'druido_forma_selvatica', label: 'Forma Selvatica', powerId: 'druido_forma_selvatica' },
        { id: 'druido_compagno_selvatico', label: 'Compagno Selvatico', powerId: 'druido_compagno_selvatico' },
      ],
      5: [
        { id: 'druido_rinascita_selvatica', label: 'Rinascita Selvatica', powerId: 'druido_rinascita_selvatica' },
      ],
    },
    levelChoices: {
      7: [
        {
          id: 'druido_7_furia_elementale',
          label: 'Furia Elementale',
          type: 'simple_choice',
          sourcePowerId: 'druido_furia_elementale',
          count: 1,
          options: ['colpo_primordiale', 'incantesimi_potenti'],
          optionLabels: {
            colpo_primordiale: 'Colpo Primordiale',
            incantesimi_potenti: 'Incantesimi Potenti',
          },
          summary: 'Scegli se potenziare i colpi fisici o i trucchetti da Druido.',
        },
      ],
    },
  },
  Guerriero: {
    id: 'guerriero',
    multiclassPrerequisites: [{ abilityAny: ['str', 'dex'], min: 13 }],
    levelFeatures: {
      2: [
        { id: 'guerriero_impeto_d_azione', label: "Impeto d'Azione", powerId: 'guerriero_impeto_d_azione' },
        { id: 'guerriero_mente_tattica', label: 'Mente Tattica', powerId: 'guerriero_mente_tattica' },
      ],
      5: [
        { id: 'guerriero_attacco_extra', label: 'Attacco Extra', powerId: 'guerriero_attacco_extra' },
        { id: 'guerriero_scatto_tattico', label: 'Scatto Tattico', powerId: 'guerriero_scatto_tattico' },
      ],
    },
  },
  Ladro: {
    id: 'ladro',
    multiclassPrerequisites: [{ ability: 'dex', min: 13 }],
    multiclassChoices: [
      {
        id: 'ladro_1_skill',
        label: 'Competenza da Ladro multiclass',
        type: 'skill_choice',
        count: 1,
        options: ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation', 'perception', 'persuasion', 'sleight', 'stealth'],
        summary: 'Da multiclass ottieni una competenza dalla lista del Ladro.',
      },
      {
        id: 'ladro_1_expertise',
        label: 'Maestrie da Ladro',
        type: 'expertise_choice',
        count: 2,
        optionSource: 'proficient_skills',
        summary: 'Scegli due abilita o strumenti adatti alla Maestria.',
      },
      {
        id: 'ladro_1_weapon_mastery',
        label: "Padronanze d'Armi da Ladro",
        type: 'weapon_mastery_choice',
        count: 2,
        options: WEAPON_MASTERY_OPTIONS.map((option) => option.id),
        summary: "Scegli due armi idonee alla Padronanza d'Armi del Ladro.",
      },
      {
        id: 'ladro_1_language',
        label: 'Lingua da Gergo Ladresco',
        type: 'language_choice',
        count: 1,
        options: LANGUAGE_OPTIONS.map((option) => option.id),
        summary: 'Gergo Ladresco concede anche una lingua aggiuntiva.',
      },
    ],
    multiclassGrants: {
      tools: ['Arnesi da scasso'],
      armor: ['Armature leggere'],
    },
    levelFeatures: {
      1: [
        { id: 'ladro_attacco_furtivo', label: 'Attacco Furtivo', powerId: 'ladro_attacco_furtivo' },
        { id: 'ladro_gergo_ladresco', label: 'Gergo Ladresco', powerId: 'ladro_gergo_ladresco' },
        { id: 'ladro_maestria', label: 'Maestria', powerId: 'ladro_maestria' },
        { id: 'ladro_padronanza_d_armi', label: "Padronanza d'armi", powerId: 'ladro_padronanza_d_armi' },
      ],
      2: [
        { id: 'ladro_azione_scaltra', label: 'Azione Scaltra', powerId: 'ladro_azione_scaltra' },
      ],
      5: [
        { id: 'ladro_colpo_scaltro', label: 'Colpo Scaltro', powerId: 'ladro_colpo_scaltro' },
        { id: 'ladro_schivata_prodigiosa', label: 'Schivata Prodigiosa', powerId: 'ladro_schivata_prodigiosa' },
      ],
    },
  },
  Mago: {
    id: 'mago',
    multiclassPrerequisites: [{ ability: 'int', min: 13 }],
    spellcasting: 'full',
    levelFeatures: {
      2: [
        { id: 'mago_studioso', label: 'Studioso', powerId: 'mago_studioso' },
      ],
      5: [
        { id: 'mago_memorizzare_incantesimo', label: 'Memorizzare Incantesimo', powerId: 'mago_memorizzare_incantesimo' },
      ],
    },
    levelChoices: {
      2: [
        {
          id: 'mago_2_scholar',
          label: 'Studio arcano',
          type: 'acknowledge',
          summary: 'Scegli la competenza o Maestria accademica prevista da Studioso.',
        },
      ],
    },
  },
  Monaco: {
    id: 'monaco',
    multiclassPrerequisites: [
      { ability: 'dex', min: 13 },
      { ability: 'wis', min: 13 },
    ],
    levelFeatures: {
      2: [
        { id: 'monk_focus', label: 'Concentrazione da Monaco', powerId: 'monk_focus' },
        { id: 'monk_patient_defense', label: 'Difesa Paziente', powerId: 'monk_patient_defense' },
        { id: 'monk_step_of_the_wind', label: 'Passo del Vento', powerId: 'monk_step_of_the_wind' },
        { id: 'monk_flurry_of_blows', label: 'Raffica di Colpi', powerId: 'monk_flurry_of_blows' },
        { id: 'monk_uncanny_metabolism', label: 'Metabolismo Straordinario', powerId: 'monk_uncanny_metabolism' },
        { id: 'monk_unarmored_movement', label: 'Movimento Senza Armatura', powerId: 'monk_unarmored_movement' },
      ],
      5: [
        { id: 'monk_extra_attack', label: 'Attacco Extra', powerId: 'monk_extra_attack' },
        { id: 'monk_stunning_strike', label: 'Colpo Stordente', powerId: 'monk_stunning_strike' },
      ],
    },
    resourceGrants: {
      2: { id: 'ki', label: 'Ki', current: 2, max: 2, resetOn: 'short_rest', category: 'class' },
    },
  },
  Paladino: {
    id: 'paladino',
    multiclassPrerequisites: [
      { ability: 'str', min: 13 },
      { ability: 'cha', min: 13 },
    ],
    spellcasting: 'half',
    levelFeatures: {
      2: [
        { id: 'paladino_stile_di_combattimento', label: 'Stile di Combattimento', powerId: 'paladino_stile_di_combattimento' },
        { id: 'paladino_punizione_divina', label: 'Punizione Divina', powerId: 'paladino_punizione_divina' },
      ],
      5: [
        { id: 'paladino_attacco_extra', label: 'Attacco Extra', powerId: 'paladino_attacco_extra' },
        {
          id: 'paladino_fido_destriero',
          label: 'Fido Destriero',
          summary: 'Trova Cavalcatura e sempre preparato e puoi lanciarlo una volta per riposo lungo senza slot.',
          grantedSpells: [
            {
              id: 'trova-cavalcatura',
              name: 'Trova Cavalcatura',
              level: 2,
              alwaysPrepared: true,
              freeCast: 'long_rest',
            },
          ],
        },
      ],
    },
    levelChoices: {
      2: [
        {
          id: 'paladino_2_fighting_style',
          label: 'Stile di Combattimento',
          type: 'simple_choice',
          count: 1,
          options: FIGHTING_STYLE_OPTIONS.map((option) => option.id),
          optionLabels: Object.fromEntries(FIGHTING_STYLE_OPTIONS.map((option) => [option.id, option.label])),
          summary: 'Scegli uno stile di combattimento disponibile al Paladino.',
        },
      ],
    },
  },
  Ranger: {
    id: 'ranger',
    multiclassPrerequisites: [
      { ability: 'dex', min: 13 },
      { ability: 'wis', min: 13 },
    ],
    spellcasting: 'half',
    levelFeatures: {
      2: [
        { id: 'ranger_esploratore_esperto', label: 'Esploratore Esperto', powerId: 'ranger_esploratore_esperto' },
        { id: 'ranger_stile_di_combattimento', label: 'Stile di Combattimento', powerId: 'ranger_stile_di_combattimento' },
      ],
      5: [
        { id: 'ranger_attacco_extra', label: 'Attacco Extra', powerId: 'ranger_attacco_extra' },
      ],
    },
    levelChoices: {
      2: [
        {
          id: 'ranger_2_expertise',
          label: 'Maestria da Esploratore',
          type: 'expertise_choice',
          count: 1,
          optionSource: 'proficient_skills',
          summary: 'Esploratore Esperto richiede una scelta di Maestria.',
        },
        {
          id: 'ranger_2_fighting_style',
          label: 'Stile di Combattimento',
          type: 'simple_choice',
          count: 1,
          options: FIGHTING_STYLE_OPTIONS.map((option) => option.id),
          optionLabels: Object.fromEntries(FIGHTING_STYLE_OPTIONS.map((option) => [option.id, option.label])),
          summary: 'Scegli uno stile di combattimento disponibile al Ranger.',
        },
      ],
    },
  },
  Stregone: {
    id: 'stregone',
    multiclassPrerequisites: [{ ability: 'cha', min: 13 }],
    spellcasting: 'full',
    levelFeatures: {
      2: [
        { id: 'stregone_fonte_di_magia', label: 'Fonte di Magia', powerId: 'stregone_fonte_di_magia' },
        { id: 'stregone_metamagia', label: 'Metamagia', powerId: 'stregone_metamagia' },
      ],
      5: [
        { id: 'stregone_ripristino_stregonesco', label: 'Ripristino Stregonesco', powerId: 'stregone_ripristino_stregonesco' },
      ],
    },
    resourceGrants: {
      2: { id: 'sorcery_points', label: 'Punti Stregoneria', current: 2, max: 2, resetOn: 'long_rest', category: 'class' },
    },
    levelChoices: {
      2: [
        {
          id: 'stregone_2_metamagic',
          label: 'Opzioni di Metamagia',
          type: 'simple_choice',
          count: 2,
          options: METAMAGIC_OPTIONS.map((option) => option.id),
          optionLabels: Object.fromEntries(METAMAGIC_OPTIONS.map((option) => [option.id, option.label])),
          summary: 'Scegli due opzioni di Metamagia.',
        },
      ],
    },
  },
  Warlock: {
    id: 'warlock',
    multiclassPrerequisites: [{ ability: 'cha', min: 13 }],
    spellcasting: 'pact',
    levelFeatures: {
      2: [
        { id: 'warlock_scaltrezza_magica', label: 'Scaltrezza Magica', powerId: 'warlock_scaltrezza_magica' },
      ],
      5: [
        {
          id: 'warlock_suppliche_occulte_5',
          label: 'Suppliche Occulte: 5',
          summary: 'Le suppliche occulte conosciute salgono a 5; si aprono anche opzioni con prerequisito Warlock 5.',
        },
      ],
    },
  },
}

const CLASS_ORDER = Object.keys(CLASS_RULES)

const SUBCLASS_LEVEL_CHOICES = {
  'Guerriero:Campione': {
    7: [
      {
        id: 'guerriero_campione_7_stile_aggiuntivo',
        label: 'Stile Aggiuntivo',
        type: 'simple_choice',
        sourcePowerId: 'guerriero_campione_stile_aggiuntivo',
        count: 1,
        options: FIGHTING_STYLE_OPTIONS.map((option) => option.id),
        optionLabels: Object.fromEntries(FIGHTING_STYLE_OPTIONS.map((option) => [option.id, option.label])),
        summary: 'Scegli uno Stile di Combattimento aggiuntivo del Campione.',
      },
    ],
  },
  'Ranger:Cacciatore': {
    7: [
      {
        id: 'ranger_cacciatore_7_tattiche_difensive',
        label: 'Tattiche Difensive',
        type: 'simple_choice',
        sourcePowerId: 'ranger_cacciatore_tattiche_difensive',
        count: 1,
        options: ['difesa_dal_multiattacco', 'sfuggire_all_orda'],
        optionLabels: {
          difesa_dal_multiattacco: 'Difesa dal multiattacco',
          sfuggire_all_orda: "Sfuggire all'orda",
        },
        summary: 'Scegli una tattica difensiva del Cacciatore; il manuale consente di sostituirla dopo un riposo breve o lungo.',
      },
    ],
  },
}

const FULL_CASTER_SLOT_TABLE = {
  1: [{ level: 1, max: 2 }],
  2: [{ level: 1, max: 3 }],
  3: [{ level: 1, max: 4 }, { level: 2, max: 2 }],
  4: [{ level: 1, max: 4 }, { level: 2, max: 3 }],
  5: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 2 }],
  6: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }],
  7: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 1 }],
  8: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 2 }],
  9: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 3 }, { level: 5, max: 1 }],
  10: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 3 }, { level: 5, max: 2 }],
  11: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 3 }, { level: 5, max: 2 }, { level: 6, max: 1 }],
  12: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 3 }, { level: 5, max: 2 }, { level: 6, max: 1 }],
  13: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 3 }, { level: 5, max: 2 }, { level: 6, max: 1 }, { level: 7, max: 1 }],
  14: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 3 }, { level: 5, max: 2 }, { level: 6, max: 1 }, { level: 7, max: 1 }],
  15: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 3 }, { level: 5, max: 2 }, { level: 6, max: 1 }, { level: 7, max: 1 }, { level: 8, max: 1 }],
  16: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 3 }, { level: 5, max: 2 }, { level: 6, max: 1 }, { level: 7, max: 1 }, { level: 8, max: 1 }],
  17: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 3 }, { level: 5, max: 2 }, { level: 6, max: 1 }, { level: 7, max: 1 }, { level: 8, max: 1 }, { level: 9, max: 1 }],
  18: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 3 }, { level: 5, max: 3 }, { level: 6, max: 1 }, { level: 7, max: 1 }, { level: 8, max: 1 }, { level: 9, max: 1 }],
  19: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 3 }, { level: 5, max: 3 }, { level: 6, max: 2 }, { level: 7, max: 1 }, { level: 8, max: 1 }, { level: 9, max: 1 }],
  20: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 3 }, { level: 5, max: 3 }, { level: 6, max: 2 }, { level: 7, max: 2 }, { level: 8, max: 1 }, { level: 9, max: 1 }],
}

const HALF_CASTER_SLOT_TABLE = {
  1: [{ level: 1, max: 2 }],
  2: [{ level: 1, max: 2 }],
  3: [{ level: 1, max: 3 }],
  4: [{ level: 1, max: 3 }],
  5: [{ level: 1, max: 4 }, { level: 2, max: 2 }],
  6: [{ level: 1, max: 4 }, { level: 2, max: 2 }],
  7: [{ level: 1, max: 4 }, { level: 2, max: 3 }],
  8: [{ level: 1, max: 4 }, { level: 2, max: 3 }],
  9: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 2 }],
  10: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 2 }],
  11: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }],
  12: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }],
  13: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }],
  14: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }],
  15: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 2 }],
  16: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 2 }],
  17: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 3 }],
  18: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 3 }],
  19: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 3 }, { level: 5, max: 2 }],
  20: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 3 }, { level: 5, max: 2 }],
}

const THIRD_CASTER_SLOT_TABLE = {
  3: [{ level: 1, max: 2 }],
  4: [{ level: 1, max: 3 }],
  5: [{ level: 1, max: 3 }],
  6: [{ level: 1, max: 3 }],
  7: [{ level: 1, max: 4 }, { level: 2, max: 2 }],
  8: [{ level: 1, max: 4 }, { level: 2, max: 2 }],
  9: [{ level: 1, max: 4 }, { level: 2, max: 2 }],
  10: [{ level: 1, max: 4 }, { level: 2, max: 3 }],
  11: [{ level: 1, max: 4 }, { level: 2, max: 3 }],
  12: [{ level: 1, max: 4 }, { level: 2, max: 3 }],
  13: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 2 }],
  14: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 2 }],
  15: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 2 }],
  16: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }],
  17: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }],
  18: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }],
  19: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 1 }],
  20: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 1 }],
}

const PACT_MAGIC_SLOT_TABLE = {
  1: [{ level: 1, max: 1, resetOn: 'short_rest' }],
  2: [{ level: 1, max: 2, resetOn: 'short_rest' }],
  3: [{ level: 2, max: 2, resetOn: 'short_rest' }],
  4: [{ level: 2, max: 2, resetOn: 'short_rest' }],
  5: [{ level: 3, max: 2, resetOn: 'short_rest' }],
  6: [{ level: 3, max: 2, resetOn: 'short_rest' }],
  7: [{ level: 4, max: 2, resetOn: 'short_rest' }],
  8: [{ level: 4, max: 2, resetOn: 'short_rest' }],
  9: [{ level: 5, max: 2, resetOn: 'short_rest' }],
  10: [{ level: 5, max: 2, resetOn: 'short_rest' }],
  11: [{ level: 5, max: 3, resetOn: 'short_rest' }],
  12: [{ level: 5, max: 3, resetOn: 'short_rest' }],
  13: [{ level: 5, max: 3, resetOn: 'short_rest' }],
  14: [{ level: 5, max: 3, resetOn: 'short_rest' }],
  15: [{ level: 5, max: 3, resetOn: 'short_rest' }],
  16: [{ level: 5, max: 3, resetOn: 'short_rest' }],
  17: [{ level: 5, max: 4, resetOn: 'short_rest' }],
  18: [{ level: 5, max: 4, resetOn: 'short_rest' }],
  19: [{ level: 5, max: 4, resetOn: 'short_rest' }],
  20: [{ level: 5, max: 4, resetOn: 'short_rest' }],
}

const WARLOCK_INVOCATIONS_KNOWN = {
  1: 1,
  2: 3,
  3: 3,
  4: 3,
  5: 5,
  6: 5,
  7: 6,
  8: 6,
  9: 7,
  10: 7,
  11: 7,
  12: 8,
  13: 8,
  14: 8,
  15: 9,
  16: 9,
  17: 9,
  18: 10,
  19: 10,
  20: 10,
}

const WARLOCK_INVOCATION_PREREQUISITES = {
  warlock_balzo_ultraterreno: { minWarlockLevel: 2 },
  warlock_conoscenze_degli_antichi: { minWarlockLevel: 2 },
  warlock_deflagrazione_agonizzante: { minWarlockLevel: 2, damageCantrip: true },
  warlock_deflagrazione_respingente: { minWarlockLevel: 2, attackDamageCantrip: true },
  warlock_dono_degli_abissi: { minWarlockLevel: 5 },
  warlock_dono_del_protettore: { minWarlockLevel: 9, requiresInvocation: 'warlock_patto_del_tomo' },
  warlock_investitura_del_signore_delle_catene: { minWarlockLevel: 5, requiresInvocation: 'warlock_patto_della_catena' },
  warlock_lama_assetata: { minWarlockLevel: 5, requiresInvocation: 'warlock_patto_della_lama' },
  warlock_lama_divoratrice: { minWarlockLevel: 12, requiresInvocation: 'warlock_lama_assetata' },
  warlock_lancia_occulta: { minWarlockLevel: 2, damageCantrip: true },
  warlock_maestro_di_mille_forme: { minWarlockLevel: 5 },
  warlock_maschera_dei_molti_volti: { minWarlockLevel: 2 },
  warlock_passo_ascendente: { minWarlockLevel: 5 },
  warlock_punizione_occulta: { minWarlockLevel: 5, requiresInvocation: 'warlock_patto_della_lama' },
  warlock_sguardo_delle_due_menti: { minWarlockLevel: 5 },
  warlock_succhiavita: { minWarlockLevel: 9, requiresInvocation: 'warlock_patto_della_lama' },
  warlock_sussurri_dalla_tomba: { minWarlockLevel: 7 },
  warlock_tutt_uno_con_le_ombre: { minWarlockLevel: 5 },
  warlock_vigore_immondo: { minWarlockLevel: 2 },
  warlock_visione_dei_reami_lontani: { minWarlockLevel: 9 },
  warlock_visioni_velate: { minWarlockLevel: 2 },
  warlock_vista_del_diavolo: { minWarlockLevel: 2 },
  warlock_vista_stregata: { minWarlockLevel: 15 },
}

const WARLOCK_INVOCATION_CHOICE_RULES = {
  warlock_patto_del_tomo: [
    {
      id: 'cantrips',
      label: 'Trucchetti del Patto del Tomo',
      type: 'cantrip_choice',
      count: 3,
      optionSource: 'all_spells',
      minSpellLevel: 0,
      maxSpellLevel: 0,
      summary: 'Scegli i trucchetti concessi dal tomo. Sono incantesimi della supplica, non normali scelte da Warlock.',
    },
    {
      id: 'rituals',
      label: 'Rituali del Patto del Tomo',
      type: 'ritual_spell_choice',
      count: 2,
      optionSource: 'all_spells',
      minSpellLevel: 1,
      maxSpellLevel: 1,
      ritualOnly: true,
      summary: 'Scegli gli incantesimi rituali di livello 1 concessi dal tomo.',
    },
  ],
  warlock_deflagrazione_agonizzante: [
    {
      id: 'cantrip',
      label: 'Trucchetto per Deflagrazione Agonizzante',
      type: 'simple_choice',
      count: 1,
      optionSource: 'known_warlock_damage_cantrips',
      summary: 'Scegli il trucchetto da Warlock che infligge danni a cui applicare la supplica.',
    },
  ],
  warlock_deflagrazione_respingente: [
    {
      id: 'cantrip',
      label: 'Trucchetto per Deflagrazione Respingente',
      type: 'simple_choice',
      count: 1,
      optionSource: 'known_warlock_attack_damage_cantrips',
      summary: 'Scegli il trucchetto da Warlock con tiro per colpire a cui applicare la supplica.',
    },
  ],
  warlock_lancia_occulta: [
    {
      id: 'cantrip',
      label: 'Trucchetto per Lancia Occulta',
      type: 'simple_choice',
      count: 1,
      optionSource: 'known_warlock_damage_cantrips',
      summary: 'Scegli il trucchetto da Warlock che infligge danni a cui applicare la gittata aumentata.',
    },
  ],
}

const CLASS_SPELLCASTING_ABILITIES = {
  Bardo: 'cha',
  Chierico: 'wis',
  Druido: 'wis',
  Mago: 'int',
  Paladino: 'cha',
  Ranger: 'wis',
  Stregone: 'cha',
  Warlock: 'cha',
}

const GENERIC_ASI_LEVELS = [4, 8, 12, 16]
const ASI_LEVELS_BY_CLASS = {
  Guerriero: [4, 6, 8, 12, 14, 16],
  Ladro: [4, 8, 10, 12, 16],
}
const EPIC_BOON_LEVEL = 19

const MULTICLASS_MIN_SCORE = 13

const ARMOR_TRAINING_LABELS = {
  leggera: 'Armature leggere',
  media: 'Armature medie',
  pesante: 'Armature pesanti',
  scudi: 'Scudi',
}

const WEAPON_TRAINING_LABELS = {
  semplice: 'Armi semplici',
  guerra: 'Armi da guerra',
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function getSubclassPowers(className, subclassName, level = 3) {
  return (powersCatalog.powers ?? []).filter((power) => {
    return (
      power.source_type === 'subclass' &&
      power.source === className &&
      power.subsource === subclassName &&
      power.level === level
    )
  })
}

function getSubclassOptions(className) {
  const subclassNames = [
    ...new Set(
      (powersCatalog.powers ?? [])
        .filter((power) => {
          return (
            power.source_type === 'subclass' &&
            power.source === className &&
            power.level === 3 &&
            power.subsource
          )
        })
        .map((power) => power.subsource)
    ),
  ]

  return subclassNames.map((name) => ({
    id: slugify(name),
    label: name,
    subclassName: name,
  }))
}

function getTotalLevel(character) {
  let totalLevel = 0

  const classes = character.classes ?? []

  classes.forEach((characterClass) => {
    totalLevel = totalLevel + (characterClass.level ?? 0)
  })

  return totalLevel
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value ?? null))
}

function getCharacterClassSummary(character) {
  const classes = character.classes ?? []

  if (classes.length === 0) {
    return 'Classe non indicata'
  }

  return classes
    .map((characterClass) => {
      const subclass = characterClass.subclass ? ` (${characterClass.subclass})` : ''

      return `${characterClass.name}${subclass} ${characterClass.level ?? 0}`
    })
    .join(' / ')
}

function snapshotCharacter(character) {
  const snapshot = cloneJson(character)

  if (!snapshot) {
    return null
  }

  delete snapshot.progressionSnapshots

  return snapshot
}

function getLevelUpReportChanges(draft) {
  const changes = [
    `${draft.preview.classLevel.className} ${draft.preview.classLevel.from} -> ${draft.preview.classLevel.to}`,
    `PF massimi ${draft.hp.maxHpFrom} -> ${draft.hp.maxHpTo}`,
  ]

  if (draft.constitutionHpAdjustment > 0) {
    changes.push(`PF retroattivi da COS +${draft.constitutionHpAdjustment}`)
  }

  ;(draft.preview.automaticChanges ?? [])
    .filter((change) => change.category === 'combat')
    .forEach((change) => {
      changes.push(`${change.label}: ${change.from} -> ${change.to}`)
    })

  ;(draft.classChoices ?? []).forEach((choice) => {
    const labels = (choice.labels ?? []).join(', ')

    if (labels) {
      changes.push(`${choice.label}: ${labels}`)
    }
  })

  ;(draft.subclassSpellChoices ?? []).forEach((choice) => {
    const labels = (choice.labels ?? []).join(', ')

    if (labels) {
      changes.push(`${choice.label}: ${labels}`)
    }
  })

  ;(draft.invocationChoices ?? []).forEach((choice) => {
    const labels = (choice.labels ?? []).join(', ')

    if (labels) {
      changes.push(`${choice.label}: ${labels}`)
    }
  })

  if (draft.asiOrFeat?.feat) {
    changes.push(`Talento: ${draft.asiOrFeat.feat.name}`)
  }

  ;(draft.asiOrFeat?.abilityIncreases ?? []).forEach((increase) => {
    changes.push(`${increase.ability.toUpperCase()} ${increase.from} -> ${increase.to}`)
  })

  return changes
}

export function createProgressionSnapshot(character, options = {}) {
  const level = getTotalLevel(character) || character.level || 1
  const createdAt = options.createdAt ?? new Date().toISOString()

  return {
    id: options.id ?? `snapshot-lv-${level}-${createdAt}`,
    type: options.type ?? 'snapshot',
    level,
    label: options.label ?? `Livello ${level}`,
    classSummary: getCharacterClassSummary(character),
    createdAt,
    sourceHistoryId: options.sourceHistoryId ?? null,
    changes: options.changes ?? [],
    character: snapshotCharacter(character),
  }
}

function ensureProgressionSnapshots(character) {
  const snapshots = character.progressionSnapshots ?? []

  if (snapshots.length > 0) {
    return snapshots
  }

  return [
    createProgressionSnapshot(character, {
      id: `snapshot-baseline-lv-${getTotalLevel(character) || character.level || 1}`,
      type: 'baseline',
      label: `Livello ${getTotalLevel(character) || character.level || 1}`,
      changes: ['Stato iniziale registrato prima della nuova progressione.'],
    }),
  ]
}

function getHistoryLevel(entry) {
  return entry.toLevel ?? entry.totalLevel?.to ?? entry.level ?? null
}

function getHistoryChanges(entry) {
  const changes = []

  if (entry.type === 'creation') {
    changes.push(`Creazione come ${entry.className ?? 'classe iniziale'}`)
  }

  if (entry.classLevel) {
    changes.push(`${entry.classLevel.className} ${entry.classLevel.from} -> ${entry.classLevel.to}`)
  }

  if (entry.hp) {
    changes.push(`PF massimi ${entry.hp.maxHpFrom} -> ${entry.hp.maxHpTo}`)
  }

  ;(entry.classChoices ?? []).forEach((choice) => {
    const labels = (choice.labels ?? []).join(', ')

    if (labels) {
      changes.push(`${choice.label}: ${labels}`)
    }
  })

  ;(entry.subclassSpellChoices ?? []).forEach((choice) => {
    const labels = (choice.labels ?? []).join(', ')

    if (labels) {
      changes.push(`${choice.label}: ${labels}`)
    }
  })

  ;(entry.invocationChoices ?? []).forEach((choice) => {
    const labels = (choice.labels ?? []).join(', ')

    if (labels) {
      changes.push(`${choice.label}: ${labels}`)
    }
  })

  return changes
}

export function getProgressionReport(character) {
  const snapshots = (character.progressionSnapshots ?? [])
    .map((snapshot) => ({
      ...snapshot,
      hasSnapshot: Boolean(snapshot.character),
      changes: snapshot.changes ?? [],
    }))

  if (snapshots.length > 0) {
    return snapshots.sort((a, b) => a.level - b.level)
  }

  return (character.progressionHistory ?? [])
    .map((entry) => ({
      id: entry.id,
      type: entry.type,
      level: getHistoryLevel(entry),
      label: getHistoryLevel(entry) ? `Livello ${getHistoryLevel(entry)}` : 'Passaggio',
      classSummary: entry.className ?? getCharacterClassSummary(character),
      createdAt: entry.appliedAt ?? null,
      changes: getHistoryChanges(entry),
      hasSnapshot: false,
      character: null,
    }))
    .filter((entry) => entry.level)
    .sort((a, b) => a.level - b.level)
}

export function extractCharacterFromProgressionSnapshot(character, snapshotId) {
  const report = getProgressionReport(character)
  const selectedSnapshot = report.find((snapshot) => snapshot.id === snapshotId && snapshot.character)

  if (!selectedSnapshot) {
    return null
  }

  const extractedAt = new Date().toISOString()
  const sourceCharacter = selectedSnapshot.character
  const newId = `${character.id ?? 'pg'}_branch_lv${selectedSnapshot.level}_${Date.now()}`
  const newName = `${sourceCharacter.name ?? character.name} - ramo lv ${selectedSnapshot.level}`
  const keptSnapshots = report
    .filter((snapshot) => snapshot.hasSnapshot && snapshot.level <= selectedSnapshot.level)
    .map((snapshot) => ({
      ...snapshot,
      character: {
        ...snapshot.character,
        id: newId,
        name: newName,
        ownerId: character.ownerId,
      },
    }))

  return {
    ...sourceCharacter,
    id: newId,
    ownerId: character.ownerId,
    name: newName,
    notes: [
      sourceCharacter.notes,
      `Estratto da ${character.name ?? 'personaggio'} al livello ${selectedSnapshot.level} il ${extractedAt}.`,
    ].filter(Boolean).join('\n\n'),
    progressionSnapshots: keptSnapshots,
    progressionBranches: [
      ...(sourceCharacter.progressionBranches ?? []),
      {
        id: `branch-${extractedAt}`,
        sourceCharacterId: character.id,
        sourceCharacterName: character.name,
        sourceSnapshotId: selectedSnapshot.id,
        sourceLevel: selectedSnapshot.level,
        createdAt: extractedAt,
      },
    ],
  }
}

function getProficiencyBonus(totalLevel){
    const bonus = 2 + Math.floor((totalLevel - 1) / 4)

    return Math.min(6, bonus)
}

function getAbilityModifier(score){
    return Math.floor((score - 10) / 2)
}

function findCharacterClass(character, className){
    const classes = character.classes ?? []

     return classes.find((characterClass) => {
        return characterClass.name === className
    })
}

function getClassHitDie(className) {
  return CLASS_HIT_DICE[className]
}

function getClassRule(className) {
  return CLASS_RULES[className] ?? null
}

function getSubclassSpellcastingRule(className, subclassName) {
  if (!subclassName) {
    return null
  }

  return SUBCLASS_SPELLCASTING_RULES[`${className}:${subclassName}`] ?? null
}

function getSubclassLevelChoices(character, className, nextClassLevel) {
  const subclassName = findCharacterClass(character, className)?.subclass

  if (!subclassName) {
    return []
  }

  return SUBCLASS_LEVEL_CHOICES[`${className}:${subclassName}`]?.[nextClassLevel] ?? []
}

function getExplicitSubclassChoicePowerIds(className, subclassName, classLevel) {
  return new Set(
    (SUBCLASS_LEVEL_CHOICES[`${className}:${subclassName}`]?.[classLevel] ?? [])
      .map((choice) => choice.sourcePowerId)
      .filter(Boolean)
  )
}

function getEffectiveSpellcastingRule(character, className, subclassName = null) {
  const classRule = getClassRule(className)

  if (classRule?.spellcasting) {
    return classRule
  }

  const currentSubclassName = subclassName ?? findCharacterClass(character, className)?.subclass

  return getSubclassSpellcastingRule(className, currentSubclassName)
}

function getSpellcastingAbilityForClass(character, className, subclassName = null) {
  const rule = getEffectiveSpellcastingRule(character, className, subclassName)

  return rule?.ability ?? CLASS_SPELLCASTING_ABILITIES[className] ?? null
}

function getClassEquipmentRule(className) {
  const ruleId = getClassRule(className)?.id ?? slugify(className)

  return startingEquipmentCatalog.class_equipment?.[ruleId] ?? null
}

function formatTrainingList(values = [], labels = {}) {
  return values.map((value) => labels[value] ?? value)
}

function formatWeaponTraining(training = []) {
  return training.flatMap((entry) => {
    if (entry.type === 'category') {
      return formatTrainingList(entry.categories ?? [], WEAPON_TRAINING_LABELS)
    }

    if (entry.type === 'filtered') {
      const category = WEAPON_TRAINING_LABELS[entry.category] ?? entry.category
      const properties = [
        ...(entry.propertiesAny ?? []).map((property) => property),
        ...(entry.propertiesAll ?? []).map((property) => property),
      ].join(', ')

      return properties
        ? [`${category} (${properties})`]
        : [category]
    }

    return []
  })
}

function formatFixedToolTraining(training = []) {
  return training
    .filter((entry) => entry.type === 'fixed')
    .flatMap((entry) => entry.ids ?? [])
    .map((toolId) => toolId
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' '))
}

function getEquipmentMulticlassGrants(className) {
  const training = getClassEquipmentRule(className)?.multiclassTraining

  if (!training) {
    return {}
  }

  return {
    armor: formatTrainingList(training.armorTraining ?? [], ARMOR_TRAINING_LABELS),
    weapons: formatWeaponTraining(training.weaponTraining ?? []),
    tools: formatFixedToolTraining(training.toolTraining ?? []),
  }
}

function getClassDisplayLevel(characterClass) {
  if (!characterClass) {
    return 0
  }

  return characterClass.level ?? 0
}

function getExistingClassNames(character) {
  return (character.classes ?? []).map((characterClass) => characterClass.name)
}

function getSkillOptionById(skillId) {
  return SKILL_OPTIONS.find((skill) => skill.id === skillId)
}

function getKnownSkillIds(character) {
  return (character.skills ?? [])
    .filter((skill) => skill.proficient)
    .map((skill) => skill.id)
}

function getKnownSpellIds(character) {
  return new Set((character.spellcasting?.spells ?? []).map((spell) => spell.id))
}

function isSpellOnClassList(spellId, className) {
  const spellListId = CLASS_SPELL_LIST_IDS[className]
  const spell = findSpellById(spellId)

  return Boolean(spellListId && (spell?.classes ?? []).includes(spellListId))
}

function isPreparedClassSpellForClass(character, spell, className) {
  if (!spell?.prepared || spell.alwaysPrepared) {
    return false
  }

  if (spell.source === className || spell.className === className) {
    return true
  }

  const casterClasses = (character.classes ?? []).filter((characterClass) => {
    return Boolean(CLASS_SPELL_LIST_IDS[characterClass.name])
  })

  return !spell.source && casterClasses.length === 1 && isSpellOnClassList(spell.id, className)
}

function getClassSpellOptions(character, choice) {
  const spellListId = CLASS_SPELL_LIST_IDS[choice.spellListClass ?? choice.className]
  const knownSpellIds = getKnownSpellIds(character)

  return spellsCatalog.spells
    .filter((spell) => (spell.classes ?? []).includes(spellListId))
    .filter((spell) => spell.level >= (choice.minSpellLevel ?? 0))
    .filter((spell) => spell.level <= (choice.maxSpellLevel ?? 9))
    .filter((spell) => !knownSpellIds.has(spell.id))
    .map((spell) => ({
      id: spell.id,
      label: spell.level > 0 ? `Liv. ${spell.level} - ${spell.name}` : spell.name,
      level: spell.level,
      spell,
    }))
    .sort((a, b) => {
      if (a.level !== b.level) {
        return a.level - b.level
      }

      return a.label.localeCompare(b.label, 'it')
    })
}

function getSpellOptions(character, choice, predicate = null) {
  const knownSpellIds = getKnownSpellIds(character)

  return spellsCatalog.spells
    .filter((spell) => spell.level >= (choice.minSpellLevel ?? 0))
    .filter((spell) => spell.level <= (choice.maxSpellLevel ?? 9))
    .filter((spell) => !choice.ritualOnly || spell.ritual || spell.ritual_possible)
    .filter((spell) => !knownSpellIds.has(spell.id))
    .filter((spell) => predicate ? predicate(spell) : true)
    .map((spell) => ({
      id: spell.id,
      label: spell.level > 0 ? `Liv. ${spell.level} - ${spell.name}` : spell.name,
      level: spell.level,
      spell,
    }))
    .sort((a, b) => {
      if (a.level !== b.level) {
        return a.level - b.level
      }

      return a.label.localeCompare(b.label, 'it')
    })
}

function getKnownWarlockCantripOptions(character, predicate) {
  return (character.spellcasting?.spells ?? [])
    .filter((spell) => (spell.level ?? 0) === 0)
    .filter((spell) => !spell.source || spell.source === 'Warlock')
    .map((spell) => {
      const catalogSpell = findSpellById(spell.id)
      const spellText = `${catalogSpell?.description ?? ''} ${spell.description ?? ''}`.toLowerCase()

      return {
        ...spell,
        catalogSpell,
        spellText,
      }
    })
    .filter((spell) => predicate(spell.spellText, spell.catalogSpell ?? spell))
    .map((spell) => ({
      id: spell.id,
      label: spell.catalogSpell?.name ?? spell.name ?? spell.id,
      level: 0,
      spell: spell.catalogSpell ?? spell,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'it'))
}

function getKnownInvocationIds(character) {
  const invocationIds = new Set(
    (powersCatalog.powers ?? [])
      .filter((power) => power.source === 'Warlock' && (power.tags ?? []).includes('Supplica'))
      .map((power) => power.id)
  )
  const powers = character.powers ?? []
  const features = character.features ?? []

  return new Set(
    [...powers, ...features]
      .map((item) => item.id ?? item.powerId)
      .filter(Boolean)
      .filter((id) => invocationIds.has(id))
  )
}

function hasWarlockCantrip(character, predicate) {
  return (character.spellcasting?.spells ?? []).some((spell) => {
    if ((spell.level ?? 0) !== 0) {
      return false
    }

    if (spell.source && spell.source !== 'Warlock') {
      return false
    }

    const catalogSpell = spellsCatalog.spells.find((candidate) => candidate.id === spell.id)
    const spellText = `${catalogSpell?.description ?? ''} ${spell.description ?? ''}`.toLowerCase()

    return predicate(spellText, catalogSpell ?? spell)
  })
}

function hasWarlockDamageCantrip(character) {
  return hasWarlockCantrip(character, (spellText) => spellText.includes('dann'))
}

function hasWarlockAttackDamageCantrip(character) {
  return hasWarlockCantrip(character, (spellText) => {
    return spellText.includes('dann') && spellText.includes('attacco')
  })
}

function getWarlockInvocationOptions(character, choice) {
  const knownInvocationIds = getKnownInvocationIds(character)
  const selectedInThisLevel = new Set(choice.selectedIds ?? [])
  const availableInvocationIds = new Set([...knownInvocationIds, ...selectedInThisLevel])
  const warlockLevel = choice.classLevel ?? findCharacterClass(character, 'Warlock')?.level ?? 1
  const hasDamageCantrip = hasWarlockDamageCantrip(character)
  const hasAttackDamageCantrip = hasWarlockAttackDamageCantrip(character)

  return (powersCatalog.powers ?? [])
    .filter((power) => (
      power.source_type === 'class' &&
      power.source === 'Warlock' &&
      power.kind === 'choice' &&
      (power.tags ?? []).includes('Supplica')
    ))
    .filter((power) => !knownInvocationIds.has(power.id))
    .filter((power) => {
      const prerequisite = WARLOCK_INVOCATION_PREREQUISITES[power.id] ?? {}

      if ((prerequisite.minWarlockLevel ?? 1) > warlockLevel) {
        return false
      }

      if (prerequisite.requiresInvocation && !availableInvocationIds.has(prerequisite.requiresInvocation)) {
        return false
      }

      if (prerequisite.damageCantrip && !hasDamageCantrip) {
        return false
      }

      if (prerequisite.attackDamageCantrip && !hasAttackDamageCantrip) {
        return false
      }

      return true
    })
    .map((power) => ({
      id: power.id,
      label: power.name,
      summary: power.quick_effect,
      level: WARLOCK_INVOCATION_PREREQUISITES[power.id]?.minWarlockLevel ?? 1,
      power,
    }))
    .sort((a, b) => {
      if (a.level !== b.level) {
        return a.level - b.level
      }

      return a.label.localeCompare(b.label, 'it')
    })
}

function getChoiceOptions(character, choice) {
  if (choice.optionSource === 'proficient_skills') {
    return (character.skills ?? [])
      .filter((skill) => skill.proficient)
      .map((skill) => ({
        id: skill.id,
        label: skill.label ?? SKILL_LABELS[skill.id] ?? skill.id,
      }))
  }

  if (choice.optionSource === 'class_spells') {
    return getClassSpellOptions(character, choice)
  }

  if (choice.optionSource === 'all_spells') {
    return getSpellOptions(character, choice)
  }

  if (choice.optionSource === 'known_warlock_damage_cantrips') {
    return getKnownWarlockCantripOptions(character, (spellText) => spellText.includes('dann'))
  }

  if (choice.optionSource === 'known_warlock_attack_damage_cantrips') {
    return getKnownWarlockCantripOptions(character, (spellText) => {
      return spellText.includes('dann') && spellText.includes('attacco')
    })
  }

  if (choice.optionSource === 'warlock_invocations') {
    return getWarlockInvocationOptions(character, choice)
  }

  const optionLabels = {
    ...SKILL_LABELS,
    ...Object.fromEntries(WEAPON_MASTERY_OPTIONS.map((option) => [option.id, option.label])),
    ...Object.fromEntries(LANGUAGE_OPTIONS.map((option) => [option.id, option.label])),
    ...(choice.optionLabels ?? {}),
  }

  return (choice.options ?? []).map((optionId) => ({
    id: optionId,
    label: optionLabels[optionId] ?? optionId,
    ...(choice.optionMeta?.[optionId] ?? {}),
  }))
}

function hydrateChoice(character, choice) {
  return {
    ...choice,
    options: getChoiceOptions(character, choice),
  }
}

function getClassFeatureChanges(className, classLevel) {
  const rule = getClassRule(className)
  const manualFeatures = rule?.levelFeatures?.[classLevel] ?? []
  const catalogFeatures = (powersCatalog.powers ?? [])
    .filter((power) => {
      return (
        power.source_type === 'class' &&
        power.source === className &&
        power.level === classLevel &&
        power.kind !== 'choice'
      )
    })
    .filter((power) => !METAMAGIC_POWER_IDS.has(power.id))
    .map((power) => ({
      id: power.id,
      label: power.name,
      powerId: power.id,
      source: power.source,
      summary: power.quick_effect,
    }))
  const byId = new Map()

  ;[...catalogFeatures, ...manualFeatures].forEach((feature) => {
    if (!feature?.id) return

    byId.set(feature.id, {
      ...(byId.get(feature.id) ?? {}),
      ...feature,
    })
  })

  return [...byId.values()].map((feature) => ({
    id: `feature_${feature.id}`,
    label: feature.label,
    from: 'Non presente',
    to: 'Ottieni',
    category: 'feature',
    feature,
  }))
}

function getSubclassFeatureChanges(className, subclassName, classLevel) {
  const explicitChoicePowerIds = getExplicitSubclassChoicePowerIds(className, subclassName, classLevel)

  return getSubclassPowers(className, subclassName, classLevel)
    .filter((power) => {
      return power.kind !== 'choice' && !explicitChoicePowerIds.has(power.id)
    })
    .map((power) => ({
      id: `subclass_feature_${power.id}`,
      label: power.name,
      from: 'Non presente',
      to: 'Ottieni',
      category: 'feature',
      feature: {
        id: power.id,
        label: power.name,
        powerId: power.id,
        source: power.subsource,
        category: 'subclass',
        kind: power.kind ?? 'feature',
        summary: power.quick_effect,
      },
    }))
}

function getFeatureEffectChanges(character, className, classLevel) {
  if (className !== 'Ranger' || classLevel !== 6) {
    return []
  }

  const currentSpeed = Number(character.combat?.speed ?? 0)
  const nextSpeed = currentSpeed > 0 ? currentSpeed + 3 : null

  return [
    {
      id: 'ranger_girovago_speed',
      label: 'Velocita',
      from: currentSpeed || 'Non indicata',
      to: nextSpeed ?? '+3 m',
      category: 'combat',
      field: 'speed',
      mode: 'increase',
      amount: 3,
    },
    {
      id: 'ranger_girovago_climb_swim',
      label: 'Movimento scalare/nuotare',
      from: 'Non presente',
      to: nextSpeed ? `${nextSpeed} m` : 'pari alla velocita',
      category: 'combat',
      field: 'movementModes',
      movementModes: ['climb', 'swim'],
      valueFromSpeed: true,
    },
  ]
}

function getClassResourceGrantPreview(character, className, nextClassLevel) {
  const grant = getClassResourceEntry(character, className, nextClassLevel)

  if (!grant) {
    return null
  }

  const resource = (character.resources ?? []).find((item) => item.id === grant.id)

  if (resource) {
    return null
  }

  return {
    id: `resource_${grant.id}`,
    label: grant.label,
    from: 'Non presente',
    to: `${grant.max}/${grant.max}`,
    category: 'resource',
    resource: grant,
  }
}

function meetsPrerequisite(character, prerequisite) {
  if (prerequisite.ability) {
    return (character.abilities?.[prerequisite.ability] ?? 0) >= prerequisite.min
  }

  if (prerequisite.abilityAny) {
    return prerequisite.abilityAny.some((ability) => {
      return (character.abilities?.[ability] ?? 0) >= prerequisite.min
    })
  }

  return true
}

function getPrerequisiteLabel(prerequisite) {
  const minScore = Math.max(prerequisite.min ?? 0, MULTICLASS_MIN_SCORE)

  if (prerequisite.ability) {
    return `${ABILITY_LABELS[prerequisite.ability] ?? prerequisite.ability.toUpperCase()} ${minScore}`
  }

  if (prerequisite.abilityAny) {
    const labels = prerequisite.abilityAny
      .map((ability) => ABILITY_LABELS[ability] ?? ability.toUpperCase())
      .join(' o ')

    return `${labels} ${minScore}`
  }

  return 'Prerequisito speciale'
}

function getClassPrerequisiteItems(character, className) {
  const prerequisites = getClassRule(className)?.multiclassPrerequisites ?? []

  return prerequisites.map((prerequisite) => {
    const normalizedPrerequisite = {
      ...prerequisite,
      min: Math.max(prerequisite.min ?? 0, MULTICLASS_MIN_SCORE),
    }

    return {
      className,
      label: `${className}: ${getPrerequisiteLabel(normalizedPrerequisite)}`,
      met: meetsPrerequisite(character, normalizedPrerequisite),
    }
  })
}

function getMulticlassPrerequisiteResult(character, className) {
  const classNames = [
    ...getExistingClassNames(character),
    className,
  ].filter(Boolean)
  const uniqueClassNames = [...new Set(classNames)]
  const items = uniqueClassNames.flatMap((currentClassName) => {
    return getClassPrerequisiteItems(character, currentClassName)
  })

  return {
    met: items.every((item) => item.met),
    items,
  }
}

function getClassLevelChoices(character, className, nextClassLevel, nextTotalLevel, isNewClass) {
  const rule = getClassRule(className)
  const subclassOptions = getSubclassOptions(className)
  const subclassChoices =
    nextClassLevel === 3 && subclassOptions.length > 0
      ? [
        {
          id: `${rule?.id ?? slugify(className)}_3_subclass`,
          label: 'Sottoclasse',
          type: 'subclass_choice',
          count: 1,
          options: subclassOptions.map((option) => option.id),
          optionLabels: Object.fromEntries(
            subclassOptions.map((option) => [option.id, option.label])
          ),
          optionMeta: Object.fromEntries(
            subclassOptions.map((option) => [option.id, { subclassName: option.subclassName }])
          ),
          summary: 'Scegli la sottoclasse ottenuta al livello 3.',
        },
      ]
      : []
  const choices = [
    ...(isNewClass ? (rule?.multiclassChoices ?? []) : []),
    ...(rule?.levelChoices?.[nextClassLevel] ?? []),
    ...subclassChoices,
    ...getSubclassLevelChoices(character, className, nextClassLevel),
    ...getSpellcastingChoiceRequirements(character, className, nextClassLevel),
    ...getWarlockInvocationChoiceRequirements(character, className, nextClassLevel),
    ...getCatalogChoiceAcknowledgements(character, className, nextClassLevel),
    ...getLevelChoiceRequirements(className, nextClassLevel, nextTotalLevel),
  ]

  return choices.map((choice) => hydrateChoice(character, choice))
}

function getCatalogChoiceAcknowledgements(character, className, nextClassLevel) {
  const subclassLevelChoices = getSubclassLevelChoices(character, className, nextClassLevel)
  const explicitChoiceIds = new Set(
    [
      ...(getClassRule(className)?.levelChoices?.[nextClassLevel] ?? []),
      ...subclassLevelChoices,
    ]
      .flatMap((choice) => [choice.id, choice.sourcePowerId].filter(Boolean))
  )
  const ignoredNamePatterns = [
    /aumento dei punteggi/i,
    /dono epico/i,
    /sottoclasse/i,
    /incantesimi$/i,
    /incantesimi del/i,
    /incantesimi psionici/i,
    /incantesimi draconici/i,
    /incantesimi meccanici/i,
    /magia del patto/i,
    /suppliche occulte/i,
  ]
  const classChoices = (powersCatalog.powers ?? [])
    .filter((power) => (
      power.source_type === 'class' &&
      power.source === className &&
      power.level === nextClassLevel &&
      power.kind === 'choice'
    ))
  const subclassName = findCharacterClass(character, className)?.subclass
  const subclassChoices = subclassName
    ? (powersCatalog.powers ?? []).filter((power) => (
      power.source_type === 'subclass' &&
      power.source === className &&
      power.subsource === subclassName &&
      power.level === nextClassLevel &&
      power.kind === 'choice'
    ))
    : []

  return [...classChoices, ...subclassChoices]
    .filter((power) => !explicitChoiceIds.has(power.id))
    .filter((power) => !ignoredNamePatterns.some((pattern) => pattern.test(power.name ?? '')))
    .map((power) => ({
      id: `${power.id}_acknowledge`,
      label: power.name,
      type: 'acknowledge',
      sourcePowerId: power.id,
      summary: power.quick_effect ?? 'Privilegio con scelta da confermare secondo il manuale.',
    }))
}

function countClassSpells(character, className, levelPredicate) {
  return (character.spellcasting?.spells ?? []).filter((spell) => {
    return isPreparedClassSpellForClass(character, spell, className) && levelPredicate(spell.level ?? 0)
  }).length
}

function getSpellcastingChoiceRequirements(character, className, nextClassLevel) {
  const rule = SPELLCASTING_CHOICE_RULES[className]

  if (!rule) {
    return []
  }

  const choices = []
  const targetCantrips = rule.cantripsKnown?.[nextClassLevel]
  const knownCantrips = countClassSpells(character, className, (level) => level === 0)
  const cantripsToChoose = Math.max(0, (targetCantrips ?? 0) - knownCantrips)

  if (cantripsToChoose > 0) {
    choices.push({
      id: `${slugify(className)}_${nextClassLevel}_cantrips`,
      label: `Trucchetti da ${className}`,
      type: 'cantrip_choice',
      count: cantripsToChoose,
      className,
      optionSource: 'class_spells',
      minSpellLevel: 0,
      maxSpellLevel: 0,
      summary: `Scegli ${cantripsToChoose} trucchetti da ${className}.`,
    })
  }

  const targetPrepared = rule.preparedSpells?.[nextClassLevel]
  const knownLeveledSpells = countClassSpells(character, className, (level) => level > 0)
  const spellsToChoose = Math.max(0, (targetPrepared ?? 0) - knownLeveledSpells)

  if (spellsToChoose > 0) {
    const maxSpellLevel = rule.maxSpellLevel?.[nextClassLevel]
      ?? getMaxSpellLevelForClassLevel(className, nextClassLevel)
      ?? 1

    choices.push({
      id: `${slugify(className)}_${nextClassLevel}_spells`,
      label: `Incantesimi da ${className}`,
      type: 'spell_choice',
      count: spellsToChoose,
      className,
      optionSource: 'class_spells',
      minSpellLevel: 1,
      maxSpellLevel,
      summary: `Scegli ${spellsToChoose} incantesimi da ${className} di livello 1-${maxSpellLevel}.`,
    })
  }

  return choices
}

export function getSubclassSpellcastingChoiceRequirements(character, className, subclassName, nextClassLevel) {
  const rule = getSubclassSpellcastingRule(className, subclassName)

  if (!rule) {
    return []
  }

  const choices = []
  const knownSpellIds = getKnownSpellIds(character)
  const fixedCantripsToGrant = (rule.fixedCantrips ?? []).filter((spell) => {
    return !knownSpellIds.has(spell.id)
  })
  const targetCantrips = rule.cantripsKnown?.[nextClassLevel]
  const knownCantrips = countClassSpells(character, className, (level) => level === 0)
  const cantripsToChoose = Math.max(0, (targetCantrips ?? 0) - knownCantrips - fixedCantripsToGrant.length)

  if (cantripsToChoose > 0) {
    choices.push({
      id: `${slugify(className)}_${slugify(subclassName)}_${nextClassLevel}_cantrips`,
      label: `Trucchetti da ${subclassName}`,
      type: 'cantrip_choice',
      count: cantripsToChoose,
      className,
      spellListClass: rule.spellListClass,
      optionSource: 'class_spells',
      minSpellLevel: 0,
      maxSpellLevel: 0,
      summary: `Scegli ${cantripsToChoose} trucchetti dalla lista da ${rule.spellListClass}.`,
    })
  }

  const targetPrepared = rule.preparedSpells?.[nextClassLevel]
  const knownLeveledSpells = countClassSpells(character, className, (level) => level > 0)
  const spellsToChoose = Math.max(0, (targetPrepared ?? 0) - knownLeveledSpells)

  if (spellsToChoose > 0) {
    const maxSpellLevel = getMaxSpellLevelForClassLevel(className, nextClassLevel, character, subclassName)

    choices.push({
      id: `${slugify(className)}_${slugify(subclassName)}_${nextClassLevel}_spells`,
      label: `Incantesimi da ${subclassName}`,
      type: 'spell_choice',
      count: spellsToChoose,
      className,
      spellListClass: rule.spellListClass,
      optionSource: 'class_spells',
      minSpellLevel: 1,
      maxSpellLevel,
      summary: `Scegli ${spellsToChoose} incantesimi dalla lista da ${rule.spellListClass} di livello 1-${maxSpellLevel}.`,
    })
  }

  return choices.map((choice) => hydrateChoice(character, choice))
}

function getWarlockInvocationChoiceRequirements(character, className, nextClassLevel) {
  if (className !== 'Warlock') {
    return []
  }

  const targetKnown = WARLOCK_INVOCATIONS_KNOWN[nextClassLevel] ?? 0
  const knownCount = getKnownInvocationIds(character).size
  const invocationsToChoose = Math.max(0, targetKnown - knownCount)

  if (invocationsToChoose <= 0) {
    return []
  }

  return [
    {
      id: `warlock_${nextClassLevel}_eldritch_invocations`,
      label: 'Suppliche Occulte',
      type: 'eldritch_invocation_choice',
      count: invocationsToChoose,
      className,
      classLevel: nextClassLevel,
      optionSource: 'warlock_invocations',
      summary: `Scegli ${invocationsToChoose} suppliche occulte valide per Warlock ${nextClassLevel}.`,
    },
  ]
}

export function getWarlockInvocationSubchoiceRequirements(character, invocationIds = [], classLevel = 1) {
  return [...new Set(invocationIds)]
    .flatMap((invocationId) => {
      const invocation = (powersCatalog.powers ?? []).find((power) => power.id === invocationId)

      return (WARLOCK_INVOCATION_CHOICE_RULES[invocationId] ?? []).map((choice) => ({
        ...choice,
        id: `${invocationId}_${choice.id}`,
        sourceInvocationId: invocationId,
        sourceInvocationName: invocation?.name ?? invocationId,
        className: 'Warlock',
        classLevel,
      }))
    })
    .map((choice) => hydrateChoice(character, choice))
}

function formatReplacementRule(rule, label) {
  if (!rule) {
    return null
  }

  if (rule.mode === 'all') {
    return rule.from === 'spellbook'
      ? `${label}: puoi ripreparare tutta la lista dal libro`
      : `${label}: puoi ripreparare tutta la lista`
  }

  if (rule.mode === 'up_to') {
    return `${label}: puoi sostituire fino a ${rule.count}`
  }

  return null
}

function getSpellReplacementNotes(className) {
  const rules = SPELL_REPLACEMENT_RULES[className]

  if (!rules) {
    return []
  }

  const levelUpNotes = [
    formatReplacementRule(rules.levelUp?.cantrips, 'trucchetti al level-up'),
    formatReplacementRule(rules.levelUp?.preparedSpells, 'incantesimi al level-up'),
    rules.levelUp?.spellbookAdditions
      ? `libro incantesimi: aggiungi ${rules.levelUp.spellbookAdditions.count} incantesimi al level-up`
      : null,
  ].filter(Boolean)
  const longRestNotes = [
    formatReplacementRule(rules.longRest?.cantrips, 'trucchetti al riposo lungo'),
    formatReplacementRule(rules.longRest?.preparedSpells, 'incantesimi al riposo lungo'),
  ].filter(Boolean)

  return [
    ...(levelUpNotes.length > 0 ? [`Level-up: ${levelUpNotes.join('; ')}.`] : []),
    ...(longRestNotes.length > 0 ? [`Riposo lungo: ${longRestNotes.join('; ')}.`] : []),
  ]
}

export function getSpellReplacementRules(className) {
  return SPELL_REPLACEMENT_RULES[className] ?? null
}

function getSpellReplacementPreview(className) {
  const notes = getSpellReplacementNotes(className)

  if (notes.length === 0) {
    return null
  }

  return {
    id: 'spell_replacement_rules',
    label: 'Cambio incantesimi',
    from: 'Regola classe',
    to: notes.join(' '),
    category: 'spell_management',
  }
}

export function getClassSpellChoiceRequirements(character, className, classLevel) {
  return getSpellcastingChoiceRequirements(character, className, classLevel)
    .map((choice) => hydrateChoice(character, choice))
}

export function buildClassSpellChoicesDraft(character, className, classLevel, selectedChoices = {}) {
  const requirements = getClassSpellChoiceRequirements(character, className, classLevel)
  const choices = requirements.map((choice) => {
    return buildGenericChoiceDraft(choice, selectedChoices?.[choice.id] ?? [])
  })
  const warnings = choices.flatMap((choice) => choice.warnings)

  return {
    requirements,
    choices,
    warnings,
    readyToApply: warnings.length === 0,
  }
}

export function applyClassSpellChoiceDraft(character, className, classLevel, choiceDraft) {
  if (!choiceDraft?.readyToApply) {
    return character
  }

  return {
    ...character,
    spellcasting: applyClassSpellChoices(
      character,
      {
        preview: {
          classLevel: {
            className,
            to: classLevel,
          },
        },
        classChoices: choiceDraft.choices,
      },
      character.spellcasting ?? {
        ability: CLASS_SPELLCASTING_ABILITIES[className] ?? null,
        preparedCount: 0,
        slots: [],
        spells: [],
      }
    ),
  }
}

function getCasterLevelForCharacter(character, classOverride = null) {
  const hasOverrideClass = (character.classes ?? []).some((characterClass) => {
    return classOverride?.className === characterClass.name
  })
  const currentTotal = (character.classes ?? []).reduce((total, characterClass) => {
    const overrideLevel =
      classOverride?.className === characterClass.name
        ? classOverride.level
        : characterClass.level
    const rule = getClassRule(characterClass.name)

    if (rule?.spellcasting === 'full') {
      return total + (overrideLevel ?? 0)
    }

    return total
  }, 0)

  if (classOverride && !hasOverrideClass) {
    const rule = getClassRule(classOverride.className)

    if (rule?.spellcasting === 'full') {
      return currentTotal + (classOverride.level ?? 0)
    }
  }

  return currentTotal
}

function getSlotMaxByLevel(character) {
  const slots = character.spellcasting?.slots ?? []

  return Object.fromEntries(slots.map((slot) => [`${slot.level}:${slot.resetOn ?? 'long_rest'}`, slot.max]))
}

function getSpellSlotTable(rule) {
  if (rule?.spellcasting === 'full') {
    return FULL_CASTER_SLOT_TABLE
  }

  if (rule?.spellcasting === 'half') {
    return HALF_CASTER_SLOT_TABLE
  }

  if (rule?.spellcasting === 'third') {
    return THIRD_CASTER_SLOT_TABLE
  }

  if (rule?.spellcasting === 'pact') {
    return PACT_MAGIC_SLOT_TABLE
  }

  return null
}

function getMaxSpellLevelForClassLevel(className, classLevel, character = null, subclassName = null) {
  const rule = character
    ? getEffectiveSpellcastingRule(character, className, subclassName)
    : getClassRule(className)
  const slotTable = getSpellSlotTable(rule)
  const slots = slotTable?.[getSpellSlotProgressionLevel(classLevel, rule)] ?? []

  return Math.max(0, ...slots.map((slot) => slot.level ?? 0))
}

function getSpellSlotProgressionLevel(characterClassLevel, rule) {
  if (
    rule?.spellcasting === 'full' ||
    rule?.spellcasting === 'half' ||
    rule?.spellcasting === 'third' ||
    rule?.spellcasting === 'pact'
  ) {
    return characterClassLevel
  }

  return 0
}

function getSpellSlotPreview(character, className, nextClassLevel, subclassName = null) {
  const rule = getEffectiveSpellcastingRule(character, className, subclassName)
  const slotTable = getSpellSlotTable(rule)

  if (!slotTable) {
    return null
  }

  const currentClassLevel = findCharacterClass(character, className)?.level ?? 0
  const currentCasterLevel = getSpellSlotProgressionLevel(currentClassLevel, rule)
  const nextCasterLevel = getSpellSlotProgressionLevel(nextClassLevel, rule)

  if (currentCasterLevel === nextCasterLevel) {
    return null
  }

  const currentSlots = getSlotMaxByLevel(character)
  const nextSlots = slotTable[nextCasterLevel]

  if (!nextSlots) {
    return null
  }

  const changed = nextSlots.some((slot) => {
    const key = `${slot.level}:${slot.resetOn ?? 'long_rest'}`

    return currentSlots[key] !== slot.max
  })

  if (!changed) {
    return null
  }

  return {
    id: 'spell_slots',
    label: 'Slot incantesimo',
    from: Object.entries(currentSlots)
      .map(([key, max]) => `L${key.split(':')[0]}: ${max}`)
      .join(', ') || 'Nessuno',
    to: nextSlots.map((slot) => `L${slot.level}: ${slot.max}`).join(', '),
    category: 'spell_slots',
    slots: nextSlots,
  }
}

export function getLevelUpOptions(character) {
  const totalLevel = getTotalLevel(character)
  const existingClassNames = getExistingClassNames(character)
  const currentClasses = (character.classes ?? []).map((characterClass) => ({
    id: `continue_${characterClass.name}`,
    mode: 'class_level',
    className: characterClass.name,
    label: `${characterClass.name} ${characterClass.level ?? 0} -> ${(characterClass.level ?? 0) + 1}`,
    available: true,
    reason: 'Classe gia presente.',
    prerequisiteItems: [],
  }))

  const multiclassOptions = CLASS_ORDER
    .filter((className) => !existingClassNames.includes(className))
    .map((className) => {
      const targetPrerequisiteResult = getMulticlassPrerequisiteResult(character, className)
      const prerequisiteItems = targetPrerequisiteResult.items

      return {
        id: `multiclass_${className}`,
        mode: 'multiclass',
        className,
        label: `${className} 1`,
        available: totalLevel >= 1 && targetPrerequisiteResult.met,
        reason: targetPrerequisiteResult.met
          ? 'Nuova classe disponibile.'
          : `Prerequisiti: ${prerequisiteItems.map((item) => item.label).join(', ')}`,
        prerequisiteItems,
      }
    })

  return [...currentClasses, ...multiclassOptions]
}

/**
 * se salendo di livello cambia una risorsa di classe, prepara un change
 * 
 */
function getClassResourcePreview(character, className, nextClassLevel) {
  const nextResource = getClassResourceEntry(character, className, nextClassLevel)

  if (!nextResource) {
    return null
  }

  const resource = (character.resources ?? []).find((characterResource) => {
    return characterResource.id === nextResource.id
  })

  if (!resource || resource.max === nextResource.max) {
    return null
  }

  return {
    id: `${nextResource.id}_max`,
    label: `${nextResource.label} massimo`,
    from: resource.max,
    to: nextResource.max,
    category: 'resource',
    resource: nextResource,
  }
}

function getHpChoiceRequirement(character, className) {
  const hitDie = getClassHitDie(className)
  const constitutionModifier = getAbilityModifier(character.abilities?.con ?? 10)

  return {
    id: 'hp_increase',
    label: 'Aumento punti ferita',
    type: 'hp_roll_or_average',
    hitDie,
    constitutionModifier,
  }
}

function getMulticlassTrainingPreview(className) {
  const grants = getEquipmentMulticlassGrants(className)
  const grantLabels = [
    ...(grants.armor ?? []),
    ...(grants.weapons ?? []),
    ...(grants.tools ?? []),
  ]

  if (grantLabels.length === 0) {
    return null
  }

  return {
    id: `${slugify(className)}_multiclass_training`,
    label: 'Competenze multiclasse',
    from: 'Non presenti',
    to: grantLabels.join(', '),
    category: 'proficiency',
    grants,
  }
}

function getLevelChoiceRequirements(className, nextClassLevel, nextTotalLevel) {
  const choices = []
  const asiLevels = ASI_LEVELS_BY_CLASS[className] ?? GENERIC_ASI_LEVELS

  if (asiLevels.includes(nextClassLevel)) {
    choices.push({
      id: `${className.toLowerCase()}_${nextClassLevel}_asi_or_feat`,
      label: 'Aumento caratteristiche oppure talento',
      type: 'asi_or_feat',
      allowAsi: true,
      featChoice: {
        allowedCategories: ['Generale'],
        requirePrerequisites: true,
        characterLevel: nextTotalLevel,
      },
      source: {
        className,
        level: nextClassLevel,
      },
    })
  }

  if (nextClassLevel === EPIC_BOON_LEVEL) {
    choices.push({
      id: `${className.toLowerCase()}_${nextClassLevel}_epic_boon`,
      label: 'Dono epico',
      type: 'asi_or_feat',
      allowAsi: false,
      featChoice: {
        allowedCategories: ['Dono epico'],
        requirePrerequisites: true,
        characterLevel: nextTotalLevel,
      },
      source: {
        className,
        level: nextClassLevel,
      },
    })
  }

  return choices
}

export function getLevelUpPreview(character, className) {
  const characterClass = findCharacterClass(character, className)
  const isNewClass = !characterClass
  const classRule = getClassRule(className)
  const prerequisiteResult = isNewClass
    ? getMulticlassPrerequisiteResult(character, className)
    : { met: true, items: [] }

  if (!classRule) {
    return {
      type: 'level_up_preview',
      characterId: character.id,
      totalLevel: null,
      classLevel: null,
      proficiencyBonus: null,
      automaticChanges: [],
      requiredChoices: [],
      optionalChoices: [],
      warnings: [`Classe ${className} non gestita dalla progressione.`],
    }
  }

  if (isNewClass && !prerequisiteResult.met) {
    return {
      type: 'level_up_preview',
      characterId: character.id,
      totalLevel: null,
      classLevel: {
        className,
        from: 0,
        to: 1,
      },
      proficiencyBonus: null,
      automaticChanges: [],
      requiredChoices: [],
      optionalChoices: [],
      mode: 'multiclass',
      prerequisiteItems: prerequisiteResult.items,
      warnings: [`Prerequisiti multiclass non soddisfatti per ${className}.`],
    }
  }

  const totalLevelFrom = getTotalLevel(character)
  const totalLevelTo = totalLevelFrom + 1

  const classLevelFrom = getClassDisplayLevel(characterClass)
  const classLevelTo = classLevelFrom + 1

  const proficiencyFrom = getProficiencyBonus(totalLevelFrom)
  const proficiencyTo = getProficiencyBonus(totalLevelTo)

  const proficiencyBonus = {
    from: proficiencyFrom,
    to: proficiencyTo,
    changed: proficiencyFrom !== proficiencyTo,
  }

  const hitDie = getClassHitDie(className)

  const automaticChanges = [
    {
      id: 'total_level',
      label: 'Livello totale',
      from: totalLevelFrom,
      to: totalLevelTo,
    },
    {
      id: 'class_level',
      label: className,
      from: classLevelFrom,
      to: classLevelTo,
    },
    isNewClass
      ? {
        id: 'class_added',
        label: 'Nuova classe',
        from: 'Assente',
        to: `${className} 1`,
      }
      : {
        id: 'hit_dice_max',
        label: 'Dadi vita massimi',
        from: `${classLevelFrom}${hitDie}`,
        to: `${classLevelTo}${hitDie}`,
      },
  ]

  if (isNewClass) {
    automaticChanges.push({
      id: 'hit_dice_max',
      label: 'Dado vita multiclass',
      from: '0',
      to: `1${hitDie}`,
    })

    const multiclassTraining = getMulticlassTrainingPreview(className)

    if (multiclassTraining) {
      automaticChanges.push(multiclassTraining)
    }
  }

  if (proficiencyBonus.changed) {
    automaticChanges.push({
      id: 'proficiency_bonus',
      label: 'Bonus competenza',
      from: proficiencyFrom,
      to: proficiencyTo,
    })
  }

  const resourceChange = getClassResourcePreview(
    character,
    className,
    classLevelTo
  )

  if (resourceChange) {
    automaticChanges.push(resourceChange)
  }

  const resourceGrant = getClassResourceGrantPreview(character, className, classLevelTo)

  if (resourceGrant) {
    automaticChanges.push(resourceGrant)
  }

  automaticChanges.push(...getClassFeatureChanges(className, classLevelTo))
  automaticChanges.push(...getFeatureEffectChanges(character, className, classLevelTo))

  if (characterClass?.subclass) {
    automaticChanges.push(
      ...getSubclassFeatureChanges(className, characterClass.subclass, classLevelTo)
    )
  }

  if (classLevelTo === 3 && getSubclassOptions(className).length > 0) {
    automaticChanges.push({
      id: 'subclass_unlock',
      label: 'Sottoclasse',
      from: characterClass?.subclass ?? 'Non scelta',
      to: 'Da scegliere',
      category: 'subclass',
    })
  }

  const spellSlotChange = getSpellSlotPreview(character, className, classLevelTo)

  if (spellSlotChange) {
    automaticChanges.push(spellSlotChange)
  }

  const spellReplacementPreview = getSpellReplacementPreview(className)

  if (spellReplacementPreview) {
    automaticChanges.push(spellReplacementPreview)
  }

  const requiredChoices = [
    getHpChoiceRequirement(character, className),
    ...getClassLevelChoices(character, className, classLevelTo, totalLevelTo, isNewClass),
  ]

  return {
    type: 'level_up_preview',
    characterId: character.id,
    mode: isNewClass ? 'multiclass' : 'class_level',
    prerequisiteItems: prerequisiteResult.items,
    totalLevel: {
      from: totalLevelFrom,
      to: totalLevelTo,
    },
    classLevel: {
      className,
      from: classLevelFrom,
      to: classLevelTo,
    },
    proficiencyBonus,
    automaticChanges,
    requiredChoices,
    optionalChoices: [],
    warnings: [],
  }
}

function getHitDieSize(hitDie) {
  return Number(String(hitDie).replace('d', ''))
}

function getAverageHpIncrease(hitDie) {
  const hitDieSize = getHitDieSize(hitDie)

  return Math.floor(hitDieSize / 2) + 1
}

function buildHpDraft(character, preview, hpChoice) {
  const hpRequirement = preview.requiredChoices.find((choice) => {
    return choice.id === 'hp_increase'
  })

  const hitDie = hpRequirement?.hitDie
  const constitutionModifier = hpRequirement?.constitutionModifier ?? 0
  const maxHpFrom = character.combat?.hp?.max ?? 0
  const warnings = []

  if (!hpRequirement) {
    warnings.push('Scelta aumento PF non presente nella preview.')
  }

  const hitDieSize = getHitDieSize(hitDie)

  if (!hitDieSize) {
    warnings.push(`Dado vita non valido: ${hitDie}.`)
  }

  let baseIncrease = 0

  if (hpChoice?.mode === 'average') {
    baseIncrease = getAverageHpIncrease(hitDie)
  } else if (hpChoice?.mode === 'manual') {
    baseIncrease = Number(hpChoice.rolled)

    if (!baseIncrease || baseIncrease < 1 || baseIncrease > hitDieSize) {
      warnings.push(`Tiro PF non valido: ${hpChoice.rolled}.`)
    }
  } else {
    warnings.push('Modalita aumento PF non valida.')
  }

  const totalIncrease = baseIncrease + constitutionModifier
  const maxHpTo = maxHpFrom + totalIncrease

  return {
    mode: hpChoice?.mode,
    hitDie,
    baseIncrease,
    constitutionModifier,
    totalIncrease,
    maxHpFrom,
    maxHpTo,
    warnings,
  }
}

function buildAsiDraft(character, asiChoice) {
  const warnings = []
  const increases = (asiChoice?.increases ?? []).filter((increase) => {
    return (Number(increase.amount) || 0) > 0
  })
  const allowedAbilities = ['str', 'dex', 'con', 'int', 'wis', 'cha']
  const totalIncrease = increases.reduce((total, increase) => {
    return total + (increase.amount ?? 0)
  }, 0)

  if (increases.length === 0) {
    warnings.push('Nessun aumento caratteristica selezionato.')
  }

  if (totalIncrease !== 2) {
    warnings.push('Un ASI deve distribuire 2 punti caratteristica.')
  }

  const increasesByAbility = increases.reduce((result, increase) => {
    const ability = increase.ability
    const amount = increase.amount ?? 0

    return {
      ...result,
      [ability]: (result[ability] ?? 0) + amount,
    }
  }, {})

  const abilityIncreases = Object.entries(increasesByAbility).map(([ability, amount]) => {
    const from = character.abilities?.[ability] ?? 0
    const to = from + amount

    if (!allowedAbilities.includes(ability)) {
      warnings.push(`Caratteristica non valida: ${ability}.`)
    }

    if (amount < 1 || amount > 2) {
      warnings.push(`Aumento non valido per ${ability}: ${amount}.`)
    }

    if (to > 20) {
      warnings.push(`La caratteristica ${ability} supererebbe 20.`)
    }

    return {
      ability,
      amount,
      from,
      to,
    }
  })

  return {
    mode: 'asi',
    abilityIncreases,
    warnings,
  }
}

function buildFeatDraft(character, requirement, featChoice) {
  const warnings = []
  const feat = findFeatById(featChoice?.featId)

  if (!feat) {
    warnings.push(`Talento non trovato: ${featChoice?.featId}.`)

    return {
      mode: 'feat',
      feat: null,
      warnings,
    }
  }

  const availableFeats = getAvailableFeats(character, requirement.featChoice)
  const isAvailable = availableFeats.some((availableFeat) => {
    return availableFeat.id === feat.id
  })

  if (!isAvailable) {
    warnings.push(`Talento non disponibile per questa scelta: ${feat.name}.`)
  }

  const choiceDraft = buildFeatChoiceDraft(character, feat, featChoice?.featChoices ?? {})
  warnings.push(...choiceDraft.warnings)

  return {
    mode: 'feat',
    feat: {
      id: feat.id,
      name: feat.name,
      category: feat.category,
      summary: feat.summary,
      effects: feat.effects ?? [],
      choices: feat.choices ?? [],
      grantedSpells: feat.grantedSpells ?? [],
    },
    choiceDraft,
    warnings,
  }
}

function buildAsiOrFeatDraft(character, preview, asiOrFeatChoice) {
  const requirement = preview.requiredChoices.find((choice) => {
    return choice.type === 'asi_or_feat'
  })

  if (!requirement) {
    return null
  }

  if (!asiOrFeatChoice) {
    return {
      mode: null,
      warnings: ['Scelta ASI/talento non compilata.'],
    }
  }

  if (asiOrFeatChoice.mode === 'asi') {
    if (requirement.allowAsi === false) {
      return {
        mode: 'asi',
        abilityIncreases: [],
        warnings: [`${requirement.label} richiede un talento valido, non un aumento caratteristiche.`],
      }
    }

    return buildAsiDraft(character, asiOrFeatChoice)
  }

  if (asiOrFeatChoice.mode === 'feat') {
    return buildFeatDraft(character, requirement, asiOrFeatChoice)
  }

  return {
    mode: asiOrFeatChoice.mode,
    warnings: ['Modalita ASI/talento non valida.'],
  }
}

function hasDuplicateItems(items) {
  return new Set(items).size !== items.length
}

function getChoiceLabel(choice, selectedId) {
  const option = (choice.options ?? []).find((candidate) => candidate.id === selectedId)

  return option?.label ?? selectedId
}

function buildGenericChoiceDraft(choice, selectedIds = []) {
  const selected = selectedIds.filter(Boolean)
  const warnings = []
  const optionIds = new Set((choice.options ?? []).map((option) => option.id))

  if (choice.type === 'acknowledge') {
    if (!selected.includes('acknowledged')) {
      warnings.push(`Conferma la scelta: ${choice.label}.`)
    }

    return {
      id: choice.id,
      label: choice.label,
      type: choice.type,
      sourcePowerId: choice.sourcePowerId,
      sourceInvocationId: choice.sourceInvocationId,
      sourceInvocationName: choice.sourceInvocationName,
      selected,
      labels: selected,
      warnings,
    }
  }

  if (selected.length !== choice.count) {
    warnings.push(`Scegli ${choice.count} opzioni per ${choice.label}.`)
  }

  if (hasDuplicateItems(selected)) {
    warnings.push(`Non scegliere due volte la stessa opzione per ${choice.label}.`)
  }

  if (selected.some((selectedId) => !optionIds.has(selectedId))) {
    warnings.push(`Una scelta non e valida per ${choice.label}.`)
  }

  return {
    id: choice.id,
    label: choice.label,
    type: choice.type,
    sourcePowerId: choice.sourcePowerId,
    sourceInvocationId: choice.sourceInvocationId,
    sourceInvocationName: choice.sourceInvocationName,
    selected,
    labels: selected.map((selectedId) => getChoiceLabel(choice, selectedId)),
    selectedOptions: selected.map((selectedId) => {
      return (choice.options ?? []).find((candidate) => candidate.id === selectedId) ?? null
    }),
    meta: Object.fromEntries(
      selected.map((selectedId) => {
        const option = (choice.options ?? []).find((candidate) => candidate.id === selectedId)

        return [selectedId, option ?? null]
      })
    ),
    warnings,
  }
}

function buildClassChoicesDraft(preview, choices) {
  const classChoiceRequirements = (preview.requiredChoices ?? []).filter((choice) => {
    return !['hp_roll_or_average', 'asi_or_feat'].includes(choice.type)
  })

  return classChoiceRequirements.map((choice) => {
    return buildGenericChoiceDraft(choice, choices?.classChoices?.[choice.id] ?? [])
  })
}

function getAbilitiesAfterAsiDraft(character, asiOrFeat) {
  const nextAbilities = { ...(character.abilities ?? {}) }

  ;(asiOrFeat?.abilityIncreases ?? []).forEach((increase) => {
    nextAbilities[increase.ability] = increase.to
  })

  return nextAbilities
}

function getSubclassNameFromDraftOrCharacter(character, preview, classChoices = []) {
  const subclassChoice = classChoices.find((choice) => choice.type === 'subclass_choice')
  const selectedId = subclassChoice?.selected?.[0]

  if (selectedId) {
    return subclassChoice.meta?.[selectedId]?.subclassName ?? subclassChoice.labels?.[0] ?? null
  }

  return findCharacterClass(character, preview.classLevel?.className)?.subclass ?? null
}

function buildSubclassSpellChoicesDraft(character, preview, choices, classChoices) {
  const className = preview.classLevel?.className
  const subclassName = getSubclassNameFromDraftOrCharacter(character, preview, classChoices)

  if (!className || !subclassName) {
    return []
  }

  return getSubclassSpellcastingChoiceRequirements(
    character,
    className,
    subclassName,
    preview.classLevel.to
  ).map((requirement) => {
    return buildGenericChoiceDraft(
      requirement,
      choices?.subclassSpellChoices?.[requirement.id] ?? []
    )
  })
}

function getSelectedInvocationIdsFromClassChoices(classChoices = []) {
  return classChoices
    .filter((choice) => choice.type === 'eldritch_invocation_choice')
    .flatMap((choice) => choice.selected ?? [])
}

function buildInvocationSubchoiceDrafts(character, preview, choices, classChoices) {
  const invocationIds = getSelectedInvocationIdsFromClassChoices(classChoices)
  const requirements = getWarlockInvocationSubchoiceRequirements(
    character,
    invocationIds,
    preview.classLevel?.to ?? 1
  )

  return requirements.map((requirement) => {
    return buildGenericChoiceDraft(
      requirement,
      choices?.invocationChoices?.[requirement.id] ?? []
    )
  })
}

export function buildLevelUpDraft(character, preview, choices) {
  const hp = buildHpDraft(character, preview, choices?.hpIncrease)
  const asiOrFeat = buildAsiOrFeatDraft(character, preview, choices?.asiOrFeat)
  const classChoices = buildClassChoicesDraft(preview, choices)
  const subclassSpellChoices = buildSubclassSpellChoicesDraft(character, preview, choices, classChoices)
  const invocationChoices = buildInvocationSubchoiceDrafts(character, preview, choices, classChoices)
  const constitutionHpAdjustment = getConstitutionHpAdjustment(
    character,
    getAbilitiesAfterAsiDraft(character, asiOrFeat),
    preview.totalLevel?.to
  )
  const warnings = [
    ...hp.warnings,
    ...(asiOrFeat?.warnings ?? []),
    ...classChoices.flatMap((choice) => choice.warnings),
    ...subclassSpellChoices.flatMap((choice) => choice.warnings),
    ...invocationChoices.flatMap((choice) => choice.warnings),
  ]

  return {
    type: 'level_up_draft',
    characterId: character.id,
    preview,
    hp,
    constitutionHpAdjustment,
    asiOrFeat,
    classChoices,
    subclassSpellChoices,
    invocationChoices,
    choices,
    readyToApply: warnings.length === 0,
    warnings,
  }
}

function applyAutomaticResourceChanges(character, preview) {
  const resources = [...(character.resources ?? [])]
  const resourceGrants = (preview.automaticChanges ?? []).filter((change) => {
    return change.category === 'resource' && change.resource
  })

  resourceGrants.forEach((change) => {
    const exists = resources.some((resource) => resource.id === change.resource.id)

    if (!exists) {
      resources.push({ ...change.resource })
    }
  })

  const resourceChanges = (preview.automaticChanges ?? []).filter((change) => {
    return change.id?.endsWith('_max')
  })

  if (resourceChanges.length === 0) {
    return resources
  }

  return resources.map((resource) => {
    const change = resourceChanges.find((candidate) => {
      return candidate.id === `${resource.id}_max`
    })

    if (!change) {
      return resource
    }

    const nextMax = Number(change.to)
    const previousMax = Number(change.from)
    const increase = Number.isNaN(nextMax) || Number.isNaN(previousMax)
      ? 0
      : nextMax - previousMax

    return {
      ...resource,
      ...(change.resource ?? {}),
      current: Math.min(nextMax, (resource.current ?? 0) + Math.max(0, increase)),
      max: nextMax,
    }
  })
}

function syncClassResourceScaling(character, resources = character.resources ?? []) {
  const nextResources = [...resources]

  getClassResourceEntries(character).forEach((expectedResource) => {
    const index = nextResources.findIndex((resource) => resource.id === expectedResource.id)

    if (index < 0) {
      nextResources.push(expectedResource)
      return
    }

    const currentResource = nextResources[index]
    const currentMax = Number(currentResource.max ?? 0)
    const nextMax = Number(expectedResource.max ?? 0)
    const increase = Math.max(0, nextMax - currentMax)

    nextResources[index] = {
      ...currentResource,
      ...expectedResource,
      current: Math.min(nextMax, Number(currentResource.current ?? 0) + increase),
      max: nextMax,
    }
  })

  return nextResources
}

function applyFeatureChanges(character, preview) {
  const existingFeatures = character.features ?? []
  const featureChanges = (preview.automaticChanges ?? []).filter((change) => {
    return change.category === 'feature' && change.feature
  })
  const nextFeatures = [...existingFeatures]

  featureChanges.forEach((change) => {
    const exists = nextFeatures.some((feature) => feature.id === change.feature.id)

    if (exists) {
      return
    }

    nextFeatures.push({
      id: change.feature.id,
      label: change.feature.label,
      level: preview.classLevel.to,
      source: change.feature.source ?? preview.classLevel.className,
      category: change.feature.category ?? 'class',
      kind: change.feature.kind ?? 'feature',
      summary: change.feature.summary ?? `Privilegio di ${preview.classLevel.className} ${preview.classLevel.to}.`,
    })
  })

  return nextFeatures
}

function applyClassChoiceFeatureChanges(character, draft) {
  const existingFeatures = character.features ?? []
  const nextFeatures = [...existingFeatures]

  ;(draft.classChoices ?? [])
    .filter((choice) => choice.type === 'simple_choice')
    .flatMap((choice) => {
      return (choice.selectedOptions ?? []).map((option) => ({
        id: `${choice.id}_${option.id}`,
        label: option.label ?? option.id,
        level: draft.preview.classLevel.to,
        source: `${draft.preview.classLevel.className} - ${choice.label}`,
        category: 'class_choice',
        kind: 'feature',
        summary: choice.summary,
        sourcePowerId: choice.sourcePowerId,
      }))
    })
    .forEach((feature) => {
      const exists = nextFeatures.some((existingFeature) => existingFeature.id === feature.id)

      if (!exists) {
        nextFeatures.push(feature)
      }
    })

  return nextFeatures
}

function applyPowerChanges(character, preview) {
  const existingPowers = character.powers ?? []
  const featureChanges = (preview.automaticChanges ?? []).filter((change) => {
    return change.category === 'feature' && change.feature?.powerId
  })
  const nextPowers = [...existingPowers]

  featureChanges.forEach((change) => {
    const exists = nextPowers.some((power) => power.id === change.feature.powerId)

    if (!exists) {
      nextPowers.push({ id: change.feature.powerId })
    }
  })

  return nextPowers
}

function applyAutomaticCombatChanges(character, preview, baseCombat) {
  const combatChanges = (preview.automaticChanges ?? []).filter((change) => {
    return change.category === 'combat'
  })
  let combat = { ...(baseCombat ?? character.combat ?? {}) }

  combatChanges.forEach((change) => {
    if (change.field === 'speed') {
      const currentSpeed = Number(combat.speed ?? character.combat?.speed ?? 0)

      combat = {
        ...combat,
        speed: change.mode === 'increase'
          ? currentSpeed + (change.amount ?? 0)
          : change.to,
      }
    }

    if (change.field === 'movementModes') {
      const speed = Number(combat.speed ?? character.combat?.speed ?? 0)
      const movement = { ...(combat.movement ?? {}) }

      ;(change.movementModes ?? []).forEach((mode) => {
        movement[mode] = change.valueFromSpeed ? speed : change.to
      })

      combat = {
        ...combat,
        movement,
      }
    }
  })

  return combat
}

function applyClassChoicePowerChanges(character, draft) {
  const existingPowers = character.powers ?? []
  const nextPowers = [...existingPowers]
  const invocationChoicesBySource = (draft.invocationChoices ?? []).reduce((result, choice) => {
    const sourceInvocationId = choice.sourceInvocationId

    if (!sourceInvocationId) {
      return result
    }

    return {
      ...result,
      [sourceInvocationId]: [
        ...(result[sourceInvocationId] ?? []),
        {
          id: choice.id,
          label: choice.label,
          selected: choice.selected,
          labels: choice.labels,
        },
      ],
    }
  }, {})

  ;(draft.classChoices ?? [])
    .filter((choice) => choice.type === 'eldritch_invocation_choice')
    .flatMap((choice) => choice.selectedOptions ?? [])
    .filter(Boolean)
    .forEach((option) => {
      const powerId = option.power?.id ?? option.id
      const exists = nextPowers.some((power) => power.id === powerId)

      if (!exists) {
        nextPowers.push({
          id: powerId,
          choices: invocationChoicesBySource[powerId] ?? [],
        })
      }
    })

  ;(draft.classChoices ?? [])
    .filter((choice) => choice.id === 'stregone_2_metamagic')
    .flatMap((choice) => choice.selected ?? [])
    .map((selectedId) => METAMAGIC_CHOICE_POWER_IDS[selectedId])
    .filter(Boolean)
    .forEach((powerId) => {
      const exists = nextPowers.some((power) => power.id === powerId)

      if (!exists) {
        nextPowers.push({ id: powerId })
      }
    })

  return nextPowers
}

function getSubclassChoiceFromDraft(draft) {
  return (draft.classChoices ?? []).find((choice) => {
    return choice.type === 'subclass_choice'
  })
}

function getSelectedSubclassName(draft) {
  const subclassChoice = getSubclassChoiceFromDraft(draft)
  const selectedId = subclassChoice?.selected?.[0]

  if (!selectedId) {
    return null
  }

  return subclassChoice.meta?.[selectedId]?.subclassName ?? subclassChoice.labels?.[0] ?? null
}

function getSelectedSubclassPowers(draft) {
  const subclassName = getSelectedSubclassName(draft)

  if (!subclassName) {
    return []
  }

  return getSubclassPowers(
    draft.preview.classLevel.className,
    subclassName,
    draft.preview.classLevel.to
  )
}

function applySubclassFeatureChanges(character, draft) {
  const existingFeatures = character.features ?? []
  const nextFeatures = [...existingFeatures]

  getSelectedSubclassPowers(draft).forEach((power) => {
    const exists = nextFeatures.some((feature) => feature.id === power.id)

    if (exists) {
      return
    }

    nextFeatures.push({
      id: power.id,
      label: power.name,
      level: power.level,
      source: power.subsource,
      category: 'subclass',
      kind: power.kind ?? 'feature',
      summary: power.quick_effect,
    })
  })

  return nextFeatures
}

function applySubclassPowerChanges(character, draft) {
  const existingPowers = character.powers ?? []
  const nextPowers = [...existingPowers]

  getSelectedSubclassPowers(draft).forEach((power) => {
    const exists = nextPowers.some((characterPower) => characterPower.id === power.id)

    if (!exists) {
      nextPowers.push({ id: power.id })
    }
  })

  return nextPowers
}

function applySpellSlotChanges(character, preview, subclassName = null) {
  const spellSlotChange = (preview.automaticChanges ?? []).find((change) => {
    return change.category === 'spell_slots'
  }) ?? getSpellSlotPreview(character, preview.classLevel.className, preview.classLevel.to, subclassName)

  if (!spellSlotChange) {
    return character.spellcasting ?? {
      ability: null,
      spellSaveDc: null,
      spellAttackBonus: null,
      preparedCount: 0,
      slots: [],
      spells: [],
    }
  }

  const currentSlots = character.spellcasting?.slots ?? []
  const nextSlots = (spellSlotChange.slots ?? []).map((slot) => {
    const currentSlot = currentSlots.find((item) => item.level === slot.level)

    return {
      id: currentSlot?.id ?? `slot_${slot.level}`,
      level: slot.level,
      label: currentSlot?.label ?? `Slot livello ${slot.level}`,
      current: Math.min(slot.max, (currentSlot?.current ?? 0) + Math.max(0, slot.max - (currentSlot?.max ?? 0))),
      max: slot.max,
      resetOn: slot.resetOn ?? currentSlot?.resetOn ?? 'long_rest',
    }
  })

  const ability = character.spellcasting?.ability
    ?? getSpellcastingAbilityForClass(character, preview.classLevel.className, subclassName)
  const abilityModifier = ability ? getAbilityModifier(character.abilities?.[ability] ?? 10) : null
  const proficiencyBonus = getProficiencyBonus(preview.totalLevel.to)

  return {
    ...(character.spellcasting ?? {}),
    ability,
    spellSaveDc: abilityModifier === null
      ? character.spellcasting?.spellSaveDc ?? null
      : 8 + abilityModifier + proficiencyBonus,
    spellAttackBonus: abilityModifier === null
      ? character.spellcasting?.spellAttackBonus ?? null
      : abilityModifier + proficiencyBonus,
    slots: nextSlots,
  }
}

function mergeSpells(existingSpells = [], additionalSpells = []) {
  const byId = new Map()

  ;[...existingSpells, ...additionalSpells].forEach((spell) => {
    if (!spell?.id) return

    byId.set(spell.id, {
      ...(byId.get(spell.id) ?? {}),
      ...spell,
    })
  })

  return [...byId.values()]
}

function buildClassGrantedSpellEntry(spellLike, className, ability) {
  const spell = findSpellById(spellLike.id)

  return {
    id: spellLike.id,
    name: spellLike.name ?? spell?.name ?? spellLike.id,
    level: spell?.level ?? spellLike.level,
    source: className,
    ability,
    prepared: true,
    classSpell: true,
    alwaysPrepared: spellLike.alwaysPrepared ?? true,
    freeCast: spellLike.freeCast ?? null,
  }
}

function buildPreparedClassSpellEntry(option, className, ability) {
  const spell = option?.spell ?? findSpellById(option?.id)

  return {
    id: option?.id ?? spell?.id,
    name: spell?.name ?? option?.label ?? option?.id,
    level: spell?.level ?? option?.level,
    source: className,
    ability,
    prepared: true,
    classSpell: true,
    preparedByClass: true,
  }
}

function buildInvocationSpellEntry(option, choice, ability) {
  const spell = option?.spell ?? findSpellById(option?.id)
  const sourceName = choice.sourceInvocationName
    ? `Warlock - ${choice.sourceInvocationName}`
    : 'Warlock'

  return {
    id: option?.id ?? spell?.id,
    name: spell?.name ?? option?.label ?? option?.id,
    level: spell?.level ?? option?.level,
    source: sourceName,
    ability,
    prepared: true,
    alwaysPrepared: true,
    invocationSpell: true,
    sourcePowerId: choice.sourceInvocationId,
  }
}

function getClassGrantedSpells(character, preview) {
  const className = preview.classLevel.className
  const rule = getClassRule(className)
  const spellAbility = character.spellcasting?.ability ?? CLASS_SPELLCASTING_ABILITIES[className] ?? null

  return (rule?.levelFeatures?.[preview.classLevel.to] ?? [])
    .flatMap((feature) => feature.grantedSpells ?? [])
    .map((spell) => buildClassGrantedSpellEntry(spell, className, spellAbility))
}

function getSubclassFixedSpellGrants(character, draft) {
  const className = draft.preview.classLevel.className
  const subclassName = getSubclassNameForDraft(character, draft)
  const rule = getSubclassSpellcastingRule(className, subclassName)
  const spellAbility = getSpellcastingAbilityForClass(character, className, subclassName)

  return (rule?.fixedCantrips ?? [])
    .map((spell) => buildClassGrantedSpellEntry({
      ...spell,
      level: 0,
      alwaysPrepared: true,
    }, className, spellAbility))
}

function getSubclassNameForDraft(character, draft) {
  return getSelectedSubclassName(draft)
    ?? findCharacterClass(character, draft.preview.classLevel.className)?.subclass
    ?? null
}

function getSubclassGrantedSpells(character, draft) {
  const className = draft.preview.classLevel.className
  const subclassName = getSubclassNameForDraft(character, draft)
  const spellAbility = character.spellcasting?.ability ?? CLASS_SPELLCASTING_ABILITIES[className] ?? null

  if (!subclassName) {
    return []
  }

  return (SUBCLASS_GRANTED_SPELLS[className]?.[subclassName] ?? [])
    .filter((entry) => entry.minLevel <= draft.preview.classLevel.to)
    .flatMap((entry) => entry.spells ?? [])
    .map((spell) => buildClassGrantedSpellEntry({
      ...spell,
      alwaysPrepared: true,
    }, subclassName, spellAbility))
}

function getPreparedSpellTarget(className, classLevel, character = null, subclassName = null) {
  const rule = character
    ? getEffectiveSpellcastingRule(character, className, subclassName)
    : SPELLCASTING_CHOICE_RULES[className]

  return rule?.preparedSpells?.[classLevel] ?? null
}

function applyClassSpellChoices(character, draft, spellcasting) {
  const className = draft.preview.classLevel.className
  const subclassName = getSubclassNameForDraft(character, draft)
  const ability = spellcasting.ability ?? getSpellcastingAbilityForClass(character, className, subclassName)
  const selectedSpellOptions = [
    ...(draft.classChoices ?? []),
    ...(draft.subclassSpellChoices ?? []),
  ]
    .filter((choice) => choice.type === 'spell_choice' || choice.type === 'cantrip_choice')
    .flatMap((choice) => choice.selectedOptions ?? Object.values(choice.meta ?? {}))
    .filter(Boolean)
  const preparedTarget = getPreparedSpellTarget(className, draft.preview.classLevel.to, character, subclassName)
  const chosenSpells = selectedSpellOptions
    .map((option) => buildPreparedClassSpellEntry(option, className, ability))
    .filter((spell) => spell.id)

  return {
    ...spellcasting,
    preparedCount: Math.max(spellcasting.preparedCount ?? 0, preparedTarget ?? 0),
    spells: mergeSpells(spellcasting.spells, chosenSpells),
  }
}

function applyInvocationSpellChoices(draft, spellcasting) {
  const ability = spellcasting.ability ?? CLASS_SPELLCASTING_ABILITIES.Warlock ?? 'cha'
  const selectedSpellOptions = (draft.invocationChoices ?? [])
    .filter((choice) => choice.type === 'spell_choice' || choice.type === 'cantrip_choice' || choice.type === 'ritual_spell_choice')
    .flatMap((choice) => {
      return (choice.selectedOptions ?? Object.values(choice.meta ?? {}))
        .filter(Boolean)
        .map((option) => ({ option, choice }))
    })
  const chosenSpells = selectedSpellOptions
    .map(({ option, choice }) => buildInvocationSpellEntry(option, choice, ability))
    .filter((spell) => spell.id)

  return {
    ...spellcasting,
    spells: mergeSpells(spellcasting.spells, chosenSpells),
  }
}

function getSpeciesChoiceFeatureForLevel(character, totalLevel) {
  const species = character.species
  const choice = species?.choice

  if (!species?.id || !choice?.id) {
    return null
  }

  const unlockLevel = choice.unlockLevel ?? 1

  if (unlockLevel > totalLevel) {
    return null
  }

  return {
    id: `${species.id}_${choice.ruleId ?? 'species_choice'}_${choice.id}`,
    label: choice.featureLabel ?? choice.label,
    level: unlockLevel,
    source: species.name ?? character.race ?? 'Specie',
    category: 'species',
    kind: 'lineage',
    summary: choice.summary,
  }
}

function getSpeciesSpellsForLevel(character, totalLevel) {
  const species = character.species
  const choice = species?.choice

  if (!choice?.spells) {
    return []
  }

  const source = [species.name, choice.displayName]
    .filter(Boolean)
    .join(' ')

  return choice.spells
    .filter((spell) => (spell.unlockLevel ?? 1) <= totalLevel)
    .map((spell) => ({
      id: spell.id,
      name: spell.name,
      level: spell.level,
      source,
      ability: choice.spellcastingAbility,
      prepared: true,
      speciesSpell: true,
      unlockLevel: spell.unlockLevel ?? 1,
    }))
}

function applySpeciesLevelChanges(character, totalLevel) {
  const speciesFeature = getSpeciesChoiceFeatureForLevel(character, totalLevel)
  const features = [...(character.features ?? [])]

  if (
    speciesFeature &&
    !features.some((feature) => feature.id === speciesFeature.id)
  ) {
    features.push(speciesFeature)
  }

  return {
    ...character,
    features,
    spellcasting: {
      ...(character.spellcasting ?? {}),
      spells: mergeSpells(
        character.spellcasting?.spells,
        getSpeciesSpellsForLevel(character, totalLevel)
      ),
    },
  }
}

function applyClassLevelChange(character, draft) {
  const className = draft.preview.classLevel.className
  const selectedSubclassName = getSelectedSubclassName(draft)
  const hasClass = (character.classes ?? []).some((characterClass) => {
    return characterClass.name === className
  })

  if (!hasClass) {
    return [
      ...(character.classes ?? []),
      {
        name: className,
        level: draft.preview.classLevel.to,
        ...(selectedSubclassName ? { subclass: selectedSubclassName } : {}),
      },
    ]
  }

  return (character.classes ?? []).map((characterClass) => {
    if (characterClass.name !== className) {
      return characterClass
    }

    return {
      ...characterClass,
      level: draft.preview.classLevel.to,
      ...(selectedSubclassName ? { subclass: selectedSubclassName } : {}),
    }
  })
}

function ensureSkillEntries(skills) {
  const existingIds = new Set((skills ?? []).map((skill) => skill.id))
  const missingSkills = SKILL_OPTIONS
    .filter((skill) => !existingIds.has(skill.id))
    .map((skill) => ({ ...skill, proficient: false }))

  return [...(skills ?? []), ...missingSkills]
}

function applyClassChoicesToSkills(character, classChoices) {
  let skills = ensureSkillEntries(character.skills ?? [])

  classChoices.forEach((choice) => {
    if (choice.type === 'skill_choice') {
      skills = skills.map((skill) => {
        if (!choice.selected.includes(skill.id)) {
          return skill
        }

        return {
          ...skill,
          proficient: true,
        }
      })
    }

    if (choice.type === 'expertise_choice') {
      skills = skills.map((skill) => {
        if (!choice.selected.includes(skill.id)) {
          return skill
        }

        return {
          ...skill,
          proficient: true,
          expertise: true,
        }
      })
    }
  })

  return skills
}

function mergeUniqueItems(items, additions) {
  return [...new Set([...(items ?? []), ...(additions ?? [])])]
}

function applyClassChoicesToProficiencies(character, draft) {
  const proficiencies = character.proficiencies ?? {}
  const className = draft.preview.classLevel.className
  const classRule = getClassRule(className)
  const equipmentGrants = getEquipmentMulticlassGrants(className)
  const grants = draft.preview.mode === 'multiclass'
    ? {
      ...equipmentGrants,
      ...(classRule?.multiclassGrants ?? {}),
    }
    : {}
  const weaponMasteries = draft.classChoices
    .filter((choice) => choice.type === 'weapon_mastery_choice')
    .flatMap((choice) => choice.labels)
  const languages = draft.classChoices
    .filter((choice) => choice.type === 'language_choice')
    .flatMap((choice) => choice.labels)

  return {
    ...proficiencies,
    armor: mergeUniqueItems(proficiencies.armor, grants.armor),
    weapons: mergeUniqueItems(proficiencies.weapons, grants.weapons),
    tools: mergeUniqueItems(proficiencies.tools, grants.tools),
    weaponMasteries: mergeUniqueItems(proficiencies.weaponMasteries, weaponMasteries),
    languages: mergeUniqueItems(proficiencies.languages, languages),
  }
}

function applyClassChoicesToLanguages(character, classChoices) {
  const selectedLanguages = classChoices
    .filter((choice) => choice.type === 'language_choice')
    .flatMap((choice) => choice.labels)

  return mergeUniqueItems(character.languages, selectedLanguages)
}

function applyAsiOrFeat(character, draft) {
  if (draft.asiOrFeat?.mode === 'asi') {
    const nextAbilities = { ...(character.abilities ?? {}) }

    ;(draft.asiOrFeat.abilityIncreases ?? []).forEach((increase) => {
      nextAbilities[increase.ability] = increase.to
    })

    return {
      abilities: nextAbilities,
      feats: character.feats ?? [],
    }
  }

  return {
    abilities: character.abilities ?? {},
    feats: character.feats ?? [],
  }
}

function getConstitutionHpAdjustment(character, nextAbilities, totalLevel) {
  const previousCon = character.abilities?.con ?? 10
  const nextCon = nextAbilities?.con ?? previousCon
  const previousModifier = getAbilityModifier(previousCon)
  const nextModifier = getAbilityModifier(nextCon)
  const modifierDelta = nextModifier - previousModifier

  if (modifierDelta <= 0) {
    return 0
  }

  return modifierDelta * Math.max(1, totalLevel ?? getTotalLevel(character) ?? 1)
}

export function repairSubclassGrantedSpells(character) {
  const classes = character.classes ?? []
  const additionalSpells = classes.flatMap((characterClass) => {
    const className = characterClass.name
    const subclassName = characterClass.subclass
    const spellAbility = character.spellcasting?.ability ?? CLASS_SPELLCASTING_ABILITIES[className] ?? null

    if (!subclassName) {
      return []
    }

    return (SUBCLASS_GRANTED_SPELLS[className]?.[subclassName] ?? [])
      .filter((entry) => entry.minLevel <= (characterClass.level ?? 0))
      .flatMap((entry) => entry.spells ?? [])
      .map((spell) => buildClassGrantedSpellEntry({
        ...spell,
        alwaysPrepared: true,
      }, subclassName, spellAbility))
  })
  const preparedTargets = classes
    .map((characterClass) => getPreparedSpellTarget(characterClass.name, characterClass.level ?? 0))
    .filter((target) => target !== null)
  const preparedCount = preparedTargets.length > 0
    ? Math.max(character.spellcasting?.preparedCount ?? 0, ...preparedTargets)
    : character.spellcasting?.preparedCount

  if (additionalSpells.length === 0 && preparedCount === character.spellcasting?.preparedCount) {
    return character
  }

  return {
    ...character,
    spellcasting: {
      ...(character.spellcasting ?? {}),
      preparedCount: preparedCount ?? character.spellcasting?.preparedCount ?? 0,
      spells: mergeSpells(character.spellcasting?.spells, additionalSpells),
    },
  }
}

export function applyLevelUpDraft(character, draft) {
  if (!draft?.readyToApply) {
    return character
  }

  const className = draft.preview.classLevel.className
  const hpIncrease = draft.hp.totalIncrease
  const currentHp = character.combat?.hp?.current ?? 0
  const hitDice = character.combat?.hitDice ?? {}
  const asiOrFeatResult = applyAsiOrFeat(character, draft)
  const constitutionHpAdjustment = draft.constitutionHpAdjustment
    ?? getConstitutionHpAdjustment(
      character,
      asiOrFeatResult.abilities,
      draft.preview.totalLevel.to
    )
  const draftWithAdjustments = {
    ...draft,
    constitutionHpAdjustment,
  }
  const appliedAt = new Date().toISOString()
  const powersWithClassFeatures = applyPowerChanges(character, draft.preview)
  const powersWithClassChoices = applyClassChoicePowerChanges(
    { ...character, powers: powersWithClassFeatures },
    draft
  )
  const featuresWithClassFeatures = applyFeatureChanges(character, draft.preview)
  const featuresWithClassChoices = applyClassChoiceFeatureChanges(
    { ...character, features: featuresWithClassFeatures },
    draft
  )
  const characterWithClassFeatures = {
    ...character,
    features: featuresWithClassChoices,
    powers: powersWithClassChoices,
  }
  const selectedSubclassNameForDraft = getSubclassNameForDraft(character, draft)
  const spellcastingWithSlotChanges = applySpellSlotChanges(
    character,
    draft.preview,
    selectedSubclassNameForDraft
  )
  const spellcastingWithClassGrants = {
    ...spellcastingWithSlotChanges,
    spells: mergeSpells(
      spellcastingWithSlotChanges.spells,
      [
        ...getClassGrantedSpells(character, draft.preview),
        ...getSubclassFixedSpellGrants(character, draft),
        ...getSubclassGrantedSpells(character, draft),
      ]
    ),
  }
  const spellcastingWithClassChoices = applyClassSpellChoices(
    character,
    draft,
    spellcastingWithClassGrants
  )
  const spellcastingWithChoices = applyInvocationSpellChoices(
    draft,
    spellcastingWithClassChoices
  )
  const hitDiceByType = {
    ...(hitDice.byType ?? {}),
    [draft.hp.hitDie]: (hitDice.byType?.[draft.hp.hitDie] ?? 0) + 1,
  }
  const baseCombat = {
    ...(character.combat ?? {}),
    hp: {
      ...(character.combat?.hp ?? {}),
      current: currentHp + hpIncrease + constitutionHpAdjustment,
      max: draft.hp.maxHpTo + constitutionHpAdjustment,
    },
    hitDice: {
      ...hitDice,
      current: (hitDice.current ?? 0) + 1,
      max: (hitDice.max ?? 0) + 1,
      type: hitDice.type ?? draft.hp.hitDie,
      byType: hitDiceByType,
    },
  }
  const historyEntry = {
    id: `level-up-${draft.preview.totalLevel.to}-${appliedAt}`,
    type: 'level_up',
    appliedAt,
    className,
    totalLevel: draft.preview.totalLevel,
    classLevel: draft.preview.classLevel,
    hp: draft.hp,
    constitutionHpAdjustment,
    asiOrFeat: draft.asiOrFeat,
    classChoices: draft.classChoices,
    subclassSpellChoices: draft.subclassSpellChoices,
    invocationChoices: draft.invocationChoices,
  }

  let updatedCharacter = applySpeciesLevelChanges({
    ...character,
    level: draft.preview.totalLevel.to,
    classes: applyClassLevelChange(character, draft),
    abilities: asiOrFeatResult.abilities,
    feats: asiOrFeatResult.feats,
    combat: applyAutomaticCombatChanges(character, draft.preview, baseCombat),
    resources: applyAutomaticResourceChanges(character, draft.preview),
    spellcasting: spellcastingWithChoices,
    skills: applyClassChoicesToSkills(character, draft.classChoices ?? []),
    proficiencies: applyClassChoicesToProficiencies(character, draft),
    languages: applyClassChoicesToLanguages(character, draft.classChoices ?? []),
    features: applySubclassFeatureChanges(characterWithClassFeatures, draft),
    powers: applySubclassPowerChanges(characterWithClassFeatures, draft),
    progressionHistory: [
      ...(character.progressionHistory ?? []),
      historyEntry,
    ],
  }, draft.preview.totalLevel.to)

  updatedCharacter = {
    ...updatedCharacter,
    resources: syncClassResourceScaling(updatedCharacter),
  }

  if (draft.asiOrFeat?.mode === 'feat' && draft.asiOrFeat.feat) {
    updatedCharacter = applyFeatDraftToCharacter(
      updatedCharacter,
      draft.asiOrFeat.feat,
      draft.asiOrFeat.choiceDraft,
      { source: 'Level up', level: draft.preview.totalLevel.to }
    )

    updatedCharacter = {
      ...updatedCharacter,
      resources: syncClassResourceScaling(updatedCharacter),
    }
  }

  return {
    ...updatedCharacter,
    progressionSnapshots: [
      ...ensureProgressionSnapshots(character),
      createProgressionSnapshot(updatedCharacter, {
        id: `snapshot-lv-${draft.preview.totalLevel.to}-${appliedAt}`,
        type: 'level_up',
        label: `Livello ${draft.preview.totalLevel.to}`,
        createdAt: appliedAt,
        sourceHistoryId: historyEntry.id,
        changes: getLevelUpReportChanges(draftWithAdjustments),
      }),
    ],
  }
}
