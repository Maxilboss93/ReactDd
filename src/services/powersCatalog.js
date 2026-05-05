import powersCatalog from '../../generated/catalogo_powers_tutte_classi_dnd2024_it.json'

export function findPowerById(id) {
  return powersCatalog.powers.find((power) => power.id === id)
}