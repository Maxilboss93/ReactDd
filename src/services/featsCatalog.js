import featsCatalog from '../../generated/dnd5e2024_rules_catalogs_it/rules/feats/feats.json'

function getTotalLevel(character, context = {}) {
  return context.characterLevel ?? character?.level ?? (character?.classes ?? []).reduce((total, characterClass) => {
    return total + (characterClass.level ?? 0)
  }, 0)
}

function hasFeature(character, featureId) {
  const features = character?.features ?? []
  const powers = character?.powers ?? []

  return (
    features.some((feature) => feature.id === featureId || feature.kind === featureId) ||
    powers.some((power) => power.id === featureId)
  )
}

function hasAnyFeature(character, featureIds) {
  return featureIds.some((featureId) => hasFeature(character, featureId))
}

function hasProficiency(character, proficiencyId) {
  const skills = character?.skills ?? []

  return skills.some((skill) => skill.id === proficiencyId && skill.proficient)
}

function meetsPrerequisite(character, prerequisite, context) {
  if (prerequisite.type === 'character_level') {
    return getTotalLevel(character, context) >= prerequisite.min
  }

  if (prerequisite.type === 'ability') {
    return (character?.abilities?.[prerequisite.ability] ?? 0) >= prerequisite.min
  }

  if (prerequisite.type === 'ability_any') {
    return prerequisite.abilities.some((ability) => {
      return (character?.abilities?.[ability] ?? 0) >= prerequisite.min
    })
  }

  if (prerequisite.type === 'feature') {
    return hasFeature(character, prerequisite.id)
  }

  if (prerequisite.type === 'feature_any') {
    return hasAnyFeature(character, prerequisite.ids ?? [])
  }

  if (prerequisite.type === 'proficiency') {
    return hasProficiency(character, prerequisite.id)
  }

  return false
}

function meetsPrerequisites(character, feat, context) {
  return (feat.prerequisites ?? []).every((prerequisite) => {
    return meetsPrerequisite(character, prerequisite, context)
  })
}

function hasFeat(character, featId) {
  const feats = character?.feats ?? []

  return feats.some((feat) => feat.id === featId)
}

export function getAllFeats() {
  return featsCatalog.items
}

export function findFeatById(id) {
  return featsCatalog.items.find((feat) => feat.id === id)
}

export function getAvailableFeats(character, featChoice) {
  const allowedCategories = featChoice?.allowedCategories ?? []
  const requirePrerequisites = featChoice?.requirePrerequisites ?? true
  const context = {
    characterLevel: featChoice?.characterLevel,
  }

  return featsCatalog.items.filter((feat) => {
    const isAllowedCategory =
      allowedCategories.length === 0 || allowedCategories.includes(feat.category)

    if (!isAllowedCategory) {
      return false
    }

    if (!feat.repeatable && hasFeat(character, feat.id)) {
      return false
    }

    if (requirePrerequisites && !meetsPrerequisites(character, feat, context)) {
      return false
    }

    return true
  })
}
