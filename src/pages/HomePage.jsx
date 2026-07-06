import { useNavigate } from 'react-router-dom'

import '../app/App.css'
import AppTopbar from '../components/layout/AppTopbar.jsx'

function HomePage() {
  const navigate = useNavigate()

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
          </div>
        </div>
      </main>
    </div>
  )
}

export default HomePage
