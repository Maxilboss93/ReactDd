import SectionCard from '../../general/card/SectionCard.jsx'
import ResourceRow from '../../general/resource/ResourceRow.jsx'

function getSpellSlotLabel(slot) {
  return slot.label ?? `Slot livello ${slot.level}`
}

function ResourcesSection({
  hitDice,
  onHitDiceChange,
  resources,
  onResourceChange,
  spellSlots = [],
  onSpellSlotChange,
}) {
  return (
    <SectionCard title="Risorse">
      <div className="resource-list">
        <ResourceRow
          iconKey="hit_dice"
          label={`Dadi Vita (${hitDice.type})`}
          current={hitDice.current}
          max={hitDice.max}
          resetOn="long_rest"
          onChange={onHitDiceChange}
        />
        {resources.map((res) => (
          <ResourceRow
            key={res.id}
            iconKey={res.id}
            label={res.label}
            current={res.current}
            max={res.max}
            resetOn={res.resetOn}
            shortRestRecover={res.shortRestRecover}
            onChange={(value) => onResourceChange(res.id, value)}
          />
        ))}
        {spellSlots.map((slot) => (
          <ResourceRow
            key={slot.id ?? `spell_slot_${slot.level}`}
            label={getSpellSlotLabel(slot)}
            current={slot.current}
            max={slot.max}
            resetOn={slot.resetOn}
            onChange={(value) => onSpellSlotChange(slot.id ?? slot.level, value)}
          />
        ))}
      </div>
    </SectionCard>
  )
}

export default ResourcesSection
