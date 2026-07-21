import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import '../app/App.css'
import AppTopbar from '../components/layout/AppTopbar.jsx'
import ClassIcon from '../components/character/ClassIcon.jsx'
import SectionCard from '../components/general/card/SectionCard.jsx'
import FeatChoicesPanel from '../components/character/FeatChoicesPanel.jsx'
import { useAuth } from '../components/authentication/AuthContext.jsx'
import { rollDie } from '../services/diceService.js'
import { createCharacter } from '../services/fakeApi.js'
import { getAvailableFeats } from '../services/featsCatalog.js'
import { getFeatChoiceRequirements } from '../services/featChoiceService.js'
import {
  getSubclassSpellcastingChoiceRequirements,
  getWarlockInvocationSubchoiceRequirements,
} from '../services/progressionService.js'
import {
  getEquipmentChoiceSelectedKey,
  getEquipmentShopOptions,
} from '../services/equipmentService.js'
import {
  applyCreationDraft,
  buildCreationDraft,
  getDefaultBackgroundToolChoices,
  getDefaultBackgroundIncreases,
  getCreationCatalog,
  getDefaultClassSkillChoices,
  getDefaultClassToolChoices,
  getDefaultCreationChoices,
} from '../services/characterCreationService.js'

const STEPS = [
  { id: 'species', label: 'Razza' },
  { id: 'background', label: 'Background' },
  { id: 'class', label: 'Classe' },
  { id: 'abilities', label: 'Valori' },
  { id: 'equipment', label: 'Equip.' },
  { id: 'final', label: 'Fine' },
]

const ABILITY_ORDER = ['str', 'dex', 'con', 'int', 'wis', 'cha']
const STARTING_LEVEL_OPTIONS = Array.from({ length: 20 }, (_, index) => index + 1)
const QUICK_STARTING_LEVELS = [1, 3, 5, 10, 15, 20]

const DEFAULT_LEVEL_ASI_CHOICE = {
  mode: 'asi',
  increases: [
    { ability: 'dex', amount: 1 },
    { ability: 'wis', amount: 1 },
  ],
}

function normalizeAsiIncreases(increases, changedIndex) {
  const normalized = increases.map((increase) => ({
    ...increase,
    amount: Math.max(0, Math.min(2, Number(increase.amount) || 0)),
  }))
  const changed = normalized[changedIndex]

  if (!changed) {
    return normalized
  }

  if (changed.amount === 2) {
    return normalized.map((increase, index) => ({
      ...increase,
      amount: index === changedIndex ? 2 : 0,
    }))
  }

  const total = normalized.reduce((sum, increase) => sum + increase.amount, 0)

  if (total > 2) {
    return normalized.map((increase, index) => ({
      ...increase,
      amount: index === changedIndex ? increase.amount : Math.max(0, increase.amount - (total - 2)),
    }))
  }

  if (total < 2 && changed.amount === 1) {
    const emptyIndex = normalized.findIndex((increase, index) => {
      return index !== changedIndex && increase.amount === 0
    })

    if (emptyIndex >= 0) {
      return normalized.map((increase, index) => ({
        ...increase,
        amount: index === emptyIndex ? 1 : increase.amount,
      }))
    }
  }

  return normalized
}

const METHOD_OPTIONS = [
  {
    id: 'standard',
    label: 'Serie standard',
    description: 'Tabella consigliata per la classe.',
  },
  {
    id: 'roll',
    label: 'Tiro dadi',
    description: '6 risultati con 4d6, scarta il piu basso.',
  },
  {
    id: 'point_buy',
    label: 'Costo in punti',
    description: 'Parti da 8 e spendi 27 punti.',
  },
]

function abilityLabel(abilityLabels, id) {
  return abilityLabels[id] ?? id.toUpperCase()
}

function skillLabel(skills, id) {
  return skills.find((skill) => skill.id === id)?.label ?? id
}

function toolLabel(toolLabels, id) {
  return toolLabels[id] ?? id
}

function formatModifier(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return '-'
  }

  return value >= 0 ? `+${value}` : String(value)
}

function formatSummaryNumber(value) {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  return Number.isFinite(Number(value)) ? String(value) : ''
}

function buildAbilityMap(scores) {
  return Object.fromEntries(
    ABILITY_ORDER.map((ability, index) => [ability, scores[index]])
  )
}

function CharacterCreationPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const catalog = useMemo(() => getCreationCatalog(), [])
  const equipmentShopOptions = useMemo(() => getEquipmentShopOptions(), [])
  const [activeStep, setActiveStep] = useState('species')
  const [choices, setChoices] = useState(() => getDefaultCreationChoices())
  const [purchaseDraft, setPurchaseDraft] = useState({ itemKey: '', quantity: 1 })
  const [saving, setSaving] = useState(false)
  const draft = buildCreationDraft(choices)
  const preview = draft.preview
  const originSummary = [preview.speciesDisplayName ?? preview.species?.name, preview.background?.name]
    .filter(Boolean)
    .join(' / ')

  function updateChoice(key, value) {
    setChoices((prevChoices) => ({
      ...prevChoices,
      [key]: value,
    }))
  }

  function selectStartingLevel(startingLevel) {
    const normalizedLevel = Math.min(20, Math.max(1, Number(startingLevel) || 1))

    setChoices((prevChoices) => ({
      ...prevChoices,
      startingLevel: normalizedLevel,
      levelUpChoices: {},
    }))
  }

  function selectSpecies(speciesId) {
    setChoices((prevChoices) => ({
      ...prevChoices,
      speciesId,
      speciesChoices: {
        ...(prevChoices.speciesChoices ?? {}),
        [speciesId]: {},
      },
    }))
  }

  function updateSpeciesChoice(speciesId, patch) {
    setChoices((prevChoices) => ({
      ...prevChoices,
      speciesChoices: {
        ...(prevChoices.speciesChoices ?? {}),
        [speciesId]: {
          ...(prevChoices.speciesChoices?.[speciesId] ?? {}),
          ...patch,
        },
      },
    }))
  }

  function updateLevelUpChoice(level, updater) {
    setChoices((prevChoices) => {
      const currentLevelChoices = prevChoices.levelUpChoices?.[level] ?? {}

      return {
        ...prevChoices,
        levelUpChoices: {
          ...(prevChoices.levelUpChoices ?? {}),
          [level]: updater(currentLevelChoices),
        },
      }
    })
  }

  function updateOriginFeatChoice(choiceId, selected) {
    if (!preview.background?.featId) return

    setChoices((prevChoices) => ({
      ...prevChoices,
      featChoices: {
        ...(prevChoices.featChoices ?? {}),
        [preview.background.featId]: {
          ...(prevChoices.featChoices?.[preview.background.featId] ?? {}),
          [choiceId]: selected,
        },
      },
    }))
  }

  function updateLevelOneClassChoice(choiceId, selected) {
    setChoices((prevChoices) => ({
      ...prevChoices,
      levelOneClassChoices: {
        ...(prevChoices.levelOneClassChoices ?? {}),
        [choiceId]: selected,
      },
    }))
  }

  function setLevelAsiOrFeatMode(level, mode) {
    updateLevelUpChoice(level, (levelChoices) => {
      const currentChoice = levelChoices.asiOrFeat ?? {}

      return {
        ...levelChoices,
        asiOrFeat: mode === 'asi'
          ? {
            ...DEFAULT_LEVEL_ASI_CHOICE,
            ...(currentChoice.mode === 'asi' ? currentChoice : {}),
          }
          : {
            mode: 'feat',
            featId: currentChoice.mode === 'feat' ? currentChoice.featId ?? '' : '',
            featChoices: currentChoice.mode === 'feat' ? currentChoice.featChoices ?? {} : {},
          },
      }
    })
  }

  function selectLevelFeat(level, featId) {
    updateLevelUpChoice(level, (levelChoices) => ({
      ...levelChoices,
      asiOrFeat: {
        mode: 'feat',
        featId,
        featChoices: {},
      },
    }))
  }

  function updateLevelFeatChoice(level, choiceId, selected) {
    updateLevelUpChoice(level, (levelChoices) => {
      const currentChoice = levelChoices.asiOrFeat ?? { mode: 'feat', featId: '' }

      return {
        ...levelChoices,
        asiOrFeat: {
          ...currentChoice,
          mode: 'feat',
          featChoices: {
            ...(currentChoice.featChoices ?? {}),
            [choiceId]: selected,
          },
        },
      }
    })
  }

  function updateLevelAsiIncrease(level, index, field, value) {
    updateLevelUpChoice(level, (levelChoices) => {
      const currentChoice = levelChoices.asiOrFeat?.mode === 'asi'
        ? levelChoices.asiOrFeat
        : DEFAULT_LEVEL_ASI_CHOICE
      const increases = currentChoice.increases.map((increase, increaseIndex) => {
        if (increaseIndex !== index) {
          return increase
        }

        return {
          ...increase,
          [field]: field === 'amount' ? Number(value) : value,
        }
      })

      return {
        ...levelChoices,
        asiOrFeat: {
          mode: 'asi',
          increases: normalizeAsiIncreases(increases, index),
        },
      }
    })
  }

  function setLevelHpMode(level, mode) {
    updateLevelUpChoice(level, (levelChoices) => ({
      ...levelChoices,
      hpIncrease: mode === 'manual'
        ? { mode: 'manual', rolled: levelChoices.hpIncrease?.rolled ?? '' }
        : { mode: 'average' },
    }))
  }

  function setLevelHpRoll(level, rolled) {
    updateLevelUpChoice(level, (levelChoices) => ({
      ...levelChoices,
      hpIncrease: {
        mode: 'manual',
        rolled,
      },
    }))
  }

  function toggleLevelClassChoice(level, choice, optionId) {
    updateLevelUpChoice(level, (levelChoices) => {
      const classChoices = levelChoices.classChoices ?? {}
      const selected = classChoices[choice.id] ?? []

      if (choice.type === 'acknowledge') {
        return {
          ...levelChoices,
          classChoices: {
            ...classChoices,
            [choice.id]: selected.includes('acknowledged') ? [] : ['acknowledged'],
          },
        }
      }

      if (selected.includes(optionId)) {
        return {
          ...levelChoices,
          classChoices: {
            ...classChoices,
            [choice.id]: selected.filter((item) => item !== optionId),
          },
        }
      }

      if (selected.length >= choice.count) {
        return levelChoices
      }

      return {
        ...levelChoices,
        classChoices: {
          ...classChoices,
          [choice.id]: [...selected, optionId],
        },
      }
    })
  }

  function updateLevelClassChoice(level, choiceId, selected) {
    updateLevelUpChoice(level, (levelChoices) => ({
      ...levelChoices,
      classChoices: {
        ...(levelChoices.classChoices ?? {}),
        [choiceId]: selected,
      },
    }))
  }

  function updateLevelSubclassSpellChoice(level, choiceId, selected) {
    updateLevelUpChoice(level, (levelChoices) => ({
      ...levelChoices,
      subclassSpellChoices: {
        ...(levelChoices.subclassSpellChoices ?? {}),
        [choiceId]: selected,
      },
    }))
  }

  function updateLevelInvocationChoice(level, choiceId, selected) {
    updateLevelUpChoice(level, (levelChoices) => ({
      ...levelChoices,
      invocationChoices: {
        ...(levelChoices.invocationChoices ?? {}),
        [choiceId]: selected,
      },
    }))
  }

  function updateBaseAbility(ability, value) {
    setChoices((prevChoices) => ({
      ...prevChoices,
      baseAbilities: {
        ...prevChoices.baseAbilities,
        [ability]: Number(value),
      },
    }))
  }

  function adjustPointBuyAbility(ability, direction) {
    setChoices((prevChoices) => {
      const currentScore = Number(prevChoices.baseAbilities[ability])
      const nextScore = currentScore + direction
      const currentCost = catalog.pointBuyCosts[currentScore]
      const nextCost = catalog.pointBuyCosts[nextScore]

      if (currentCost === undefined || nextCost === undefined) {
        return prevChoices
      }

      const spent = Object.values(prevChoices.baseAbilities).reduce((total, score) => {
        return total + (catalog.pointBuyCosts[Number(score)] ?? 0)
      }, 0)
      const nextSpent = spent - currentCost + nextCost

      if (nextSpent > catalog.pointBuyBudget) {
        return prevChoices
      }

      return {
        ...prevChoices,
        baseAbilities: {
          ...prevChoices.baseAbilities,
          [ability]: nextScore,
        },
      }
    })
  }

  function adjustBackgroundIncrease(ability, direction) {
    setChoices((prevChoices) => {
      const currentIncrease = Number(prevChoices.backgroundIncreases[ability] ?? 0)
      const nextIncrease = currentIncrease + direction

      if (nextIncrease < 0 || nextIncrease > 2) {
        return prevChoices
      }

      const currentTotal = Object.values(prevChoices.backgroundIncreases ?? {}).reduce((total, amount) => {
        return total + (Number(amount) || 0)
      }, 0)
      const nextTotal = currentTotal - currentIncrease + nextIncrease

      if (nextTotal > 3) {
        return prevChoices
      }

      return {
        ...prevChoices,
        backgroundIncreases: {
          ...prevChoices.backgroundIncreases,
          [ability]: nextIncrease,
        },
      }
    })
  }

  function selectAbilityMethod(method) {
    setChoices((prevChoices) => {
      if (method === 'standard') {
        const standardAbilities = catalog.standardAbilitiesByClass[prevChoices.classId]
        const nextBaseAbilities = standardAbilities
          ? { ...standardAbilities }
          : prevChoices.baseAbilities

        return {
          ...prevChoices,
          abilityMethod: method,
          baseAbilities: nextBaseAbilities,
          backgroundIncreases: getDefaultBackgroundIncreases(
            prevChoices.classId,
            prevChoices.backgroundId,
            nextBaseAbilities
          ),
        }
      }

      if (method === 'point_buy') {
        const nextBaseAbilities = buildAbilityMap([8, 8, 8, 8, 8, 8])

        return {
          ...prevChoices,
          abilityMethod: method,
          baseAbilities: nextBaseAbilities,
          backgroundIncreases: getDefaultBackgroundIncreases(
            prevChoices.classId,
            prevChoices.backgroundId,
            nextBaseAbilities
          ),
        }
      }

      return {
        ...prevChoices,
        abilityMethod: method,
        baseAbilities:
          prevChoices.abilityRolls?.length === 6
            ? buildAbilityMap(prevChoices.abilityRolls.map((roll) => roll.total))
            : prevChoices.baseAbilities,
      }
    })
  }

  function rollAbilityScores() {
    const abilityRolls = Array.from({ length: 6 }, (_, index) => {
      const rolls = Array.from({ length: 4 }, () => rollDie(6))
      const sortedRolls = [...rolls].sort((a, b) => a - b)
      const dropped = sortedRolls[0]
      const kept = sortedRolls.slice(1)

      return {
        id: `ability-roll-${Date.now()}-${index}`,
        rolls,
        kept,
        dropped,
        total: kept.reduce((total, roll) => total + roll, 0),
      }
    })
    const sortedScores = abilityRolls
      .map((roll) => roll.total)
      .sort((a, b) => b - a)

    setChoices((prevChoices) => ({
      ...prevChoices,
      abilityMethod: 'roll',
      abilityRolls,
      baseAbilities: buildAbilityMap(sortedScores),
      backgroundIncreases: getDefaultBackgroundIncreases(
        prevChoices.classId,
        prevChoices.backgroundId,
        buildAbilityMap(sortedScores)
      ),
    }))
  }

  function selectClass(classId) {
    setChoices((prevChoices) => {
      const nextBaseAbilities = prevChoices.abilityMethod === 'standard'
        ? { ...(catalog.standardAbilitiesByClass[classId] ?? prevChoices.baseAbilities) }
        : prevChoices.baseAbilities

      return {
        ...prevChoices,
        classId,
        baseAbilities: nextBaseAbilities,
        backgroundIncreases: getDefaultBackgroundIncreases(
          classId,
          prevChoices.backgroundId,
          nextBaseAbilities
        ),
        selectedClassSkills: getDefaultClassSkillChoices(
          classId,
          prevChoices.backgroundId,
          prevChoices.selectedClassSkills
        ),
        selectedClassTools: getDefaultClassToolChoices(
          classId,
          prevChoices.backgroundId,
          prevChoices.selectedClassTools,
          prevChoices.selectedBackgroundTools
        ),
        levelOneClassChoices: {},
        levelUpChoices: {},
        classEquipmentOptionId: '',
        equipmentChoices: {},
        equipmentPurchases: [],
      }
    })
  }

  function toggleClassSkill(skillId) {
    setChoices((prevChoices) => {
      const characterClass = catalog.classes.find((item) => item.id === prevChoices.classId)
      const background = catalog.backgrounds.find((item) => item.id === prevChoices.backgroundId)
      const count = characterClass?.skillChoices?.count ?? 0
      const options = characterClass?.skillChoices?.options ?? []
      const backgroundSkills = new Set(background?.skills ?? [])

      if (!options.includes(skillId) || backgroundSkills.has(skillId)) {
        return prevChoices
      }

      const selected = prevChoices.selectedClassSkills ?? []

      if (selected.includes(skillId)) {
        return {
          ...prevChoices,
          selectedClassSkills: selected.filter((item) => item !== skillId),
        }
      }

      if (selected.length >= count) {
        return prevChoices
      }

      return {
        ...prevChoices,
        selectedClassSkills: [...selected, skillId],
      }
    })
  }

  function toggleToolChoice(key, toolId, options, count, excludedToolIds = []) {
    setChoices((prevChoices) => {
      const optionIds = new Set(options.map((tool) => tool.id))
      const excluded = new Set(excludedToolIds)

      if (!optionIds.has(toolId) || excluded.has(toolId)) {
        return prevChoices
      }

      const selected = prevChoices[key] ?? []

      if (selected.includes(toolId)) {
        return {
          ...prevChoices,
          [key]: selected.filter((item) => item !== toolId),
        }
      }

      if (selected.length >= count) {
        return prevChoices
      }

      return {
        ...prevChoices,
        [key]: [...selected, toolId],
      }
    })
  }

  function getBaseScoreOptions() {
    if (choices.abilityMethod === 'point_buy') {
      return catalog.pointBuyScores
    }

    if (choices.abilityMethod === 'roll') {
      return (choices.abilityRolls ?? []).map((roll) => roll.total)
    }

    return catalog.standardScores
  }

  function selectBackground(backgroundId) {
    setChoices((prevChoices) => {
      const backgroundFeatId = catalog.backgrounds.find((background) => {
        return background.id === backgroundId
      })?.featId

      return {
        ...prevChoices,
        backgroundId,
        featChoices: {
          ...(prevChoices.featChoices ?? {}),
          ...(backgroundFeatId ? { [backgroundFeatId]: {} } : {}),
        },
        backgroundIncreases: getDefaultBackgroundIncreases(
          prevChoices.classId,
          backgroundId,
          prevChoices.baseAbilities
        ),
        selectedClassSkills: getDefaultClassSkillChoices(
          prevChoices.classId,
          backgroundId,
          prevChoices.selectedClassSkills
        ),
        selectedBackgroundTools: getDefaultBackgroundToolChoices(
          backgroundId,
          prevChoices.selectedBackgroundTools
        ),
        selectedClassTools: getDefaultClassToolChoices(
          prevChoices.classId,
          backgroundId,
          prevChoices.selectedClassTools,
          getDefaultBackgroundToolChoices(backgroundId, prevChoices.selectedBackgroundTools)
        ),
        backgroundEquipmentOptionId: '',
        equipmentChoices: {},
        equipmentPurchases: [],
      }
    })
  }

  function selectEquipmentMode(mode) {
    setChoices((prevChoices) => ({
      ...prevChoices,
      equipmentMode: mode,
      backgroundEquipmentOptionId: '',
      classEquipmentOptionId: '',
      equipmentChoices: {},
      equipmentPurchases: [],
    }))
  }

  function selectBackgroundEquipmentOption(optionId) {
    setChoices((prevChoices) => ({
      ...prevChoices,
      backgroundEquipmentOptionId: optionId,
      equipmentChoices: {},
    }))
  }

  function selectClassEquipmentOption(optionId) {
    setChoices((prevChoices) => ({
      ...prevChoices,
      classEquipmentOptionId: optionId,
      equipmentChoices: {},
    }))
  }

  function toggleEquipmentChoice(requirement, option) {
    const optionKey = getEquipmentChoiceSelectedKey(option)

    setChoices((prevChoices) => {
      const selected = prevChoices.equipmentChoices?.[requirement.id] ?? []

      if (selected.includes(optionKey)) {
        return {
          ...prevChoices,
          equipmentChoices: {
            ...(prevChoices.equipmentChoices ?? {}),
            [requirement.id]: selected.filter((item) => item !== optionKey),
          },
        }
      }

      if (selected.length >= requirement.count) {
        return prevChoices
      }

      return {
        ...prevChoices,
        equipmentChoices: {
          ...(prevChoices.equipmentChoices ?? {}),
          [requirement.id]: [...selected, optionKey],
        },
      }
    })
  }

  function addEquipmentPurchase() {
    if (!purchaseDraft.itemKey) return

    setChoices((prevChoices) => ({
      ...prevChoices,
      equipmentPurchases: [
        ...(prevChoices.equipmentPurchases ?? []),
        {
          id: `purchase-${Date.now()}`,
          itemKey: purchaseDraft.itemKey,
          quantity: Math.max(1, Number(purchaseDraft.quantity) || 1),
        },
      ],
    }))
    setPurchaseDraft({ itemKey: '', quantity: 1 })
  }

  function removeEquipmentPurchase(purchaseId) {
    setChoices((prevChoices) => ({
      ...prevChoices,
      equipmentPurchases: (prevChoices.equipmentPurchases ?? []).filter((purchase) => {
        return purchase.id !== purchaseId
      }),
    }))
  }

  async function confirmCreation() {
    if (!draft.readyToApply || !user?.id) return

    const character = applyCreationDraft(draft)

    if (!character) return

    setSaving(true)
    const createdCharacter = await createCharacter(user.id, character)
    setSaving(false)
    navigate(`/scheda/${createdCharacter.id}`)
  }

  return (
    <div className="app">
      <AppTopbar
        title="Nuovo PG"
        onBack={() => navigate('/schede')}
      />

      <main className="screen">
        <div className="panel_content">
          <SectionCard title="Livello iniziale">
            <div className="progression-asi-row">
              <label className="progression-field">
                <span>Scrivi livello</span>
                <input
                  type="number"
                  min="1"
                  max="20"
                  step="1"
                  value={choices.startingLevel}
                  onChange={(event) => selectStartingLevel(event.target.value)}
                />
              </label>

              <label className="progression-field">
                <span>Lista livelli</span>
                <select
                  value={choices.startingLevel}
                  onChange={(event) => selectStartingLevel(Number(event.target.value))}
                >
                  {STARTING_LEVEL_OPTIONS.map((level) => (
                    <option key={level} value={level}>
                      Livello {level}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="creation-level-shortcuts" aria-label="Scorciatoie livello iniziale">
              {QUICK_STARTING_LEVELS.map((level) => (
                <button
                  key={level}
                  className={`progression-choice ${choices.startingLevel === level ? 'progression-choice--active' : ''}`}
                  type="button"
                  onClick={() => selectStartingLevel(level)}
                >
                  Lv {level}
                </button>
              ))}
            </div>

            <div className="creation-card-grid creation-card-grid--method creation-level-detail-grid">
              <button
                className={`creation-option ${choices.startingLevel === 1 ? 'creation-option--active' : ''}`}
                type="button"
                onClick={() => selectStartingLevel(1)}
              >
                <strong>Livello 1</strong>
                <span>Creazione classica, poi sali in Progressione.</span>
              </button>
              <button
                className={`creation-option ${choices.startingLevel === 2 ? 'creation-option--active' : ''}`}
                type="button"
                onClick={() => selectStartingLevel(2)}
              >
                <strong>Livello 2</strong>
                <span>Passa dal level-up 1 a 2 con le scelte richieste.</span>
              </button>
              <button
                className={`creation-option ${choices.startingLevel === 3 ? 'creation-option--active' : ''}`}
                type="button"
                onClick={() => selectStartingLevel(3)}
              >
                <strong>Livello 3</strong>
                <span>Completa livello 2 e poi scegli la sottoclasse.</span>
              </button>
              <button
                className={`creation-option ${choices.startingLevel === 4 ? 'creation-option--active' : ''}`}
                type="button"
                onClick={() => selectStartingLevel(4)}
              >
                <strong>Livello 4</strong>
                <span>Attraversa sottoclasse e scelta ASI o talento.</span>
              </button>
              <button
                className={`creation-option ${choices.startingLevel === 5 ? 'creation-option--active' : ''}`}
                type="button"
                onClick={() => selectStartingLevel(5)}
              >
                <strong>Livello 5</strong>
                <span>Aggiunge i privilegi chiave e gli slot di 3°/2°.</span>
              </button>
            </div>
          </SectionCard>

          <div className="creation-steps" aria-label="Passi creazione personaggio">
            {STEPS.map((step, index) => (
              <button
                key={step.id}
                className={`creation-step ${activeStep === step.id ? 'creation-step--active' : ''}`}
                type="button"
                onClick={() => setActiveStep(step.id)}
              >
                <strong>{index + 1}</strong>
                <span>{step.label}</span>
              </button>
            ))}
          </div>

          {activeStep === 'species' && (
            <>
              <SectionCard title="Razza / Specie">
                <div className="creation-card-grid">
                  {catalog.species.map((species) => (
                    <button
                      key={species.id}
                      className={`creation-option ${choices.speciesId === species.id ? 'creation-option--active' : ''}`}
                      type="button"
                      onClick={() => selectSpecies(species.id)}
                    >
                      <strong>{species.name}</strong>
                      <span>{species.size}, {species.speed} m</span>
                    </button>
                  ))}
                </div>
              </SectionCard>

              {preview.speciesChoice && (
                <SectionCard title="Scelte specie">
                  <div className="progression-block">
                    <h4>{preview.speciesChoice.label}</h4>
                    <p className="progression-note">{preview.speciesChoice.summary}</p>

                    <div className="creation-card-grid">
                      {preview.speciesChoice.options.map((option) => (
                        <button
                          key={option.id}
                          className={`creation-option ${preview.speciesChoice.selectedOptionId === option.id ? 'creation-option--active' : ''}`}
                          type="button"
                          onClick={() => updateSpeciesChoice(preview.species.id, { optionId: option.id })}
                        >
                          <strong>{option.label}</strong>
                          <span>{option.summary}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {preview.speciesChoice.spellcastingAbilityChoice && preview.speciesChoice.selectedOption && (
                    <div className="progression-block">
                      <h4>Caratteristica magica</h4>
                      <p className="progression-note">
                        Usata per gli incantesimi concessi dalla specie.
                      </p>
                      <div className="progression-choice-row">
                        {preview.speciesChoice.spellAbilityOptions.map((ability) => (
                          <button
                            key={ability}
                            className={`progression-choice ${preview.speciesChoice.spellcastingAbility === ability ? 'progression-choice--active' : ''}`}
                            type="button"
                            onClick={() => updateSpeciesChoice(preview.species.id, { spellcastingAbility: ability })}
                          >
                            {abilityLabel(catalog.abilities, ability)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </SectionCard>
              )}
            </>
          )}

          {activeStep === 'background' && (
            <>
              <SectionCard title="Background">
                <div className="creation-card-grid">
                  {catalog.backgrounds.map((background) => (
                    <button
                      key={background.id}
                      className={`creation-option ${choices.backgroundId === background.id ? 'creation-option--active' : ''}`}
                      type="button"
                      onClick={() => selectBackground(background.id)}
                    >
                      <strong>{background.name}</strong>
                      <span>
                        {background.featName} - {background.abilities
                          .map((ability) => abilityLabel(catalog.abilities, ability))
                          .join('/')}
                      </span>
                    </button>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Strumenti background">
                {!preview.background ? (
                  <div className="list-empty">Scegli un background per vedere gli strumenti.</div>
                ) : preview.backgroundTools.choice ? (
                  <>
                    <div className="creation-skill-choice-head">
                      <span>
                        {preview.backgroundTools.selected.length}/{preview.backgroundTools.choice.count}
                      </span>
                    </div>
                    <div className="creation-skill-choice-grid">
                      {preview.backgroundTools.options.map((tool) => {
                        const isSelected = preview.backgroundTools.selected.includes(tool.id)
                        const isLocked =
                          !isSelected &&
                          preview.backgroundTools.selected.length >= preview.backgroundTools.choice.count

                        return (
                          <button
                            key={tool.id}
                            className={`creation-skill-choice ${isSelected ? 'is-on' : ''}`}
                            type="button"
                            disabled={isLocked}
                            onClick={() => toggleToolChoice(
                              'selectedBackgroundTools',
                              tool.id,
                              preview.backgroundTools.options,
                              preview.backgroundTools.choice.count
                            )}
                          >
                            <span>{tool.label}</span>
                            <small>{isSelected ? 'Background' : ''}</small>
                          </button>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  <div className="creation-locked-grid">
                    {preview.backgroundTools.all.map((toolId) => (
                      <div key={toolId} className="creation-locked-score">
                        <span>Strumento</span>
                        <strong>{toolLabel(catalog.toolLabels, toolId)}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              {preview.originFeat?.requirements?.length > 0 && (
                <SectionCard title={`Scelte talento: ${preview.originFeat.feat.name}`}>
                  <FeatChoicesPanel
                    requirements={preview.originFeat.requirements}
                    values={choices.featChoices?.[preview.background.featId] ?? {}}
                    onChange={updateOriginFeatChoice}
                  />
                </SectionCard>
              )}
            </>
          )}

          {activeStep === 'abilities' && preview.class && preview.background && (
            <>
              <SectionCard title="Metodo valori">
                <div className="creation-card-grid creation-card-grid--method">
                  {METHOD_OPTIONS.map((method) => (
                    <button
                      key={method.id}
                      className={`creation-option ${choices.abilityMethod === method.id ? 'creation-option--active' : ''}`}
                      type="button"
                      onClick={() => selectAbilityMethod(method.id)}
                    >
                      <strong>{method.label}</strong>
                      <span>{method.description}</span>
                    </button>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Valori base">
                {choices.abilityMethod === 'roll' && (
                  <div className="creation-roll-panel">
                    <button
                      className="creation-roll-btn"
                      type="button"
                      onClick={rollAbilityScores}
                    >
                      Tira 6 risultati
                    </button>

                    {(choices.abilityRolls ?? []).length > 0 && (
                      <div className="creation-roll-list">
                        {choices.abilityRolls.map((roll, index) => (
                          <div key={roll.id} className="creation-roll-item">
                            <span>#{index + 1}</span>
                            <strong>{roll.total}</strong>
                            <small>{roll.rolls.join(', ')} - scarta {roll.dropped}</small>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {choices.abilityMethod === 'point_buy' && (
                  <div className="creation-pointbuy">
                    <span>Punti spesi</span>
                    <strong>
                      {preview.abilityMeta.pointBuySpent}/{catalog.pointBuyBudget}
                    </strong>
                    <small>
                      Restano {preview.abilityMeta.pointBuyRemaining} punti.
                    </small>
                  </div>
                )}

                {!choices.abilityMethod && (
                  <div className="list-empty">Scegli un metodo per generare i valori base.</div>
                )}

                {choices.abilityMethod === 'standard' && (
                  <div className="creation-locked-grid">
                    {ABILITY_ORDER.map((ability) => (
                      <div key={ability} className="creation-locked-score">
                        <span>{abilityLabel(catalog.abilities, ability)}</span>
                        <strong>{choices.baseAbilities[ability] || '-'}</strong>
                      </div>
                    ))}
                  </div>
                )}

                {choices.abilityMethod === 'point_buy' ? (
                  <div className="creation-pointbuy-grid">
                    {ABILITY_ORDER.map((ability) => {
                      const score = Number(choices.baseAbilities[ability])
                      const currentCost = catalog.pointBuyCosts[score] ?? 0
                      const nextCost = catalog.pointBuyCosts[score + 1]
                      const canIncrease =
                        nextCost !== undefined &&
                        preview.abilityMeta.pointBuySpent - currentCost + nextCost <= catalog.pointBuyBudget
                      const canDecrease = catalog.pointBuyCosts[score - 1] !== undefined

                      return (
                        <div key={ability} className="creation-pointbuy-score">
                          <span>{abilityLabel(catalog.abilities, ability)}</span>
                          <strong>{score}</strong>
                          <small>{currentCost} pt</small>
                          <div className="creation-pointbuy-controls">
                            <button
                              type="button"
                              aria-label={`Diminuisci ${abilityLabel(catalog.abilities, ability)}`}
                              disabled={!canDecrease}
                              onClick={() => adjustPointBuyAbility(ability, -1)}
                            >
                              -
                            </button>
                            <button
                              type="button"
                              aria-label={`Aumenta ${abilityLabel(catalog.abilities, ability)}`}
                              disabled={!canIncrease}
                              onClick={() => adjustPointBuyAbility(ability, 1)}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : choices.abilityMethod === 'roll' ? (
                  <div className="creation-form creation-form--abilities">
                    {ABILITY_ORDER.map((ability) => (
                      <label key={ability} className="creation-field">
                        <span>{abilityLabel(catalog.abilities, ability)}</span>
                        <select
                          value={choices.baseAbilities[ability] ?? ''}
                          disabled={choices.abilityMethod === 'roll' && (choices.abilityRolls ?? []).length !== 6}
                          onChange={(event) => updateBaseAbility(ability, event.target.value)}
                        >
                          {getBaseScoreOptions().map((score, index) => (
                            <option key={`${score}-${index}`} value={score}>
                              {score}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>
                ) : null}
              </SectionCard>

              <SectionCard title="Incrementi background">
                <div className="creation-pointbuy">
                  <span>Punti background</span>
                  <strong>
                    {Object.values(choices.backgroundIncreases ?? {}).reduce((total, amount) => total + (Number(amount) || 0), 0)}/3
                  </strong>
                  <small>
                    Usa +2/+1 oppure +1/+1/+1 tra quelle del background.
                  </small>
                </div>

                <div className="creation-pointbuy-grid">
                  {preview.background.abilities.map((ability) => {
                    const increase = Number(choices.backgroundIncreases?.[ability] ?? 0)
                    const totalIncrease = Object.values(choices.backgroundIncreases ?? {}).reduce((total, amount) => {
                      return total + (Number(amount) || 0)
                    }, 0)
                    const canDecrease = increase > 0
                    const canIncrease = increase < 2 && totalIncrease < 3

                    return (
                      <div key={ability} className="creation-pointbuy-score">
                        <span>{abilityLabel(catalog.abilities, ability)}</span>
                        <strong>+{increase}</strong>
                        <small>bonus</small>
                        <div className="creation-pointbuy-controls">
                          <button
                            type="button"
                            aria-label={`Diminuisci bonus ${abilityLabel(catalog.abilities, ability)}`}
                            disabled={!canDecrease}
                            onClick={() => adjustBackgroundIncrease(ability, -1)}
                          >
                            -
                          </button>
                          <button
                            type="button"
                            aria-label={`Aumenta bonus ${abilityLabel(catalog.abilities, ability)}`}
                            disabled={!canIncrease}
                            onClick={() => adjustBackgroundIncrease(ability, 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </SectionCard>

              <SectionCard title="Totali e competenze">
                <div className="creation-ability-grid">
                  {ABILITY_ORDER.map((ability) => {
                    const modifier = preview.abilityModifiers?.[ability]
                    const saveIsProficient = preview.class?.savingThrows.includes(ability)

                    return (
                      <div key={ability} className="creation-ability">
                        <span>{abilityLabel(catalog.abilities, ability)}</span>
                        <strong>{preview.abilities[ability] || '-'}</strong>
                        <div className="creation-ability-meta">
                          <small>{formatModifier(modifier)}</small>
                          <span
                            className={`creation-save-dot ${saveIsProficient ? 'is-on' : ''}`}
                            aria-label={saveIsProficient ? 'Competente nel tiro salvezza' : 'Non competente nel tiro salvezza'}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </SectionCard>
            </>
          )}

          {activeStep === 'class' && (
            <>
              <SectionCard title="Classe">
                <div className="creation-card-grid">
                  {catalog.classes.map((characterClass) => {
                    const standardAbilities = catalog.standardAbilitiesByClass[characterClass.id]
                    const primarySummary = characterClass.primaryAbilities
                      .map((ability) => `${abilityLabel(catalog.abilities, ability)} ${standardAbilities?.[ability] ?? preview.abilities?.[ability] ?? '-'}`)
                      .join(' / ')

                    return (
                      <button
                        key={characterClass.id}
                        className={`creation-option ${choices.classId === characterClass.id ? 'creation-option--active' : ''}`}
                        type="button"
                        onClick={() => selectClass(characterClass.id)}
                      >
                        <span className="creation-option__head">
                          <ClassIcon classLabel={characterClass.name} size="md" />
                          <strong>{characterClass.name}</strong>
                        </span>
                        <span>{characterClass.hitDie}, primaria {primarySummary}</span>
                      </button>
                    )
                  })}
                </div>
              </SectionCard>

              <SectionCard title="Competenze classe">
                {!preview.class || !preview.background ? (
                  <div className="list-empty">Scegli classe e background per vedere le competenze disponibili.</div>
                ) : (
                  <>
                    <div className="creation-skill-choice-head">
                      <span>
                        {preview.classSkills.selected.length}/{preview.classSkills.count}
                      </span>
                    </div>
                    <div className="creation-skill-choice-grid">
                      {preview.classSkills.options.map((skillId) => {
                        const isBackground = preview.classSkills.background.includes(skillId)
                        const isSelected = preview.classSkills.selected.includes(skillId)
                        const isLocked =
                          !isSelected &&
                          !isBackground &&
                          preview.classSkills.selected.length >= preview.classSkills.count

                        return (
                          <button
                            key={skillId}
                            className={`creation-skill-choice ${isSelected ? 'is-on' : ''} ${isBackground ? 'is-background' : ''}`}
                            type="button"
                            disabled={isBackground || isLocked}
                            onClick={() => toggleClassSkill(skillId)}
                          >
                            <span>{skillLabel(catalog.skills, skillId)}</span>
                            <small>{isBackground ? 'Background' : isSelected ? 'Classe' : ''}</small>
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
              </SectionCard>

              {preview.class && (preview.classTools.choice || preview.classTools.all.length > 0) && (
                <SectionCard title="Strumenti classe">
                  {preview.classTools.choice ? (
                    <>
                      <div className="creation-skill-choice-head">
                        <span>
                          {preview.classTools.selected.length}/{preview.classTools.choice.count}
                        </span>
                      </div>
                      <div className="creation-skill-choice-grid">
                        {preview.classTools.options.map((tool) => {
                          const isBackground = preview.backgroundTools.all.includes(tool.id)
                          const isSelected = preview.classTools.selected.includes(tool.id)
                          const isLocked =
                            !isSelected &&
                            !isBackground &&
                            preview.classTools.selected.length >= preview.classTools.choice.count

                          return (
                            <button
                              key={tool.id}
                              className={`creation-skill-choice ${isSelected ? 'is-on' : ''} ${isBackground ? 'is-background' : ''}`}
                              type="button"
                              disabled={isBackground || isLocked}
                              onClick={() => toggleToolChoice(
                                'selectedClassTools',
                                tool.id,
                                preview.classTools.options,
                                preview.classTools.choice.count,
                                preview.backgroundTools.all
                              )}
                            >
                              <span>{tool.label}</span>
                              <small>{isBackground ? 'Background' : isSelected ? 'Classe' : ''}</small>
                            </button>
                          )
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="creation-locked-grid">
                      {preview.classTools.all.map((toolId) => (
                        <div key={toolId} className="creation-locked-score">
                          <span>Strumento</span>
                          <strong>{toolLabel(catalog.toolLabels, toolId)}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
              )}

              {preview.levelOneSpellChoices?.requirements?.length > 0 && (
                <SectionCard title="Incantesimi iniziali">
                  <FeatChoicesPanel
                    requirements={preview.levelOneSpellChoices.requirements}
                    values={choices.levelOneClassChoices ?? {}}
                    onChange={updateLevelOneClassChoice}
                  />
                </SectionCard>
              )}
            </>
          )}

          {activeStep === 'equipment' && (
            <>
              <SectionCard title="Metodo equipaggiamento">
                <div className="creation-card-grid creation-card-grid--method">
                  <button
                    className={`creation-option ${choices.equipmentMode === 'kit' ? 'creation-option--active' : ''}`}
                    type="button"
                    onClick={() => selectEquipmentMode('kit')}
                  >
                    <strong>Dotazione</strong>
                    <span>Prendi pacchetto background e pacchetto classe, poi spendi le monete residue.</span>
                  </button>
                  <button
                    className={`creation-option ${choices.equipmentMode === 'gold' ? 'creation-option--active' : ''}`}
                    type="button"
                    onClick={() => selectEquipmentMode('gold')}
                  >
                    <strong>Compra con monete</strong>
                    <span>Parti dal denaro alternativo e scala ogni acquisto dal budget.</span>
                  </button>
                </div>

                <div className="equipment-budget-grid">
                  <div>
                    <span>Budget</span>
                    <strong>{preview.equipment?.budgetLabel ?? '0 mo'}</strong>
                  </div>
                  <div>
                    <span>Speso</span>
                    <strong>{preview.equipment?.spentLabel ?? '0 mo'}</strong>
                  </div>
                  <div>
                    <span>Resta</span>
                    <strong>{preview.equipment?.remainingLabel ?? '0 mo'}</strong>
                  </div>
                </div>
              </SectionCard>

              {choices.equipmentMode && (
                <>
                  <SectionCard title="Pacchetto background">
                    <div className="creation-card-grid">
                      {(choices.equipmentMode === 'gold'
                        ? (preview.equipment?.backgroundOptions ?? []).filter((option) => option.currency)
                        : (preview.equipment?.backgroundOptions ?? [])
                      ).map((option) => (
                        <button
                          key={option.id}
                          className={`creation-option ${preview.equipment?.effectiveBackgroundOptionId === option.id ? 'creation-option--active' : ''}`}
                          type="button"
                          onClick={() => selectBackgroundEquipmentOption(option.id)}
                        >
                          <strong>{option.label}</strong>
                          <span>
                            {option.currency
                              ? 'Denaro alternativo del background.'
                              : 'Dotazione del background con oggetti e monete indicate.'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </SectionCard>

                  <SectionCard title="Pacchetto classe">
                    <div className="creation-card-grid">
                      {(choices.equipmentMode === 'gold'
                        ? [preview.equipment?.currencyClassOption].filter(Boolean)
                        : (preview.equipment?.packageClassOptions ?? [])
                      ).map((option) => (
                        <button
                          key={option.id}
                          className={`creation-option ${preview.equipment?.effectiveClassOptionId === option.id ? 'creation-option--active' : ''}`}
                          type="button"
                          onClick={() => selectClassEquipmentOption(option.id)}
                        >
                          <strong>{option.label}</strong>
                          <span>
                            {option.currency
                              ? 'Denaro alternativo della classe.'
                              : `${option.items?.filter((item) => item.catalog !== 'currency').length ?? 0} voci di equipaggiamento.`}
                          </span>
                        </button>
                      ))}
                    </div>
                  </SectionCard>

                  {(preview.equipment?.requirements ?? []).length > 0 && (
                    <SectionCard title="Scelte equipaggiamento">
                      {(preview.equipment?.requirements ?? []).map((requirement) => {
                        const selected = choices.equipmentChoices?.[requirement.id] ?? []

                        return (
                          <div key={requirement.id} className="progression-subchoice">
                            <h4>{requirement.label}</h4>
                            <div className="creation-skill-choice-head">
                              <span>{selected.length}/{requirement.count}</span>
                            </div>
                            <div className="creation-skill-choice-grid">
                              {requirement.options.map((option) => {
                                const optionKey = getEquipmentChoiceSelectedKey(option)
                                const isSelected = selected.includes(optionKey)
                                const isLocked = !isSelected && selected.length >= requirement.count

                                return (
                                  <button
                                    key={optionKey}
                                    className={`creation-skill-choice ${isSelected ? 'is-on' : ''}`}
                                    type="button"
                                    disabled={isLocked}
                                    onClick={() => toggleEquipmentChoice(requirement, option)}
                                  >
                                    <span>{option.label}</span>
                                    <small>{isSelected ? 'Scelta' : ''}</small>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </SectionCard>
                  )}

                  <SectionCard title="Acquisti con monete">
                    <div className="equipment-purchase-row">
                      <label className="progression-field">
                        <span>Oggetto</span>
                        <select
                          value={purchaseDraft.itemKey}
                          onChange={(event) => setPurchaseDraft((current) => ({
                            ...current,
                            itemKey: event.target.value,
                          }))}
                        >
                          <option value="">Scegli oggetto</option>
                          {equipmentShopOptions.map((item) => (
                            <option key={item.key} value={item.key}>
                              {item.label} - {item.cost}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="progression-field">
                        <span>Quantita</span>
                        <input
                          type="number"
                          min="1"
                          value={purchaseDraft.quantity}
                          onChange={(event) => setPurchaseDraft((current) => ({
                            ...current,
                            quantity: event.target.value,
                          }))}
                        />
                      </label>

                      <button
                        className="list-btn list-btn--primary"
                        type="button"
                        disabled={!purchaseDraft.itemKey}
                        onClick={addEquipmentPurchase}
                      >
                        Aggiungi
                      </button>
                    </div>

                    {(preview.equipment?.purchases ?? []).length > 0 && (
                      <div className="equipment-preview-list">
                        {preview.equipment.purchases.map((item) => (
                          <div key={item.id} className="equipment-preview-item">
                            <div>
                              <strong>{item.name}</strong>
                              <span>x{item.quantity} - {item.description}</span>
                            </div>
                            <button
                              className="list-btn list-btn--danger"
                              type="button"
                              onClick={() => removeEquipmentPurchase(item.purchaseId)}
                            >
                              Rimuovi
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </SectionCard>

                  <SectionCard title="Anteprima inventario">
                    {(preview.equipment?.allItems ?? []).length === 0 ? (
                      <div className="list-empty">Nessun oggetto selezionato.</div>
                    ) : (
                      <div className="equipment-preview-list">
                        {preview.equipment.allItems.map((item) => (
                          <div key={`${item.id}-${item.name}`} className="equipment-preview-item">
                            <div>
                              <strong>{item.name}</strong>
                              <span>
                                x{item.quantity}
                                {item.equipped ? ' - equipaggiato' : ''}
                                {item.description ? ` - ${item.description}` : ''}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </SectionCard>
                </>
              )}
            </>
          )}

          {activeStep === 'final' && (
            <SectionCard title="Dettagli finali">
              <div className="creation-form">
                <label className="creation-field">
                  <span>Nome</span>
                  <input
                    value={choices.name}
                    onChange={(event) => updateChoice('name', event.target.value)}
                    placeholder="Es. Mirabella"
                  />
                </label>

                <label className="creation-field">
                  <span>Idea personaggio</span>
                  <textarea
                    value={choices.concept}
                    onChange={(event) => updateChoice('concept', event.target.value)}
                    placeholder="Due righe sul tono del PG, non una biografia."
                  />
                </label>

                <label className="creation-field">
                  <span>Allineamento</span>
                  <select
                    value={choices.alignment}
                    onChange={(event) => updateChoice('alignment', event.target.value)}
                  >
                    <option value="">Scegli allineamento</option>
                    {catalog.alignments.map((alignment) => (
                      <option key={alignment} value={alignment}>
                        {alignment}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </SectionCard>
          )}

          {choices.startingLevel > 1 && preview.ready && (
            <SectionCard title="Passaggi di livello">
              {draft.levelUpFlow.length === 0 ? (
                <div className="list-empty">
                  Completa prima origine, classe e valori per vedere le scelte di livello.
                </div>
              ) : (
                <div className="progression-flow">
                  {draft.levelUpFlow.map((step) => {
                    const levelChoices = choices.levelUpChoices?.[step.level] ?? {}
                    const hpChoice = levelChoices.hpIncrease ?? { mode: 'average' }
                    const classChoices = levelChoices.classChoices ?? {}
                    const subclassSpellChoices = levelChoices.subclassSpellChoices ?? {}
                    const invocationChoices = levelChoices.invocationChoices ?? {}
                    const classChoiceRequirements = step.preview.requiredChoices.filter((choice) => {
                      return !['hp_roll_or_average', 'asi_or_feat'].includes(choice.type)
                    })
                    const asiOrFeatRequirement = step.preview.requiredChoices.find((choice) => {
                      return choice.type === 'asi_or_feat'
                    })
                    const canChooseAsi = asiOrFeatRequirement?.allowAsi !== false
                    const subclassChoiceRequirement = classChoiceRequirements.find((choice) => {
                      return choice.type === 'subclass_choice'
                    })
                    const selectedSubclassId = subclassChoiceRequirement
                      ? classChoices[subclassChoiceRequirement.id]?.[0]
                      : null
                    const selectedSubclassName = selectedSubclassId
                      ? subclassChoiceRequirement.options?.find((option) => option.id === selectedSubclassId)?.subclassName
                      : step.character.classes?.find((characterClass) => {
                        return characterClass.name === step.preview.classLevel?.className
                      })?.subclass
                    const subclassSpellChoiceRequirements = selectedSubclassName
                      ? getSubclassSpellcastingChoiceRequirements(
                        step.character,
                        step.preview.classLevel.className,
                        selectedSubclassName,
                        step.preview.classLevel.to
                      )
                      : []
                    const selectedInvocationIds = classChoiceRequirements
                      .filter((choice) => choice.type === 'eldritch_invocation_choice')
                      .flatMap((choice) => classChoices[choice.id] ?? [])
                    const invocationSubchoiceRequirements = getWarlockInvocationSubchoiceRequirements(
                      step.character,
                      selectedInvocationIds,
                      step.preview.classLevel?.to ?? 1
                    )
                    const asiOrFeatChoice = levelChoices.asiOrFeat ?? { mode: 'feat', featId: '' }
                    const availableFeats = asiOrFeatRequirement
                      ? getAvailableFeats(step.character, asiOrFeatRequirement.featChoice)
                      : []
                    const selectedFeat = availableFeats.find((feat) => feat.id === asiOrFeatChoice.featId)
                    const featChoiceRequirements = selectedFeat
                      ? getFeatChoiceRequirements(selectedFeat, step.character, asiOrFeatChoice.featChoices ?? {})
                      : []

                    return (
                      <div key={step.level} className="progression-block">
                        <h4>Livello {step.level}</h4>

                        <div className="progression-change-list">
                          {step.preview.automaticChanges.map((change) => (
                            <div key={change.id} className="progression-change">
                              <span>{change.label}</span>
                              <strong>{change.from}{' -> '}{change.to}</strong>
                            </div>
                          ))}
                        </div>

                        <div className="progression-choice-row">
                          <button
                            className={`progression-choice ${hpChoice.mode !== 'manual' ? 'progression-choice--active' : ''}`}
                            type="button"
                            onClick={() => setLevelHpMode(step.level, 'average')}
                          >
                            PF medi
                          </button>
                          <button
                            className={`progression-choice ${hpChoice.mode === 'manual' ? 'progression-choice--active' : ''}`}
                            type="button"
                            onClick={() => setLevelHpMode(step.level, 'manual')}
                          >
                            PF manuali
                          </button>
                        </div>

                        {hpChoice.mode === 'manual' && (
                          <label className="progression-field">
                            <span>Risultato dado vita</span>
                            <input
                              type="number"
                              min="1"
                              value={hpChoice.rolled ?? ''}
                              onChange={(event) => setLevelHpRoll(step.level, event.target.value)}
                            />
                          </label>
                        )}

                        {classChoiceRequirements.map((choice) => {
                          const selected = classChoices[choice.id] ?? []

                          return (
                            <div key={choice.id} className="progression-subchoice">
                              <h4>{choice.label}</h4>
                              {choice.summary && (
                                <p className="progression-note">{choice.summary}</p>
                              )}

                              {choice.type === 'spell_choice' || choice.type === 'cantrip_choice' || choice.type === 'ritual_spell_choice' ? (
                                <FeatChoicesPanel
                                  requirements={[choice]}
                                  values={{ [choice.id]: selected }}
                                  onChange={(choiceId, nextSelected) => updateLevelClassChoice(
                                    step.level,
                                    choiceId,
                                    nextSelected
                                  )}
                                />
                              ) : choice.type === 'acknowledge' ? (
                                <button
                                  className={`progression-choice ${selected.includes('acknowledged') ? 'progression-choice--active' : ''}`}
                                  type="button"
                                  onClick={() => toggleLevelClassChoice(step.level, choice)}
                                >
                                  Confermato
                                </button>
                              ) : (
                                <>
                                  <div className="creation-skill-choice-head">
                                    <span>{selected.length}/{choice.count}</span>
                                  </div>
                                  <div className="creation-skill-choice-grid">
                                    {(choice.options ?? []).map((option) => {
                                      const isSelected = selected.includes(option.id)
                                      const isLocked = !isSelected && selected.length >= choice.count

                                      return (
                                        <button
                                          key={option.id}
                                          className={`creation-skill-choice ${isSelected ? 'is-on' : ''}`}
                                          type="button"
                                          disabled={isLocked}
                                          onClick={() => toggleLevelClassChoice(step.level, choice, option.id)}
                                        >
                                          <span>{option.label}</span>
                                          <small>{isSelected ? 'Scelta' : ''}</small>
                                        </button>
                                      )
                                    })}
                                  </div>
                                </>
                              )}
                            </div>
                          )
                        })}

                        {subclassSpellChoiceRequirements.length > 0 && (
                          <div className="progression-subchoice">
                            <h4>Incantesimi della sottoclasse</h4>
                            <FeatChoicesPanel
                              requirements={subclassSpellChoiceRequirements}
                              values={subclassSpellChoices}
                              onChange={(choiceId, selected) => updateLevelSubclassSpellChoice(
                                step.level,
                                choiceId,
                                selected
                              )}
                            />
                          </div>
                        )}

                        {invocationSubchoiceRequirements.length > 0 && (
                          <div className="progression-subchoice">
                            <h4>Scelte delle suppliche</h4>
                            <FeatChoicesPanel
                              requirements={invocationSubchoiceRequirements}
                              values={invocationChoices}
                              onChange={(choiceId, selected) => updateLevelInvocationChoice(
                                step.level,
                                choiceId,
                                selected
                              )}
                            />
                          </div>
                        )}

                        {asiOrFeatRequirement && (
                          <div className="progression-subchoice">
                            <h4>{canChooseAsi ? 'Aumento o talento' : asiOrFeatRequirement.label}</h4>
                            <div className="progression-choice-row">
                              <button
                                className={`progression-choice ${asiOrFeatChoice.mode === 'feat' ? 'progression-choice--active' : ''}`}
                                type="button"
                                onClick={() => setLevelAsiOrFeatMode(step.level, 'feat')}
                              >
                                Talento
                              </button>
                              {canChooseAsi && (
                                <button
                                  className={`progression-choice ${asiOrFeatChoice.mode === 'asi' ? 'progression-choice--active' : ''}`}
                                  type="button"
                                  onClick={() => setLevelAsiOrFeatMode(step.level, 'asi')}
                                >
                                  Aumento caratteristiche
                                </button>
                              )}
                            </div>

                            {asiOrFeatChoice.mode === 'feat' && (
                              <>
                                <label className="progression-field">
                                  <span>Talento disponibile</span>
                                  <select
                                    value={asiOrFeatChoice.featId ?? ''}
                                    onChange={(event) => selectLevelFeat(step.level, event.target.value)}
                                  >
                                    <option value="">Scegli talento</option>
                                    {availableFeats.map((feat) => (
                                      <option key={feat.id} value={feat.id}>
                                        {feat.name}
                                      </option>
                                    ))}
                                  </select>
                                </label>

                                {featChoiceRequirements.length > 0 && (
                                  <FeatChoicesPanel
                                    requirements={featChoiceRequirements}
                                    values={asiOrFeatChoice.featChoices ?? {}}
                                    onChange={(choiceId, selected) => updateLevelFeatChoice(
                                      step.level,
                                      choiceId,
                                      selected
                                    )}
                                  />
                                )}
                              </>
                            )}

                            {asiOrFeatChoice.mode === 'asi' && (
                              <div className="progression-asi-list">
                                {(asiOrFeatChoice.increases ?? DEFAULT_LEVEL_ASI_CHOICE.increases).map((increase, index) => (
                                  <div key={`creation-asi-${step.level}-${index}`} className="progression-asi-row">
                                    <label className="progression-field">
                                      <span>Caratteristica</span>
                                      <select
                                        value={increase.ability}
                                        onChange={(event) => updateLevelAsiIncrease(
                                          step.level,
                                          index,
                                          'ability',
                                          event.target.value
                                        )}
                                      >
                                        {ABILITY_ORDER.map((ability) => (
                                          <option key={ability} value={ability}>
                                            {abilityLabel(catalog.abilities, ability)}
                                          </option>
                                        ))}
                                      </select>
                                    </label>

                                    <label className="progression-field">
                                      <span>Punti</span>
                                      <select
                                        value={increase.amount}
                                        onChange={(event) => updateLevelAsiIncrease(
                                          step.level,
                                          index,
                                          'amount',
                                          event.target.value
                                        )}
                                      >
                                        <option value="0">+0</option>
                                        <option value="1">+1</option>
                                        <option value="2">+2</option>
                                      </select>
                                    </label>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {step.draft.warnings.length > 0 && (
                          <div className="progression-warnings">
                            {step.draft.warnings.map((warning) => (
                              <div key={warning}>{warning}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </SectionCard>
          )}

          <SectionCard title="Riepilogo creazione" className="section-card--summary">
            <div className="creation-summary">
              <div>
                <span>Livello</span>
                <strong>{preview.derived?.level ?? ''}</strong>
              </div>
              <div>
                <span>Classe</span>
                <strong>{preview.class?.name ?? ''}</strong>
              </div>
              <div>
                <span>Origine</span>
                <strong>{originSummary}</strong>
              </div>
              <div>
                <span>PF</span>
                <strong>{formatSummaryNumber(preview.derived?.hpMax)}</strong>
              </div>
              <div>
                <span>CA base</span>
                <strong>{formatSummaryNumber(preview.derived?.ac)}</strong>
              </div>
            </div>

            {preview.grants?.length > 0 && (
              <div className="creation-grants">
                {preview.grants.map((grant) => (
                  <div key={grant.label}>
                    <span>{grant.label}</span>
                    <strong>{grant.value}</strong>
                  </div>
                ))}
              </div>
            )}

            {draft.warnings.length > 0 && (
              <div className="progression-warnings">
                {draft.warnings.map((warning) => (
                  <div key={warning}>{warning}</div>
                ))}
              </div>
            )}

            <button
              className="creation-confirm"
              type="button"
              disabled={!draft.readyToApply || saving}
              onClick={confirmCreation}
            >
              {saving ? 'Creazione...' : `Crea PG livello ${preview.derived?.level ?? choices.startingLevel}`}
            </button>
          </SectionCard>
        </div>
      </main>
    </div>
  )
}

export default CharacterCreationPage
