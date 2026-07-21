import startingEquipmentCatalog from '../../generated/dnd5e2024_rules_catalogs_it/rules/equipment/starting_equipment.json'
import backgroundEquipmentCatalog from '../../generated/dnd5e2024_rules_catalogs_it/rules/equipment/background_starting_equipment.json'
import weaponsCatalog from '../../generated/dnd5e2024_rules_catalogs_it/rules/equipment/weapons.json'
import armorsCatalog from '../../generated/dnd5e2024_rules_catalogs_it/rules/equipment/armors.json'
import shieldsCatalog from '../../generated/dnd5e2024_rules_catalogs_it/rules/equipment/shields.json'
import toolsCatalog from '../../generated/dnd5e2024_rules_catalogs_it/rules/equipment/tools.json'
import adventuringGearCatalog from '../../generated/dnd5e2024_rules_catalogs_it/rules/equipment/adventuring_gear.json'

const COPPER_BY_COIN = {
  mr: 1,
  ma: 10,
  me: 50,
  mo: 100,
  mp: 1000,
}

const COIN_BY_APP_CURRENCY = {
  cp: 'mr',
  sp: 'ma',
  ep: 'me',
  gp: 'mo',
  pp: 'mp',
}

const CATALOGS = {
  weapons: weaponsCatalog.items ?? [],
  armors: armorsCatalog.items ?? [],
  shields: shieldsCatalog.items ?? [],
  tools: toolsCatalog.items ?? [],
  adventuring_gear: adventuringGearCatalog.items ?? [],
}

const GROUP_BY_CATALOG = {
  weapons: 'weapons',
  armors: 'armor',
  shields: 'armor',
  tools: 'tools',
  adventuring_gear: 'adventuringGear',
}

export const INVENTORY_GROUP_OPTIONS = [
  { id: 'weapons', label: 'Arma' },
  { id: 'armor', label: 'Armatura o scudo' },
  { id: 'tools', label: 'Strumento' },
  { id: 'adventuringGear', label: 'Oggetto' },
  { id: 'magicItems', label: 'Oggetto magico' },
  { id: 'consumables', label: 'Consumabile' },
  { id: 'storyItems', label: 'Oggetto di storia' },
  { id: 'wishlist', label: 'Da trovare / comprare' },
]

const CATALOG_LABELS = {
  weapons: 'Armi',
  armors: 'Armature',
  shields: 'Scudi',
  tools: 'Strumenti',
  adventuring_gear: 'Equipaggiamento',
}

const TOOL_ID_TO_CATALOG_ID = {
  alchemist_supplies: 'scorte-da-alchimista',
  brewer_supplies: 'scorte-da-birraio',
  calligrapher_supplies: 'scorte-da-calligrafo',
  carpenter_tools: 'strumenti-da-falegname',
  cartographer_tools: 'strumenti-da-cartografo',
  cobbler_tools: 'strumenti-da-calzolaio',
  cook_utensils: 'utensili-da-cuoco',
  glassblower_tools: 'strumenti-da-soffiatore',
  jeweler_tools: 'strumenti-da-gioielliere',
  leatherworker_tools: 'strumenti-da-conciatore',
  mason_tools: 'strumenti-da-muratore',
  painter_tools: 'strumenti-da-pittore',
  potter_tools: 'strumenti-da-vasaio',
  smith_tools: 'strumenti-da-fabbro',
  weaver_tools: 'strumenti-da-tessitore',
  woodcarver_tools: 'strumenti-da-intagliatore',
  forgery_kit: 'arnesi-da-falsario',
  thieves_tools: 'arnesi-da-scasso',
  herbalism_kit: 'borsa-da-erborista',
  navigator_tools: 'strumenti-da-navigatore',
  dice_set: 'gioco',
  dragonchess_set: 'gioco',
  playing_cards: 'gioco',
  three_dragon_ante: 'gioco',
  bagpipes: 'strumento-musicale',
  drum: 'strumento-musicale',
  dulcimer: 'strumento-musicale',
  flute: 'strumento-musicale',
  horn: 'strumento-musicale',
  lute: 'strumento-musicale',
  lyre: 'strumento-musicale',
  pan_flute: 'strumento-musicale',
  shawm: 'strumento-musicale',
  viol: 'strumento-musicale',
}

const TOOL_VARIANT_BY_ID = {
  dice_set: 'dadi',
  dragonchess_set: 'scacchi dei draghi',
  playing_cards: 'carte da gioco',
  three_dragon_ante: 'Tre Draghi al Buio',
  bagpipes: 'cornamusa',
  drum: 'tamburo',
  dulcimer: 'dulcimer',
  flute: 'flauto',
  horn: 'corno',
  lute: 'liuto',
  lyre: 'lira',
  pan_flute: 'flauto di pan',
  shawm: 'ciaramella',
  viol: 'viola',
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function findCatalogItem(catalog, id) {
  return (CATALOGS[catalog] ?? []).find((item) => item.id === id) ?? null
}

function getClassEquipmentRule(classId) {
  return startingEquipmentCatalog.class_equipment?.[classId] ?? null
}

function getBackgroundEquipmentRule(backgroundId) {
  return backgroundEquipmentCatalog.background_equipment?.[backgroundId] ?? null
}

function getOptionById(options, optionId) {
  return (options ?? []).find((option) => option.id === optionId) ?? null
}

function getCurrencyOnlyOption(options = []) {
  return options.find((option) => option.currency && !(option.items?.length > 0)) ?? null
}

function getPackageOptions(options = []) {
  return options.filter((option) => option.items?.length > 0)
}

function getDefaultBackgroundOption(backgroundRule, mode) {
  if (!backgroundRule) {
    return null
  }

  return mode === 'gold'
    ? getCurrencyOnlyOption(backgroundRule.startingOptions)
    : getPackageOptions(backgroundRule.startingOptions)[0] ?? null
}

function getDefaultClassOption(classRule, mode) {
  if (!classRule) {
    return null
  }

  return mode === 'gold'
    ? getCurrencyOnlyOption(classRule.startingOptions)
    : getPackageOptions(classRule.startingOptions)[0] ?? null
}

function parseCostToCopper(cost) {
  if (!cost || typeof cost !== 'string') {
    return 0
  }

  const match = cost.match(/([\d.,]+)\s*(mr|ma|me|mo|mp)/i)

  if (!match) {
    return 0
  }

  const amount = Number(match[1].replace(/\./g, '').replace(',', '.'))
  const coin = match[2].toLowerCase()

  return Math.round(amount * (COPPER_BY_COIN[coin] ?? 0))
}

function currencyToCopper(currency = {}) {
  return Object.entries(currency).reduce((total, [coin, amount]) => {
    const normalizedCoin = COIN_BY_APP_CURRENCY[coin] ?? coin

    return total + (Number(amount) || 0) * (COPPER_BY_COIN[normalizedCoin] ?? 0)
  }, 0)
}

function copperToCurrency(copper) {
  let remaining = Math.max(0, Math.round(copper))
  const pp = Math.floor(remaining / COPPER_BY_COIN.mp)
  remaining -= pp * COPPER_BY_COIN.mp
  const gp = Math.floor(remaining / COPPER_BY_COIN.mo)
  remaining -= gp * COPPER_BY_COIN.mo
  const ep = Math.floor(remaining / COPPER_BY_COIN.me)
  remaining -= ep * COPPER_BY_COIN.me
  const sp = Math.floor(remaining / COPPER_BY_COIN.ma)
  remaining -= sp * COPPER_BY_COIN.ma

  return {
    cp: remaining,
    sp,
    ep,
    gp,
    pp,
  }
}

function formatCopper(copper) {
  const currency = copperToCurrency(copper)
  const parts = [
    currency.pp ? `${currency.pp} mp` : '',
    currency.gp ? `${currency.gp} mo` : '',
    currency.ep ? `${currency.ep} me` : '',
    currency.sp ? `${currency.sp} ma` : '',
    currency.cp ? `${currency.cp} mr` : '',
  ].filter(Boolean)

  return parts.length > 0 ? parts.join(', ') : '0 mo'
}

function addCurrencyFromOption(option) {
  const itemCurrency = (option?.items ?? [])
    .filter((item) => item.catalog === 'currency')
    .reduce((currency, item) => ({
      ...currency,
      [item.id]: (currency[item.id] ?? 0) + (Number(item.quantity) || 0),
    }), {})

  return currencyToCopper(option?.currency ?? {}) + currencyToCopper(itemCurrency)
}

function getToolCatalogEntry(toolId) {
  const catalogId = TOOL_ID_TO_CATALOG_ID[toolId] ?? toolId
  const item = findCatalogItem('tools', catalogId)

  if (!item) {
    return null
  }

  return {
    catalog: 'tools',
    id: item.id,
    quantity: 1,
    variant: TOOL_VARIANT_BY_ID[toolId],
  }
}

function getToolEntriesFromSelected(toolIds = []) {
  return toolIds
    .map((toolId) => getToolCatalogEntry(toolId))
    .filter(Boolean)
}

function getChoiceOptions(item, context) {
  if (item.source === 'backgroundToolTraining') {
    return getToolEntriesFromSelected(context.selectedBackgroundTools)
  }

  if (item.source === 'toolTraining') {
    return getToolEntriesFromSelected(context.selectedClassTools)
  }

  if (item.source === 'tools') {
    return (toolsCatalog.items ?? [])
      .filter((tool) => (item.categories ?? []).includes(tool.category))
      .map((tool) => ({
        catalog: 'tools',
        id: tool.id,
        quantity: item.quantity ?? 1,
      }))
  }

  return []
}

function getChoiceRequirementsFromOption(option, context) {
  return (option?.items ?? [])
    .filter((item) => item.catalog === 'choice')
    .flatMap((item) => {
      const options = getChoiceOptions(item, context)

      if (options.length <= 1) {
        return []
      }

      return [{
        id: item.choiceId,
        label: item.label,
        count: item.count ?? item.quantity ?? 1,
        options: options.map((option) => {
          const catalogItem = findCatalogItem(option.catalog, option.id)

          return {
            ...option,
            label: getItemDisplayName(catalogItem, option),
          }
        }),
      }]
    })
}

function getItemDisplayName(catalogItem, entry = {}) {
  if (!catalogItem) {
    return entry.id ?? 'Oggetto'
  }

  return entry.variant
    ? `${catalogItem.name} (${entry.variant})`
    : catalogItem.name
}

function normalizeItemEntry(entry, source, context, selectedEquipmentChoices = {}) {
  if (entry.catalog === 'currency') {
    return []
  }

  if (entry.catalog === 'choice') {
    const options = getChoiceOptions(entry, context)
    const selectedIds = selectedEquipmentChoices[entry.choiceId] ?? []
    const selectedOptions = selectedIds.length > 0
      ? options.filter((option) => selectedIds.includes(`${option.catalog}:${option.id}:${option.variant ?? ''}`))
      : options.slice(0, entry.count ?? entry.quantity ?? 1)

    return selectedOptions.map((option) => ({
      ...option,
      quantity: option.quantity ?? entry.quantity ?? 1,
      source,
    }))
  }

  return [{
    ...entry,
    source,
  }]
}

function getInventoryItem(entry) {
  const catalogItem = findCatalogItem(entry.catalog, entry.id)

  if (!catalogItem) {
    return null
  }

  const itemId = [
    entry.source?.id ?? 'equipment',
    entry.catalog,
    entry.id,
    slugify(entry.variant ?? ''),
  ].filter(Boolean).join('_')

  return {
    id: itemId,
    itemId: entry.id,
    catalog: entry.catalog,
    inventoryGroup: GROUP_BY_CATALOG[entry.catalog],
    name: getItemDisplayName(catalogItem, entry),
    quantity: Number(entry.quantity) || 1,
    equipped: Boolean(entry.equipped),
    description: entry.source?.label ?? '',
    notes: [
      catalogItem.cost ? `Costo: ${catalogItem.cost}` : '',
      catalogItem.weight ? `Peso: ${catalogItem.weight}` : '',
    ].filter(Boolean).join(' - '),
    costCopper: parseCostToCopper(catalogItem.cost),
    cost: catalogItem.cost,
    weight: catalogItem.weight,
    stats: getItemStats(entry.catalog, catalogItem),
    recoverable: entry.catalog === 'adventuring_gear' && entry.id === 'munizioni',
    consumable: entry.catalog === 'adventuring_gear' && ['olio', 'acido', 'acqua-santa', 'antitossina', 'pozione-di-guarigione'].includes(entry.id),
  }
}

function getItemStats(catalog, item) {
  if (catalog === 'weapons') {
    return {
      type: 'weapon',
      category: item.proficiency,
      kind: item.kind,
      damage: item.damage ? `${item.damage.dice} ${item.damage.type}` : null,
      properties: item.properties ?? [],
      mastery: item.mastery,
    }
  }

  if (catalog === 'armors') {
    return {
      type: 'armor',
      category: item.category,
      armorClass: item.armor_class,
      strengthRequirement: item.strength_requirement,
      stealthDisadvantage: Boolean(item.stealth_disadvantage),
    }
  }

  if (catalog === 'shields') {
    return {
      type: 'shield',
      category: item.category,
      armorClassBonus: item.armor_class_bonus,
      equipAction: item.equip_action,
    }
  }

  if (catalog === 'tools') {
    return {
      type: 'tool',
      category: item.category,
      ability: item.ability,
    }
  }

  if (catalog === 'adventuring_gear') {
    return {
      type: 'gear',
      category: item.category,
    }
  }

  return {
    type: catalog,
  }
}

function getAbilityModifier(score) {
  if (score === null || score === undefined || score === '') {
    return null
  }

  const number = Number(score)

  return Number.isFinite(number) ? Math.floor((number - 10) / 2) : null
}

function normalizeRuleText(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function slugifyLoose(value) {
  return normalizeRuleText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function findCatalogItemByLooseIdentity(catalog, item) {
  const candidates = [
    item?.itemId,
    item?.id,
    item?.name,
  ].filter(Boolean).map(slugifyLoose)

  return (CATALOGS[catalog] ?? []).find((catalogItem) => {
    const catalogCandidates = [
      catalogItem.id,
      catalogItem.name,
    ].filter(Boolean).map(slugifyLoose)

    return candidates.some((candidate) => catalogCandidates.includes(candidate))
  }) ?? null
}

function parseLegacyArmorStats(item) {
  const text = [item?.description, item?.notes].filter(Boolean).join(' ')
  const acMatch = normalizeRuleText(text).match(/\bca\s*([+-]?\d+)/)

  if (!acMatch) {
    return null
  }

  return {
    type: 'armor',
    category: '',
    armorClass: acMatch[1],
    strengthRequirement: null,
    stealthDisadvantage: normalizeRuleText(text).includes('svantaggio'),
  }
}

function getEffectiveItemStats(item) {
  if (item?.stats?.type) {
    return item.stats
  }

  if (item?.catalog && item?.itemId) {
    const catalogItem = findCatalogItem(item.catalog, item.itemId)

    if (catalogItem) {
      return getItemStats(item.catalog, catalogItem)
    }
  }

  const armorCatalogItem = findCatalogItemByLooseIdentity('armors', item)

  if (armorCatalogItem) {
    return getItemStats('armors', armorCatalogItem)
  }

  const shieldCatalogItem = findCatalogItemByLooseIdentity('shields', item)

  if (shieldCatalogItem) {
    return getItemStats('shields', shieldCatalogItem)
  }

  return parseLegacyArmorStats(item)
}

function getEquippedArmorItems(equipment = {}) {
  return (equipment.armor ?? [])
    .filter((item) => item?.equipped)
    .map((item) => ({
      ...item,
      stats: getEffectiveItemStats(item) ?? item.stats,
    }))
}

function parseArmorClassFormula(armorClass, dexMod) {
  const formula = String(armorClass ?? '').trim()
  const baseMatch = formula.match(/\d+/)

  if (!baseMatch) {
    return null
  }

  const baseAc = Number(baseMatch[0])

  if (!Number.isFinite(baseAc)) {
    return null
  }

  const normalized = normalizeRuleText(formula)

  if (!normalized.includes('mod des') && !normalized.includes('dex')) {
    return baseAc
  }

  const effectiveDexMod = Number.isFinite(dexMod) ? dexMod : 0
  const dexCapMatch = normalized.match(/max\s*(\d+)/)
  const cappedDexMod = dexCapMatch
    ? Math.min(effectiveDexMod, Number(dexCapMatch[1]))
    : effectiveDexMod

  return baseAc + cappedDexMod
}

function getCharacterClassNames(character) {
  return (character?.classes ?? []).map((characterClass) => {
    return normalizeRuleText(characterClass?.name)
  })
}

function hasFeatureText(character, patterns) {
  return (character?.features ?? []).some((feature) => {
    const text = normalizeRuleText([
      feature?.id,
      feature?.label,
      feature?.name,
      feature?.source,
      feature?.summary,
    ].filter(Boolean).join(' '))

    return patterns.some((pattern) => text.includes(pattern))
  })
}

function hasMonkUnarmoredDefense(character) {
  const classNames = getCharacterClassNames(character)

  return classNames.includes('monaco') ||
    classNames.includes('monk') ||
    hasFeatureText(character, ['monk_unarmored_defense', 'difesa senza armatura monaco'])
}

function hasBarbarianUnarmoredDefense(character) {
  const classNames = getCharacterClassNames(character)

  return classNames.includes('barbaro') ||
    classNames.includes('barbarian') ||
    hasFeatureText(character, ['barbaro_difesa_senza_armatura'])
}

function getEquippedShieldBonus(equippedItems) {
  const bonuses = equippedItems
    .filter((item) => item.stats?.type === 'shield')
    .map((item) => Number(item.stats?.armorClassBonus) || 0)

  return bonuses.length > 0 ? Math.max(...bonuses) : 0
}

function hasStructuredAcEquipment(equipment = {}) {
  return getEquippedArmorItems(equipment).some((item) => {
    return (
      item.stats?.type === 'armor' &&
      parseArmorClassFormula(item.stats?.armorClass, 0) !== null
    ) || (
      item.stats?.type === 'shield' &&
      Number(item.stats?.armorClassBonus) !== 0
    )
  })
}

export function calculateCharacterArmorClass(character, equipment = character?.equipment) {
  const dexMod = getAbilityModifier(character?.abilities?.dex)

  if (dexMod === null) {
    return null
  }

  const conMod = getAbilityModifier(character?.abilities?.con) ?? 0
  const wisMod = getAbilityModifier(character?.abilities?.wis) ?? 0
  const equippedItems = getEquippedArmorItems(equipment)
  const armorValues = equippedItems
    .filter((item) => item.stats?.type === 'armor')
    .map((item) => parseArmorClassFormula(item.stats?.armorClass, dexMod))
    .filter((value) => value !== null)
  const hasArmor = armorValues.length > 0
  const shieldBonus = getEquippedShieldBonus(equippedItems)
  const baseCandidates = [
    10 + dexMod,
    ...armorValues,
  ]

  if (!hasArmor && hasBarbarianUnarmoredDefense(character)) {
    baseCandidates.push(10 + dexMod + conMod)
  }

  if (!hasArmor && shieldBonus === 0 && hasMonkUnarmoredDefense(character)) {
    baseCandidates.push(10 + dexMod + wisMod)
  }

  return Math.max(...baseCandidates) + shieldBonus
}

export function syncCharacterEquipmentDerivedStats(character, { force = false } = {}) {
  if (!character) {
    return character
  }

  if (!force && !hasStructuredAcEquipment(character.equipment)) {
    return character
  }

  const ac = calculateCharacterArmorClass(character)

  if (ac === null || ac === character.combat?.ac) {
    return character
  }

  return {
    ...character,
    combat: {
      ...(character.combat ?? {}),
      ac,
    },
  }
}

function mergeInventoryItems(items) {
  const byKey = new Map()

  items.filter(Boolean).forEach((item) => {
    const key = [item.catalog, item.itemId, item.name, item.equipped ? 'equipped' : 'stored'].join(':')
    const current = byKey.get(key)

    if (!current) {
      byKey.set(key, item)
      return
    }

    byKey.set(key, {
      ...current,
      quantity: (current.quantity ?? 1) + (item.quantity ?? 1),
      description: [...new Set([current.description, item.description].filter(Boolean))].join(' / '),
    })
  })

  return [...byKey.values()]
}

function buildItemsFromOption(option, source, context, equipmentChoices) {
  return (option?.items ?? [])
    .flatMap((entry) => normalizeItemEntry(entry, source, context, equipmentChoices))
    .map((entry) => getInventoryItem(entry))
    .filter(Boolean)
}

function getPurchaseItem(purchase) {
  const [catalog, itemId] = String(purchase.itemKey ?? '').split(':')
  const catalogItem = findCatalogItem(catalog, itemId)

  if (!catalogItem || !GROUP_BY_CATALOG[catalog]) {
    return null
  }

  const quantity = Math.max(1, Number(purchase.quantity) || 1)
  const item = getInventoryItem({
    catalog,
    id: itemId,
    quantity,
    source: { id: 'purchase', label: 'Acquisto iniziale' },
  })

  if (!item) {
    return null
  }

  return {
    ...item,
    id: purchase.id ?? `purchase_${catalog}_${itemId}`,
    purchaseId: purchase.id,
    totalCostCopper: item.costCopper * quantity,
  }
}

function groupItems(items) {
  const groups = {
    weapons: [],
    armor: [],
    tools: [],
    adventuringGear: [],
    magicItems: [],
    consumables: [],
    storyItems: [],
    wishlist: [],
  }

  mergeInventoryItems(items).forEach((item) => {
    const group = item.inventoryGroup ?? GROUP_BY_CATALOG[item.catalog] ?? 'adventuringGear'
    groups[group].push(item)
  })

  return groups
}

function getSelectedOptions(choices, classRule, backgroundRule) {
  const mode = choices.equipmentMode
  const defaultBackgroundOption = getDefaultBackgroundOption(backgroundRule, mode)
  const defaultClassOption = getDefaultClassOption(classRule, mode)
  const backgroundOption = getOptionById(
    backgroundRule?.startingOptions,
    choices.backgroundEquipmentOptionId
  ) ?? defaultBackgroundOption
  const classOption = getOptionById(
    classRule?.startingOptions,
    choices.classEquipmentOptionId
  ) ?? defaultClassOption

  return {
    backgroundOption,
    classOption,
  }
}

export function getEquipmentShopOptions() {
  return Object.entries(CATALOGS)
    .flatMap(([catalog, items]) => items.map((item) => ({
      key: `${catalog}:${item.id}`,
      catalog,
      itemId: item.id,
      label: item.name,
      cost: item.cost ?? '',
      costCopper: parseCostToCopper(item.cost),
    })))
    .filter((item) => item.costCopper > 0)
    .sort((a, b) => a.label.localeCompare(b.label, 'it'))
}

export function getInventoryCatalogOptions() {
  return Object.entries(CATALOGS)
    .flatMap(([catalog, items]) => items.map((item) => ({
      key: `${catalog}:${item.id}`,
      catalog,
      itemId: item.id,
      label: item.name,
      group: GROUP_BY_CATALOG[catalog] ?? 'adventuringGear',
      catalogLabel: CATALOG_LABELS[catalog] ?? catalog,
      cost: item.cost ?? '',
      weight: item.weight ?? '',
      stats: getItemStats(catalog, item),
    })))
    .sort((a, b) => `${a.catalogLabel} ${a.label}`.localeCompare(`${b.catalogLabel} ${b.label}`, 'it'))
}

export function createInventoryItemFromCatalog({ itemKey, quantity = 1, sourceLabel = 'Aggiunto in inventario' }) {
  const [catalog, itemId] = String(itemKey ?? '').split(':')
  const item = getInventoryItem({
    catalog,
    id: itemId,
    quantity,
    source: {
      id: `manual_${Date.now()}`,
      label: sourceLabel,
    },
  })

  if (!item) {
    return null
  }

  return {
    ...item,
    id: `manual_${catalog}_${itemId}_${Date.now()}`,
    description: sourceLabel,
  }
}

function parseCustomProperties(value) {
  return String(value ?? '')
    .split(',')
    .map((property) => property.trim())
    .filter(Boolean)
}

function getCustomStats(form) {
  const group = form.group

  if (group === 'weapons') {
    return {
      type: 'weapon',
      category: form.weaponCategory,
      kind: form.weaponKind,
      damage: form.damageDice && form.damageType
        ? `${form.damageDice} ${form.damageType}`
        : form.damageDice || null,
      properties: parseCustomProperties(form.properties),
      mastery: form.mastery,
      ability: form.abilityMode,
      attackBonus: Number(form.attackBonus) || 0,
      damageBonus: Number(form.damageBonus) || 0,
    }
  }

  if (group === 'armor') {
    return {
      type: form.armorKind === 'shield' ? 'shield' : 'armor',
      category: form.armorCategory,
      armorClass: form.armorClass,
      armorClassBonus: Number(form.armorClassBonus) || 0,
      strengthRequirement: form.strengthRequirement,
      stealthDisadvantage: Boolean(form.stealthDisadvantage),
    }
  }

  if (group === 'tools') {
    return {
      type: 'tool',
      category: form.toolCategory,
      ability: form.toolAbility,
    }
  }

  return {
    type: group === 'consumables' ? 'consumable' : 'gear',
    category: INVENTORY_GROUP_OPTIONS.find((option) => option.id === group)?.label ?? group,
  }
}

export function createCustomInventoryItem(form) {
  const name = String(form.name ?? '').trim()

  if (!name) {
    return null
  }

  const group = form.group || 'adventuringGear'
  const quantity = Math.max(1, Number(form.quantity) || 1)
  const idBase = slugify(`${name}-${Date.now()}`)

  return {
    id: `custom_${idBase}`,
    itemId: `custom_${idBase}`,
    catalog: 'custom',
    custom: true,
    inventoryGroup: group,
    name,
    quantity,
    equipped: false,
    equippedSlot: null,
    description: form.sourceLabel || 'Oggetto personalizzato',
    notes: form.notes ?? '',
    cost: form.cost ?? '',
    weight: form.weight ?? '',
    costCopper: parseCostToCopper(form.cost),
    stats: getCustomStats({ ...form, group }),
    recoverable: Boolean(form.recoverable),
    consumable: group === 'consumables' || Boolean(form.consumable),
  }
}

export function getCreationEquipmentPreview(choices, context = {}) {
  const classRule = getClassEquipmentRule(context.classId)
  const backgroundRule = getBackgroundEquipmentRule(context.backgroundId)
  const warnings = []
  const mode = choices.equipmentMode

  if (!classRule || !backgroundRule) {
    return {
      ready: false,
      warnings: [],
      mode,
      classOptions: [],
      backgroundOptions: [],
      requirements: [],
      items: [],
      purchases: [],
      budgetCopper: 0,
      spentCopper: 0,
      remainingCopper: 0,
      budgetLabel: '0 mo',
      spentLabel: '0 mo',
      remainingLabel: '0 mo',
    }
  }

  if (!mode) {
    warnings.push("Scegli se partire con la dotazione o comprare l'equipaggiamento con le monete.")
  }

  const { backgroundOption, classOption } = getSelectedOptions(choices, classRule, backgroundRule)
  const equipmentContext = {
    selectedBackgroundTools: context.selectedBackgroundTools ?? [],
    selectedClassTools: context.selectedClassTools ?? [],
  }
  const requirements = [
    ...getChoiceRequirementsFromOption(backgroundOption, equipmentContext),
    ...getChoiceRequirementsFromOption(classOption, equipmentContext),
  ]
  const equipmentChoices = choices.equipmentChoices ?? {}

  requirements.forEach((requirement) => {
    const selected = equipmentChoices[requirement.id] ?? []

    if (selected.length !== requirement.count) {
      warnings.push(`Scegli ${requirement.count} opzioni per ${requirement.label}.`)
    }
  })

  if (mode && !backgroundOption) {
    warnings.push('Scegli il pacchetto del background.')
  }

  if (mode && !classOption) {
    warnings.push('Scegli il pacchetto della classe.')
  }

  const backgroundItems = buildItemsFromOption(
    backgroundOption,
    { id: 'background', label: `Background - ${backgroundOption?.label ?? ''}` },
    equipmentContext,
    equipmentChoices
  )
  const classItems = buildItemsFromOption(
    classOption,
    { id: 'class', label: `Classe - ${classOption?.label ?? ''}` },
    equipmentContext,
    equipmentChoices
  )
  const purchases = (choices.equipmentPurchases ?? [])
    .map((purchase) => getPurchaseItem(purchase))
    .filter(Boolean)
  const budgetCopper = addCurrencyFromOption(backgroundOption) + addCurrencyFromOption(classOption)
  const spentCopper = purchases.reduce((total, item) => total + item.totalCostCopper, 0)
  const remainingCopper = budgetCopper - spentCopper

  if (remainingCopper < 0) {
    warnings.push(`Gli acquisti superano il budget di ${formatCopper(Math.abs(remainingCopper))}.`)
  }

  return {
    ready: warnings.length === 0,
    warnings,
    mode,
    classRule,
    backgroundRule,
    backgroundOptions: backgroundRule.startingOptions ?? [],
    classOptions: classRule.startingOptions ?? [],
    packageClassOptions: getPackageOptions(classRule.startingOptions),
    currencyClassOption: getCurrencyOnlyOption(classRule.startingOptions),
    selectedBackgroundOption: backgroundOption,
    selectedClassOption: classOption,
    effectiveBackgroundOptionId: backgroundOption?.id ?? '',
    effectiveClassOptionId: classOption?.id ?? '',
    requirements,
    items: [...backgroundItems, ...classItems],
    purchases,
    allItems: [...backgroundItems, ...classItems, ...purchases],
    budgetCopper,
    spentCopper,
    remainingCopper,
    budgetLabel: formatCopper(budgetCopper),
    spentLabel: formatCopper(spentCopper),
    remainingLabel: formatCopper(Math.max(0, remainingCopper)),
  }
}

export function buildStartingEquipment(equipmentPreview) {
  const grouped = groupItems(equipmentPreview.allItems ?? [])

  return {
    currency: copperToCurrency(equipmentPreview.remainingCopper),
    startingBudget: {
      gp: equipmentPreview.budgetCopper / COPPER_BY_COIN.mo,
      spentGp: equipmentPreview.spentCopper / COPPER_BY_COIN.mo,
      remainingGp: Math.max(0, equipmentPreview.remainingCopper) / COPPER_BY_COIN.mo,
      mode: equipmentPreview.mode,
      notes: equipmentPreview.mode === 'gold'
        ? "Equipaggiamento comprato con le monete iniziali."
        : "Dotazione iniziale da background e classe.",
    },
    ...grouped,
  }
}

export function getEquipmentPurchaseSummary(purchase) {
  const item = getPurchaseItem(purchase)

  if (!item) {
    return null
  }

  return {
    ...item,
    costLabel: formatCopper(item.totalCostCopper),
  }
}

export function getEquipmentChoiceSelectedKey(option) {
  return `${option.catalog}:${option.id}:${option.variant ?? ''}`
}

export function getCurrencyLabelFromCopper(copper) {
  return formatCopper(copper)
}
