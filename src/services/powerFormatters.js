const ABILITY_LABELS = {
  str: 'Forza',
  dex: 'Destrezza',
  con: 'Costituzione',
  int: 'Intelligenza',
  wis: 'Saggezza',
  cha: 'Carisma',
}

const RESET_LABELS = {
  short_rest: 'riposo breve',
  long_rest: 'riposo lungo',
  dawn: 'alba',
  none: 'nessun reset',
}

const SCALE_LABELS = {
  level: 'livello',
  proficiency_bonus: 'competenza',
  ability_modifier: 'mod caratteristica',
}

export function getAbilityModifier(score) {
  return Math.floor(((score ?? 10) - 10) / 2)
}

export function getProficiencyBonus(character) {
  const level = character?.level ?? 1
  return Math.min(6, 2 + Math.floor((level - 1) / 4))
}

function formatAbilityLabel(ability) {
  if (!ability) return null

  return String(ability)
    .split('/')
    .map((part) => ABILITY_LABELS[part] ?? part.toUpperCase())
    .join('/')
}

function getMonkSaveDc(character) {
  const wisdomModifier = getAbilityModifier(character?.abilities?.wis)
  const proficiencyBonus = getProficiencyBonus(character)
  return 8 + wisdomModifier + proficiencyBonus
}

export function getPowerSaveLabel(power, character) {
  const ability = power.save?.ability
  const dcType = power.save?.dc

  if (!ability && !dcType) return null

  const saveAbility = formatAbilityLabel(ability)
  const savePrefix = saveAbility ? `TS ${saveAbility}` : 'TS'

  if (dcType === 'monk_dc') {
    return `${savePrefix} CD ${getMonkSaveDc(character)}`
  }

  if (dcType === 'spell_save_dc') {
    const spellSaveDc = character?.spellcasting?.spellSaveDc
    return spellSaveDc ? `${savePrefix} CD ${spellSaveDc}` : savePrefix
  }

  if (dcType === 'variabile') {
    return `${savePrefix} CD variabile`
  }

  if (typeof dcType === 'number') {
    return `${savePrefix} CD ${dcType}`
  }

  return savePrefix
}

export function getPowerUsesLabel(power) {
  const uses = power.uses
  if (!uses) return null

  const pieces = []

  if (uses.max) {
    pieces.push(`${uses.max} usi`)
  }

  if (uses.scales_with) {
    pieces.push(`scala con ${SCALE_LABELS[uses.scales_with] ?? uses.scales_with}`)
  }

  if (uses.reset_on) {
    pieces.push(`reset: ${RESET_LABELS[uses.reset_on] ?? uses.reset_on}`)
  }

  return pieces.length > 0 ? pieces.join(' · ') : null
}

export function getPowerFactLabels(power, character) {
  const saveLabel = getPowerSaveLabel(power, character)
  const usesLabel = getPowerUsesLabel(power)

  return [
    power.cost?.label ? `Costo: ${power.cost.label}` : null,
    usesLabel ? `Usi: ${usesLabel}` : null,
    power.trigger ? `Quando: ${power.trigger}` : null,
    power.range ? `Gittata: ${power.range}` : null,
    power.area ? `Area: ${power.area}` : null,
    power.duration ? `Durata: ${power.duration}` : null,
    power.roll,
    power.damage,
    saveLabel,
  ].filter(Boolean)
}

export function getPowerSourceLabel(power) {
  const levelLabel = power.level ? `Livello ${power.level}` : null
  return [power.source, power.subsource, levelLabel].filter(Boolean).join(' · ')
}
