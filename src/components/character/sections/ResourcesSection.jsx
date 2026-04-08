import SectionCard from '../../general/card/SectionCard.jsx'
import ResourceRow from '../../general/resource/ResourceRow.jsx'

function ResourcesSection({ hitDice, onHitDiceChange, resources, onResourceChange }) {
  return (
    <SectionCard title="Risorse">
      <div className="resource-list">
        <ResourceRow
          label={`Dadi Vita (${hitDice.type})`}
          current={hitDice.current}
          max={hitDice.max}
          resetOn="long_rest"
          onChange={onHitDiceChange}
        />
        {resources.map((res) => (
          <ResourceRow
            key={res.id}
            label={res.label}
            current={res.current}
            max={res.max}
            resetOn={res.resetOn}
            onChange={(value) => onResourceChange(res.id, value)}
          />
        ))}
      </div>
    </SectionCard>
  )
}

export default ResourcesSection
