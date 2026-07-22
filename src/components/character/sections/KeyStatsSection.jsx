import SectionCard from '../../general/card/SectionCard.jsx'
import StatIcon from '../StatIcon.jsx'

function KeyStatsSection({
  ac,
  speed,
  dexModLabel,
  primaryResource,
  proficiencyBonus,
  derivedStats = [],
}) {
  const stats = [
    { id: 'ac', icon: 'ac', label: 'CA', value: ac },
    { id: 'speed', icon: 'speed', label: 'Vel.', value: `${speed} mt` },
    { id: 'initiative', icon: 'initiative', label: 'Iniz.', value: dexModLabel },
    {
      id: primaryResource ? primaryResource.id : 'proficiency',
      icon: primaryResource ? primaryResource.id : 'proficiency',
      label: primaryResource?.label ?? 'Comp.',
      value: primaryResource ? `${primaryResource.current}/${primaryResource.max}` : `+${proficiencyBonus}`,
    },
    ...derivedStats.slice(0, 2).map((stat) => ({
      id: stat.id,
      icon: stat.id,
      label: stat.label,
      value: stat.value,
      note: stat.source,
    })),
  ]

  return (
    <SectionCard title="Statistiche Chiave">
      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.id} className="stat-pill">
            <StatIcon statKey={stat.icon} size="md" />
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value">{stat.value}</div>
            {stat.note && <div className="stat-note">{stat.note}</div>}
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

export default KeyStatsSection
