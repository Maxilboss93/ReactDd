import SectionCard from '../../general/card/SectionCard.jsx'

function OverviewSection({ character, mainClass }) {
  const classSummary = (character.classes ?? [])
    .map((characterClass) => `${characterClass.name} ${characterClass.level}`)
    .join(' / ')
  const subclassSummary = (character.classes ?? [])
    .map((characterClass) => characterClass.subclass)
    .filter(Boolean)
    .join(' / ')
  const portraitUrl = character.portraitUrl ?? character.image ?? character.avatarUrl ?? null

  return (
    <SectionCard title="Panoramica">
      <div className="character-block character-block--portrait">
        <div className="character-portrait" aria-hidden={!portraitUrl}>
          {portraitUrl && <img src={portraitUrl} alt="" />}
        </div>
        <div className="character-block__text">
          <div className="character-name">{character.name}</div>
          <div className="character-line">
            {character.race} - {classSummary || `${mainClass.name} Livello ${mainClass.level}`}
          </div>
          {subclassSummary && (
            <div className="character-line">{subclassSummary}</div>
          )}
        </div>
      </div>
    </SectionCard>
  )
}

export default OverviewSection
