

import {
  findFeatById,
  getAvailableFeats,
} from './featsCatalog.js'

const CLASS_HIT_DICE = {
  Monaco: 'd8',
  Paladino: 'd10',
  Ranger: 'd10',
  Stregone: 'd6',
}

const CLASS_RESOURCE_RULES = {
  Monaco: {
    resourceId: 'ki',
    label: 'Ki',
    getMax: (classLevel) => classLevel,
  },
}


function getTotalLevel(character) {
  let totalLevel = 0

  const classes = character.classes ?? []

  classes.forEach((characterClass) => {
    totalLevel = totalLevel + (characterClass.level ?? 0)
  })

  return totalLevel
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

/**
 * se salendo di livello cambia una risorsa di classe, prepara un change
 * 
 */
function getClassResourcePreview(character, className, nextClassLevel) {
  const rule = CLASS_RESOURCE_RULES[className]

  if (!rule) {
    return null
  }

  const resources = character.resources ?? []

  const resource = resources.find((characterResource) => {
    return characterResource.id === rule.resourceId
  })

  if (!resource) {
    return null
  }

  const newMax = rule.getMax(nextClassLevel)

  if (resource.max === newMax) {
    return null
  }

  return {
    id: `${rule.resourceId}_max`,
    label: `${rule.label} massimo`,
    from: resource.max,
    to: newMax,
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

function getLevelChoiceRequirements(className, nextClassLevel, nextTotalLevel) {
  const choices = []

  if (nextClassLevel === 4) {
    choices.push({
      id: `${className.toLowerCase()}_${nextClassLevel}_asi_or_feat`,
      label: 'Aumento caratteristiche oppure talento',
      type: 'asi_or_feat',
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

  return choices
}

export function getLevelUpPreview(character, className) {
  const characterClass = findCharacterClass(character, className)

  if (!characterClass) {
    return {
      type: 'level_up_preview',
      characterId: character.id,
      totalLevel: null,
      classLevel: null,
      proficiencyBonus: null,
      automaticChanges: [],
      requiredChoices: [],
      optionalChoices: [],
      warnings: [`Classe ${className} non trovata sul personaggio.`],
    }
  }

  const totalLevelFrom = getTotalLevel(character)
  const totalLevelTo = totalLevelFrom + 1

  const classLevelFrom = characterClass.level ?? 0
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
    {
      id: 'hit_dice_max',
      label: 'Dadi vita massimi',
      from: `${classLevelFrom}${hitDie}`,
      to: `${classLevelTo}${hitDie}`,
    },
  ]

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

  const requiredChoices = [
    getHpChoiceRequirement(character, className),
    ...getLevelChoiceRequirements(className, classLevelTo, totalLevelTo),
  ]

  return {
    type: 'level_up_preview',
    characterId: character.id,
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
  const increases = asiChoice?.increases ?? []
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

  return {
    mode: 'feat',
    feat: {
      id: feat.id,
      name: feat.name,
      category: feat.category,
      summary: feat.summary,
      effects: feat.effects ?? [],
    },
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

export function buildLevelUpDraft(character, preview, choices) {
  const hp = buildHpDraft(character, preview, choices?.hpIncrease)
  const asiOrFeat = buildAsiOrFeatDraft(character, preview, choices?.asiOrFeat)
  const warnings = [
    ...hp.warnings,
    ...(asiOrFeat?.warnings ?? []),
  ]

  return {
    type: 'level_up_draft',
    characterId: character.id,
    preview,
    hp,
    asiOrFeat,
    choices,
    readyToApply: warnings.length === 0,
    warnings,
  }
}

function applyAutomaticResourceChanges(character, preview) {
  const resources = character.resources ?? []
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
      current: Math.min(nextMax, (resource.current ?? 0) + Math.max(0, increase)),
      max: nextMax,
    }
  })
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

  if (draft.asiOrFeat?.mode === 'feat' && draft.asiOrFeat.feat) {
    const feats = character.feats ?? []
    const hasFeatAlready = feats.some((feat) => {
      return feat.id === draft.asiOrFeat.feat.id
    })

    return {
      abilities: character.abilities ?? {},
      feats: hasFeatAlready
        ? feats
        : [
          ...feats,
          {
            id: draft.asiOrFeat.feat.id,
            name: draft.asiOrFeat.feat.name,
            source: 'Level up',
            level: draft.preview.totalLevel.to,
          },
        ],
    }
  }

  return {
    abilities: character.abilities ?? {},
    feats: character.feats ?? [],
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
  const appliedAt = new Date().toISOString()

  return {
    ...character,
    level: draft.preview.totalLevel.to,
    classes: (character.classes ?? []).map((characterClass) => {
      if (characterClass.name !== className) {
        return characterClass
      }

      return {
        ...characterClass,
        level: draft.preview.classLevel.to,
      }
    }),
    abilities: asiOrFeatResult.abilities,
    feats: asiOrFeatResult.feats,
    combat: {
      ...(character.combat ?? {}),
      hp: {
        ...(character.combat?.hp ?? {}),
        current: currentHp + hpIncrease,
        max: draft.hp.maxHpTo,
      },
      hitDice: {
        ...hitDice,
        current: (hitDice.current ?? 0) + 1,
        max: (hitDice.max ?? 0) + 1,
        type: hitDice.type ?? draft.hp.hitDie,
      },
    },
    resources: applyAutomaticResourceChanges(character, draft.preview),
    progressionHistory: [
      ...(character.progressionHistory ?? []),
      {
        id: `level-up-${draft.preview.totalLevel.to}-${appliedAt}`,
        type: 'level_up',
        appliedAt,
        className,
        totalLevel: draft.preview.totalLevel,
        classLevel: draft.preview.classLevel,
        hp: draft.hp,
        asiOrFeat: draft.asiOrFeat,
      },
    ],
  }
}
