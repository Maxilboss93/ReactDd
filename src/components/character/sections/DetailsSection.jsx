import { useEffect, useState } from 'react'

import SectionCard from '../../general/card/SectionCard.jsx'

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

function DetailsSection({ character }) {
  const details = character?.details ?? {}
  const storageKey = `character-notes:${character?.id ?? 'unknown'}`
  const [noteDraft, setNoteDraft] = useState('')
  const [savedNotes, setSavedNotes] = useState([])
  const [openNoteId, setOpenNoteId] = useState(null)
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [loadedStorageKey, setLoadedStorageKey] = useState(null)

  useEffect(() => {
    setSavedNotes(readSavedNotes(storageKey))
    setNoteDraft('')
    setOpenNoteId(null)
    setEditingNoteId(null)
    setLoadedStorageKey(storageKey)
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
