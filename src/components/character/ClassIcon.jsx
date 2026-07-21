import barbaroIcon from '../../assets/class-icons/barbaro.svg'
import bardoIcon from '../../assets/class-icons/bardo.svg'
import chiericoIcon from '../../assets/class-icons/chierico.svg'
import dragoIcon from '../../assets/class-icons/drago.svg'
import druidoIcon from '../../assets/class-icons/druido.svg'
import guerrieroIcon from '../../assets/class-icons/guerriero.svg'
import ladroIcon from '../../assets/class-icons/ladro.svg'
import magoIcon from '../../assets/class-icons/mago.svg'
import monacoIcon from '../../assets/class-icons/monaco.svg'
import paladinoIcon from '../../assets/class-icons/paladino.svg'
import rangerIcon from '../../assets/class-icons/ranger.svg'
import stregoneIcon from '../../assets/class-icons/stregone.svg'
import warlockIcon from '../../assets/class-icons/warlock.svg'

const CLASS_ICON_BY_KEY = {
  barbaro: barbaroIcon,
  barbarian: barbaroIcon,
  bardo: bardoIcon,
  bard: bardoIcon,
  chierico: chiericoIcon,
  cleric: chiericoIcon,
  druido: druidoIcon,
  druid: druidoIcon,
  guerriero: guerrieroIcon,
  fighter: guerrieroIcon,
  ladro: ladroIcon,
  rogue: ladroIcon,
  mago: magoIcon,
  wizard: magoIcon,
  monaco: monacoIcon,
  monk: monacoIcon,
  paladino: paladinoIcon,
  paladin: paladinoIcon,
  ranger: rangerIcon,
  stregone: stregoneIcon,
  sorcerer: stregoneIcon,
  warlock: warlockIcon,
}

function normalizeIconKey(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function getPowerClassLabel(power) {
  const dragonText = [
    power?.id,
    power?.name,
    power?.source,
    power?.subsource,
  ].filter(Boolean).join(' ')

  if (normalizeIconKey(dragonText).includes('draconic') || normalizeIconKey(dragonText).includes('draconica') || normalizeIconKey(dragonText).includes('drago')) {
    return 'Drago'
  }

  return power?.source
}

export function getClassIconSrc(label, power = null) {
  const effectiveLabel = power ? getPowerClassLabel(power) : label
  const normalized = normalizeIconKey(effectiveLabel)

  if (normalized.includes('drago')) {
    return dragoIcon
  }

  const match = Object.entries(CLASS_ICON_BY_KEY).find(([key]) => {
    return normalized === key || normalized.includes(key)
  })

  return match?.[1] ?? null
}

function ClassIcon({ classLabel, power = null, size = 'md', className = '' }) {
  const src = getClassIconSrc(classLabel, power)
  const label = power ? getPowerClassLabel(power) : classLabel

  if (!src) {
    return null
  }

  return (
    <span className={`class-icon class-icon--${size} ${className}`.trim()} aria-hidden="true">
      <img src={src} alt="" title={label ? `${label}` : undefined} />
    </span>
  )
}

export default ClassIcon
