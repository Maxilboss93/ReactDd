import SectionCard from '../../general/card/SectionCard.jsx'
import StatIcon from '../StatIcon.jsx'

function HpSection({ hpCurrent, hpMax, onDec, onInc }) {
  return (
    <SectionCard title="Punti Ferita">
      <div className="hp-row">
        <button className="hp-btn" onClick={onDec}>
          -
        </button>

        <div className="hp-value">
          <StatIcon statKey="hp" size="xl" />
          <strong>{hpCurrent} / {hpMax}</strong>
        </div>

        <button className="hp-btn" onClick={onInc}>
          +
        </button>
      </div>
    </SectionCard>
  )
}

export default HpSection
