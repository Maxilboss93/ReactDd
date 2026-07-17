import spellsCatalog from '../../generated/dnd2024_spells_it.json'
import weaponsCatalog from '../../generated/dnd5e2024_rules_catalogs_it/rules/equipment/weapons.json'
import { findFeatById } from './featsCatalog.js'
import { findSpellById } from './spellsCatalog.js'

export const FEAT_ABILITY_OPTIONS = [
  { id: 'str', label: 'FOR' },
  { id: 'dex', label: 'DES' },
  { id: 'con', label: 'COS' },
  { id: 'int', label: 'INT' },
  { id: 'wis', label: 'SAG' },
  { id: 'cha', label: 'CAR' },
]

const ABILITY_LABELS = Object.fromEntries(
  FEAT_ABILITY_OPTIONS.map((ability) => [ability.id, ability.label])
)

const SPELL_LIST_OPTIONS = [
  { id: 'chierico', label: 'Chierico' },
  { id: 'druido', label: 'Druido' },
  { id: 'mago', label: 'Mago' },
]

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

const TOOL_LABELS = Object.fromEntries(
  Object.values(TOOL_OPTIONS)
    .flat()
    .map((tool) => [tool.id, tool.label])
)

function getProficiencyBonus(character) {
  const level = Number(character?.level ?? 1)

  return Math.max(2, Math.ceil(level / 4) + 1)
}

function getChoiceCount(choice, character) {
  if (choice.countSource === 'proficiency_bonus') {
    return getProficiencyBonus(character)
  }

  return choice.count ?? 1
}

function normalizeSelected(selectedChoices, choiceId) {
  const selected = selectedChoices?.[choiceId] ?? []

  return Array.isArray(selected) ? selected.filter(Boolean) : [selected].filter(Boolean)
}

function hasSkillProficiency(character, skillId) {
  return (character?.skills ?? []).some((skill) => skill.id === skillId && skill.proficient)
}

function hasSkillExpertise(character, skillId) {
  return (character?.skills ?? []).some((skill) => skill.id === skillId && skill.expertise)
}

function hasToolProficiency(character, toolId) {
  const label = TOOL_LABELS[toolId] ?? toolId
  const proficiencyTools = character?.proficiencies?.tools ?? []
  const equipmentTools = character?.equipment?.tools ?? []

  return (
    proficiencyTools.includes(toolId) ||
    proficiencyTools.includes(label) ||
    equipmentTools.some((tool) => tool.id === toolId || tool.name === label)
  )
}

function getToolOptions(categories = []) {
  const selectedCategories = categories.length > 0 ? categories : Object.keys(TOOL_OPTIONS)

  return selectedCategories.flatMap((category) => TOOL_OPTIONS[category] ?? [])
}

function isRitualSpell(spell) {
  return spell?.casting_time?.ritual || spell?.duration?.ritual_possible
}

function getSpellOptions(choice, selectedChoices) {
  const selectedList = choice.listFromChoice
    ? normalizeSelected(selectedChoices, choice.listFromChoice)[0]
    : null

  if (choice.listFromChoice && !selectedList) {
    return []
  }

  return spellsCatalog.spells
    .filter((spell) => choice.level === undefined || spell.level === choice.level)
    .filter((spell) => !selectedList || (spell.classes ?? []).includes(selectedList))
    .filter((spell) => !choice.schools || choice.schools.includes(spell.school))
    .filter((spell) => !choice.ritual || isRitualSpell(spell))
    .map((spell) => ({
      id: spell.id,
      label: spell.name,
      meta: {
        level: spell.level,
        school: spell.school,
        classes: spell.classes,
      },
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'it'))
}

function buildOptions(choice, character, selectedChoices) {
  if (choice.type === 'ability_score_choice') {
    return (choice.abilities ?? Object.keys(ABILITY_LABELS)).map((ability) => ({
      id: ability,
      label: ABILITY_LABELS[ability] ?? ability.toUpperCase(),
    }))
  }

  if (choice.type === 'ability_without_save_proficiency') {
    return Object.keys(ABILITY_LABELS)
      .filter((ability) => !character?.savingThrows?.[ability])
      .map((ability) => ({
        id: ability,
        label: ABILITY_LABELS[ability] ?? ability.toUpperCase(),
      }))
  }

  if (choice.type === 'spellcasting_ability_choice') {
    return (choice.abilities ?? ['int', 'wis', 'cha']).map((ability) => ({
      id: ability,
      label: ABILITY_LABELS[ability] ?? ability.toUpperCase(),
    }))
  }

  if (choice.type === 'spell_list_choice') {
    return SPELL_LIST_OPTIONS.filter((option) => (choice.lists ?? []).includes(option.id))
  }

  if (choice.type === 'spell_choice' || choice.type === 'ritual_spell_choice') {
    return getSpellOptions(choice, selectedChoices)
  }

  if (choice.type === 'skill_proficiency_choice') {
    return SKILL_OPTIONS
      .filter((skill) => !hasSkillProficiency(character, skill.id))
      .map((skill) => ({ id: skill.id, label: skill.label }))
  }

  if (choice.type === 'expertise_choice') {
    return SKILL_OPTIONS
      .filter((skill) => hasSkillProficiency(character, skill.id) && !hasSkillExpertise(character, skill.id))
      .map((skill) => ({ id: skill.id, label: skill.label }))
  }

  if (choice.type === 'skill_or_tool_proficiency_choice') {
    return [
      ...SKILL_OPTIONS
        .filter((skill) => !hasSkillProficiency(character, skill.id))
        .map((skill) => ({ id: `skill:${skill.id}`, label: `Abilita: ${skill.label}` })),
      ...getToolOptions(choice.categories)
        .filter((tool) => !hasToolProficiency(character, tool.id))
        .map((tool) => ({ id: `tool:${tool.id}`, label: `Strumento: ${tool.label}` })),
    ]
  }

  if (choice.type === 'tool_proficiency_choice') {
    return getToolOptions(choice.categories)
      .filter((tool) => !hasToolProficiency(character, tool.id))
  }

  if (choice.type === 'damage_type_choice') {
    return (choice.options ?? []).map((option) => ({ id: option, label: option }))
  }

  if (choice.type === 'weapon_mastery_choice') {
    return weaponsCatalog.items.map((weapon) => ({
      id: weapon.id,
      label: `${weapon.name} (${weapon.mastery})`,
      meta: { mastery: weapon.mastery },
    }))
  }

  return (choice.options ?? []).map((option) => {
    if (typeof option === 'string') {
      return { id: option, label: option }
    }

    return option
  })
}

export function getFeatChoiceRequirements(feat, character, selectedChoices = {}) {
  return (feat?.choices ?? []).map((choice) => {
    const count = getChoiceCount(choice, character)

    return {
      ...choice,
      count,
      selected: normalizeSelected(selectedChoices, choice.id),
      options: buildOptions(choice, character, selectedChoices),
    }
  })
}

function getOptionLabel(requirement, selectedId) {
  const option = (requirement.options ?? []).find((candidate) => candidate.id === selectedId)

  return option?.label ?? selectedId
}

function hasDuplicateItems(items) {
  return new Set(items).size !== items.length
}

export function buildFeatChoiceDraft(character, feat, selectedChoices = {}) {
  const requirements = getFeatChoiceRequirements(feat, character, selectedChoices)
  const choiceDrafts = requirements.map((requirement) => {
    const selected = normalizeSelected(selectedChoices, requirement.id)
    const optionIds = new Set((requirement.options ?? []).map((option) => option.id))
    const warnings = []

    if (selected.length !== requirement.count) {
      warnings.push(`Scegli ${requirement.count} opzioni per ${requirement.label}.`)
    }

    if (hasDuplicateItems(selected)) {
      warnings.push(`Non scegliere due volte la stessa opzione per ${requirement.label}.`)
    }

    if (selected.some((selectedId) => !optionIds.has(selectedId))) {
      warnings.push(`Una scelta non e valida per ${requirement.label}.`)
    }

    if (
      (requirement.type === 'ability_score_choice' || requirement.type === 'ability_without_save_proficiency') &&
      selected.some((ability) => {
        const currentScore = Number(character?.abilities?.[ability] ?? 0)
        const amount = Number(requirement.amount ?? 1)
        const max = Number(requirement.max ?? 20)

        return currentScore + amount > max
      })
    ) {
      warnings.push(`${requirement.label} supererebbe il massimo consentito.`)
    }

    return {
      id: requirement.id,
      label: requirement.label,
      type: requirement.type,
      count: requirement.count,
      amount: requirement.amount ?? 1,
      max: requirement.max ?? 20,
      selected,
      labels: selected.map((selectedId) => getOptionLabel(requirement, selectedId)),
      selectedOptions: selected.map((selectedId) => {
        return (requirement.options ?? []).find((option) => option.id === selectedId) ?? {
          id: selectedId,
          label: selectedId,
        }
      }),
      sourceChoice: requirement,
      warnings,
    }
  })

  return {
    featId: feat?.id ?? null,
    featName: feat?.name ?? null,
    requirements,
    choices: choiceDrafts,
    warnings: choiceDrafts.flatMap((choice) => choice.warnings),
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

function ensureSkillEntries(skills) {
  const existingIds = new Set((skills ?? []).map((skill) => skill.id))
  const missingSkills = SKILL_OPTIONS
    .filter((skill) => !existingIds.has(skill.id))
    .map((skill) => ({ ...skill, proficient: false }))

  return [...(skills ?? []), ...missingSkills]
}

function addToolEquipment(character, toolId, sourceName) {
  const tools = character.equipment?.tools ?? []
  const toolName = TOOL_LABELS[toolId] ?? toolId
  const exists = tools.some((tool) => tool.name === toolName || tool.id === `feat_${toolId}`)

  if (exists) {
    return tools
  }

  return [
    ...tools,
    {
      id: `feat_${toolId}`,
      name: toolName,
      quantity: 1,
      description: `Competenza fornita da ${sourceName}.`,
    },
  ]
}

function getFeatSpellAbility(choiceDrafts) {
  const explicitAbility = choiceDrafts
    .find((choice) => choice.type === 'spellcasting_ability_choice')
    ?.selected?.[0]

  if (explicitAbility) {
    return explicitAbility
  }

  return choiceDrafts
    .find((choice) => choice.type === 'ability_score_choice' || choice.type === 'ability_without_save_proficiency')
    ?.selected?.[0] ?? null
}

function normalizeFeatEntryChoices(featEntry) {
  const choices = featEntry?.choices

  if (Array.isArray(choices)) {
    return choices
  }

  if (!choices || typeof choices !== 'object') {
    return []
  }

  return Object.entries(choices).map(([id, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return {
        id,
        ...value,
        selected: Array.isArray(value.selected)
          ? value.selected
          : Array.isArray(value.value)
            ? value.value
            : [value.selected ?? value.value].filter(Boolean),
      }
    }

    return {
      id,
      selected: Array.isArray(value) ? value : [value].filter(Boolean),
    }
  })
}

function getFeatEntrySpellAbility(featEntry) {
  return normalizeFeatEntryChoices(featEntry)
    .find((choice) => {
      return choice.id === 'ability_increase' || choice.id === 'magic_initiate_ability'
    })
    ?.selected?.[0] ?? null
}

function buildSpellEntry(spellLike, sourceName, ability, extra = {}) {
  const spell = findSpellById(spellLike.id)

  return {
    id: spellLike.id,
    name: spell?.name ?? spellLike.name ?? spellLike.label ?? spellLike.id,
    level: spell?.level ?? spellLike.level,
    source: sourceName,
    ability,
    prepared: true,
    featSpell: true,
    alwaysPrepared: spellLike.alwaysPrepared ?? extra.alwaysPrepared ?? true,
    freeCast: spellLike.freeCast ?? extra.freeCast ?? null,
  }
}

export function applyFeatDraftToCharacter(character, feat, choiceDraft, source = {}) {
  if (!feat) {
    return character
  }

  const sourceName = source.source ?? 'Talento'
  const level = source.level ?? character.level ?? 1
  const choiceDrafts = choiceDraft?.choices ?? []
  const spellAbility = getFeatSpellAbility(choiceDrafts)
  let nextCharacter = {
    ...character,
    abilities: { ...(character.abilities ?? {}) },
    savingThrows: { ...(character.savingThrows ?? {}) },
    skills: ensureSkillEntries(character.skills ?? []),
    proficiencies: { ...(character.proficiencies ?? {}) },
    equipment: {
      ...(character.equipment ?? {}),
      tools: character.equipment?.tools ?? [],
    },
    spellcasting: {
      ...(character.spellcasting ?? {}),
      spells: character.spellcasting?.spells ?? [],
    },
  }

  const toolProficiencies = new Set(nextCharacter.proficiencies.tools ?? [])
  const weaponMasteries = new Set(nextCharacter.proficiencies.weaponMasteries ?? [])
  const chosenSpells = []

  choiceDrafts.forEach((choice) => {
    if (choice.type === 'ability_score_choice' || choice.type === 'ability_without_save_proficiency') {
      choice.selected.forEach((ability) => {
        const currentScore = Number(nextCharacter.abilities[ability] ?? 0)
        const amount = Number(choice.amount ?? 1)
        const max = Number(choice.max ?? 20)

        nextCharacter.abilities[ability] = Math.min(max, currentScore + amount)

        if (choice.type === 'ability_without_save_proficiency') {
          nextCharacter.savingThrows[ability] = true
        }
      })
    }

    if (choice.type === 'skill_proficiency_choice' || choice.type === 'expertise_choice') {
      nextCharacter.skills = nextCharacter.skills.map((skill) => {
        if (!choice.selected.includes(skill.id)) {
          return skill
        }

        return {
          ...skill,
          proficient: true,
          ...(choice.type === 'expertise_choice' ? { expertise: true } : {}),
        }
      })
    }

    if (choice.type === 'skill_or_tool_proficiency_choice') {
      choice.selected.forEach((selectedId) => {
        const [kind, id] = selectedId.split(':')

        if (kind === 'skill') {
          nextCharacter.skills = nextCharacter.skills.map((skill) => {
            return skill.id === id ? { ...skill, proficient: true } : skill
          })
        }

        if (kind === 'tool') {
          toolProficiencies.add(TOOL_LABELS[id] ?? id)
          nextCharacter.equipment.tools = addToolEquipment(nextCharacter, id, feat.name)
        }
      })
    }

    if (choice.type === 'tool_proficiency_choice') {
      choice.selected.forEach((toolId) => {
        toolProficiencies.add(TOOL_LABELS[toolId] ?? toolId)
        nextCharacter.equipment.tools = addToolEquipment(nextCharacter, toolId, feat.name)
      })
    }

    if (choice.type === 'weapon_mastery_choice') {
      choice.labels.forEach((label) => weaponMasteries.add(label))
    }

    if (choice.type === 'spell_choice' || choice.type === 'ritual_spell_choice') {
      choice.selectedOptions.forEach((option) => {
        chosenSpells.push(buildSpellEntry(option, feat.name, spellAbility, choice.sourceChoice))
      })
    }
  })

  const grantedSpells = (feat.grantedSpells ?? []).map((spell) => {
    return buildSpellEntry(spell, feat.name, spellAbility)
  })
  const feats = nextCharacter.feats ?? []
  const featEntry = {
    id: feat.id,
    name: feat.name,
    source: sourceName,
    level,
    category: feat.category,
    summary: feat.summary,
    choices: choiceDrafts.map((choice) => ({
      id: choice.id,
      label: choice.label,
      selected: choice.selected,
      labels: choice.labels,
    })),
  }
  const hasFeatAlready = feats.some((characterFeat) => characterFeat.id === feat.id)

  return {
    ...nextCharacter,
    proficiencies: {
      ...nextCharacter.proficiencies,
      tools: [...toolProficiencies],
      weaponMasteries: [...weaponMasteries],
    },
    feats: hasFeatAlready
      ? feats.map((characterFeat) => characterFeat.id === feat.id ? featEntry : characterFeat)
      : [...feats, featEntry],
    spellcasting: {
      ...nextCharacter.spellcasting,
      spells: mergeSpells(nextCharacter.spellcasting.spells, [
        ...chosenSpells,
        ...grantedSpells,
      ]),
    },
  }
}

export function repairFeatGrantedSpells(character) {
  if (!character) {
    return character
  }

  const grantedSpells = (character.feats ?? []).flatMap((featEntry) => {
    const feat = findFeatById(featEntry.id)
    const ability = getFeatEntrySpellAbility(featEntry)

    return (feat?.grantedSpells ?? []).map((spell) => {
      return buildSpellEntry(spell, feat.name, ability)
    })
  })

  if (grantedSpells.length === 0) {
    return character
  }

  return {
    ...character,
    spellcasting: {
      ...(character.spellcasting ?? {}),
      spells: mergeSpells(character.spellcasting?.spells, grantedSpells),
    },
  }
}
