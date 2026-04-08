import './AbilityGrid.css'

function abilityMod(score) {
  return Math.floor((score - 10) / 2)
}

function formatMod(mod) {
  return mod >= 0 ? `+${mod}` : `${mod}`
}

function AbilityGrid({ abilities }) {
  return (
    <div className="abilities-grid">
      {abilities.map((ab) => (
        <div key={ab.id} className="ability-pill">
          <div className="ability-label">{ab.label}</div>
          <div className="ability-score">{ab.value}</div>
          <div className="ability-mod">{formatMod(abilityMod(ab.value))}</div>
        </div>
      ))}
    </div>
  )
}

export default AbilityGrid
