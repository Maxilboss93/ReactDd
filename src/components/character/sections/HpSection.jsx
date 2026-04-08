import SectionCard from '../../general/card/SectionCard.jsx'

function HpSection({ hpCurrent, hpMax, onDec, onInc }) {
  return (
    <SectionCard title="Punti Ferita">
      <div className="hp-row">
        <button className="hp-btn" onClick={onDec}>
          -
        </button>

        <div className="hp-value">
          {hpCurrent} / {hpMax}
        </div>

        <button className="hp-btn" onClick={onInc}>
          +
        </button>
      </div>
    </SectionCard>
  )
}

export default HpSection
