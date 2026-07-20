import SectionCard from '../../general/card/SectionCard.jsx'
import { getClassDerivedStats } from '../../../services/classScalingService.js'

function ClassDerivedStatsSection({ character }) {
  const stats = getClassDerivedStats(character)

  if (stats.length === 0) {
    return null
  }

  return (
    <SectionCard title="Derivati di classe">
      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.id} className="stat-pill">
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-note">{stat.source}</div>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

export default ClassDerivedStatsSection
