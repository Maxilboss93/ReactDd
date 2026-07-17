function toggleSelected(selected, optionId, count) {
  if (selected.includes(optionId)) {
    return selected.filter((item) => item !== optionId)
  }

  if (count === 1) {
    return [optionId]
  }

  if (selected.length >= count) {
    return selected
  }

  return [...selected, optionId]
}

function isLongChoice(requirement) {
  return (requirement.options?.length ?? 0) > 24
}

function isSpellChoice(requirement) {
  return (
    requirement.type === 'spell_choice' ||
    requirement.type === 'cantrip_choice' ||
    requirement.type === 'ritual_spell_choice'
  )
}

function isSelectChoice(requirement) {
  return isLongChoice(requirement)
}

function getOptionLevel(option) {
  if (Number.isFinite(Number(option.level))) {
    return Number(option.level)
  }

  const labelLevel = String(option.label ?? '').match(/^Liv\.\s*(\d+)/i)

  return labelLevel ? Number(labelLevel[1]) : 0
}

function getSpellLevelLabel(level) {
  return level === 0 ? 'Trucchetti' : `Livello ${level}`
}

function getSpellOptionLabel(option) {
  return String(option.label ?? option.id).replace(/^Liv\.\s*\d+\s*-\s*/i, '')
}

function groupSpellOptions(options = []) {
  return options.reduce((groups, option) => {
    const level = getOptionLevel(option)

    if (!groups.has(level)) {
      groups.set(level, [])
    }

    groups.get(level).push(option)

    return groups
  }, new Map())
}

function SpellChoicePicker({ requirement, selected, count, onChange }) {
  const groupedOptions = [...groupSpellOptions(requirement.options).entries()]
    .sort(([levelA], [levelB]) => levelA - levelB)

  return (
    <div className="spell-choice-picker">
      {selected.length > 0 && (
        <div className="spell-choice-selected" aria-label="Incantesimi selezionati">
          {selected.map((optionId) => {
            const option = requirement.options.find((item) => item.id === optionId)

            return (
              <button
                key={optionId}
                className="spell-choice-chip"
                type="button"
                onClick={() => onChange(selected.filter((item) => item !== optionId))}
              >
                {getSpellOptionLabel(option ?? { id: optionId, label: optionId })}
              </button>
            )
          })}
        </div>
      )}

      {groupedOptions.map(([level, options]) => (
        <div key={level} className="spell-choice-level">
          <h5>{getSpellLevelLabel(level)}</h5>
          <div className="spell-choice-grid">
            {options.map((option) => {
              const isSelected = selected.includes(option.id)
              const isLocked = !isSelected && selected.length >= count

              return (
                <button
                  key={option.id}
                  className={`creation-skill-choice spell-choice-option ${isSelected ? 'is-on' : ''}`}
                  type="button"
                  disabled={isLocked}
                  onClick={() => onChange(toggleSelected(selected, option.id, count))}
                >
                  <span>{getSpellOptionLabel(option)}</span>
                  <small>{isSelected ? 'Scelto' : getSpellLevelLabel(level)}</small>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function FeatChoicesPanel({ requirements = [], values = {}, onChange }) {
  if (requirements.length === 0) {
    return null
  }

  function updateRequirement(requirement, nextSelected) {
    onChange?.(requirement.id, nextSelected)
  }

  return (
    <div className="feat-choice-panel">
      {requirements.map((requirement) => {
        const selected = values[requirement.id] ?? requirement.selected ?? []
        const count = requirement.count ?? 1

        return (
          <div key={requirement.id} className="feat-choice-group">
            <div className="creation-skill-choice-head">
              <span>{selected.length}/{count}</span>
            </div>
            <h4>{requirement.label}</h4>

            {requirement.options.length === 0 ? (
              <div className="list-empty">Completa prima le scelte precedenti.</div>
            ) : isSpellChoice(requirement) ? (
              <SpellChoicePicker
                requirement={requirement}
                selected={selected}
                count={count}
                onChange={(nextSelected) => updateRequirement(requirement, nextSelected)}
              />
            ) : isSelectChoice(requirement) ? (
              <div className="feat-choice-select-list">
                {Array.from({ length: count }, (_, index) => (
                  <label key={`${requirement.id}-${index}`} className="progression-field">
                    <span>Scelta {index + 1}</span>
                    <select
                      value={selected[index] ?? ''}
                      onChange={(event) => {
                        const nextSelected = [...selected]
                        const value = event.target.value

                        if (!value) {
                          nextSelected.splice(index, 1)
                        } else {
                          nextSelected[index] = value
                        }

                        updateRequirement(
                          requirement,
                          [...new Set(nextSelected.filter(Boolean))].slice(0, count)
                        )
                      }}
                    >
                      <option value="">Scegli opzione</option>
                      {requirement.options.map((option) => (
                        <option
                          key={option.id}
                          value={option.id}
                          disabled={selected.includes(option.id) && selected[index] !== option.id}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            ) : (
              <div className="creation-skill-choice-grid">
                {requirement.options.map((option) => {
                  const isSelected = selected.includes(option.id)
                  const isLocked = !isSelected && selected.length >= count

                  return (
                    <button
                      key={option.id}
                      className={`creation-skill-choice ${isSelected ? 'is-on' : ''}`}
                      type="button"
                      disabled={isLocked}
                      onClick={() => updateRequirement(
                        requirement,
                        toggleSelected(selected, option.id, count)
                      )}
                    >
                      <span>{option.label}</span>
                      <small>{isSelected ? 'Scelta' : ''}</small>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default FeatChoicesPanel
