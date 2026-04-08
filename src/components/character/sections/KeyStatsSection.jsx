import SectionCard from '../../general/card/SectionCard.jsx'

function KeyStatsSection({ ac, speed, dexModLabel, kiCurrent, kiMax }) {
  return (
    <SectionCard title="Statistiche Chiave">
      <div className="stats-grid">
        <div className="stat-pill">
          <div className="stat-label">CA</div>
          <div className="stat-value">{ac}</div>
        </div>

        <div className="stat-pill">
          <div className="stat-label">Vel.</div>
          <div className="stat-value">{speed} mt</div>
        </div>

        <div className="stat-pill">
          <div className="stat-label">DES</div>
          <div className="stat-value">{dexModLabel}</div>
        </div>

        <div className="stat-pill">
          <div className="stat-label">Ki</div>
          <div className="stat-value">
            {kiCurrent}/{kiMax}
          </div>
        </div>
      </div>
    </SectionCard>
  )
}

export default KeyStatsSection
