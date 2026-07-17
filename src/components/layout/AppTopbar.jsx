import { useNavigate } from 'react-router-dom'

import { useAuth } from '../authentication/AuthContext.jsx'

function AppTopbar({ title, onBack, onMenuOpen, showLogout = true }) {
  const navigate = useNavigate()
  const { isAuthenticated, logout } = useAuth()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const canLogout = showLogout && isAuthenticated

  return (
    <header className="topbar">
      {onBack ? (
        <button className="icon-btn" type="button" aria-label="Indietro" onClick={onBack}>
          &larr;
        </button>
      ) : (
        <div className="topbar__spacer" />
      )}

      <div className="topbar__title">{title}</div>

      {onMenuOpen ? (
        <button className="icon-btn" type="button" aria-label="Apri menu" onClick={onMenuOpen}>
          &#9776;
        </button>
      ) : canLogout ? (
        <button className="icon-btn icon-btn--text" type="button" onClick={handleLogout}>
          Esci
        </button>
      ) : (
        <div className="topbar__spacer" />
      )}
    </header>
  )
}

export default AppTopbar
