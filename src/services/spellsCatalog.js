import spellsCatalog from '../../generated/dnd2024_spells_it.json'

export function findSpellById(id) {
  return spellsCatalog.spells.find((spell) => spell.id === id)
}