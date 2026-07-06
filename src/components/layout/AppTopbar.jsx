function AppTopbar({ title, onBack, onMenuOpen }) {
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
      ) : (
        <div className="topbar__spacer" />
      )}
    </header>
  )
}

export default AppTopbar
