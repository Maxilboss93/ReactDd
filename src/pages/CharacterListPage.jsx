import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../components/authentication/AuthContext.jsx'
import AppTopbar from '../components/layout/AppTopbar.jsx'
import ClassIcon from '../components/character/ClassIcon.jsx'
import { deleteCharacter, fetchCharacters } from '../services/fakeApi.js'
import '../app/App.css'

function CharacterListPage() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    if (!user?.id) return

    fetchCharacters(user.id).then((list) => {
      if (!active) return
      setItems(list)
      setLoading(false)

    })

    return () => {
      active = false
    }
  }, [user?.id, navigate])

  async function handleDelete(character) {
    if (!user?.id || !character?.id) return

    const confirmed = window.confirm(`Eliminare definitivamente ${character.name}?`)

    if (!confirmed) {
      return
    }

    setDeletingId(character.id)
    setMessage('')

    try {
      await deleteCharacter(user.id, character.id)
      setItems((currentItems) => currentItems.filter((item) => item.id !== character.id))
      setMessage(`${character.name} eliminato.`)
    } catch {
      setMessage(`Non sono riuscito a eliminare ${character.name}.`)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="app">
      <AppTopbar
        title="Gestione PG"
        onBack={() => navigate('/home')}
      />

      <main className="screen">
        <div className="panel_content">
          <div className="list-toolbar">
            <button
              className="list-btn list-btn--primary"
              type="button"
              onClick={() => navigate('/crea-pg')}
            >
              + Nuovo PG
            </button>
          </div>

          {message && (
            <div className="list-message" role="status">
              {message}
            </div>
          )}

          {loading && <div className="list-empty">Caricamento schede...</div>}

          {!loading && items.length === 0 && (
            <div className="list-empty">Nessun personaggio creato.</div>
          )}

          {!loading && items.length > 0 && (
            <div className="list-grid">
              {items.map((c) => {
                const mainClass = c.classes?.[0] ?? null

                return (
                  <div key={c.id} className="list-card">
                    <div className="list-card__identity">
                      <ClassIcon classLabel={mainClass?.name} size="lg" />
                      <div>
                        <div className="list-name">{c.name}</div>
                        <div className="list-meta">
                          {c.race} - {(c.classes ?? [])
                            .map((characterClass) => `${characterClass.name} ${characterClass.level}`)
                            .join(' / ')}
                        </div>
                      </div>
                    </div>
                    <div className="list-card__actions">
                      <button
                        className="list-btn"
                        type="button"
                        onClick={() => navigate(`/scheda/${c.id}`)}
                      >
                        Apri
                      </button>

                      <button
                        className="list-btn"
                        type="button"
                        onClick={() => alert(`Duplica ${c.name}`)}
                      >
                        Duplica
                      </button>

                      <button
                        className="list-btn list-btn--danger"
                        type="button"
                        disabled={deletingId === c.id}
                        onClick={() => handleDelete(c)}
                      >
                        {deletingId === c.id ? 'Elimino...' : 'Elimina'}
                      </button>
                    </div>

                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default CharacterListPage
