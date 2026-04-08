import SectionCard from '../../general/card/SectionCard.jsx'

function OverviewSection({ character, mainClass }) {
  return (
    <SectionCard title="Panoramica">
      <div className="character-block">
        <div className="character-name">{character.name}</div>
        <div className="character-line">
          {character.race} - {mainClass.name} Livello {mainClass.level}
        </div>
        <div className="character-line">{mainClass.subclass}</div>
      </div>
    </SectionCard>
  )
}

export default OverviewSection
