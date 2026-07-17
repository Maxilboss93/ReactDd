import SectionCard from '../../general/card/SectionCard.jsx'

function OverviewSection({ character, mainClass }) {
  const classSummary = (character.classes ?? [])
    .map((characterClass) => `${characterClass.name} ${characterClass.level}`)
    .join(' / ')
  const subclassSummary = (character.classes ?? [])
    .map((characterClass) => characterClass.subclass)
    .filter(Boolean)
    .join(' / ')

  return (
    <SectionCard title="Panoramica">
      <div className="character-block">
        <div className="character-name">{character.name}</div>
        <div className="character-line">
          {character.race} - {classSummary || `${mainClass.name} Livello ${mainClass.level}`}
        </div>
        {subclassSummary && (
          <div className="character-line">{subclassSummary}</div>
        )}
      </div>
    </SectionCard>
  )
}

export default OverviewSection
