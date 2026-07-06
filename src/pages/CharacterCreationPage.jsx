import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import '../app/App.css'
import AppTopbar from '../components/layout/AppTopbar.jsx'
import SectionCard from '../components/general/card/SectionCard.jsx'
import { useAuth } from '../components/authentication/AuthContext.jsx'
import { rollDie } from '../services/diceService.js'
import { createCharacter } from '../services/fakeApi.js'
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
  { id: 'final', label: 'Fine' },
]

const ABILITY_ORDER = ['str', 'dex', 'con', 'int', 'wis', 'cha']

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
  return value >= 0 ? `+${value}` : String(value)
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
  const [activeStep, setActiveStep] = useState('species')
  const [choices, setChoices] = useState(() => getDefaultCreationChoices())
  const [saving, setSaving] = useState(false)
  const draft = buildCreationDraft(choices)
  const preview = draft.preview

  function updateChoice(key, value) {
    setChoices((prevChoices) => ({
      ...prevChoices,
      [key]: value,
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
        const nextBaseAbilities = {
          ...(catalog.standardAbilitiesByClass[prevChoices.classId] ?? catalog.standardAbilitiesByClass.guerriero),
        }

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
    setChoices((prevChoices) => ({
      ...prevChoices,
      backgroundId,
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
            <SectionCard title="Razza / Specie">
              <div className="creation-card-grid">
                {catalog.species.map((species) => (
                  <button
                    key={species.id}
                    className={`creation-option ${choices.speciesId === species.id ? 'creation-option--active' : ''}`}
                    type="button"
                    onClick={() => updateChoice('speciesId', species.id)}
                  >
                    <strong>{species.name}</strong>
                    <span>{species.size}, {species.speed} m</span>
                  </button>
                ))}
              </div>
            </SectionCard>
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
                {preview.backgroundTools.choice ? (
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
            </>
          )}

          {activeStep === 'abilities' && preview.background && (
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

                {choices.abilityMethod === 'standard' && (
                  <div className="creation-locked-grid">
                    {ABILITY_ORDER.map((ability) => (
                      <div key={ability} className="creation-locked-score">
                        <span>{abilityLabel(catalog.abilities, ability)}</span>
                        <strong>{choices.baseAbilities[ability]}</strong>
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
                          value={choices.baseAbilities[ability]}
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
                    Usa +2/+1 oppure +1/+1/+1.
                  </small>
                </div>

                <div className="creation-pointbuy-grid">
                  {preview.background.abilities.map((ability) => {
                    const increase = Number(choices.backgroundIncreases[ability] ?? 0)
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
                    const modifier = preview.abilityModifiers?.[ability] ?? 0
                    const saveIsProficient = preview.class?.savingThrows.includes(ability)

                    return (
                      <div key={ability} className="creation-ability">
                        <span>{abilityLabel(catalog.abilities, ability)}</span>
                        <strong>{preview.abilities[ability]}</strong>
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
                        <strong>{characterClass.name}</strong>
                        <span>{characterClass.hitDie}, primaria {primarySummary}</span>
                      </button>
                    )
                  })}
                </div>
              </SectionCard>

              <SectionCard title="Competenze classe">
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
              </SectionCard>

              {(preview.classTools.choice || preview.classTools.all.length > 0) && (
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
                    {catalog.alignments.map((alignment) => (
                      <option key={alignment} value={alignment}>
                        {alignment}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="creation-field">
                  <span>Equipaggiamento iniziale</span>
                  <select
                    value={choices.equipmentMode}
                    onChange={(event) => updateChoice('equipmentMode', event.target.value)}
                  >
                    <option value="gold">50 mo dal background</option>
                    <option value="kit">Dotazione da dettagliare</option>
                  </select>
                </label>
              </div>
            </SectionCard>
          )}

          <SectionCard title="Riepilogo creazione">
            <div className="creation-summary">
              <div>
                <span>Classe</span>
                <strong>{preview.class?.name ?? '-'}</strong>
              </div>
              <div>
                <span>Origine</span>
                <strong>{preview.species?.name ?? '-'} / {preview.background?.name ?? '-'}</strong>
              </div>
              <div>
                <span>PF</span>
                <strong>{preview.derived?.hpMax ?? '-'}</strong>
              </div>
              <div>
                <span>CA base</span>
                <strong>{preview.derived?.ac ?? '-'}</strong>
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
              {saving ? 'Creazione...' : 'Crea PG livello 1'}
            </button>
          </SectionCard>
        </div>
      </main>
    </div>
  )
}

export default CharacterCreationPage
