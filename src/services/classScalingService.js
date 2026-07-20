const CLASS_RESOURCE_TABLES = {
  Barbaro: {
    id: 'rage',
    label: 'Ira',
    resetOn: 'long_rest',
    category: 'class',
    table: {
      1: 2,
      2: 2,
      3: 3,
      4: 3,
      5: 3,
      6: 4,
      7: 4,
      8: 4,
      9: 4,
      10: 4,
      11: 4,
      12: 5,
      13: 5,
      14: 5,
      15: 5,
      16: 5,
      17: 6,
      18: 6,
      19: 6,
      20: 6,
    },
  },
  Bardo: {
    id: 'bardic_inspiration',
    label: 'Ispirazione Bardica',
    category: 'class',
    getMax: (_classLevel, character) => {
      return Math.max(1, getAbilityModifier(character?.abilities?.cha ?? 10))
    },
    getResetOn: (classLevel) => classLevel >= 5 ? 'short_rest' : 'long_rest',
  },
  Chierico: {
    id: 'channel_divinity',
    label: 'Incanalare Divinita',
    resetOn: 'short_rest',
    category: 'class',
    table: {
      2: 2,
      3: 2,
      4: 2,
      5: 2,
      6: 3,
      7: 3,
      8: 3,
      9: 3,
      10: 3,
      11: 3,
      12: 3,
      13: 3,
      14: 3,
      15: 3,
      16: 3,
      17: 3,
      18: 4,
      19: 4,
      20: 4,
    },
  },
  Druido: {
    id: 'wild_shape',
    label: 'Forma Selvatica',
    resetOn: 'long_rest',
    shortRestRecover: 1,
    category: 'class',
    table: {
      2: 2,
      3: 2,
      4: 2,
      5: 3,
      6: 3,
      7: 3,
      8: 3,
      9: 3,
      10: 3,
      11: 3,
      12: 3,
      13: 4,
      14: 4,
      15: 4,
      16: 4,
      17: 4,
      18: 4,
      19: 4,
      20: 4,
    },
  },
  Guerriero: {
    id: 'second_wind',
    label: 'Recuperare Energie',
    resetOn: 'long_rest',
    shortRestRecover: 1,
    category: 'class',
    table: {
      1: 2,
      2: 2,
      3: 2,
      4: 3,
      5: 3,
      6: 3,
      7: 3,
      8: 3,
      9: 3,
      10: 4,
      11: 4,
      12: 4,
      13: 4,
      14: 4,
      15: 4,
      16: 4,
      17: 4,
      18: 4,
      19: 4,
      20: 4,
    },
  },
  Monaco: {
    id: 'ki',
    label: 'Ki',
    resetOn: 'short_rest',
    category: 'class',
    getMax: (classLevel) => classLevel >= 2 ? classLevel : 0,
  },
  Paladino: {
    id: 'lay_on_hands',
    label: 'Imposizione delle Mani',
    resetOn: 'long_rest',
    category: 'class',
    getMax: (classLevel) => classLevel * 5,
  },
  Stregone: {
    id: 'sorcery_points',
    label: 'Punti Stregoneria',
    resetOn: 'long_rest',
    category: 'class',
    getMax: (classLevel) => classLevel >= 2 ? classLevel : 0,
  },
}

const MARTIAL_ARTS_DIE_TABLE = [
  { min: 1, max: 4, die: 'd6' },
  { min: 5, max: 10, die: 'd8' },
  { min: 11, max: 16, die: 'd10' },
  { min: 17, max: 20, die: 'd12' },
]

const SNEAK_ATTACK_DICE_TABLE = {
  1: '1d6',
  2: '1d6',
  3: '2d6',
  4: '2d6',
  5: '3d6',
  6: '3d6',
  7: '4d6',
  8: '4d6',
  9: '5d6',
  10: '5d6',
  11: '6d6',
  12: '6d6',
  13: '7d6',
  14: '7d6',
  15: '8d6',
  16: '8d6',
  17: '9d6',
  18: '9d6',
  19: '10d6',
  20: '10d6',
}

export function getAbilityModifier(score) {
  return Math.floor(((Number(score) || 10) - 10) / 2)
}

function getScaledTableValue(table, classLevel) {
  if (!table) {
    return 0
  }

  for (let level = Math.min(20, classLevel); level >= 1; level -= 1) {
    if (table[level] !== undefined) {
      return table[level]
    }
  }

  return 0
}

export function getClassLevel(character, className) {
  return (character?.classes ?? []).find((characterClass) => {
    return characterClass.name === className
  })?.level ?? 0
}

export function getClassResourceEntry(character, className, classLevel = getClassLevel(character, className)) {
  const rule = CLASS_RESOURCE_TABLES[className]

  if (!rule || classLevel <= 0) {
    return null
  }

  const max = rule.getMax
    ? rule.getMax(classLevel, character)
    : getScaledTableValue(rule.table, classLevel)

  if (!max || max <= 0) {
    return null
  }

  return {
    id: rule.id,
    label: rule.label,
    current: max,
    max,
    resetOn: rule.getResetOn ? rule.getResetOn(classLevel, character) : rule.resetOn,
    shortRestRecover: rule.shortRestRecover ?? null,
    category: rule.category ?? 'class',
    source: className,
  }
}

export function getClassResourceEntries(character) {
  return (character?.classes ?? [])
    .map((characterClass) => getClassResourceEntry(character, characterClass.name, characterClass.level ?? 0))
    .filter(Boolean)
}

export function getMartialArtsDie(classLevel) {
  return MARTIAL_ARTS_DIE_TABLE.find((entry) => {
    return classLevel >= entry.min && classLevel <= entry.max
  })?.die ?? null
}

export function getSneakAttackDice(classLevel) {
  return SNEAK_ATTACK_DICE_TABLE[Math.max(1, Math.min(20, classLevel))] ?? null
}

export function getClassDerivedStats(character) {
  const stats = []
  const monkLevel = getClassLevel(character, 'Monaco')
  const rogueLevel = getClassLevel(character, 'Ladro')

  if (monkLevel > 0) {
    stats.push({
      id: 'martial_arts_die',
      label: 'Dado Arti Marziali',
      value: getMartialArtsDie(monkLevel),
      source: `Monaco ${monkLevel}`,
    })
  }

  if (rogueLevel > 0) {
    stats.push({
      id: 'sneak_attack_dice',
      label: 'Attacco Furtivo',
      value: getSneakAttackDice(rogueLevel),
      source: `Ladro ${rogueLevel}`,
    })
  }

  return stats.filter((stat) => stat.value)
}
