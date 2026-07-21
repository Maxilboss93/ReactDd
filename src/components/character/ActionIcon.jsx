import azioneIcon from '../../assets/action-icons/azione.svg'
import azioneAttaccoIcon from '../../assets/action-icons/azione-attacco.svg'
import azioneBonusIcon from '../../assets/action-icons/azione-bonus.svg'
import duranteRiposoIcon from '../../assets/action-icons/durante-riposo.svg'
import parteAttaccoIcon from '../../assets/action-icons/parte-attacco.svg'
import passivaIcon from '../../assets/action-icons/passiva.svg'
import reazioneIcon from '../../assets/action-icons/reazione.svg'
import varieIcon from '../../assets/action-icons/varie.svg'

function normalizeActionKey(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function getActionIconSrc(actionType) {
  const normalized = normalizeActionKey(actionType)

  if (!normalized || normalized === 'nessuna') {
    return passivaIcon
  }

  if (normalized.includes('azione bonus')) {
    return azioneBonusIcon
  }

  if (normalized.includes('reazione')) {
    return reazioneIcon
  }

  if (normalized.includes('riposo')) {
    return duranteRiposoIcon
  }

  if (normalized.includes('azione di attacco')) {
    return azioneAttaccoIcon
  }

  if (normalized.includes('attacco furtivo') || normalized.includes('raffica') || normalized.includes('parte di un attacco')) {
    return parteAttaccoIcon
  }

  if (normalized.includes('azione')) {
    return azioneIcon
  }

  return varieIcon
}

function ActionIcon({ actionType, size = 'sm', className = '' }) {
  const src = getActionIconSrc(actionType)

  return (
    <span className={`action-icon action-icon--${size} ${className}`.trim()} aria-hidden="true">
      <img src={src} alt="" title={actionType || 'Passiva'} />
    </span>
  )
}

export default ActionIcon
