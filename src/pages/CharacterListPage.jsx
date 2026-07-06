import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../components/authentication/AuthContext.jsx'
import AppTopbar from '../components/layout/AppTopbar.jsx'
import { fetchCharacters } from '../services/fakeApi.js'
import '../app/App.css'

function CharacterListPage() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
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
          {loading && <div className="list-empty">Caricamento schede...</div>}

          {!loading && items.length === 0 && (
            <div className="list-empty">Nessun personaggio creato.</div>
          )}

          {!loading && items.length > 0 && (
            <div className="list-grid">
              {items.map((c) => (
                <div key={c.id} className="list-card">
                  <div className="list-name">{c.name}</div>
                  <div className="list-meta">
                    {c.race} - {c.classes[0]?.name} {c.classes[0]?.level}
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
                      onClick={() => alert(`Elimina ${c.name}`)}
                    >
                      Elimina
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default CharacterListPage
