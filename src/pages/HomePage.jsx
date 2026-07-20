import { useNavigate } from 'react-router-dom'

import '../app/App.css'
import { useAuth } from '../components/authentication/AuthContext.jsx'
import AppTopbar from '../components/layout/AppTopbar.jsx'

function HomePage() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app">
      <AppTopbar title="Home" />

      <main className="screen">
        <div className="panel_content">
          <div className="home-actions">
            <button
              className="home-action"
              type="button"
              onClick={() => navigate('/schede')}
            >
              <span>Gestione PG</span>
              <small>Gestisci le tue schede personaggio</small>
            </button>

            <button
              className="home-action"
              type="button"
              onClick={() => navigate('/campagne')}
            >
              <span>Le mie campagne</span>
              <small>Organizza party, sessioni e personaggi</small>
            </button>

            <button
              className="home-action home-action--logout"
              type="button"
              onClick={handleLogout}
            >
              <span>Esci</span>
              <small>Chiudi la sessione e torna al login</small>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default HomePage
