import SectionCard from '../../general/card/SectionCard.jsx'
import StatIcon from '../StatIcon.jsx'

function KeyStatsSection({ ac, speed, dexModLabel, primaryResource, proficiencyBonus }) {
  return (
    <SectionCard title="Statistiche Chiave">
      <div className="stats-grid">
        <div className="stat-pill">
          <StatIcon statKey="ac" size="md" />
          <div className="stat-label">CA</div>
          <div className="stat-value">{ac}</div>
        </div>

        <div className="stat-pill">
          <StatIcon statKey="speed" size="md" />
          <div className="stat-label">Vel.</div>
          <div className="stat-value">{speed} mt</div>
        </div>

        <div className="stat-pill">
          <StatIcon statKey="initiative" size="md" />
          <div className="stat-label">Iniz.</div>
          <div className="stat-value">{dexModLabel}</div>
        </div>

        <div className="stat-pill">
          <StatIcon statKey={primaryResource ? primaryResource.id : 'proficiency'} size="md" />
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
