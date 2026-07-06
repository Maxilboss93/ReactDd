import { useEffect, useState } from 'react'

import SectionCard from '../../general/card/SectionCard.jsx'
import DiceRoller from '../../dice/DiceRoller.jsx'
import {
  applyLevelUpDraft,
  buildLevelUpDraft,
  getLevelUpPreview,
} from '../../../services/progressionService.js'
import { getAvailableFeats } from '../../../services/featsCatalog.js'

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

function getHitDieSides(hitDie) {
  return Number(String(hitDie ?? '').replace('d', ''))
}

function ProgressionSection({ character, onCharacterChange }) {
  const [levelUpPreview, setLevelUpPreview] = useState(null)
  const [hpChoice, setHpChoice] = useState({ mode: 'average' })
  const [manualHpRoll, setManualHpRoll] = useState('')
  const [asiOrFeatChoice, setAsiOrFeatChoice] = useState({ mode: 'feat', featId: '' })
  const [applyMessage, setApplyMessage] = useState('')

  useEffect(() => {
    setLevelUpPreview(null)
    setHpChoice({ mode: 'average' })
    setManualHpRoll('')
    setAsiOrFeatChoice({ mode: 'feat', featId: '' })
    setApplyMessage('')
  }, [character?.id])

  function startLevelUp() {
    const className = character.classes?.[0]?.name

    if (!className) return

    setLevelUpPreview(getLevelUpPreview(character, className))
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
        increases,
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
    setApplyMessage(`Level up confermato: ${character.name} e ora livello ${levelUpDraft.preview.totalLevel.to}.`)
  }

  const asiOrFeatRequirement = levelUpPreview?.requiredChoices.find((choice) => {
    return choice.type === 'asi_or_feat'
  })
  const availableFeats = asiOrFeatRequirement
    ? getAvailableFeats(character, asiOrFeatRequirement.featChoice)
    : []
  const hpRequirement = levelUpPreview?.requiredChoices.find((choice) => {
    return choice.id === 'hp_increase'
  })
  const hpHitDieSides = getHitDieSides(hpRequirement?.hitDie)
  const levelUpChoices = {
    hpIncrease:
      hpChoice.mode === 'manual'
        ? { mode: 'manual', rolled: Number(manualHpRoll) }
        : { mode: 'average' },
    asiOrFeat: asiOrFeatChoice,
  }
  const levelUpDraft = levelUpPreview
    ? buildLevelUpDraft(character, levelUpPreview, levelUpChoices)
    : null

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

      <SectionCard title="Progressione">
        <div className="progression-card">
          <div className="progression-card__summary">
            <span>Livello attuale</span>
            <strong>{character.level ?? 'Non indicato'}</strong>
          </div>

          <button
            className="progression-card__start"
            type="button"
            onClick={startLevelUp}
          >
            Passa di livello
          </button>

          {levelUpPreview && (
            <div className="progression-flow">
              <div className="progression-block">
                <h4>Anteprima</h4>
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

              {asiOrFeatRequirement && (
                <div className="progression-block">
                  <h4>Aumento o talento</h4>
                  <div className="progression-choice-row">
                    <button
                      className={`progression-choice ${asiOrFeatChoice.mode === 'feat' ? 'progression-choice--active' : ''}`}
                      type="button"
                      onClick={() => setAsiOrFeatChoice({ mode: 'feat', featId: '' })}
                    >
                      Talento
                    </button>
                    <button
                      className={`progression-choice ${asiOrFeatChoice.mode === 'asi' ? 'progression-choice--active' : ''}`}
                      type="button"
                      onClick={() => setAsiOrFeatChoice(DEFAULT_ASI_CHOICE)}
                    >
                      Aumento caratteristiche
                    </button>
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
                      <strong>{levelUpDraft.hp.maxHpFrom}{' -> '}{levelUpDraft.hp.maxHpTo}</strong>
                    </div>
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
