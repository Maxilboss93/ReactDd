import { useState } from 'react'

function groupSpellEntriesByLevel(spellEntries) {
  return spellEntries.reduce((groups, entry) => {
    const level = entry.spell.level ?? 0

    if (!groups[level]) {
      groups[level] = []
    }

    groups[level].push(entry)

    return groups
  }, {})
}

function getSpellLevelTitle(level) {
  if (level === 0) {
    return 'Trucchetti'
  }

  return `${level}° livello`
}

function getSlotLabel(level, spellcasting) {
  if (level === 0) {
    return null
  }

  const slot = spellcasting?.slots?.find((slotItem) => slotItem.level === level)

  if (!slot) {
    return 'Innati / risorse'
  }

  return `Slot ${slot.current}/${slot.max}`
}

function SpellCard({ characterSpell, spell }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <article className="power-card">
      <button
        className="power-card__toggle"
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div>
          <strong className="power-card__title">{spell.name}</strong>
        </div>

        <span className="power-card__action">{spell.level_label}</span>
      </button>

      {isOpen && (
        <div className="power-card__body">
          <div className="power-card__source">
            {characterSpell.source}
          </div>

          <div className="power-card__facts">
            <span>Tempo: {spell.casting_time.raw}</span>
            <span>Gittata: {spell.range.raw}</span>
            <span>Componenti: {spell.components.raw}</span>
            <span>Durata: {spell.duration.raw}</span>
          </div>

          <p className="power-card__effect">
            {spell.description}
          </p>

          {spell.at_higher_levels && (
            <p className="power-card__details">
              {spell.at_higher_levels}
            </p>
          )}
        </div>
      )}
    </article>
  )
}

function SpellSection({ spellEntries, spellcasting }) {
  const spellsByLevel = groupSpellEntriesByLevel(spellEntries)
  const levels = Object.keys(spellsByLevel)
    .map(Number)
    .sort((firstLevel, secondLevel) => firstLevel - secondLevel)

  return (
    <div className="spell-groups">
      {levels.map((level) => {
        const slotLabel = getSlotLabel(level, spellcasting)

        return (
          <section key={level} className="spell-level">
            <div className="spell-level__header">
              <h3 className="spell-level__title">{getSpellLevelTitle(level)}</h3>

              {slotLabel && (
                <span className="spell-level__meta">{slotLabel}</span>
              )}
            </div>

            <div className="power-list">
              {spellsByLevel[level].map(({ characterSpell, spell }) => (
                <SpellCard
                  key={characterSpell.id}
                  characterSpell={characterSpell}
                  spell={spell}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

export default SpellSection
