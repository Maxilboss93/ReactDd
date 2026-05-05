import { useEffect, useState } from 'react'

import SectionCard from '../../general/card/SectionCard.jsx'
import DiceRoller from '../../dice/DiceRoller.jsx'
import {
  buildLevelUpDraft,
  getLevelUpPreview,
} from '../../../services/progressionService.js'
import { getAvailableFeats } from '../../../services/featsCatalog.js'

function getClassLabel(characterClass) {
  const subclass = characterClass.subclass ? ` - ${characterClass.subclass}` : ''

  return `${characterClass.name} ${characterClass.level}${subclass}`
}

function DetailList({ title, items }) {
  if (!items?.length) {
    return null
  }

  return (
    <SectionCard title={title}>
      <ul className="details-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </SectionCard>
  )
}

function readSavedNotes(storageKey) {
  const storedValue = localStorage.getItem(storageKey)

  if (!storedValue) {
    return []
  }

  try {
    const parsedValue = JSON.parse(storedValue)

    if (Array.isArray(parsedValue)) {
      return parsedValue
    }
  } catch {
    return [
      {
        id: 'legacy-note',
        text: storedValue,
        createdAt: new Date().toISOString(),
      },
    ]
  }

  return []
}

function getNotePreview(note) {
  const firstLine = note.text.trim().split('\n')[0]

  if (firstLine.length <= 42) {
    return firstLine
  }

  return `${firstLine.slice(0, 42)}...`
}

function formatNoteDate(value) {
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function getHitDieSides(hitDie) {
  return Number(String(hitDie ?? '').replace('d', ''))
}

function DetailsSection({ character }) {
  const details = character?.details ?? {}
  const storageKey = `character-notes:${character?.id ?? 'unknown'}`
  const [noteDraft, setNoteDraft] = useState('')
  const [savedNotes, setSavedNotes] = useState([])
  const [openNoteId, setOpenNoteId] = useState(null)
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [loadedStorageKey, setLoadedStorageKey] = useState(null)
  const [levelUpPreview, setLevelUpPreview] = useState(null)
  const [hpChoice, setHpChoice] = useState({ mode: 'average' })
  const [manualHpRoll, setManualHpRoll] = useState('')
  const [asiOrFeatChoice, setAsiOrFeatChoice] = useState({ mode: 'feat', featId: '' })

  useEffect(() => {
    setSavedNotes(readSavedNotes(storageKey))
    setNoteDraft('')
    setOpenNoteId(null)
    setEditingNoteId(null)
    setLoadedStorageKey(storageKey)
    setLevelUpPreview(null)
    setHpChoice({ mode: 'average' })
    setManualHpRoll('')
    setAsiOrFeatChoice({ mode: 'feat', featId: '' })
  }, [storageKey])

  useEffect(() => {
    if (loadedStorageKey !== storageKey) return

    localStorage.setItem(storageKey, JSON.stringify(savedNotes))
  }, [loadedStorageKey, storageKey, savedNotes])

  function saveNote() {
    const text = noteDraft.trim()

    if (!text) return

    if (editingNoteId) {
      setSavedNotes((prevNotes) =>
        prevNotes.map((note) =>
          note.id === editingNoteId
            ? { ...note, text, updatedAt: new Date().toISOString() }
            : note
        )
      )
      setOpenNoteId(editingNoteId)
      setEditingNoteId(null)
    } else {
      const newNote = {
        id: `note-${Date.now()}`,
        text,
        createdAt: new Date().toISOString(),
      }

      setSavedNotes((prevNotes) => [newNote, ...prevNotes])
      setOpenNoteId(newNote.id)
    }

    setNoteDraft('')
  }

  function editNote(note) {
    setNoteDraft(note.text)
    setEditingNoteId(note.id)
    setOpenNoteId(note.id)
  }

  function deleteNote(noteId) {
    const confirmed = window.confirm('Eliminare questa nota?')

    if (!confirmed) return

    setSavedNotes((prevNotes) =>
      prevNotes.filter((note) => note.id !== noteId)
    )

    if (openNoteId === noteId) {
      setOpenNoteId(null)
    }

    if (editingNoteId === noteId) {
      setEditingNoteId(null)
      setNoteDraft('')
    }
  }

  function startLevelUp() {
    const className = character.classes?.[0]?.name

    if (!className) return

    setLevelUpPreview(getLevelUpPreview(character, className))
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
    <div className="details-section">
      <SectionCard title="Identità">
        <div className="details-grid">
          <div>
            <span>Nome</span>
            <strong>{character.name}</strong>
          </div>
          <div>
            <span>Specie</span>
            <strong>{character.race}</strong>
          </div>
          <div>
            <span>Background</span>
            <strong>{character.background ?? 'Non indicato'}</strong>
          </div>
          <div>
            <span>Allineamento</span>
            <strong>{character.alignment ?? 'Non indicato'}</strong>
          </div>
        </div>

        {character.concept && (
          <p className="details-text details-text--strong">{character.concept}</p>
        )}
      </SectionCard>

      <SectionCard title="Classi">
        <div className="details-pill-list">
          {(character.classes ?? []).map((characterClass) => (
            <span key={`${characterClass.name}-${characterClass.level}`}>
              {getClassLabel(characterClass)}
            </span>
          ))}
        </div>

        {character.progressionPlan && (
          <p className="details-text">
            {character.progressionPlan.label}: livello bersaglio {character.progressionPlan.targetLevel}
          </p>
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
                      onClick={() =>
                        setAsiOrFeatChoice({
                          mode: 'asi',
                          increases: [
                            { ability: 'dex', amount: 1 },
                            { ability: 'wis', amount: 1 },
                          ],
                        })
                      }
                    >
                      ASI rapido
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
                    disabled
                  >
                    Conferma level up
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </SectionCard>

      {details.backstoryShort && (
        <SectionCard title="Storia breve">
          <p className="details-text">{details.backstoryShort}</p>

          {details.catchphrase && (
            <p className="details-quote">"{details.catchphrase}"</p>
          )}
        </SectionCard>
      )}

      <DetailList title="Tratti" items={details.personalityTraits} />
      <DetailList title="Ideali" items={details.ideals} />
      <DetailList title="Legami" items={details.bonds} />
      <DetailList title="Difetti" items={details.flaws} />

      {character.notes && (
        <SectionCard title="Note scheda">
          <p className="details-text">{character.notes}</p>
        </SectionCard>
      )}

      <SectionCard title="Blocknotes">
        <label className="details-notes">
          <span>{editingNoteId ? 'Modifica nota' : 'Nuova nota'}</span>
          <textarea
            value={noteDraft}
            onChange={(event) => setNoteDraft(event.target.value)}
            placeholder="PNG, promesse, indizi, tesori da ricordare..."
          />
        </label>

        <div className="details-notes__actions">
          <button
            className="details-notes__save"
            type="button"
            disabled={!noteDraft.trim()}
            onClick={saveNote}
          >
            {editingNoteId ? 'Aggiorna nota' : 'Salva nota'}
          </button>

          {editingNoteId && (
            <button
              className="details-notes__cancel"
              type="button"
              onClick={() => {
                setEditingNoteId(null)
                setNoteDraft('')
              }}
            >
              Annulla
            </button>
          )}
        </div>

        {savedNotes.length > 0 && (
          <div className="details-note-list">
            {savedNotes.map((note) => {
              const isOpen = openNoteId === note.id

              return (
                <article key={note.id} className="details-note">
                  <button
                    className="details-note__toggle"
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenNoteId(isOpen ? null : note.id)}
                  >
                    <strong>{getNotePreview(note)}</strong>
                    <span>{formatNoteDate(note.updatedAt ?? note.createdAt)}</span>
                  </button>

                  {isOpen && (
                    <div className="details-note__body">
                      <p>{note.text}</p>

                      <div className="details-note__actions">
                        <button type="button" onClick={() => editNote(note)}>
                          Riapri
                        </button>
                        <button type="button" onClick={() => deleteNote(note.id)}>
                          Elimina
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </SectionCard>
    </div>
  )
}

export default DetailsSection
