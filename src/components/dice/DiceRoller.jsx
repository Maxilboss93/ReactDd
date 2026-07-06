import { useEffect, useRef, useState } from 'react'
import DiceBox from '@drdreo/dice-box-threejs'

import { rollDice, rollDicePool, rollDie } from '../../services/diceService.js'

const DICE_OPTIONS = [4, 6, 8, 10, 12, 20, 100]
const PHYSICS_ROLL_TIMEOUT_MS = 12000

function withTimeout(promise, timeoutMs) {
  let timeoutId

  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Timeout lancio 3D')), timeoutMs)
  })

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId))
}

// Crea dadi visuali per gruppi diversi, mantenendo il tipo di dado su ogni elemento.
function buildRandomDicePool(groups) {
  const dice = []

  groups.forEach((group, groupIndex) => {
    for (let i = 0; i < group.count; i++) {
      dice.push({
        id: `${groupIndex}-${i}`,
        groupIndex,
        sides: group.sides,
        value: rollDie(group.sides),
      })
    }
  })

  return dice
}

// Trasforma count/sides oppure diceGroups in una lista unica di gruppi tirabili.
function getActiveGroups({ diceGroups, activeSides, count, shouldUseD20Mode }) {
  if (diceGroups?.length) {
    return diceGroups
  }

  return [{
    id: 'single',
    count: shouldUseD20Mode ? 2 : count,
    sides: activeSides,
  }]
}

// Prepara la notazione semplice che la libreria 3D sa lanciare: 3d10+2d6.
function getDiceNotation(groups) {
  return groups
    .map((group) => `${group.count}d${group.sides}`)
    .join('+')
}

// Converte il risultato della libreria 3D nel formato che la nostra app usa già.
function normalizePhysicsResult(physicsResult, { activeGroups, modifier, d20Mode }) {
  const groups = physicsResult.sets.map((set, index) => ({
    id: activeGroups[index]?.id ?? `${set.num}d${set.sides}`,
    count: set.num,
    sides: set.sides,
    rolls: set.rolls.map((roll) => roll.value),
  }))
  const dice = groups.flatMap((group, groupIndex) =>
    group.rolls.map((value, index) => ({
      id: `${groupIndex}-${index}`,
      groupIndex,
      sides: group.sides,
      value,
    }))
  )
  const rolls = dice.map((die) => die.value)
  const diceTotal = rolls.reduce((total, roll) => total + roll, 0)
  const usesD20Mode = d20Mode !== 'normal'
  const keptRoll = usesD20Mode
    ? d20Mode === 'advantage'
      ? Math.max(...rolls)
      : Math.min(...rolls)
    : null

  return {
    groups,
    dice,
    rolls,
    count: usesD20Mode ? 1 : dice.length,
    modifier,
    modifierMode: 'total',
    diceTotal,
    keptRoll,
    total: usesD20Mode ? keptRoll + modifier : diceTotal + modifier,
    d20Mode,
  }
}

// Dado visuale riusabile: mostra la plancia, anima il tiro e restituisce il risultato.
function DiceRoller({
  sides,
  diceGroups = null,
  label,
  large = false,
  count = 1,
  modifier = 0,
  modifierMode = 'total',
  minimumPerRoll = null,
  d20Mode = 'normal',
  disabled = false,
  onRoll,
}) {
  const [rolling, setRolling] = useState(false)
  const [displayRolls, setDisplayRolls] = useState([])
  const [lastResult, setLastResult] = useState(null)
  const [selectedSides, setSelectedSides] = useState(sides ?? 20)
  const [isPhysicsReady, setIsPhysicsReady] = useState(false)
  const [isPhysicsRolling, setIsPhysicsRolling] = useState(false)
  const [lastPhysicsNotation, setLastPhysicsNotation] = useState(null)
  const [usePhysics, setUsePhysics] = useState(true)
  const boxElementRef = useRef(null)
  const diceBoxRef = useRef(null)
  const activeSides = sides ?? selectedSides
  const hasDicePool = Boolean(diceGroups?.length)
  const canChooseDie = !sides && !hasDicePool
  const shouldUseD20Mode = !hasDicePool && activeSides === 20 && d20Mode !== 'normal'
  const activeGroups = getActiveGroups({
    diceGroups,
    activeSides,
    count,
    shouldUseD20Mode,
  })
  const activeNotation = getDiceNotation(activeGroups)
  const visualDiceCount = activeGroups.reduce((total, group) => total + group.count, 0)
  const isDisabled = disabled || rolling || visualDiceCount <= 0
  const shouldShowCssDice =
    !isPhysicsRolling &&
    (!usePhysics || !isPhysicsReady || !lastPhysicsNotation || lastPhysicsNotation !== activeNotation)
  const visibleDice = displayRolls.length === visualDiceCount
    ? displayRolls
    : activeGroups.flatMap((group, groupIndex) =>
      Array.from({ length: group.count }, (_, index) => ({
        id: `${groupIndex}-${index}`,
        groupIndex,
        sides: group.sides,
        value: group.sides,
      }))
    )

  useEffect(() => {
    if (!boxElementRef.current) return

    let cancelled = false

    async function setupDiceBox() {
      try {
        const box = new DiceBox(boxElementRef.current, {
          framerate: 1 / 60,
          sounds: false,
          shadows: true,
          theme_surface: 'green-felt',
          theme_colorset: 'white',
          theme_material: 'glass',
          gravity_multiplier: 400,
          light_intensity: 0.75,
          baseScale: 95,
          strength: 1.15,
        })

        await box.initialize()

        if (cancelled) return

        diceBoxRef.current = box
        setIsPhysicsReady(true)
      } catch (error) {
        console.error('Dice box 3D non disponibile:', error)
        setUsePhysics(false)
      }
    }

    setupDiceBox()

    return () => {
      cancelled = true
      diceBoxRef.current?.clearDice?.()
      diceBoxRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!lastPhysicsNotation || lastPhysicsNotation === activeNotation) return

    diceBoxRef.current?.clearDice?.()
    setLastPhysicsNotation(null)
  }, [activeNotation, lastPhysicsNotation])

  // Avvia l'animazione, calcola il risultato finale e lo comunica al componente padre.
  async function handleRoll() {
    if (isDisabled) return

    setRolling(true)
    setLastResult(null)
    setDisplayRolls(buildRandomDicePool(activeGroups))

    const animation = setInterval(() => {
      setDisplayRolls(buildRandomDicePool(activeGroups))
    }, 75)

    if (usePhysics && isPhysicsReady && diceBoxRef.current) {
      try {
        const boxRect = boxElementRef.current?.getBoundingClientRect()

        if (boxRect?.width && boxRect?.height) {
          diceBoxRef.current.setDimensions?.({ x: boxRect.width, y: boxRect.height })
        }

        setIsPhysicsRolling(true)
        const physicsResult = await withTimeout(
          diceBoxRef.current.roll(getDiceNotation(activeGroups)),
          PHYSICS_ROLL_TIMEOUT_MS
        )
        clearInterval(animation)
        const result = normalizePhysicsResult(physicsResult, {
          activeGroups,
          modifier,
          d20Mode: shouldUseD20Mode ? d20Mode : 'normal',
        })

        setDisplayRolls(result.dice)
        setLastResult(result)
        setLastPhysicsNotation(activeNotation)
        setRolling(false)
        setIsPhysicsRolling(false)
        onRoll?.(result)
        return
      } catch (error) {
        console.error('Lancio 3D non riuscito, uso fallback CSS:', error)
        setUsePhysics(false)
        setIsPhysicsRolling(false)
        setLastPhysicsNotation(null)
        diceBoxRef.current?.clearDice?.()
      }
    }

    setTimeout(() => {
      clearInterval(animation)

      if (hasDicePool) {
        const result = rollDicePool({
          groups: activeGroups,
          modifier,
        })

        setDisplayRolls(result.dice)
        setLastResult(result)
        setRolling(false)
        onRoll?.(result)
        return
      }

      const baseResult = rollDice({
        sides: activeSides,
        count: shouldUseD20Mode ? 2 : count,
        modifier: shouldUseD20Mode ? 0 : modifier,
        modifierMode,
        minimumPerRoll,
      })
      const result = shouldUseD20Mode
        ? {
          ...baseResult,
          count: 1,
          modifier,
          d20Mode,
          keptRoll: d20Mode === 'advantage'
            ? Math.max(...baseResult.rolls)
            : Math.min(...baseResult.rolls),
          total: (d20Mode === 'advantage'
            ? Math.max(...baseResult.rolls)
            : Math.min(...baseResult.rolls)) + modifier,
        }
        : { ...baseResult, d20Mode: 'normal' }

      setDisplayRolls(result.rolls.map((roll, index) => ({
        id: `single-${index}`,
        groupIndex: 0,
        sides: activeSides,
        value: roll,
      })))
      setLastResult(result)
      setRolling(false)
      onRoll?.(result)
    }, 1100)
  }

  return (
    <div className={`dice-roller ${large ? 'dice-roller--large' : ''}`}>
      <div className="dice-roller__controls">
        <div className="dice-roller__meta">
          <span>Dado</span>
          <strong>{hasDicePool ? `${visualDiceCount} dadi` : count > 1 ? `${count}d${activeSides}` : `d${activeSides}`}</strong>
        </div>

        {canChooseDie && (
          <label className="dice-roller__select">
            <span>Tipo</span>
            <select
              value={selectedSides}
              disabled={rolling}
              onChange={(event) => setSelectedSides(Number(event.target.value))}
            >
              {DICE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  d{option}
                </option>
              ))}
            </select>
          </label>
        )}

        <button
          className="dice-roller__button"
          type="button"
          disabled={isDisabled}
          onClick={handleRoll}
        >
          {rolling ? 'Lancio...' : label}
        </button>
      </div>

      <div className="dice-roller__tray" aria-live="polite">
        <div
          ref={boxElementRef}
          className={`dice-roller__physics-box ${isPhysicsReady ? 'dice-roller__physics-box--ready' : ''}`}
        />

        {shouldShowCssDice && (
          <div className="dice-roller__dice-pool">
            {visibleDice.map((die, index) => {
              const isKeptRoll =
                lastResult?.d20Mode !== 'normal' &&
                lastResult?.keptRoll === die.value &&
                lastResult?.rolls.indexOf(die.value) === index

              return (
                <div
                  key={`${die.id}-${visualDiceCount}`}
                  className={`dice-roller__die ${rolling ? 'dice-roller__die--rolling' : ''} ${isKeptRoll ? 'dice-roller__die--kept' : ''}`}
                  data-sides={die.sides}
                  style={{
                    '--dice-index': index,
                    '--roll-delay': `${index * -0.08}s`,
                    '--roll-duration': `${0.92 + (index % 5) * 0.08}s`,
                  }}
                >
                  <span>{die.value}</span>
                  <small>d{die.sides}</small>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {lastResult && (
        <div className="dice-roller__result">
          <span>
            Dadi: {lastResult.groups
              ? lastResult.groups.map((group) => `${group.count}d${group.sides}: ${group.rolls.join(', ')}`).join(' | ')
              : lastResult.rolls.join(', ')}
          </span>
          {lastResult.d20Mode !== 'normal' && (
            <span>
              {lastResult.d20Mode === 'advantage' ? 'Vantaggio' : 'Svantaggio'}: tiene {lastResult.keptRoll}
            </span>
          )}
          {modifier !== 0 && (
            <span>
              Mod: {modifier >= 0 ? `+${modifier}` : modifier}
              {modifierMode === 'each' ? ' per dado' : ''}
            </span>
          )}
          <strong>Totale: {lastResult.total}</strong>
        </div>
      )}
    </div>
  )
}

export default DiceRoller
