// Tira un singolo dado con il numero di facce indicato.
export function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1
}

// Tira uno o più dadi e applica il modificatore al totale o a ogni singolo dado.
export function rollDice({
  sides,
  count = 1,
  modifier = 0,
  modifierMode = 'total',
  minimumPerRoll = null,
}) {
  const rolls = []

  for (let i = 0; i < count; i++) {
    rolls.push(rollDie(sides))
  }

  let diceTotal = 0

  rolls.forEach((roll) => {
    diceTotal = diceTotal + roll
  })

  const adjustedRolls = rolls.map((roll) => {
    if (modifierMode !== 'each') {
      return roll
    }

    const adjustedRoll = roll + modifier

    if (minimumPerRoll === null) {
      return adjustedRoll
    }

    return Math.max(minimumPerRoll, adjustedRoll)
  })

  let adjustedDiceTotal = 0

  adjustedRolls.forEach((roll) => {
    adjustedDiceTotal = adjustedDiceTotal + roll
  })

  return {
    sides,
    count,
    modifier,
    modifierMode,
    rolls,
    adjustedRolls,
    diceTotal,
    total: modifierMode === 'each' ? adjustedDiceTotal : diceTotal + modifier,
  }
}

// Tira gruppi diversi nello stesso lancio, per casi come 2d6 + 1d10 + 4d8.
export function rollDicePool({
  groups,
  modifier = 0,
}) {
  const groupResults = []
  const dice = []
  const rolls = []
  let diceTotal = 0

  groups.forEach((group, groupIndex) => {
    const groupRolls = []

    for (let i = 0; i < group.count; i++) {
      const value = rollDie(group.sides)

      groupRolls.push(value)
      rolls.push(value)
      dice.push({
        id: `${groupIndex}-${i}`,
        groupIndex,
        sides: group.sides,
        value,
      })
      diceTotal = diceTotal + value
    }

    groupResults.push({
      ...group,
      rolls: groupRolls,
    })
  })

  return {
    groups: groupResults,
    dice,
    rolls,
    count: dice.length,
    modifier,
    modifierMode: 'total',
    diceTotal,
    total: diceTotal + modifier,
    d20Mode: 'normal',
  }
}
