import { useEffect, useState } from 'react'

import SectionCard from '../../general/card/SectionCard.jsx'
import DiceRoller from '../../dice/DiceRoller.jsx'
import FeatChoicesPanel from '../FeatChoicesPanel.jsx'
import {
  applyLevelUpDraft,
  buildLevelUpDraft,
  extractCharacterFromProgressionSnapshot,
  getLevelUpOptions,
  getLevelUpPreview,
  getProgressionReport,
  getSubclassSpellcastingChoiceRequirements,
  getWarlockInvocationSubchoiceRequirements,
} from '../../../services/progressionService.js'
import { getAvailableFeats } from '../../../services/featsCatalog.js'
import { getFeatChoiceRequirements } from '../../../services/featChoiceService.js'

const ABILITY_OPTIONS = [
  { id: 'str', label: 'FOR' },
  { id: 'dex', label: 'DES' },
  { id: 'con', label: 'COS' },
  { id: 'int', label: 'INT' },
  { id: 'wis', label: 'SAG' },
  { id: 'cha', label: 'CAR' },
]

const DEFAULT_ASI_CHOICE = {
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

function getHitDieSides(hitDie) {
  return Number(String(hitDie ?? '').replace('d', ''))
}

function getDefaultClassChoiceValue(choice) {
  if (choice.type === 'acknowledge') {
    return []
  }

  return []
}

function getSnapshotSummary(snapshot) {
  const snapshotCharacter = snapshot.character

  if (!snapshotCharacter) {
    return null
  }

  const hpMax = snapshotCharacter.combat?.hp?.max ?? '-'
  const ac = snapshotCharacter.combat?.ac ?? '-'
  const speed = snapshotCharacter.combat?.speed ?? '-'

  return `PF ${hpMax} - CA ${ac} - Vel ${speed}m`
}

function ProgressionSection({ character, onCharacterChange, onCharacterExtract }) {
  const [levelUpPreview, setLevelUpPreview] = useState(null)
  const [hpChoice, setHpChoice] = useState({ mode: 'average' })
  const [manualHpRoll, setManualHpRoll] = useState('')
  const [asiOrFeatChoice, setAsiOrFeatChoice] = useState({ mode: 'feat', featId: '' })
  const [classChoices, setClassChoices] = useState({})
  const [subclassSpellChoices, setSubclassSpellChoices] = useState({})
  const [invocationChoices, setInvocationChoices] = useState({})
  const [showMulticlassOptions, setShowMulticlassOptions] = useState(false)
  const [applyMessage, setApplyMessage] = useState('')
  const [selectedReportId, setSelectedReportId] = useState(null)

  useEffect(() => {
    setLevelUpPreview(null)
    setHpChoice({ mode: 'average' })
    setManualHpRoll('')
    setAsiOrFeatChoice({ mode: 'feat', featId: '' })
    setClassChoices({})
    setSubclassSpellChoices({})
    setInvocationChoices({})
    setShowMulticlassOptions(false)
    setApplyMessage('')
    setSelectedReportId(null)
  }, [character?.id])

  function resetLevelUpChoices(preview) {
    setHpChoice({ mode: 'average' })
    setManualHpRoll('')
    setAsiOrFeatChoice({ mode: 'feat', featId: '' })
    setSubclassSpellChoices({})
    setInvocationChoices({})
    setClassChoices(
      Object.fromEntries(
        (preview?.requiredChoices ?? [])
          .filter((choice) => !['hp_roll_or_average', 'asi_or_feat'].includes(choice.type))
          .map((choice) => [choice.id, getDefaultClassChoiceValue(choice)])
      )
    )
  }

  function startLevelUp(className = character.classes?.[0]?.name) {

    if (!className) return

    const preview = getLevelUpPreview(character, className)

    setLevelUpPreview(preview)
    resetLevelUpChoices(preview)
    setApplyMessage('')
  }

  function updateAsiIncrease(index, field, value) {
    setAsiOrFeatChoice((prevChoice) => {
      const currentChoice = prevChoice.mode === 'asi' ? prevChoice : DEFAULT_ASI_CHOICE
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
        mode: 'asi',
        increases: normalizeAsiIncreases(increases, index),
      }
    })
  }

  function confirmLevelUp() {
    if (!levelUpDraft?.readyToApply) return

    const updatedCharacter = applyLevelUpDraft(character, levelUpDraft)

    onCharacterChange?.(updatedCharacter)
    setLevelUpPreview(null)
    setHpChoice({ mode: 'average' })
    setManualHpRoll('')
    setAsiOrFeatChoice({ mode: 'feat', featId: '' })
    setClassChoices({})
    setSubclassSpellChoices({})
    setInvocationChoices({})
    setApplyMessage(`Level up confermato: ${character.name} e ora livello ${levelUpDraft.preview.totalLevel.to}.`)
  }

  function updateFeatChoice(choiceId, selected) {
    setAsiOrFeatChoice((prevChoice) => ({
      ...prevChoice,
      mode: 'feat',
      featChoices: {
        ...(prevChoice.featChoices ?? {}),
        [choiceId]: selected,
      },
    }))
  }

  function updateClassChoice(choiceId, selected) {
    setClassChoices((prevChoices) => ({
      ...prevChoices,
      [choiceId]: selected,
    }))
  }

  function updateSubclassSpellChoice(choiceId, selected) {
    setSubclassSpellChoices((prevChoices) => ({
      ...prevChoices,
      [choiceId]: selected,
    }))
  }

  function updateInvocationChoice(choiceId, selected) {
    setInvocationChoices((prevChoices) => ({
      ...prevChoices,
      [choiceId]: selected,
    }))
  }

  async function extractSnapshot(snapshotId) {
    const extractedCharacter = extractCharacterFromProgressionSnapshot(character, snapshotId)

    if (!extractedCharacter) {
      setApplyMessage('Questo passaggio non ha una scheda estraibile.')
      return
    }

    await onCharacterExtract?.(extractedCharacter)
    setApplyMessage(`Creato un ramo da livello ${extractedCharacter.level}.`)
  }

  function toggleClassChoice(choice, optionId) {
    setClassChoices((prevChoices) => {
      const selected = prevChoices[choice.id] ?? []

      if (choice.type === 'acknowledge') {
        return {
          ...prevChoices,
          [choice.id]: selected.includes('acknowledged') ? [] : ['acknowledged'],
        }
      }

      if (selected.includes(optionId)) {
        return {
          ...prevChoices,
          [choice.id]: selected.filter((item) => item !== optionId),
        }
      }

      if (selected.length >= choice.count) {
        return prevChoices
      }

      return {
        ...prevChoices,
        [choice.id]: [...selected, optionId],
      }
    })
  }

  const asiOrFeatRequirement = levelUpPreview?.requiredChoices.find((choice) => {
    return choice.type === 'asi_or_feat'
  })
  const canChooseAsi = asiOrFeatRequirement?.allowAsi !== false
  const availableFeats = asiOrFeatRequirement
    ? getAvailableFeats(character, asiOrFeatRequirement.featChoice)
    : []
  const selectedFeat = availableFeats.find((feat) => feat.id === asiOrFeatChoice.featId)
  const featChoiceRequirements = selectedFeat
    ? getFeatChoiceRequirements(selectedFeat, character, asiOrFeatChoice.featChoices ?? {})
    : []
  const hpRequirement = levelUpPreview?.requiredChoices.find((choice) => {
    return choice.id === 'hp_increase'
  })
  const classChoiceRequirements = levelUpPreview?.requiredChoices.filter((choice) => {
    return !['hp_roll_or_average', 'asi_or_feat'].includes(choice.type)
  }) ?? []
  const subclassChoiceRequirement = classChoiceRequirements.find((choice) => {
    return choice.type === 'subclass_choice'
  })
  const selectedSubclassId = subclassChoiceRequirement
    ? classChoices[subclassChoiceRequirement.id]?.[0]
    : null
  const selectedSubclassName = selectedSubclassId
    ? subclassChoiceRequirement.options?.find((option) => option.id === selectedSubclassId)?.subclassName
    : character.classes?.find((characterClass) => {
      return characterClass.name === levelUpPreview?.classLevel?.className
    })?.subclass
  const subclassSpellChoiceRequirements = levelUpPreview && selectedSubclassName
    ? getSubclassSpellcastingChoiceRequirements(
      character,
      levelUpPreview.classLevel.className,
      selectedSubclassName,
      levelUpPreview.classLevel.to
    )
    : []
  const selectedInvocationIds = classChoiceRequirements
    .filter((choice) => choice.type === 'eldritch_invocation_choice')
    .flatMap((choice) => classChoices[choice.id] ?? [])
  const invocationSubchoiceRequirements = levelUpPreview
    ? getWarlockInvocationSubchoiceRequirements(
      character,
      selectedInvocationIds,
      levelUpPreview.classLevel?.to ?? 1
    )
    : []
  const hpHitDieSides = getHitDieSides(hpRequirement?.hitDie)
  const levelUpOptions = getLevelUpOptions(character)
  const sameClassOptions = levelUpOptions.filter((option) => option.mode === 'class_level')
  const multiclassOptions = levelUpOptions.filter((option) => {
    return option.mode === 'multiclass' && option.available
  })
  const levelUpChoices = {
    hpIncrease:
      hpChoice.mode === 'manual'
        ? { mode: 'manual', rolled: Number(manualHpRoll) }
        : { mode: 'average' },
    asiOrFeat: asiOrFeatChoice,
    classChoices,
    subclassSpellChoices,
    invocationChoices,
  }
  const levelUpDraft = levelUpPreview
    ? buildLevelUpDraft(character, levelUpPreview, levelUpChoices)
    : null
  const progressionReport = getProgressionReport(character)

  return (
    <div className="progression-section">
      <SectionCard title="Piano futuro">
        {character.progressionPlan ? (
          <>
            <p className="details-text">
              {character.progressionPlan.label}: livello bersaglio {character.progressionPlan.targetLevel}
            </p>

            <div className="details-pill-list">
              {(character.progressionPlan.targetClasses ?? []).map((targetClass) => (
                <span key={`${targetClass.name}-${targetClass.level}`}>
                  {targetClass.name} {targetClass.level}
                </span>
              ))}
            </div>
          </>
        ) : (
          <p className="details-text">Nessun piano futuro impostato.</p>
        )}
      </SectionCard>

      <SectionCard title="Report livelli">
        {progressionReport.length === 0 ? (
          <p className="details-text">Nessuna progressione registrata.</p>
        ) : (
          <div className="progression-report">
            {progressionReport.map((snapshot) => {
              const isOpen = selectedReportId === snapshot.id
              const snapshotSummary = getSnapshotSummary(snapshot)

              return (
                <article key={snapshot.id} className="progression-report__item">
                  <button
                    className="progression-report__toggle"
                    type="button"
                    onClick={() => setSelectedReportId(isOpen ? null : snapshot.id)}
                  >
                    <span>
                      <strong>{snapshot.label ?? `Livello ${snapshot.level}`}</strong>
                      <small>{snapshot.classSummary}</small>
                    </span>
                    <b>{isOpen ? 'Chiudi' : 'Vedi'}</b>
                  </button>

                  {isOpen && (
                    <div className="progression-report__body">
                      {snapshotSummary && (
                        <div className="progression-report__stats">
                          {snapshotSummary}
                        </div>
                      )}

                      {(snapshot.changes ?? []).length > 0 && (
                        <ul className="progression-report__changes">
                          {(snapshot.changes ?? []).map((change) => (
                            <li key={change}>{change}</li>
                          ))}
                        </ul>
                      )}

                      {!snapshot.hasSnapshot && (
                        <p className="progression-note">
                          Storico presente, ma senza fotografia completa della scheda. Gli snapshot estraibili vengono creati dai nuovi level-up e dalle nuove creazioni.
                        </p>
                      )}

                      <button
                        className="progression-card__start"
                        type="button"
                        disabled={!snapshot.hasSnapshot}
                        onClick={() => extractSnapshot(snapshot.id)}
                      >
                        Estrai ramo da questo livello
                      </button>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Progressione">
        <div className="progression-card">
          <div className="progression-card__summary">
            <span>Livello attuale</span>
            <strong>{character.level ?? 'Non indicato'}</strong>
          </div>

          <div className="progression-choice-row">
            {sameClassOptions.map((option) => (
              <button
                key={option.id}
                className="progression-card__start"
                type="button"
                onClick={() => startLevelUp(option.className)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <button
            className="progression-card__start progression-card__start--secondary"
            type="button"
            onClick={() => setShowMulticlassOptions((prev) => !prev)}
          >
            Valuta multiclasse valido
          </button>

          {showMulticlassOptions && (
            <div className="progression-block">
              <h4>Multiclasse disponibili</h4>
              {multiclassOptions.length === 0 ? (
                <div className="list-empty">
                  Nessuna nuova classe valida con i valori attuali.
                </div>
              ) : (
                <div className="progression-option-grid">
                  {multiclassOptions.map((option) => (
                    <button
                      key={option.id}
                      className="progression-option"
                      type="button"
                      onClick={() => startLevelUp(option.className)}
                    >
                      <strong>{option.label}</strong>
                      <span>
                        {option.prerequisiteItems
                          .map((item) => item.label)
                          .join(', ')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {levelUpPreview && (
            <div className="progression-flow">
              <div className="progression-block">
                <h4>Anteprima</h4>
                {levelUpPreview.mode === 'multiclass' && (
                  <p className="progression-note">
                    Percorso multiclasse: usa solo le competenze e le scelte concesse dal multiclass, non la dotazione iniziale completa della nuova classe.
                  </p>
                )}
                <div className="progression-change-list">
                  {levelUpPreview.automaticChanges.map((change) => (
                    <div key={change.id} className="progression-change">
                      <span>{change.label}</span>
                      <strong>{change.from}{' -> '}{change.to}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="progression-block">
                <h4>Punti ferita</h4>
                <div className="progression-choice-row">
                  <button
                    className={`progression-choice ${hpChoice.mode === 'average' ? 'progression-choice--active' : ''}`}
                    type="button"
                    onClick={() => setHpChoice({ mode: 'average' })}
                  >
                    Media fissa
                  </button>
                  <button
                    className={`progression-choice ${hpChoice.mode === 'manual' ? 'progression-choice--active' : ''}`}
                    type="button"
                    onClick={() => setHpChoice({ mode: 'manual' })}
                  >
                    Tiro manuale
                  </button>
                </div>

                {hpChoice.mode === 'manual' && (
                  <>
                    <DiceRoller
                      sides={hpHitDieSides}
                      label={`Tira ${hpRequirement?.hitDie ?? 'dado vita'}`}
                      modifier={hpRequirement?.constitutionModifier ?? 0}
                      onRoll={(result) => {
                        setHpChoice({ mode: 'manual' })
                        setManualHpRoll(String(result.rolls[0]))
                      }}
                    />

                    <label className="progression-field">
                      <span>Risultato dado vita</span>
                      <input
                        type="number"
                        min="1"
                        value={manualHpRoll}
                        onChange={(event) => setManualHpRoll(event.target.value)}
                      />
                    </label>
                  </>
                )}
              </div>

              {classChoiceRequirements.map((choice) => {
                const selected = classChoices[choice.id] ?? []

                return (
                  <div key={choice.id} className="progression-block">
                    <h4>{choice.label}</h4>
                    {choice.summary && (
                      <p className="progression-note">{choice.summary}</p>
                    )}

                    {choice.type === 'spell_choice' || choice.type === 'cantrip_choice' ? (
                      <FeatChoicesPanel
                        requirements={[choice]}
                        values={{ [choice.id]: selected }}
                        onChange={updateClassChoice}
                      />
                    ) : choice.type === 'acknowledge' ? (
                      <button
                        className={`progression-choice ${selected.includes('acknowledged') ? 'progression-choice--active' : ''}`}
                        type="button"
                        onClick={() => toggleClassChoice(choice)}
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
                                onClick={() => toggleClassChoice(choice, option.id)}
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
                <div className="progression-block">
                  <h4>Incantesimi della sottoclasse</h4>
                  <FeatChoicesPanel
                    requirements={subclassSpellChoiceRequirements}
                    values={subclassSpellChoices}
                    onChange={updateSubclassSpellChoice}
                  />
                </div>
              )}

              {invocationSubchoiceRequirements.length > 0 && (
                <div className="progression-block">
                  <h4>Scelte delle suppliche</h4>
                  <FeatChoicesPanel
                    requirements={invocationSubchoiceRequirements}
                    values={invocationChoices}
                    onChange={updateInvocationChoice}
                  />
                </div>
              )}

              {asiOrFeatRequirement && (
                <div className="progression-block">
                  <h4>{canChooseAsi ? 'Aumento o talento' : asiOrFeatRequirement.label}</h4>
                  <div className="progression-choice-row">
                    <button
                      className={`progression-choice ${asiOrFeatChoice.mode === 'feat' ? 'progression-choice--active' : ''}`}
                      type="button"
                      onClick={() => setAsiOrFeatChoice({ mode: 'feat', featId: '' })}
                    >
                      Talento
                    </button>
                    {canChooseAsi && (
                      <button
                        className={`progression-choice ${asiOrFeatChoice.mode === 'asi' ? 'progression-choice--active' : ''}`}
                        type="button"
                        onClick={() => setAsiOrFeatChoice(DEFAULT_ASI_CHOICE)}
                      >
                        Aumento caratteristiche
                      </button>
                    )}
                  </div>

                  {asiOrFeatChoice.mode === 'feat' && (
                    <label className="progression-field">
                      <span>Talento disponibile</span>
                      <select
                        value={asiOrFeatChoice.featId}
                        onChange={(event) =>
                          setAsiOrFeatChoice({
                            mode: 'feat',
                            featId: event.target.value,
                            featChoices: {},
                          })
                        }
                      >
                        <option value="">Scegli talento</option>
                        {availableFeats.map((feat) => (
                          <option key={feat.id} value={feat.id}>
                            {feat.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  {asiOrFeatChoice.mode === 'feat' && featChoiceRequirements.length > 0 && (
                    <FeatChoicesPanel
                      requirements={featChoiceRequirements}
                      values={asiOrFeatChoice.featChoices ?? {}}
                      onChange={updateFeatChoice}
                    />
                  )}

                  {asiOrFeatChoice.mode === 'asi' && (
                    <div className="progression-asi-list">
                      {(asiOrFeatChoice.increases ?? []).map((increase, index) => (
                        <div key={`asi-${index}`} className="progression-asi-row">
                          <label className="progression-field">
                            <span>Caratteristica</span>
                            <select
                              value={increase.ability}
                              onChange={(event) =>
                                updateAsiIncrease(index, 'ability', event.target.value)
                              }
                            >
                              {ABILITY_OPTIONS.map((ability) => (
                                <option key={ability.id} value={ability.id}>
                                  {ability.label}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="progression-field">
                            <span>Punti</span>
                            <select
                              value={increase.amount}
                              onChange={(event) =>
                                updateAsiIncrease(index, 'amount', event.target.value)
                              }
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

              {levelUpDraft && (
                <div className="progression-block">
                  <h4>Riepilogo draft</h4>
                  <div className="progression-change-list">
                    <div className="progression-change">
                      <span>PF massimi</span>
                      <strong>
                        {levelUpDraft.hp.maxHpFrom}
                        {' -> '}
                        {levelUpDraft.hp.maxHpTo + (levelUpDraft.constitutionHpAdjustment ?? 0)}
                      </strong>
                    </div>
                    {(levelUpDraft.constitutionHpAdjustment ?? 0) > 0 && (
                      <div className="progression-change">
                        <span>PF retroattivi COS</span>
                        <strong>+{levelUpDraft.constitutionHpAdjustment}</strong>
                      </div>
                    )}
                    {levelUpDraft.asiOrFeat?.feat && (
                      <div className="progression-change">
                        <span>Talento</span>
                        <strong>{levelUpDraft.asiOrFeat.feat.name}</strong>
                      </div>
                    )}
                    {levelUpDraft.asiOrFeat?.abilityIncreases?.map((increase) => (
                      <div key={increase.ability} className="progression-change">
                        <span>{increase.ability.toUpperCase()}</span>
                        <strong>{increase.from}{' -> '}{increase.to}</strong>
                      </div>
                    ))}
                    {levelUpDraft.classChoices?.map((choice) => (
                      <div key={choice.id} className="progression-change">
                        <span>{choice.label}</span>
                        <strong>{choice.labels.join(', ')}</strong>
                      </div>
                    ))}
                    {levelUpDraft.subclassSpellChoices?.map((choice) => (
                      <div key={choice.id} className="progression-change">
                        <span>{choice.label}</span>
                        <strong>{choice.labels.join(', ')}</strong>
                      </div>
                    ))}
                    {levelUpDraft.invocationChoices?.map((choice) => (
                      <div key={choice.id} className="progression-change">
                        <span>{choice.label}</span>
                        <strong>{choice.labels.join(', ')}</strong>
                      </div>
                    ))}
                  </div>

                  {levelUpDraft.warnings.length > 0 && (
                    <div className="progression-warnings">
                      {levelUpDraft.warnings.map((warning) => (
                        <div key={warning}>{warning}</div>
                      ))}
                    </div>
                  )}

                  <button
                    className="progression-card__confirm"
                    type="button"
                    disabled={!levelUpDraft.readyToApply}
                    onClick={confirmLevelUp}
                  >
                    Conferma level up
                  </button>
                </div>
              )}
            </div>
          )}

          {applyMessage && (
            <div className="progression-success" role="status">
              {applyMessage}
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  )
}

export default ProgressionSection
