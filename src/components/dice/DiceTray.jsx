import { useMemo, useState } from 'react'

import SectionCard from '../general/card/SectionCard.jsx'
import DiceRoller from './DiceRoller.jsx'

const DICE_OPTIONS = [4, 6, 8, 10, 12, 20, 100]
const D20_MODES = [
  { id: 'normal', label: 'Normale' },
  { id: 'advantage', label: 'Vantaggio' },
  { id: 'disadvantage', label: 'Svantaggio' },
]

// Trasforma il modificatore numerico nel pezzo di testo leggibile: +3, -1, ecc.
function formatModifier(modifier) {
  if (modifier === 0) {
    return ''
  }

  return modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}`
}

// Converte i conteggi selezionati in gruppi ordinati, per esempio 3d10 + 2d6.
function buildDiceGroups(diceCounts) {
  return DICE_OPTIONS
    .map((sides) => ({
      id: `d${sides}`,
      sides,
      count: diceCounts[sides] ?? 0,
    }))
    .filter((group) => group.count > 0)
}

// Costruisce l'etichetta leggibile del tiro scelto nella plancia.
function getRollLabel({ diceGroups, modifier, d20Mode }) {
  if (diceGroups.length === 0) {
    return 'Scegli i dadi'
  }

  const diceLabel = diceGroups
    .map((group) => `${group.count}d${group.sides}`)
    .join(' + ')
  const fullLabel = `${diceLabel}${formatModifier(modifier)}`

  if (d20Mode === 'advantage') {
    return `${fullLabel} con vantaggio`
  }

  if (d20Mode === 'disadvantage') {
    return `${fullLabel} con svantaggio`
  }

  return fullLabel
}

// Plancia libera: tocchi i dadi per comporre il pool e poi lanci tutto insieme.
function DiceTray() {
  const [diceCounts, setDiceCounts] = useState({})
  const [modifier, setModifier] = useState(0)
  const [d20Mode, setD20Mode] = useState('normal')
  const [isExpanded, setIsExpanded] = useState(false)
  const [history, setHistory] = useState([])

  const diceGroups = useMemo(() => buildDiceGroups(diceCounts), [diceCounts])
  const totalDice = diceGroups.reduce((total, group) => total + group.count, 0)
  const canUseD20Mode =
    diceGroups.length === 1 &&
    diceGroups[0].sides === 20 &&
    diceGroups[0].count === 1
  const activeD20Mode = canUseD20Mode ? d20Mode : 'normal'
  const rollLabel = useMemo(
    () => getRollLabel({
      diceGroups,
      modifier,
      d20Mode: activeD20Mode,
    }),
    [activeD20Mode, diceGroups, modifier]
  )

  // Aggiunge un dado al pool quando tocchi un pulsante d4/d6/d8/ecc.
  function addDie(sides) {
    setDiceCounts((prevCounts) => ({
      ...prevCounts,
      [sides]: Math.min((prevCounts[sides] ?? 0) + 1, 20),
    }))
    setD20Mode('normal')
  }

  // Toglie un dado di quel tipo, senza scendere sotto zero.
  function removeDie(sides) {
    setDiceCounts((prevCounts) => ({
      ...prevCounts,
      [sides]: Math.max((prevCounts[sides] ?? 0) - 1, 0),
    }))
    setD20Mode('normal')
  }

  // Svuota il pool di dadi preparato.
  function clearPool() {
    setDiceCounts({})
    setD20Mode('normal')
  }

  // Riceve il risultato dal DiceRoller e lo salva negli ultimi tiri.
  function saveRoll(result) {
    const entry = {
      id: `roll-${Date.now()}`,
      label: rollLabel,
      rolls: result.rolls,
      groups: result.groups,
      keptRoll: result.keptRoll,
      d20Mode: result.d20Mode,
      total: result.total,
    }

    setHistory((prevHistory) => [entry, ...prevHistory].slice(0, 8))
  }

  // Svuota la cronologia locale della plancia.
  function clearHistory() {
    setHistory([])
  }

  return (
    <div className={`dice-tray ${isExpanded ? 'dice-tray--expanded' : ''}`}>
      {isExpanded && (
        <div className="dice-tray__expanded-bar">
          <strong>{rollLabel}</strong>
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
          >
            Chiudi
          </button>
        </div>
      )}

      <SectionCard title="Plancia dadi">
        <div className="dice-tray__picker">
          {DICE_OPTIONS.map((sides) => {
            const count = diceCounts[sides] ?? 0

            return (
              <div key={sides} className="dice-tray__picker-item">
                <button
                  className={`dice-tray__die-button ${count > 0 ? 'dice-tray__die-button--selected' : ''}`}
                  type="button"
                  onClick={() => addDie(sides)}
                >
                  <strong>d{sides}</strong>
                  <span>{count}</span>
                </button>

                <button
                  className="dice-tray__die-minus"
                  type="button"
                  disabled={count === 0}
                  onClick={() => removeDie(sides)}
                >
                  -
                </button>
              </div>
            )
          })}
        </div>

        <div className="dice-tray__summary">
          <strong>{rollLabel}</strong>
          <div className="dice-tray__summary-actions">
            <button
              className="dice-tray__clear-pool"
              type="button"
              disabled={totalDice === 0}
              onClick={clearPool}
            >
              Svuota
            </button>
            <button
              className="dice-tray__expand"
              type="button"
              onClick={() => setIsExpanded(true)}
            >
              Tavolo grande
            </button>
          </div>
        </div>

        <label className="dice-tray__field dice-tray__field--modifier">
          <span>Modificatore totale</span>
          <input
            type="number"
            inputMode="numeric"
            value={modifier}
            onChange={(event) => setModifier(Number(event.target.value) || 0)}
          />
        </label>

        <div className="dice-tray__modes">
          {D20_MODES.map((mode) => (
            <button
              key={mode.id}
              className={`dice-tray__mode ${activeD20Mode === mode.id ? 'dice-tray__mode--active' : ''}`}
              type="button"
              disabled={mode.id !== 'normal' && !canUseD20Mode}
              onClick={() => setD20Mode(mode.id)}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <DiceRoller
          diceGroups={canUseD20Mode ? null : diceGroups}
          sides={canUseD20Mode ? 20 : null}
          large={isExpanded}
          count={canUseD20Mode ? 1 : totalDice}
          modifier={modifier}
          d20Mode={activeD20Mode}
          disabled={totalDice === 0}
          label={`Lancia ${rollLabel}`}
          onRoll={saveRoll}
        />
      </SectionCard>

      <SectionCard title="Ultimi tiri">
        {history.length === 0 ? (
          <div className="dice-tray__empty">Nessun tiro ancora.</div>
        ) : (
          <>
            <div className="dice-tray__history">
              {history.map((roll) => (
                <article key={roll.id} className="dice-tray__history-item">
                  <div>
                    <strong>{roll.label}</strong>
                    <span>
                      Dadi: {roll.groups
                        ? roll.groups.map((group) => `${group.count}d${group.sides}: ${group.rolls.join(', ')}`).join(' | ')
                        : roll.rolls.join(', ')}
                      {roll.d20Mode !== 'normal' && ` - tiene ${roll.keptRoll}`}
                    </span>
                  </div>
                  <b>{roll.total}</b>
                </article>
              ))}
            </div>

            <button
              className="dice-tray__clear"
              type="button"
              onClick={clearHistory}
            >
              Svuota cronologia
            </button>
          </>
        )}
      </SectionCard>
    </div>
  )
}

export default DiceTray
