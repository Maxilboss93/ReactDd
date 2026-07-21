import rangedWeaponIcon from '../../assets/equipment-icons/arma-distanza.svg'
import thrownWeaponIcon from '../../assets/equipment-icons/arma-lancio.svg'
import meleeWeaponIcon from '../../assets/equipment-icons/arma-mischia.svg'
import lightArmorIcon from '../../assets/equipment-icons/armatura-leggera.svg'
import mediumArmorIcon from '../../assets/equipment-icons/armatura-media.svg'
import heavyArmorIcon from '../../assets/equipment-icons/armatura-pesante.svg'
import consumableIcon from '../../assets/equipment-icons/consumabile.svg'
import adventuringGearIcon from '../../assets/equipment-icons/equipaggiamento-avventura.svg'
import focusIcon from '../../assets/equipment-icons/focus.svg'
import magicItemIcon from '../../assets/equipment-icons/oggetto-magico.svg'
import storyItemIcon from '../../assets/equipment-icons/oggetto-storia.svg'
import shieldIcon from '../../assets/equipment-icons/scudo.svg'
import toolIcon from '../../assets/equipment-icons/strumento.svg'
import treasureIcon from '../../assets/equipment-icons/tesoro-monete.svg'

const ICON_BY_GROUP = {
  weapons: meleeWeaponIcon,
  armor: mediumArmorIcon,
  tools: toolIcon,
  adventuringGear: adventuringGearIcon,
  magicItems: magicItemIcon,
  consumables: consumableIcon,
  storyItems: storyItemIcon,
  wishlist: treasureIcon,
  currency: treasureIcon,
}

function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function hasThrownProperty(item) {
  return (item?.stats?.properties ?? []).some((property) => {
    return normalize(property).includes('lancio')
  })
}

export function getEquipmentIconSrc(groupId, item = null) {
  const stats = item?.stats ?? {}
  const statsType = normalize(stats.type)
  const category = normalize(stats.category)
  const kind = normalize(stats.kind)
  const itemId = normalize(item?.itemId ?? item?.id ?? '')
  const itemName = normalize(item?.name ?? '')

  if (groupId === 'currency') {
    return treasureIcon
  }

  if (statsType === 'shield') {
    return shieldIcon
  }

  if (statsType === 'armor') {
    if (category.includes('leggera')) return lightArmorIcon
    if (category.includes('pesante')) return heavyArmorIcon
    return mediumArmorIcon
  }

  if (statsType === 'weapon') {
    if (hasThrownProperty(item)) return thrownWeaponIcon
    if (kind.includes('distanza')) return rangedWeaponIcon
    return meleeWeaponIcon
  }

  if (statsType === 'tool' || groupId === 'tools') {
    return toolIcon
  }

  if (item?.consumable || statsType === 'consumable' || groupId === 'consumables') {
    return consumableIcon
  }

  if (item?.catalog === 'magicItems' || groupId === 'magicItems') {
    return magicItemIcon
  }

  if (groupId === 'storyItems') {
    return storyItemIcon
  }

  if (
    item?.equippedSlot === 'focus' ||
    itemId.includes('focus') ||
    itemName.includes('focus') ||
    itemName.includes('simbolo sacro') ||
    itemName.includes('bacchetta') ||
    itemName.includes('verga') ||
    itemName.includes('bastone')
  ) {
    return focusIcon
  }

  return ICON_BY_GROUP[groupId] ?? adventuringGearIcon
}

function EquipmentIcon({ groupId, item = null, size = 'md', className = '' }) {
  const src = getEquipmentIconSrc(groupId, item)
  const classes = ['equipment-icon', `equipment-icon--${size}`, className]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={classes} aria-hidden="true">
      <img src={src} alt="" />
    </span>
  )
}

export default EquipmentIcon
