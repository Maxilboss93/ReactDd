import attaccoIncantesimoIcon from '../../assets/stat-icons/attacco-incantesimo.svg'
import classeArmaturaIcon from '../../assets/stat-icons/classe-armatura.svg'
import classeDifficoltaIcon from '../../assets/stat-icons/classe-difficolta.svg'
import competenzaIcon from '../../assets/stat-icons/competenza.svg'
import dadoVitaIcon from '../../assets/stat-icons/dado-vita.svg'
import iniziativaIcon from '../../assets/stat-icons/iniziativa.svg'
import puntiFeritaIcon from '../../assets/stat-icons/punti-ferita.svg'
import tiroSalvezzaIcon from '../../assets/stat-icons/tiro-salvezza.svg'
import velocitaIcon from '../../assets/stat-icons/velocita.svg'

const STAT_ICON_BY_KEY = {
  ac: classeArmaturaIcon,
  armor_class: classeArmaturaIcon,
  classe_armatura: classeArmaturaIcon,
  hp: puntiFeritaIcon,
  punti_ferita: puntiFeritaIcon,
  speed: velocitaIcon,
  velocita: velocitaIcon,
  initiative: iniziativaIcon,
  iniziativa: iniziativaIcon,
  proficiency: competenzaIcon,
  competenza: competenzaIcon,
  hit_dice: dadoVitaIcon,
  dado_vita: dadoVitaIcon,
  martial_arts_die: dadoVitaIcon,
  sneak_attack_dice: dadoVitaIcon,
  saving_throw: tiroSalvezzaIcon,
  tiro_salvezza: tiroSalvezzaIcon,
  spell_attack: attaccoIncantesimoIcon,
  attacco_incantesimo: attaccoIncantesimoIcon,
  spell_dc: classeDifficoltaIcon,
  classe_difficolta: classeDifficoltaIcon,
}

function normalizeStatKey(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function getStatIconSrc(statKey) {
  const normalized = normalizeStatKey(statKey)

  if (STAT_ICON_BY_KEY[normalized]) {
    return STAT_ICON_BY_KEY[normalized]
  }

  if (normalized.includes('compet')) return competenzaIcon
  if (normalized.includes('iniziativa')) return iniziativaIcon
  if (normalized.includes('vel')) return velocitaIcon
  if (normalized.includes('dado') || normalized.includes('dice')) return dadoVitaIcon
  if (normalized.includes('salvezza')) return tiroSalvezzaIcon
  if (normalized.includes('difficolta') || normalized.includes('dc')) return classeDifficoltaIcon
  if (normalized.includes('attacco') && normalized.includes('incantesimo')) return attaccoIncantesimoIcon

  return null
}

function StatIcon({ statKey, size = 'md', className = '' }) {
  const src = getStatIconSrc(statKey)

  if (!src) {
    return null
  }

  return (
    <span className={`stat-icon stat-icon--${size} ${className}`.trim()} aria-hidden="true">
      <img src={src} alt="" title={statKey} />
    </span>
  )
}

export default StatIcon
