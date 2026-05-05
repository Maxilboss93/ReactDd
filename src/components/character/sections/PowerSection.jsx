import { useState } from 'react'

import SectionCard from '../../general/card/SectionCard.jsx'
import SpellSection from './SpellSection.jsx'

import { findSpellById } from '../../../services/spellsCatalog.js'
import { findPowerById } from '../../../services/powersCatalog.js'
import {
  getPowerFactLabels,
  getPowerSourceLabel,
} from '../../../services/powerFormatters.js'

function PowerCard({ characterPower, power, character }) {
  const factLabels = getPowerFactLabels(power, character)
  const [isOpen, setIsOpen] = useState(false)

  return (
    <article key={characterPower.id} className="power-card">
      <button
        className="power-card__toggle"
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div>
          <strong className="power-card__title">{power.name}</strong>
        </div>

        <span className="power-card__action">{power.action_type}</span>
      </button>

      {isOpen && (
        <div className="power-card__body">
          <div className="power-card__source">
            {getPowerSourceLabel(power)}
          </div>

          <div className="power-card__facts">
            {factLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <p className="power-card__effect">{power.quick_effect}</p>

          {power.details && (
            <p className="power-card__details">{power.details}</p>
          )}
        </div>
      )}
    </article>
  )
}

function getFallbackSpell(characterSpell) {
  return {
    id: characterSpell.id,
    name: characterSpell.name,
    level: characterSpell.level ?? 0,
    level_label: characterSpell.level === 0 ? 'Trucchetto' : `${characterSpell.level}° livello`,
    school: characterSpell.school,
    casting_time: { raw: 'Da verificare' },
    range: { raw: 'Da verificare' },
    components: { raw: 'Da verificare' },
    duration: {
      raw: characterSpell.concentration ? 'Concentrazione' : 'Da verificare',
    },
    description: characterSpell.notes ?? 'Incantesimo presente nella scheda del personaggio, ma non trovato nel catalogo globale.',
    at_higher_levels: null,
  }
}

function PowersSection({ character, title }) {
  const characterSpells = character?.spellcasting?.spells ?? []
  const characterPowers = character?.powers ?? []

  const spellEntries = characterSpells
    .map((characterSpell) => {
      const spell = findSpellById(characterSpell.id) ?? getFallbackSpell(characterSpell)

      return {
        characterSpell,
        spell,
      }
    })

  const powerEntries = characterPowers
    .map((characterPower) => {
      const power = findPowerById(characterPower.id)

      return {
        characterPower,
        power,
      }
    })
    .filter((entry) => entry.power)

  const hasPowers = powerEntries.length > 0
  const hasSpells = spellEntries.length > 0
  const hasBoth = hasPowers && hasSpells
  const [powerSubtab, setPowerSubtab] = useState('powers')

  return (
    <SectionCard title={title}>
      {hasBoth && (
        <div className="subtabs">
          <button
            className={`subtabs__btn ${powerSubtab === 'powers' ? 'subtabs__btn--active' : ''}`}
            onClick={() => setPowerSubtab('powers')}
          >
            Capacità
          </button>
          <button
            className={`subtabs__btn ${powerSubtab === 'spells' ? 'subtabs__btn--active' : ''}`}
            onClick={() => setPowerSubtab('spells')}
          >
            Incantesimi
          </button>
        </div>
      )}

      {!hasPowers && !hasSpells && (
        <div className="list-empty">Nessuna capacità o incantesimo disponibile.</div>
      )}

      {hasPowers && (!hasBoth || powerSubtab === 'powers') && (
        <div className="power-list">
          {powerEntries.map(({ characterPower, power }) => (
            <PowerCard
              key={characterPower.id}
              characterPower={characterPower}
              power={power}
              character={character}
            />
          ))}
        </div>
      )}

      {hasSpells && (!hasBoth || powerSubtab === 'spells') && (
        <SpellSection
          spellEntries={spellEntries}
          spellcasting={character.spellcasting}
        />
      )}
    </SectionCard>
  )
}



export default PowersSection
