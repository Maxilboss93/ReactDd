import {
  applyLevelUpDraft,
  applyClassSpellChoiceDraft,
  buildClassSpellChoicesDraft,
  buildLevelUpDraft,
  createProgressionSnapshot,
  getLevelUpPreview,
} from './progressionService.js'
import { findFeatById } from './featsCatalog.js'
import {
  applyFeatDraftToCharacter,
  buildFeatChoiceDraft,
} from './featChoiceService.js'

const ABILITY_LABELS = {
  str: 'FOR',
  dex: 'DES',
  con: 'COS',
  int: 'INT',
  wis: 'SAG',
  cha: 'CAR',
}

const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8]

const POINT_BUY_COSTS = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
}

const POINT_BUY_BUDGET = 27
const POINT_BUY_SCORES = Object.keys(POINT_BUY_COSTS).map((score) => Number(score))

const CREATION_SPELL_SLOT_TABLES = {
  full_caster: {
    1: [{ level: 1, max: 2 }],
  },
  half_caster: {
    1: [{ level: 1, max: 2 }],
  },
  pact_magic: {
    1: [{ level: 1, max: 1, resetOn: 'short_rest' }],
  },
}

const STANDARD_ABILITIES_BY_CLASS = {
  barbaro: { str: 15, dex: 13, con: 14, int: 10, wis: 12, cha: 8 },
  bardo: { str: 8, dex: 14, con: 12, int: 13, wis: 10, cha: 15 },
  chierico: { str: 14, dex: 8, con: 13, int: 10, wis: 15, cha: 12 },
  druido: { str: 8, dex: 12, con: 14, int: 13, wis: 15, cha: 10 },
  guerriero: { str: 15, dex: 14, con: 13, int: 8, wis: 10, cha: 12 },
  ladro: { str: 12, dex: 15, con: 13, int: 14, wis: 10, cha: 8 },
  mago: { str: 8, dex: 12, con: 13, int: 15, wis: 14, cha: 10 },
  monaco: { str: 12, dex: 15, con: 13, int: 10, wis: 14, cha: 8 },
  paladino: { str: 15, dex: 10, con: 13, int: 8, wis: 12, cha: 14 },
  ranger: { str: 12, dex: 15, con: 13, int: 8, wis: 14, cha: 10 },
  stregone: { str: 10, dex: 13, con: 14, int: 8, wis: 12, cha: 15 },
  warlock: { str: 8, dex: 14, con: 13, int: 12, wis: 10, cha: 15 },
}

const DEFAULT_BASE_ABILITIES = STANDARD_ABILITIES_BY_CLASS.guerriero
const EMPTY_BASE_ABILITIES = Object.fromEntries(
  Object.keys(ABILITY_LABELS).map((ability) => [ability, ''])
)

const LEVEL_TWO_FEATURES_BY_CLASS = {
  barbaro: ['Attacco Irruento', 'Percezione del Pericolo'],
  bardo: ['Factotum', 'Maestria'],
  chierico: ['Incanalare Divinita', 'Scacciare Non Morti'],
  druido: ['Forma Selvatica', 'Compagno Selvatico'],
  guerriero: ["Impeto d'Azione", 'Mente Tattica'],
  ladro: ['Azione Scaltra'],
  mago: ['Studioso'],
  monaco: ['Concentrazione da Monaco', 'Movimento senza armatura'],
  paladino: ['Stile di combattimento', 'Punizione Divina'],
  ranger: ['Esploratore Esperto', 'Stile di Combattimento'],
  stregone: ['Fonte di Magia', 'Metamagia'],
  warlock: ['Scaltrezza Magica'],
}

const SKILLS = [
  { id: 'acrobatics', label: 'Acrobazia', ability: 'dex' },
  { id: 'athletics', label: 'Atletica', ability: 'str' },
  { id: 'sleight', label: 'Rapidita di Mano', ability: 'dex' },
  { id: 'stealth', label: 'Furtivita', ability: 'dex' },
  { id: 'arcana', label: 'Arcano', ability: 'int' },
  { id: 'history', label: 'Storia', ability: 'int' },
  { id: 'investigation', label: 'Investigazione', ability: 'int' },
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

const ALL_SKILL_IDS = SKILLS.map((skill) => skill.id)

const TOOL_OPTIONS = {
  artisan: [
    { id: 'alchemist_supplies', label: 'Scorte da alchimista' },
    { id: 'brewer_supplies', label: 'Scorte da birraio' },
    { id: 'calligrapher_supplies', label: 'Scorte da calligrafo' },
    { id: 'carpenter_tools', label: 'Strumenti da falegname' },
    { id: 'cartographer_tools', label: 'Strumenti da cartografo' },
    { id: 'cobbler_tools', label: 'Strumenti da calzolaio' },
    { id: 'cook_utensils', label: 'Utensili da cuoco' },
    { id: 'glassblower_tools', label: 'Strumenti da soffiatore' },
    { id: 'jeweler_tools', label: 'Strumenti da gioielliere' },
    { id: 'leatherworker_tools', label: 'Strumenti da conciatore' },
    { id: 'mason_tools', label: 'Strumenti da muratore' },
    { id: 'painter_tools', label: 'Strumenti da pittore' },
    { id: 'potter_tools', label: 'Strumenti da vasaio' },
    { id: 'smith_tools', label: 'Strumenti da fabbro' },
    { id: 'weaver_tools', label: 'Strumenti da tessitore' },
    { id: 'woodcarver_tools', label: 'Strumenti da intagliatore' },
  ],
  game: [
    { id: 'dice_set', label: 'Dadi' },
    { id: 'dragonchess_set', label: 'Scacchi dei draghi' },
    { id: 'playing_cards', label: 'Carte da gioco' },
    { id: 'three_dragon_ante', label: 'Tre Draghi al Buio' },
  ],
  musical: [
    { id: 'bagpipes', label: 'Cornamusa' },
    { id: 'drum', label: 'Tamburo' },
    { id: 'dulcimer', label: 'Dulcimer' },
    { id: 'flute', label: 'Flauto' },
    { id: 'horn', label: 'Corno' },
    { id: 'lute', label: 'Liuto' },
    { id: 'lyre', label: 'Lira' },
    { id: 'pan_flute', label: 'Flauto di pan' },
    { id: 'shawm', label: 'Ciaramella' },
    { id: 'viol', label: 'Viola' },
  ],
  other: [
    { id: 'forgery_kit', label: 'Arnesi da falsario' },
    { id: 'thieves_tools', label: 'Arnesi da scasso' },
    { id: 'herbalism_kit', label: 'Borsa da erborista' },
    { id: 'navigator_tools', label: 'Strumenti da navigatore' },
  ],
}

const TOOL_LABELS = Object.values(TOOL_OPTIONS)
  .flat()
  .reduce((labels, tool) => ({ ...labels, [tool.id]: tool.label }), {})

function toolChoice(categories, count = 1) {
  return { categories, count }
}

export const CLASS_OPTIONS = [
  { id: 'barbaro', name: 'Barbaro', hitDie: 'd12', primaryAbilities: ['str'], savingThrows: ['str', 'con'], skillChoices: { count: 2, options: ['animal', 'athletics', 'intimidation', 'nature', 'perception', 'survival'] }, featureNames: ['Ira', 'Difesa senza armatura'] },
  { id: 'bardo', name: 'Bardo', hitDie: 'd8', primaryAbilities: ['cha'], savingThrows: ['dex', 'cha'], skillChoices: { count: 3, options: ALL_SKILL_IDS }, toolChoices: toolChoice(['musical'], 3), spellcasting: { ability: 'cha', progression: 'full_caster' }, featureNames: ['Incantesimi', 'Ispirazione Bardica'] },
  { id: 'chierico', name: 'Chierico', hitDie: 'd8', primaryAbilities: ['wis'], savingThrows: ['wis', 'cha'], skillChoices: { count: 2, options: ['history', 'insight', 'medicine', 'persuasion', 'religion'] }, spellcasting: { ability: 'wis', progression: 'full_caster' }, featureNames: ['Incantesimi', 'Ordine Divino'] },
  { id: 'druido', name: 'Druido', hitDie: 'd8', primaryAbilities: ['wis'], savingThrows: ['int', 'wis'], skillChoices: { count: 2, options: ['animal', 'arcana', 'insight', 'medicine', 'nature', 'perception', 'religion', 'survival'] }, fixedTools: ['herbalism_kit'], spellcasting: { ability: 'wis', progression: 'full_caster' }, featureNames: ['Incantesimi', 'Druidico'] },
  { id: 'guerriero', name: 'Guerriero', hitDie: 'd10', primaryAbilities: ['str', 'dex'], savingThrows: ['str', 'con'], skillChoices: { count: 2, options: ['acrobatics', 'animal', 'athletics', 'history', 'insight', 'intimidation', 'perception', 'persuasion', 'survival'] }, featureNames: ['Stile di combattimento', 'Recuperare energie', 'Padronanza d\'armi'] },
  { id: 'ladro', name: 'Ladro', hitDie: 'd8', primaryAbilities: ['dex'], savingThrows: ['dex', 'int'], skillChoices: { count: 4, options: ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation', 'perception', 'persuasion', 'sleight', 'stealth'] }, fixedTools: ['thieves_tools'], featureNames: ['Maestria', 'Attacco furtivo', 'Gergo ladresco'] },
  { id: 'mago', name: 'Mago', hitDie: 'd6', primaryAbilities: ['int'], savingThrows: ['int', 'wis'], skillChoices: { count: 2, options: ['arcana', 'history', 'insight', 'investigation', 'medicine', 'nature', 'religion'] }, spellcasting: { ability: 'int', progression: 'full_caster' }, featureNames: ['Incantesimi', 'Recupero arcano'] },
  { id: 'monaco', name: 'Monaco', hitDie: 'd8', primaryAbilities: ['dex', 'wis'], savingThrows: ['str', 'dex'], skillChoices: { count: 2, options: ['acrobatics', 'athletics', 'history', 'insight', 'religion', 'stealth'] }, toolChoices: toolChoice(['artisan', 'musical'], 1), featureNames: ['Arti marziali', 'Difesa senza armatura'] },
  { id: 'paladino', name: 'Paladino', hitDie: 'd10', primaryAbilities: ['str', 'cha'], savingThrows: ['wis', 'cha'], skillChoices: { count: 2, options: ['athletics', 'insight', 'intimidation', 'medicine', 'persuasion', 'religion'] }, spellcasting: { ability: 'cha', progression: 'half_caster' }, featureNames: ['Imposizione delle Mani', 'Incantesimi', 'Padronanza d\'armi'] },
  { id: 'ranger', name: 'Ranger', hitDie: 'd10', primaryAbilities: ['dex', 'wis'], savingThrows: ['str', 'dex'], skillChoices: { count: 3, options: ['animal', 'athletics', 'insight', 'investigation', 'nature', 'perception', 'stealth', 'survival'] }, spellcasting: { ability: 'wis', progression: 'half_caster' }, featureNames: ['Nemico prescelto', 'Incantesimi', 'Padronanza d\'armi'] },
  { id: 'stregone', name: 'Stregone', hitDie: 'd6', primaryAbilities: ['cha'], savingThrows: ['con', 'cha'], skillChoices: { count: 2, options: ['arcana', 'deception', 'intimidation', 'insight', 'persuasion', 'religion'] }, spellcasting: { ability: 'cha', progression: 'full_caster' }, featureNames: ['Incantesimi', 'Stregoneria innata'] },
  { id: 'warlock', name: 'Warlock', hitDie: 'd8', primaryAbilities: ['cha'], savingThrows: ['wis', 'cha'], skillChoices: { count: 2, options: ['arcana', 'deception', 'history', 'intimidation', 'investigation', 'nature', 'religion'] }, spellcasting: { ability: 'cha', progression: 'pact_magic' }, featureNames: ['Magia del Patto', 'Invocazioni occulte'] },
]

export const SPECIES_OPTIONS = [
  { id: 'aasimar', name: 'Aasimar', size: 'Media o Piccola', speed: 9, traits: ['Mani curative', 'Portatore di luce', 'Resistenza celestiale', 'Scurovisione'] },
  { id: 'dragonide', name: 'Dragonide', size: 'Media', speed: 9, traits: ['Discendenza draconica', 'Resistenza ai danni', 'Scurovisione', 'Soffio'] },
  { id: 'elfo', name: 'Elfo', size: 'Media', speed: 9, traits: ['Lignaggio elfico', 'Retaggio fatato', 'Scurovisione', 'Sensi acuti', 'Trance'] },
  { id: 'gnomo', name: 'Gnomo', size: 'Piccola', speed: 9, traits: ['Astuzia gnomesca', 'Scurovisione', 'Lignaggio gnomesco'] },
  { id: 'goliath', name: 'Goliath', size: 'Media', speed: 10.5, traits: ['Costituzione robusta', 'Discendenza gigantica', 'Forma grande'] },
  { id: 'halfling', name: 'Halfling', size: 'Piccola', speed: 9, traits: ['Agilita halfling', 'Coraggioso', 'Fortuna', 'Furtivita innata'] },
  { id: 'nano', name: 'Nano', size: 'Media', speed: 9, traits: ['Resilienza nanica', 'Scurovisione', 'Robustezza nanica'] },
  { id: 'orco', name: 'Orco', size: 'Media', speed: 9, traits: ['Adrenalina', 'Costituzione possente', 'Scurovisione'] },
  { id: 'tiefling', name: 'Tiefling', size: 'Media o Piccola', speed: 9, traits: ['Retaggio immondo', 'Scurovisione', 'Resistenza immonda'] },
  { id: 'umano', name: 'Umano', size: 'Media o Piccola', speed: 9, traits: ['Versatile', 'Intraprendente', 'Abile'] },
]

const SPECIES_CHOICE_RULES = {
  aasimar: {
    id: 'celestial_revelation',
    label: 'Rivelazione Celestiale',
    summary: 'Scegli la rivelazione che si manifestera dal livello 3.',
    unlockLevel: 3,
    options: [
      {
        id: 'heavenly_wings',
        label: 'Ali Celestiali',
        displayName: 'dalle Ali Celestiali',
        featureLabel: 'Rivelazione Celestiale: Ali Celestiali',
        summary: 'Dal livello 3 puoi manifestare ali luminose e ottenere movimento in volo temporaneo.',
      },
      {
        id: 'inner_radiance',
        label: 'Radianza Interiore',
        displayName: 'dalla Radianza Interiore',
        featureLabel: 'Rivelazione Celestiale: Radianza Interiore',
        summary: 'Dal livello 3 puoi emanare luce e potere radioso durante la trasformazione.',
      },
      {
        id: 'necrotic_shroud',
        label: 'Velo Necrotico',
        displayName: 'dal Velo Necrotico',
        featureLabel: 'Rivelazione Celestiale: Velo Necrotico',
        summary: 'Dal livello 3 puoi manifestare energia cupa e intimorire i nemici vicini.',
      },
    ],
  },
  dragonide: {
    id: 'draconic_ancestry',
    label: 'Discendenza Draconica',
    summary: 'Determina tipo di danno del soffio e resistenza.',
    options: [
      { id: 'black', label: 'Drago Nero', displayName: 'Nero', damageType: 'acido' },
      { id: 'blue', label: 'Drago Blu', displayName: 'Blu', damageType: 'fulmine' },
      { id: 'brass', label: 'Drago d\'Ottone', displayName: 'd\'Ottone', damageType: 'fuoco' },
      { id: 'bronze', label: 'Drago di Bronzo', displayName: 'di Bronzo', damageType: 'fulmine' },
      { id: 'copper', label: 'Drago di Rame', displayName: 'di Rame', damageType: 'acido' },
      { id: 'gold', label: 'Drago d\'Oro', displayName: 'd\'Oro', damageType: 'fuoco' },
      { id: 'green', label: 'Drago Verde', displayName: 'Verde', damageType: 'veleno' },
      { id: 'red', label: 'Drago Rosso', displayName: 'Rosso', damageType: 'fuoco' },
      { id: 'silver', label: 'Drago d\'Argento', displayName: 'd\'Argento', damageType: 'freddo' },
      { id: 'white', label: 'Drago Bianco', displayName: 'Bianco', damageType: 'freddo' },
    ].map((option) => ({
      ...option,
      featureLabel: `Discendenza Draconica: ${option.label}`,
      summary: `Soffio e resistenza ai danni da ${option.damageType}.`,
      action: {
        id: `dragonborn_breath_${option.id}`,
        name: `Soffio ${option.label}`,
        type: 'save',
        damage: `1d10 ${option.damageType}`,
        notes: 'Tiro salvezza su Destrezza, CD 8 + COS + bonus competenza. Aumenta con il livello del personaggio.',
      },
    })),
  },
  elfo: {
    id: 'elven_lineage',
    label: 'Lignaggio Elfico',
    summary: 'Scegli Drow, Alto Elfo o Elfo dei Boschi.',
    spellcastingAbilityChoice: true,
    options: [
      {
        id: 'drow',
        label: 'Drow',
        displayName: 'Drow',
        featureLabel: 'Lignaggio Elfico: Drow',
        summary: 'Scurovisione estesa e magia drow.',
        spells: [
          { id: 'luci-danzanti', name: 'Luci Danzanti', level: 0 },
          { id: 'luminescenza', name: 'Luminescenza', level: 1, unlockLevel: 3 },
          { id: 'oscurita', name: 'Oscurita', level: 2, unlockLevel: 5 },
        ],
      },
      {
        id: 'high',
        label: 'Alto Elfo',
        displayName: 'Alto',
        featureLabel: 'Lignaggio Elfico: Alto Elfo',
        summary: 'Magia arcana innata e trucchetto da mago sostituibile dopo il riposo lungo.',
        spells: [
          { id: 'prestidigitazione', name: 'Prestidigitazione', level: 0 },
          { id: 'individuazione-del-magico', name: 'Individuazione del Magico', level: 1, unlockLevel: 3 },
          { id: 'passo-velato', name: 'Passo Velato', level: 2, unlockLevel: 5 },
        ],
      },
      {
        id: 'wood',
        label: 'Elfo dei Boschi',
        displayName: 'dei Boschi',
        featureLabel: 'Lignaggio Elfico: Elfo dei Boschi',
        summary: 'Velocita aumentata e magia naturale.',
        speed: 10.5,
        spells: [
          { id: 'artificio-druidico', name: 'Artificio Druidico', level: 0 },
          { id: 'passo-veloce', name: 'Passo Veloce', level: 1, unlockLevel: 3 },
          { id: 'passare-senza-tracce', name: 'Passare Senza Tracce', level: 2, unlockLevel: 5 },
        ],
      },
    ],
  },
  gnomo: {
    id: 'gnomish_lineage',
    label: 'Lignaggio Gnomesco',
    summary: 'Scegli Gnomo delle Foreste o Gnomo delle Rocce.',
    spellcastingAbilityChoice: true,
    options: [
      {
        id: 'forest',
        label: 'Gnomo delle Foreste',
        displayName: 'delle Foreste',
        featureLabel: 'Lignaggio Gnomesco: Foreste',
        summary: 'Illusione Minore e Parlare con gli Animali sempre preparato.',
        spells: [
          { id: 'illusione-minore', name: 'Illusione Minore', level: 0 },
          { id: 'parlare-con-gli-animali', name: 'Parlare con gli Animali', level: 1 },
        ],
      },
      {
        id: 'rock',
        label: 'Gnomo delle Rocce',
        displayName: 'delle Rocce',
        featureLabel: 'Lignaggio Gnomesco: Rocce',
        summary: 'Riparare, Prestidigitazione e piccoli congegni magici.',
        spells: [
          { id: 'riparare', name: 'Riparare', level: 0 },
          { id: 'prestidigitazione', name: 'Prestidigitazione', level: 0 },
        ],
      },
    ],
  },
  goliath: {
    id: 'giant_ancestry',
    label: 'Discendenza Gigantica',
    summary: 'Scegli il retaggio gigante che concede un beneficio usabile con il bonus competenza.',
    resource: { id: 'giant_ancestry', label: 'Discendenza Gigantica' },
    options: [
      { id: 'cloud', label: 'Gigante delle Nuvole', displayName: 'delle Nuvole', featureLabel: 'Discendenza Gigantica: Nuvole', summary: 'Teletrasporto breve come beneficio della discendenza.' },
      { id: 'fire', label: 'Gigante del Fuoco', displayName: 'del Fuoco', featureLabel: 'Discendenza Gigantica: Fuoco', summary: 'Danno da fuoco extra quando colpisci.' },
      { id: 'frost', label: 'Gigante del Gelo', displayName: 'del Gelo', featureLabel: 'Discendenza Gigantica: Gelo', summary: 'Danno da freddo extra e rallentamento.' },
      { id: 'hill', label: 'Gigante delle Colline', displayName: 'delle Colline', featureLabel: 'Discendenza Gigantica: Colline', summary: 'Puoi buttare prono un bersaglio idoneo quando colpisci.' },
      { id: 'stone', label: 'Gigante delle Pietre', displayName: 'delle Pietre', featureLabel: 'Discendenza Gigantica: Pietre', summary: 'Reazione per ridurre i danni subiti.' },
      { id: 'storm', label: 'Gigante delle Tempeste', displayName: 'delle Tempeste', featureLabel: 'Discendenza Gigantica: Tempeste', summary: 'Reazione per infliggere danni da tuono a chi ti ferisce.' },
    ],
  },
  tiefling: {
    id: 'fiendish_legacy',
    label: 'Retaggio Immondo',
    summary: 'Scegli Abissale, Ctonio o Infernale.',
    spellcastingAbilityChoice: true,
    options: [
      {
        id: 'abyssal',
        label: 'Abissale',
        displayName: 'Abissale',
        featureLabel: 'Retaggio Abissale',
        summary: 'Resistenza al veleno e magia abissale.',
        damageResistance: 'veleno',
        spells: [
          { id: 'spruzzo-velenoso', name: 'Spruzzo Velenoso', level: 0 },
          { id: 'raggio-di-infermita', name: 'Raggio di Infermita', level: 1, unlockLevel: 3 },
          { id: 'blocca-persone', name: 'Blocca Persone', level: 2, unlockLevel: 5 },
        ],
      },
      {
        id: 'chthonic',
        label: 'Ctonio',
        displayName: 'Ctonio',
        featureLabel: 'Retaggio Ctonio',
        summary: 'Resistenza necrotica e magia ctonia.',
        damageResistance: 'necrotico',
        spells: [
          { id: 'tocco-gelido', name: 'Tocco Gelido', level: 0 },
          { id: 'vita-falsata', name: 'Vita Falsata', level: 1, unlockLevel: 3 },
          { id: 'raggio-di-indebolimento', name: 'Raggio di Indebolimento', level: 2, unlockLevel: 5 },
        ],
      },
      {
        id: 'infernal',
        label: 'Infernale',
        displayName: 'Infernale',
        featureLabel: 'Retaggio Infernale',
        summary: 'Resistenza al fuoco e magia infernale.',
        damageResistance: 'fuoco',
        spells: [
          { id: 'dardo-di-fuoco', name: 'Dardo di Fuoco', level: 0 },
          { id: 'intimorire-infernale', name: 'Intimorire Infernale', level: 1, unlockLevel: 3 },
          { id: 'oscurita', name: 'Oscurita', level: 2, unlockLevel: 5 },
        ],
      },
    ],
  },
}

const SPECIES_SPELL_ABILITY_OPTIONS = ['int', 'wis', 'cha']

export const BACKGROUND_OPTIONS = [
  { id: 'accolito', name: 'Accolito', abilities: ['int', 'wis', 'cha'], featId: 'iniziato-alla-magia', featName: 'Iniziato alla Magia', skills: ['insight', 'religion'], fixedTools: ['calligrapher_supplies'] },
  { id: 'artigiano', name: 'Artigiano', abilities: ['str', 'dex', 'int'], featId: 'lavoro-manuale', featName: 'Lavoro manuale', skills: ['investigation', 'persuasion'], toolChoices: toolChoice(['artisan'], 1) },
  { id: 'ciarlatano', name: 'Ciarlatano', abilities: ['dex', 'con', 'cha'], featId: 'abile', featName: 'Abile', skills: ['deception', 'sleight'], fixedTools: ['forgery_kit'] },
  { id: 'contadino', name: 'Contadino', abilities: ['str', 'con', 'wis'], featId: 'robusto', featName: 'Robusto', skills: ['animal', 'nature'], fixedTools: ['carpenter_tools'] },
  { id: 'criminale', name: 'Criminale', abilities: ['dex', 'con', 'int'], featId: 'allerta', featName: 'Allerta', skills: ['sleight', 'stealth'], fixedTools: ['thieves_tools'] },
  { id: 'eremita', name: 'Eremita', abilities: ['con', 'wis', 'cha'], featId: 'guaritore', featName: 'Guaritore', skills: ['medicine', 'religion'], fixedTools: ['herbalism_kit'] },
  { id: 'guardia', name: 'Guardia', abilities: ['str', 'int', 'wis'], featId: 'allerta', featName: 'Allerta', skills: ['athletics', 'perception'], toolChoices: toolChoice(['game'], 1) },
  { id: 'guida', name: 'Guida', abilities: ['dex', 'con', 'wis'], featId: 'iniziato-alla-magia', featName: 'Iniziato alla Magia', skills: ['stealth', 'survival'], fixedTools: ['cartographer_tools'] },
  { id: 'intrattenitore', name: 'Intrattenitore', abilities: ['str', 'dex', 'cha'], featId: 'musicista', featName: 'Musicista', skills: ['acrobatics', 'performance'], toolChoices: toolChoice(['musical'], 1) },
  { id: 'marinaio', name: 'Marinaio', abilities: ['str', 'dex', 'wis'], featId: 'lottatore-da-taverna', featName: 'Lottatore da Taverna', skills: ['acrobatics', 'perception'], fixedTools: ['navigator_tools'] },
  { id: 'mercante', name: 'Mercante', abilities: ['con', 'int', 'cha'], featId: 'fortunato', featName: 'Fortunato', skills: ['animal', 'persuasion'], fixedTools: ['navigator_tools'] },
  { id: 'nobile', name: 'Nobile', abilities: ['str', 'int', 'cha'], featId: 'abile', featName: 'Abile', skills: ['history', 'persuasion'], toolChoices: toolChoice(['game'], 1) },
  { id: 'sapiente', name: 'Sapiente', abilities: ['con', 'int', 'wis'], featId: 'iniziato-alla-magia', featName: 'Iniziato alla Magia', skills: ['arcana', 'history'], fixedTools: ['calligrapher_supplies'] },
  { id: 'scriba', name: 'Scriba', abilities: ['dex', 'int', 'wis'], featId: 'abile', featName: 'Abile', skills: ['investigation', 'perception'], fixedTools: ['calligrapher_supplies'] },
  { id: 'soldato', name: 'Soldato', abilities: ['str', 'dex', 'con'], featId: 'aggressore-selvaggio', featName: 'Aggressore Selvaggio', skills: ['athletics', 'intimidation'], toolChoices: toolChoice(['game'], 1) },
  { id: 'viandante', name: 'Viandante', abilities: ['dex', 'wis', 'cha'], featId: 'fortunato', featName: 'Fortunato', skills: ['insight', 'stealth'], fixedTools: ['thieves_tools'] },
]

const ALIGNMENTS = [
  'Legale Buono',
  'Neutrale Buono',
  'Caotico Buono',
  'Legale Neutrale',
  'Neutrale',
  'Caotico Neutrale',
  'Legale Malvagio',
  'Neutrale Malvagio',
  'Caotico Malvagio',
]

function findById(items, id) {
  return items.find((item) => item.id === id)
}

function getSpeciesChoiceRule(speciesId) {
  return SPECIES_CHOICE_RULES[speciesId] ?? null
}

function getSpeciesChoiceOption(speciesId, optionId) {
  const rule = getSpeciesChoiceRule(speciesId)

  return rule?.options.find((option) => option.id === optionId) ?? null
}

function getSelectedSpeciesOption(species, choices) {
  if (!species) {
    return null
  }

  return getSpeciesChoiceOption(
    species.id,
    choices.speciesChoices?.[species.id]?.optionId
  )
}

function getSpeciesSpellAbility(species, choices) {
  if (!species) {
    return null
  }

  return choices.speciesChoices?.[species.id]?.spellcastingAbility ?? null
}

function getSpeciesDisplayName(species, selectedSpeciesOption) {
  if (!species) {
    return ''
  }

  if (!selectedSpeciesOption?.displayName) {
    return species.name
  }

  if (species.id === 'dragonide') {
    return `${species.name} ${selectedSpeciesOption.displayName}`
  }

  if (species.id === 'goliath' || species.id === 'gnomo') {
    return `${species.name} ${selectedSpeciesOption.displayName}`
  }

  return `${species.name} ${selectedSpeciesOption.displayName}`
}

function getSpeciesChoicePreview(species, choices) {
  const rule = getSpeciesChoiceRule(species?.id)

  if (!rule) {
    return null
  }

  const selectedOption = getSelectedSpeciesOption(species, choices)
  const spellcastingAbility = getSpeciesSpellAbility(species, choices)

  return {
    ...rule,
    selectedOption,
    selectedOptionId: selectedOption?.id ?? '',
    spellcastingAbility,
    spellAbilityOptions: SPECIES_SPELL_ABILITY_OPTIONS,
  }
}

function validateSpeciesChoices(species, choices, startingLevel) {
  const rule = getSpeciesChoiceRule(species?.id)
  const warnings = []

  if (!rule) {
    return warnings
  }

  const selectedOption = getSelectedSpeciesOption(species, choices)

  if (!selectedOption) {
    warnings.push(`Scegli ${rule.label} per ${species.name}.`)
  }

  if (
    rule.spellcastingAbilityChoice &&
    selectedOption &&
    !SPECIES_SPELL_ABILITY_OPTIONS.includes(getSpeciesSpellAbility(species, choices))
  ) {
    warnings.push(`Scegli la caratteristica da incantatore per ${rule.label}.`)
  }

  if (rule.unlockLevel && startingLevel >= rule.unlockLevel && !selectedOption) {
    warnings.push(`Completa ${rule.label}, attiva dal livello ${rule.unlockLevel}.`)
  }

  return warnings
}

function getSpeciesChoiceFeature(species, selectedSpeciesOption, startingLevel = 1) {
  if (!species || !selectedSpeciesOption) {
    return null
  }

  const rule = getSpeciesChoiceRule(species.id)
  const featureLevel = rule?.unlockLevel ?? 1

  if (featureLevel > startingLevel) {
    return null
  }

  return {
    id: `${species.id}_${rule.id}_${selectedSpeciesOption.id}`,
    label: selectedSpeciesOption.featureLabel ?? selectedSpeciesOption.label,
    level: featureLevel,
    source: species.name,
    category: 'species',
    kind: 'lineage',
    summary: selectedSpeciesOption.summary,
  }
}

function getSpeciesSpells(species, selectedSpeciesOption, spellcastingAbility, characterLevel = 1) {
  if (!species || !selectedSpeciesOption) {
    return []
  }

  return (selectedSpeciesOption.spells ?? [])
    .filter((spell) => (spell.unlockLevel ?? 1) <= characterLevel)
    .map((spell) => ({
      id: spell.id,
      name: spell.name,
      level: spell.level,
      source: getSpeciesDisplayName(species, selectedSpeciesOption),
      ability: spellcastingAbility,
      prepared: true,
      speciesSpell: true,
      unlockLevel: spell.unlockLevel ?? 1,
    }))
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

function buildSpeciesActions(species, selectedSpeciesOption) {
  if (!selectedSpeciesOption?.action) {
    return []
  }

  return [
    {
      ...selectedSpeciesOption.action,
      source: getSpeciesDisplayName(species, selectedSpeciesOption),
    },
  ]
}

function getAbilityModifier(score) {
  return Math.floor((score - 10) / 2)
}

function getHitDieSize(hitDie) {
  return Number(String(hitDie).replace('d', ''))
}

function getSkillById(id) {
  return SKILLS.find((skill) => skill.id === id)
}

function getToolById(id) {
  return Object.values(TOOL_OPTIONS)
    .flat()
    .find((tool) => tool.id === id)
}

function getToolChoiceOptions(choice) {
  return (choice?.categories ?? [])
    .flatMap((category) => TOOL_OPTIONS[category] ?? [])
}

function getToolLabels(toolIds) {
  return (toolIds ?? [])
    .map((toolId) => getToolById(toolId)?.label ?? toolId)
}

function getAllToolIds(toolIds = []) {
  return [...new Set(toolIds.filter(Boolean))]
}

function getDefaultToolChoices(choice, previousToolIds = [], excludedToolIds = []) {
  const options = getToolChoiceOptions(choice)
  const count = choice?.count ?? 0
  const excluded = new Set(excludedToolIds)
  const selected = []

  previousToolIds.forEach((toolId) => {
    if (
      selected.length < count &&
      options.some((tool) => tool.id === toolId) &&
      !excluded.has(toolId) &&
      !selected.includes(toolId)
    ) {
      selected.push(toolId)
    }
  })

  return selected
}

export function getDefaultBackgroundToolChoices(backgroundId, previousToolIds = []) {
  const background = findById(BACKGROUND_OPTIONS, backgroundId)

  if (!background) {
    return []
  }

  return getDefaultToolChoices(background.toolChoices, previousToolIds)
}

export function getDefaultClassToolChoices(classId, backgroundId, previousToolIds = [], backgroundToolIds = []) {
  const characterClass = findById(CLASS_OPTIONS, classId)
  const background = findById(BACKGROUND_OPTIONS, backgroundId)

  if (!characterClass) {
    return []
  }

  const excludedToolIds = getAllToolIds([
    ...(background?.fixedTools ?? []),
    ...backgroundToolIds,
  ])

  return getDefaultToolChoices(characterClass.toolChoices, previousToolIds, excludedToolIds)
}

export function getDefaultClassSkillChoices(classId, backgroundId, previousSkillIds = []) {
  const characterClass = findById(CLASS_OPTIONS, classId)

  if (!characterClass) {
    return []
  }

  const background = findById(BACKGROUND_OPTIONS, backgroundId)
  const backgroundSkills = new Set(background?.skills ?? [])
  const options = characterClass.skillChoices?.options ?? []
  const count = characterClass.skillChoices?.count ?? 0
  const selected = []

  previousSkillIds.forEach((skillId) => {
    if (
      selected.length < count &&
      options.includes(skillId) &&
      !backgroundSkills.has(skillId) &&
      !selected.includes(skillId)
    ) {
      selected.push(skillId)
    }
  })

  return selected
}

export function getDefaultBackgroundIncreases(classId, backgroundId, baseAbilities = null) {
  const background = findById(BACKGROUND_OPTIONS, backgroundId)

  if (!background) {
    return {}
  }

  const abilities = background.abilities ?? []

  return Object.fromEntries(
    abilities.map((ability) => [ability, 0])
  )
}

function validateClassSkillChoices(characterClass, background, selectedSkillIds) {
  const warnings = []
  const skillChoices = characterClass.skillChoices ?? { count: 0, options: [] }
  const selected = selectedSkillIds ?? []
  const uniqueSelected = new Set(selected)
  const backgroundSkills = new Set(background.skills)

  if (uniqueSelected.size !== selected.length) {
    warnings.push('Scegli ogni competenza di classe una sola volta.')
  }

  const invalidSkill = selected.find((skillId) => !skillChoices.options.includes(skillId))

  if (invalidSkill) {
    warnings.push('Una competenza scelta non appartiene alla lista della classe.')
  }

  const duplicatedBackgroundSkill = selected.find((skillId) => backgroundSkills.has(skillId))

  if (duplicatedBackgroundSkill) {
    warnings.push('Le competenze del background sono gia acquisite: scegli altre competenze di classe.')
  }

  if (selected.length !== skillChoices.count) {
    warnings.push(`Scegli ${skillChoices.count} competenze dalla lista della classe.`)
  }

  return warnings
}

function validateToolChoices(label, choice, selectedToolIds = [], excludedToolIds = []) {
  const warnings = []

  if (!choice) return warnings

  const options = getToolChoiceOptions(choice)
  const optionIds = new Set(options.map((tool) => tool.id))
  const selected = selectedToolIds ?? []
  const uniqueSelected = new Set(selected)
  const excluded = new Set(excludedToolIds)

  if (uniqueSelected.size !== selected.length) {
    warnings.push(`Scegli ogni ${label} una sola volta.`)
  }

  if (selected.some((toolId) => !optionIds.has(toolId))) {
    warnings.push(`Una scelta di ${label} non appartiene alla lista prevista.`)
  }

  if (selected.some((toolId) => excluded.has(toolId))) {
    warnings.push(`Una scelta di ${label} e gia acquisita da un'altra fonte.`)
  }

  if (selected.length !== choice.count) {
    warnings.push(`Scegli ${choice.count} ${label}.`)
  }

  return warnings
}

function validateStandardArray(baseAbilities, classId) {
  const expectedAbilities = STANDARD_ABILITIES_BY_CLASS[classId]

  if (!expectedAbilities) {
    return ['La serie standard richiede una classe valida.']
  }

  const matchesStandardArray = Object.keys(ABILITY_LABELS).every((ability) => {
    return Number(baseAbilities?.[ability]) === expectedAbilities[ability]
  })

  return matchesStandardArray
    ? []
    : ['La serie standard e bloccata dalla tabella per classe del manuale.']
}

function getPointBuySpent(baseAbilities) {
  return Object.values(baseAbilities ?? {}).reduce((total, score) => {
    return total + (POINT_BUY_COSTS[Number(score)] ?? 0)
  }, 0)
}

function validateRolledScores(baseAbilities, abilityRolls) {
  const warnings = []
  const rolledScores = (abilityRolls ?? []).map((roll) => Number(roll.total))
  const selectedScores = Object.values(baseAbilities ?? {}).map((score) => Number(score))

  if (rolledScores.length !== 6) {
    warnings.push('Tira 6 risultati con 4d6, scartando il dado piu basso.')
    return warnings
  }

  const sortedRolled = [...rolledScores].sort((a, b) => b - a)
  const sortedSelected = [...selectedScores].sort((a, b) => b - a)
  const matchesRolls =
    sortedSelected.length === sortedRolled.length &&
    sortedSelected.every((score, index) => score === sortedRolled[index])

  if (!matchesRolls) {
    warnings.push('Assegna una volta ciascuno i risultati tirati.')
  }

  return warnings
}

function validatePointBuy(baseAbilities) {
  const warnings = []
  const scores = Object.values(baseAbilities ?? {}).map((score) => Number(score))
  const hasInvalidScore = scores.some((score) => !POINT_BUY_SCORES.includes(score))

  if (hasInvalidScore) {
    warnings.push('Con il costo in punti puoi scegliere valori da 8 a 15 prima dei bonus.')
  }

  const spent = getPointBuySpent(baseAbilities)

  if (spent !== POINT_BUY_BUDGET) {
    warnings.push(`Spendi esattamente ${POINT_BUY_BUDGET} punti. Ora ne hai spesi ${spent}.`)
  }

  return warnings
}

function validateAbilityMethod(choices, baseAbilities) {
  if (choices.abilityMethod === 'standard') {
    return validateStandardArray(baseAbilities, choices.classId)
  }

  if (choices.abilityMethod === 'roll') {
    return validateRolledScores(baseAbilities, choices.abilityRolls)
  }

  if (choices.abilityMethod === 'point_buy') {
    return validatePointBuy(baseAbilities)
  }

  return ['Metodo di generazione caratteristiche non valido.']
}

function applyBackgroundAbilityIncreases(baseAbilities, background, increases) {
  const nextAbilities = { ...baseAbilities }
  const warnings = []
  const totalIncrease = Object.values(increases ?? {}).reduce((total, amount) => {
    return total + (Number(amount) || 0)
  }, 0)

  if (totalIncrease !== 3) {
    warnings.push('Distribuisci 3 punti caratteristica dal background.')
  }

  Object.entries(increases ?? {}).forEach(([ability, amount]) => {
    const increase = Number(amount) || 0

    if (increase === 0) return

    if (!background.abilities.includes(ability)) {
      warnings.push(`${ABILITY_LABELS[ability] ?? ability} non e tra le caratteristiche del background.`)
    }

    if (increase < 0 || increase > 2) {
      warnings.push(`${ABILITY_LABELS[ability] ?? ability} puo ricevere al massimo +2 dal background.`)
    }

    const baseScore = Number(nextAbilities[ability])

    if (!Number.isFinite(baseScore)) {
      return
    }

    nextAbilities[ability] = Math.min(20, baseScore + increase)
  })

  return { abilities: nextAbilities, warnings }
}

function hasCompleteAbilityMap(abilities) {
  return Object.keys(ABILITY_LABELS).every((ability) => {
    const score = Number(abilities?.[ability])
    return Number.isFinite(score) && score > 0
  })
}

function normalizeStartingLevel(value) {
  const level = Number(value)

  if (Number.isFinite(level) && level >= 1 && level <= 20) {
    return level
  }

  return 1
}

function getAverageHpIncrease(hitDie, constitutionModifier) {
  return Math.floor(getHitDieSize(hitDie) / 2) + 1 + constitutionModifier
}

function buildFeatures(characterClass, species, background, startingLevel = 1, selectedSpeciesOption = null) {
  const levelTwoFeatures = startingLevel >= 2
    ? (LEVEL_TWO_FEATURES_BY_CLASS[characterClass.id] ?? [])
    : []
  const speciesChoiceFeature = getSpeciesChoiceFeature(species, selectedSpeciesOption, startingLevel)

  return [
    ...species.traits.map((trait) => ({
      id: `${species.id}_${trait.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
      label: trait,
      level: 1,
      source: species.name,
      category: 'species',
      kind: 'trait',
      summary: `Tratto di specie: ${trait}.`,
    })),
    ...(speciesChoiceFeature ? [speciesChoiceFeature] : []),
    ...characterClass.featureNames.map((featureName) => ({
      id: `${characterClass.id}_${featureName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
      label: featureName,
      level: 1,
      source: characterClass.name,
      category: 'class',
      kind: 'feature',
      summary: `Privilegio di classe di 1 livello: ${featureName}.`,
    })),
    ...levelTwoFeatures.map((featureName) => ({
      id: `${characterClass.id}_${featureName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_2`,
      label: featureName,
      level: 2,
      source: characterClass.name,
      category: 'class',
      kind: 'feature',
      summary: `Privilegio di classe di 2 livello: ${featureName}. Alcune scelte specifiche vanno confermate in Progressione.`,
    })),
    {
      id: `background_${background.id}`,
      label: background.name,
      level: 1,
      source: 'Background',
      category: 'background',
      kind: 'origin',
      summary: `Background con talento ${background.featName}.`,
    },
  ]
}

function buildResources(characterClass, species, background, startingLevel = 1, selectedSpeciesOption = null) {
  const resources = []

  if (background.featId === 'fortunato') {
    resources.push({
      id: 'fortune',
      label: 'Talento: Fortunato',
      current: 2,
      max: 2,
      resetOn: 'long_rest',
      category: 'feat',
    })
  }

  if (characterClass.id === 'paladino') {
    resources.push({
      id: 'lay_on_hands',
      label: 'Imposizione delle Mani',
      current: 5 * startingLevel,
      max: 5 * startingLevel,
      resetOn: 'long_rest',
      category: 'class',
    })
  }

  if (characterClass.id === 'monaco' && startingLevel === 1) {
    resources.push({
      id: 'martial_arts_die',
      label: 'Dado arti marziali',
      current: 1,
      max: 1,
      resetOn: 'none',
      category: 'class',
    })
  }

  if (characterClass.id === 'monaco' && startingLevel >= 2) {
    resources.push({
      id: 'ki',
      label: 'Ki',
      current: 2,
      max: 2,
      resetOn: 'short_rest',
      category: 'class',
    })
  }

  if (characterClass.id === 'stregone' && startingLevel >= 2) {
    resources.push({
      id: 'sorcery_points',
      label: 'Punti Stregoneria',
      current: 2,
      max: 2,
      resetOn: 'long_rest',
      category: 'class',
    })
  }

  if (species.id === 'dragonide') {
    resources.push({
      id: 'breath_weapon',
      label: 'Soffio',
      current: 2,
      max: 2,
      resetOn: 'long_rest',
      category: 'species',
    })
  }

  if (species.id === 'goliath' && selectedSpeciesOption) {
    resources.push({
      id: 'giant_ancestry',
      label: `Discendenza Gigantica: ${selectedSpeciesOption.label}`,
      current: 2,
      max: 2,
      resetOn: 'long_rest',
      category: 'species',
    })
  }

  return resources
}

function buildSpellcasting(characterClass, abilities, startingLevel = 1) {
  if (!characterClass.spellcasting) {
    return {
      ability: null,
      spellSaveDc: null,
      spellAttackBonus: null,
      preparedCount: 0,
      slots: [],
      spells: [],
    }
  }

  const ability = characterClass.spellcasting.ability
  const abilityMod = getAbilityModifier(abilities[ability] ?? 10)
  const progression = characterClass.spellcasting.progression
  const slotTable = CREATION_SPELL_SLOT_TABLES[progression] ?? {}
  const slots = slotTable[startingLevel] ?? slotTable[1] ?? []
  const hasPreparedSpells = progression === 'full_caster' || progression === 'half_caster'
  const preparedCount = hasPreparedSpells
    ? Math.max(1, abilityMod + startingLevel)
    : progression === 'pact_magic'
      ? 2
      : 0

  return {
    ability,
    spellSaveDc: 8 + abilityMod + 2,
    spellAttackBonus: abilityMod + 2,
    preparedCount,
    slots: slots.map((slot) => ({
      id: `${characterClass.id}_slot_${slot.level}`,
      level: slot.level,
      label: `Slot livello ${slot.level}`,
      current: slot.max,
      max: slot.max,
      resetOn: slot.resetOn ?? 'long_rest',
    })),
    spells: [],
  }
}

function buildSkills(background, selectedClassSkills = []) {
  const proficientSkills = new Set([
    ...background.skills,
    ...selectedClassSkills,
  ])

  return SKILLS.map((skill) => ({
    ...skill,
    proficient: proficientSkills.has(skill.id),
  }))
}

export function getCreationCatalog() {
  return {
    classes: CLASS_OPTIONS,
    species: SPECIES_OPTIONS,
    speciesChoiceRules: SPECIES_CHOICE_RULES,
    speciesSpellAbilityOptions: SPECIES_SPELL_ABILITY_OPTIONS,
    backgrounds: BACKGROUND_OPTIONS,
    skills: SKILLS,
    toolOptions: TOOL_OPTIONS,
    toolLabels: TOOL_LABELS,
    abilities: ABILITY_LABELS,
    alignments: ALIGNMENTS,
    standardScores: STANDARD_ARRAY,
    pointBuyScores: POINT_BUY_SCORES,
    pointBuyCosts: POINT_BUY_COSTS,
    pointBuyBudget: POINT_BUY_BUDGET,
    standardAbilitiesByClass: STANDARD_ABILITIES_BY_CLASS,
  }
}

export function getDefaultCreationChoices() {
  return {
    name: '',
    concept: '',
    startingLevel: 1,
    classId: '',
    speciesId: '',
    backgroundId: '',
    alignment: '',
    abilityMethod: '',
    baseAbilities: { ...EMPTY_BASE_ABILITIES },
    abilityRolls: [],
    backgroundIncreases: {},
    featChoices: {},
    levelOneClassChoices: {},
    speciesChoices: {},
    selectedClassSkills: [],
    selectedBackgroundTools: [],
    selectedClassTools: [],
    languages: [],
    levelUpChoices: {},
    equipmentMode: '',
  }
}

export function getCreationPreview(choices) {
  const characterClass = findById(CLASS_OPTIONS, choices.classId)
  const species = findById(SPECIES_OPTIONS, choices.speciesId)
  const background = findById(BACKGROUND_OPTIONS, choices.backgroundId)
  const startingLevel = normalizeStartingLevel(choices.startingLevel)
  const warnings = []

  if (!characterClass) warnings.push('Scegli una classe.')
  if (!species) warnings.push('Scegli una specie.')
  if (!background) warnings.push('Scegli un background.')

  const selectedSpeciesOption = getSelectedSpeciesOption(species, choices)
  const speciesChoice = getSpeciesChoicePreview(species, choices)
  const speciesWarnings = species
    ? validateSpeciesChoices(species, choices, startingLevel)
    : []
  const baseAbilities = choices.baseAbilities ?? EMPTY_BASE_ABILITIES
  const abilityResult = background
    ? applyBackgroundAbilityIncreases(
      baseAbilities,
      background,
      choices.backgroundIncreases
    )
    : { abilities: { ...baseAbilities }, warnings: [] }
  const abilityWarnings = characterClass && background
    ? [
      ...validateAbilityMethod(choices, baseAbilities),
      ...abilityResult.warnings,
    ]
    : []
  const skillWarnings = characterClass && background
    ? validateClassSkillChoices(
      characterClass,
      background,
      choices.selectedClassSkills
    )
    : []
  const backgroundTools = getAllToolIds([
    ...(background?.fixedTools ?? []),
    ...(choices.selectedBackgroundTools ?? []),
  ])
  const classTools = getAllToolIds([
    ...(characterClass?.fixedTools ?? []),
    ...(choices.selectedClassTools ?? []),
  ])
  const originFeat = background ? findFeatById(background.featId) : null
  const originFeatSelectedChoices = choices.featChoices?.[background?.featId] ?? {}
  const originFeatCharacter = characterClass && background
    ? {
      level: startingLevel,
      abilities: abilityResult.abilities,
      savingThrows: Object.fromEntries(
        Object.keys(ABILITY_LABELS).map((ability) => [
          ability,
          characterClass.savingThrows.includes(ability),
        ])
      ),
      skills: buildSkills(background, choices.selectedClassSkills),
      proficiencies: {
        tools: getToolLabels([...backgroundTools, ...classTools]),
      },
    }
    : null
  const originFeatDraft = originFeat && originFeatCharacter
    ? buildFeatChoiceDraft(originFeatCharacter, originFeat, originFeatSelectedChoices)
    : null
  const toolWarnings = [
    ...validateToolChoices(
      'strumento del background',
      background?.toolChoices,
      choices.selectedBackgroundTools
    ),
    ...validateToolChoices(
      'strumento della classe',
      characterClass?.toolChoices,
      choices.selectedClassTools,
      backgroundTools
    ),
  ]
  const hasCompleteAbilities = hasCompleteAbilityMap(abilityResult.abilities)
  const conMod = hasCompleteAbilities ? getAbilityModifier(abilityResult.abilities.con) : null
  const levelOneSpellCharacter = characterClass && hasCompleteAbilities
    ? {
      id: 'pg_creation_level_1',
      level: 1,
      classes: [{ name: characterClass.name, level: 1 }],
      abilities: abilityResult.abilities,
      spellcasting: buildSpellcasting(characterClass, abilityResult.abilities, 1),
    }
    : null
  const levelOneSpellChoices = levelOneSpellCharacter
    ? buildClassSpellChoicesDraft(
      levelOneSpellCharacter,
      characterClass.name,
      1,
      choices.levelOneClassChoices ?? {}
    )
    : { requirements: [], choices: [], warnings: [], readyToApply: true }
  const levelOneHp = characterClass && conMod !== null ? getHitDieSize(characterClass.hitDie) + conMod : null
  const hpMax = levelOneHp === null
    ? null
    : levelOneHp + Math.max(0, startingLevel - 1) * getAverageHpIncrease(characterClass.hitDie, conMod)
  const dexMod = hasCompleteAbilities ? getAbilityModifier(abilityResult.abilities.dex) : null
  const speciesSpeed = selectedSpeciesOption?.speed ?? species?.speed ?? null
  const primaryScores = (characterClass?.primaryAbilities ?? []).map((ability) => ({
    ability,
    score: abilityResult.abilities[ability] ?? null,
  }))

  return {
    type: 'character_creation_preview',
    ready: warnings.length === 0 && speciesWarnings.length === 0 && abilityWarnings.length === 0 && skillWarnings.length === 0 && toolWarnings.length === 0 && (originFeatDraft?.warnings ?? []).length === 0 && levelOneSpellChoices.warnings.length === 0,
    warnings: [...warnings, ...speciesWarnings, ...abilityWarnings, ...skillWarnings, ...toolWarnings, ...(originFeatDraft?.warnings ?? []), ...levelOneSpellChoices.warnings],
    class: characterClass,
    species,
    speciesChoice,
    selectedSpeciesOption,
    speciesDisplayName: getSpeciesDisplayName(species, selectedSpeciesOption),
    background,
    originFeat: originFeat
      ? {
        feat: originFeat,
        selectedChoices: originFeatSelectedChoices,
        requirements: originFeatDraft?.requirements ?? [],
        draft: originFeatDraft,
      }
      : null,
    levelOneSpellChoices,
    baseAbilities,
    abilityMethod: choices.abilityMethod,
    startingLevel,
    abilityMeta: {
      rollResults: choices.abilityRolls ?? [],
      pointBuySpent: getPointBuySpent(baseAbilities),
      pointBuyRemaining: POINT_BUY_BUDGET - getPointBuySpent(baseAbilities),
    },
    abilities: abilityResult.abilities,
    abilityModifiers: Object.fromEntries(
      Object.entries(abilityResult.abilities).map(([ability, score]) => [
        ability,
        Number.isFinite(Number(score)) ? getAbilityModifier(Number(score)) : null,
      ])
    ),
    classSkills: {
      count: characterClass?.skillChoices?.count ?? 0,
      options: characterClass?.skillChoices?.options ?? [],
      selected: choices.selectedClassSkills ?? [],
      background: background?.skills ?? [],
    },
    backgroundTools: {
      fixed: background?.fixedTools ?? [],
      choice: background?.toolChoices ?? null,
      selected: choices.selectedBackgroundTools ?? [],
      all: backgroundTools,
      options: getToolChoiceOptions(background?.toolChoices),
    },
    classTools: {
      fixed: characterClass?.fixedTools ?? [],
      choice: characterClass?.toolChoices ?? null,
      selected: choices.selectedClassTools ?? [],
      all: classTools,
      options: getToolChoiceOptions(characterClass?.toolChoices),
    },
    classFit: {
      primaryScores,
      hasStrongPrimary: primaryScores.some((item) => Number(item.score) >= 15),
      meetsMulticlassFloor: primaryScores.every((item) => Number(item.score) >= 13),
    },
    derived: {
      level: startingLevel,
      proficiencyBonus: 2,
      hpMax,
      ac: dexMod === null ? null : 10 + dexMod,
      speed: speciesSpeed,
      hitDice: {
        current: startingLevel,
        max: startingLevel,
        type: characterClass?.hitDie ?? null,
        byType: characterClass?.hitDie ? { [characterClass.hitDie]: startingLevel } : {},
      },
    },
    grants: [
      { label: 'Scelta specie', value: selectedSpeciesOption?.label ?? '' },
      { label: 'Tratti specie', value: [selectedSpeciesOption?.summary, selectedSpeciesOption?.damageResistance ? `Resistenza: ${selectedSpeciesOption.damageResistance}` : ''].filter(Boolean).join(' - ') },
      { label: 'Talento origine', value: background?.featName ?? '' },
      {
        label: 'Scelte talento',
        value: (originFeatDraft?.choices ?? [])
          .flatMap((choice) => choice.labels)
          .join(', '),
      },
      { label: 'Competenze background', value: (background?.skills ?? []).map((skillId) => getSkillById(skillId)?.label ?? skillId).join(', ') },
      { label: 'Competenze classe', value: (choices.selectedClassSkills ?? []).map((skillId) => getSkillById(skillId)?.label ?? skillId).join(', ') },
      { label: 'Strumenti background', value: getToolLabels(backgroundTools).join(', ') },
      { label: 'Strumenti classe', value: getToolLabels(classTools).join(', ') },
      { label: 'Lingue', value: (choices.languages ?? []).join(', ') },
    ],
  }
}

function buildBaseCreationCharacter(preview, choices, id) {
  const features = buildFeatures(preview.class, preview.species, preview.background, 1, preview.selectedSpeciesOption)
  const resources = buildResources(preview.class, preview.species, preview.background, 1, preview.selectedSpeciesOption)
  const spellcasting = buildSpellcasting(preview.class, preview.abilities, 1)
  const speciesSpells = getSpeciesSpells(
    preview.species,
    preview.selectedSpeciesOption,
    preview.speciesChoice?.spellcastingAbility,
    1
  )
  const levelOneHp = getHitDieSize(preview.class.hitDie) + getAbilityModifier(preview.abilities.con)
  const appliedAt = new Date().toISOString()
  const historyEntry = {
    id: `creation-${id}`,
    type: 'creation',
    appliedAt,
    fromLevel: 0,
    toLevel: 1,
    className: preview.class.name,
    choices,
  }

  const character = {
    id,
    name: choices.name?.trim() || 'Nuovo PG',
    level: 1,
    race: preview.speciesDisplayName,
    species: {
      id: preview.species.id,
      name: preview.species.name,
      choice: preview.selectedSpeciesOption
        ? {
          ruleId: preview.speciesChoice.id,
          ruleLabel: preview.speciesChoice.label,
          id: preview.selectedSpeciesOption.id,
          label: preview.selectedSpeciesOption.label,
          displayName: preview.selectedSpeciesOption.displayName,
          featureLabel: preview.selectedSpeciesOption.featureLabel,
          summary: preview.selectedSpeciesOption.summary,
          spellcastingAbility: preview.speciesChoice.spellcastingAbility,
          unlockLevel: preview.speciesChoice.unlockLevel ?? 1,
          spells: preview.selectedSpeciesOption.spells ?? [],
        }
        : null,
    },
    background: preview.background.name,
    alignment: choices.alignment,
    concept: choices.concept?.trim() ?? '',
    classes: [
      {
        name: preview.class.name,
        level: 1,
      },
    ],
    combat: {
      hp: {
        current: levelOneHp,
        max: levelOneHp,
        temp: 0,
      },
      ac: preview.derived.ac,
      speed: preview.derived.speed,
      initiativeBonus: getAbilityModifier(preview.abilities.dex),
      hitDice: {
        current: 1,
        max: 1,
        type: preview.class.hitDie,
        byType: { [preview.class.hitDie]: 1 },
      },
    },
    abilities: preview.abilities,
    savingThrows: Object.fromEntries(
      Object.keys(ABILITY_LABELS).map((ability) => [
        ability,
        preview.class.savingThrows.includes(ability),
      ])
    ),
    skills: buildSkills(preview.background, choices.selectedClassSkills),
    resources,
    feats: [],
    spellcasting: {
      ...spellcasting,
      spells: mergeSpells(spellcasting.spells, speciesSpells),
    },
    features,
    powers: [],
    actions: buildSpeciesActions(preview.species, preview.selectedSpeciesOption),
    equipment: {
      currency: choices.equipmentMode === 'gold'
        ? { cp: 0, sp: 0, ep: 0, gp: 50, pp: 0 }
        : { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
      startingBudget: {
        gp: choices.equipmentMode === 'gold' ? 50 : 0,
        notes: choices.equipmentMode === 'gold'
          ? 'Scelta rapida: 50 mo dal background.'
          : 'Dotazione da background/classe da dettagliare.',
      },
      weapons: [],
      armor: [],
      tools: [
        ...preview.backgroundTools.all.map((toolId) => ({
          id: `background_${toolId}`,
          name: getToolById(toolId)?.label ?? toolId,
          quantity: 1,
          description: 'Competenza o strumento fornito dal background.',
        })),
        ...preview.classTools.all.map((toolId) => ({
          id: `class_${toolId}`,
          name: getToolById(toolId)?.label ?? toolId,
          quantity: 1,
          description: 'Competenza o strumento fornito dalla classe.',
        })),
      ],
      adventuringGear: [],
      magicItems: [],
      consumables: [],
      storyItems: [],
      wishlist: [],
    },
    details: {
      personalityTraits: [],
      ideals: [],
      bonds: [],
      flaws: [],
      campaignNotes: [],
    },
    progressionHistory: [
      historyEntry,
    ],
    notes: 'Creato con flusso guidato livello 0 -> 1. Alcune scelte avanzate di classe, incantesimi ed equipaggiamento saranno dettagliate nei prossimi step.',
  }

  const characterWithClassSpells = applyClassSpellChoiceDraft(
    character,
    preview.class.name,
    1,
    preview.levelOneSpellChoices
  )

  const characterWithOriginFeat = preview.originFeat?.feat
    ? applyFeatDraftToCharacter(
      characterWithClassSpells,
      preview.originFeat.feat,
      preview.originFeat.draft,
      { source: 'Background', level: 1 }
    )
    : {
      ...characterWithClassSpells,
      feats: [
        {
          id: preview.background.featId,
          name: preview.background.featName,
          source: 'Background',
          level: 1,
        },
      ],
    }

  return {
    ...characterWithOriginFeat,
    progressionSnapshots: [
      createProgressionSnapshot(characterWithOriginFeat, {
        id: `snapshot-lv-1-${id}`,
        type: 'creation',
        label: 'Livello 1',
        createdAt: appliedAt,
        sourceHistoryId: historyEntry.id,
        changes: [`Creazione come ${preview.class.name}`],
      }),
    ],
  }
}

function getDefaultLevelUpChoice(levelChoices) {
  return {
    hpIncrease:
      levelChoices?.hpIncrease?.mode === 'manual'
        ? {
          mode: 'manual',
          rolled: Number(levelChoices.hpIncrease.rolled),
        }
        : { mode: 'average' },
    classChoices: levelChoices?.classChoices ?? {},
    subclassSpellChoices: levelChoices?.subclassSpellChoices ?? {},
    invocationChoices: levelChoices?.invocationChoices ?? {},
    asiOrFeat: levelChoices?.asiOrFeat ?? { mode: 'feat', featId: '' },
  }
}

function applySpeciesProgressionChoices(character, preview) {
  const selectedSpeciesOption = preview.selectedSpeciesOption

  if (!selectedSpeciesOption) {
    return character
  }

  const currentLevel = character.level ?? preview.startingLevel ?? 1
  const speciesFeature = getSpeciesChoiceFeature(
    preview.species,
    selectedSpeciesOption,
    currentLevel
  )
  const features = [...(character.features ?? [])]

  if (
    speciesFeature &&
    !features.some((feature) => feature.id === speciesFeature.id)
  ) {
    features.push(speciesFeature)
  }

  const speciesSpells = getSpeciesSpells(
    preview.species,
    selectedSpeciesOption,
    preview.speciesChoice?.spellcastingAbility,
    currentLevel
  )

  return {
    ...character,
    features,
    spellcasting: {
      ...(character.spellcasting ?? {}),
      spells: mergeSpells(character.spellcasting?.spells, speciesSpells),
    },
  }
}

export function getCreationLevelUpFlow(choices, basePreview = null) {
  const preview = basePreview ?? getCreationPreview(choices)

  if (!preview.ready || preview.startingLevel <= 1 || !preview.class) {
    return []
  }

  let currentCharacter = buildBaseCreationCharacter(
    preview,
    choices,
    'pg_creation_preview'
  )
  const flow = []

  for (let level = 2; level <= preview.startingLevel; level += 1) {
    const levelPreview = getLevelUpPreview(currentCharacter, preview.class.name)
    const levelChoices = getDefaultLevelUpChoice(choices.levelUpChoices?.[level])
    const levelDraft = buildLevelUpDraft(currentCharacter, levelPreview, levelChoices)

    flow.push({
      level,
      character: currentCharacter,
      preview: levelPreview,
      draft: levelDraft,
    })

    if (!levelDraft.readyToApply) {
      break
    }

    currentCharacter = applyLevelUpDraft(currentCharacter, levelDraft)
  }

  return flow
}

export function buildCreationDraft(choices) {
  const preview = getCreationPreview(choices)
  const levelUpFlow = getCreationLevelUpFlow(choices, preview)
  const warnings = [...preview.warnings]

  if (!choices.name?.trim()) {
    warnings.push('Inserisci il nome del personaggio.')
  }

  if (!choices.alignment) {
    warnings.push('Scegli un allineamento.')
  }

  if (!choices.equipmentMode) {
    warnings.push('Scegli l\'equipaggiamento iniziale.')
  }

  if (preview.startingLevel > 1) {
    const completedLevels = levelUpFlow.filter((step) => step.draft.readyToApply).length
    const expectedLevels = preview.startingLevel - 1

    if (completedLevels < expectedLevels) {
      warnings.push('Completa le scelte dei passaggi di livello prima di creare il PG.')
    }

    levelUpFlow.forEach((step) => {
      step.draft.warnings.forEach((warning) => {
        warnings.push(`Livello ${step.level}: ${warning}`)
      })
    })
  }

  return {
    type: 'character_creation_draft',
    choices,
    preview,
    levelUpFlow,
    readyToApply: preview.ready && warnings.length === 0,
    warnings,
  }
}

export function applyCreationDraft(draft) {
  if (!draft.readyToApply) {
    return null
  }

  const { preview, choices } = draft
  const id = `pg_${Date.now()}`
  let character = buildBaseCreationCharacter(preview, choices, id)

  ;(draft.levelUpFlow ?? []).forEach((step) => {
    character = applyLevelUpDraft(character, step.draft)
  })

  character = applySpeciesProgressionChoices(character, preview)

  return {
    ...character,
    name: choices.name.trim(),
    notes: preview.startingLevel > 1
      ? `Creato con flusso guidato livello 0 -> ${preview.startingLevel}, applicando i passaggi di livello intermedi. Incantesimi ed equipaggiamento avanzato possono essere rifiniti nelle rispettive sezioni.`
      : character.notes,
  }
}
