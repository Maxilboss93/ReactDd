import acidoIcon from '../../assets/magic-icons/acido.svg'
import fulmineIcon from '../../assets/magic-icons/fulmine.svg'
import fuocoIcon from '../../assets/magic-icons/fuoco.svg'
import geloIcon from '../../assets/magic-icons/gelo.svg'
import necroticaIcon from '../../assets/magic-icons/necrotica.svg'
import psichicaIcon from '../../assets/magic-icons/psichica.svg'
import radiosaIcon from '../../assets/magic-icons/radiosa.svg'
import tuonoIcon from '../../assets/magic-icons/tuono.svg'
import velenoIcon from '../../assets/magic-icons/veleno.svg'
import curaIcon from '../../assets/magic-utility-icons/cura.svg'
import naturaIcon from '../../assets/magic-utility-icons/natura.svg'
import ventoIcon from '../../assets/magic-utility-icons/vento.svg'
import abiurazioneIcon from '../../assets/magic-school-icons/abiurazione.svg'
import ammaliamentoIcon from '../../assets/magic-school-icons/ammaliamento.svg'
import divinazioneIcon from '../../assets/magic-school-icons/divinazione.svg'
import evocazioneIcon from '../../assets/magic-school-icons/evocazione.svg'
import illusioneIcon from '../../assets/magic-school-icons/illusione.svg'
import invocazioneIcon from '../../assets/magic-school-icons/invocazione.svg'
import necromanziaIcon from '../../assets/magic-school-icons/necromanzia.svg'
import trasmutazioneIcon from '../../assets/magic-school-icons/trasmutazione.svg'

const MAGIC_ICON_BY_DAMAGE_TYPE = {
  acido: acidoIcon,
  fulmine: fulmineIcon,
  fuoco: fuocoIcon,
  freddo: geloIcon,
  gelo: geloIcon,
  necrotici: necroticaIcon,
  necrotico: necroticaIcon,
  necrotica: necroticaIcon,
  psichici: psichicaIcon,
  psichico: psichicaIcon,
  psichica: psichicaIcon,
  radiosi: radiosaIcon,
  radioso: radiosaIcon,
  radiosa: radiosaIcon,
  tuono: tuonoIcon,
  veleno: velenoIcon,
}

const MAGIC_ICON_BY_SCHOOL = {
  abiurazione: abiurazioneIcon,
  ammaliamento: ammaliamentoIcon,
  divinazione: divinazioneIcon,
  evocazione: evocazioneIcon,
  illusione: illusioneIcon,
  invocazione: invocazioneIcon,
  necromanzia: necromanziaIcon,
  trasmutazione: trasmutazioneIcon,
}

function normalizeMagicKey(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function getSpellIdentityText(spell) {
  return normalizeMagicKey([
    spell?.id,
    spell?.name,
    spell?.school,
  ].filter(Boolean).join(' '))
}

function getUtilityIconSrc(spell) {
  const identity = getSpellIdentityText(spell)

  if (
    spell?.mechanics?.heals_or_temp_hp ||
    /\b(cura|guarigione|guaritrice|ristorare|rinascita|resurrezione)\b/.test(identity) ||
    identity.includes('salvare-i-morenti') ||
    identity.includes('aura-di-vitalita') ||
    identity.includes('faro-di-speranza') ||
    identity === 'aiuto aiuto abiurazione' ||
    identity === 'eroismo eroismo ammaliamento'
  ) {
    return curaIcon
  }

  if (
    /\b(natura|animali|animale|vegetali|vegetale|bestia|boschive|selvatic)\b/.test(identity) ||
    identity.includes('crescita-vegetale') ||
    identity.includes('parlare-con-gli-animali') ||
    identity.includes('parlare-con-i-vegetali') ||
    identity.includes('comunione-con-la-natura') ||
    identity.includes('richiama-bestia')
  ) {
    return naturaIcon
  }

  if (
    /\b(vento|aria|volare|volo|levitazione)\b/.test(identity) ||
    identity.includes('caduta-morbida') ||
    identity.includes('forma-gassosa') ||
    identity.includes('nube-di-nebbia') ||
    identity.includes('folata-di-vento')
  ) {
    return ventoIcon
  }

  return null
}

export function getMagicIconSrc(damageTypes = [], spell = null) {
  const damageIcon = damageTypes
    .map((damageType) => MAGIC_ICON_BY_DAMAGE_TYPE[normalizeMagicKey(damageType)])
    .find(Boolean)
  const utilityIcon = getUtilityIconSrc(spell)
  const schoolIcon = MAGIC_ICON_BY_SCHOOL[normalizeMagicKey(spell?.school)]

  return damageIcon ?? utilityIcon ?? schoolIcon ?? null
}

function MagicIcon({ damageTypes = [], spell = null, size = 'md', className = '' }) {
  const src = getMagicIconSrc(damageTypes, spell)
  const title = damageTypes.length > 0
    ? damageTypes.filter(Boolean).join(', ')
    : spell?.school

  if (!src) {
    return null
  }

  return (
    <span className={`magic-icon magic-icon--${size} ${className}`.trim()} aria-hidden="true">
      <img src={src} alt="" title={title} />
    </span>
  )
}

export default MagicIcon
