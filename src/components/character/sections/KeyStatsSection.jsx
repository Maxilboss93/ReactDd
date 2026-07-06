import SectionCard from '../../general/card/SectionCard.jsx'

function KeyStatsSection({ ac, speed, dexModLabel, primaryResource, proficiencyBonus }) {
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
          <div className="stat-label">{primaryResource?.label ?? 'Comp.'}</div>
          <div className="stat-value">
            {primaryResource ? `${primaryResource.current}/${primaryResource.max}` : `+${proficiencyBonus}`}
          </div>
        </div>
      </div>
    </SectionCard>
  )
}

export default KeyStatsSection
