import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../components/authentication/AuthContext.jsx'
import { fetchCharacters } from '../services/fakeApi.js'
import '../app/App.css'

function CharacterListPage() {
  const { user, logout } = useAuth()
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

      if (list.length === 1) {
        navigate(`/scheda/${list[0].id}`, { replace: true })
      }
    })

    return () => {
      active = false
    }
  }, [user?.id, navigate])

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__spacer" />
        <div className="topbar__title">Le tue schede</div>
        <button className="icon-btn icon-btn--text" onClick={handleLogout}>
          Esci
        </button>
      </header>

      <main className="screen">
        <div className="panel_content">
          {loading && <div className="list-empty">Caricamento schede...</div>}

          {!loading && items.length === 0 && (
            <div className="list-empty">Nessuna scheda disponibile.</div>
          )}

          {!loading && items.length > 0 && (
            <div className="list-grid">
              {items.map((c) => (
                <div key={c.id} className="list-card">
                  <div className="list-name">{c.name}</div>
                  <div className="list-meta">
                    {c.race} - {c.classes[0]?.name} {c.classes[0]?.level}
                  </div>
                  <button
                    className="list-btn"
                    onClick={() => navigate(`/scheda/${c.id}`)}
                  >
                    Apri
                  </button>
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
