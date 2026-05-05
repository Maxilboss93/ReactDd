import { useEffect, useMemo, useState } from 'react'

import SectionCard from '../../general/card/SectionCard.jsx'

const EQUIPMENT_GROUPS = [
  { id: 'weapons', title: 'Armi' },
  { id: 'armor', title: 'Armature e scudi' },
  { id: 'tools', title: 'Strumenti' },
  { id: 'adventuringGear', title: 'Equipaggiamento' },
  { id: 'magicItems', title: 'Oggetti magici' },
  { id: 'consumables', title: 'Consumabili' },
  { id: 'storyItems', title: 'Oggetti di storia' },
  { id: 'wishlist', title: 'Da trovare / comprare' },
]

function getItemKey(item) {
  return item.id ?? item.name
}

function isTrackableItem(item) {
  return item.consumable || item.recoverable
}

function getInitialTracker(equipment) {
  return EQUIPMENT_GROUPS.reduce((tracker, group) => {
    const items = equipment[group.id] ?? []

    items.forEach((item) => {
      if (!isTrackableItem(item)) return

      tracker[getItemKey(item)] = {
        available: item.quantity ?? 0,
        spent: 0,
      }
    })

    return tracker
  }, {})
}

function EquipmentItem({ item, tracker, onUse, onRecover, onAdd, onDelete }) {
  const itemKey = getItemKey(item)
  const isTrackable = isTrackableItem(item)
  const available = tracker?.available ?? item.quantity ?? 0
  const spent = tracker?.spent ?? 0
  const quantityLabel = isTrackable ? available : item.quantity

  return (
    <article className={`equipment-item ${isTrackable && available === 0 ? 'equipment-item--empty' : ''}`}>
      <div className="equipment-item__header">
        <strong className="equipment-item__name">{item.name}</strong>

        {quantityLabel > 1 && (
          <span className="equipment-item__quantity">x{quantityLabel}</span>
        )}

        {isTrackable && quantityLabel === 0 && (
          <span className="equipment-item__quantity">Esaurito</span>
        )}
      </div>

      {item.description && (
        <p className="equipment-item__text">{item.description}</p>
      )}

      {item.notes && (
        <p className="equipment-item__notes">{item.notes}</p>
      )}

      {isTrackable && (
        <div className="equipment-item__tracker">
          <div className="equipment-item__status">
            <span>Disponibili: {available}</span>

            {item.recoverable && (
              <span>Da recuperare: {spent}</span>
            )}
          </div>

          <div className="equipment-item__actions">
            <button
              className="equipment-item__btn"
              type="button"
              disabled={available <= 0}
              onClick={() => onUse(itemKey, item)}
            >
              {item.recoverable ? 'Usa' : 'Consuma'}
            </button>

            {item.recoverable && (
              <button
                className="equipment-item__btn"
                type="button"
                disabled={spent <= 0}
                onClick={() => onRecover(itemKey)}
              >
                Recupera
              </button>
            )}

            <button
              className="equipment-item__btn"
              type="button"
              onClick={() => onAdd(itemKey)}
            >
              Aggiungi
            </button>
          </div>
        </div>
      )}

      <button
        className="equipment-item__delete"
        type="button"
        onClick={() => onDelete(itemKey, item)}
      >
        Elimina dall'inventario
      </button>
    </article>
  )
}

function CurrencyRow({ currency }) {
  const coins = [
    { id: 'cp', label: 'MR' },
    { id: 'sp', label: 'MA' },
    { id: 'ep', label: 'ME' },
    { id: 'gp', label: 'MO' },
    { id: 'pp', label: 'MP' },
  ]

  return (
    <div className="currency-row">
      {coins.map((coin) => (
        <div key={coin.id} className="currency-pill">
          <span>{coin.label}</span>
          <strong>{currency?.[coin.id] ?? 0}</strong>
        </div>
      ))}
    </div>
  )
}

function EquipmentSection({ character }) {
  const equipment = character?.equipment ?? {}
  const currency = equipment.currency ?? {}
  const storageKey = `equipment-tracker:${character?.id ?? 'unknown'}`
  const initialTracker = useMemo(() => getInitialTracker(equipment), [equipment])
  const [tracker, setTracker] = useState(initialTracker)
  const hasAnyItems = EQUIPMENT_GROUPS.some(
    (group) =>
      (equipment[group.id] ?? []).some(
        (item) => !tracker[getItemKey(item)]?.deleted
      )
  )

  useEffect(() => {
    const savedTracker = JSON.parse(localStorage.getItem(storageKey) ?? '{}')

    setTracker({
      ...initialTracker,
      ...savedTracker,
    })
  }, [initialTracker, storageKey])

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(tracker))
  }, [storageKey, tracker])

  function updateTracker(itemKey, updater) {
    setTracker((prev) => {
      const current = prev[itemKey] ?? { available: 0, spent: 0 }

      return {
        ...prev,
        [itemKey]: updater(current),
      }
    })
  }

  function useItem(itemKey, item) {
    updateTracker(itemKey, (current) => ({
      available: Math.max(0, current.available - 1),
      spent: item.recoverable ? current.spent + 1 : current.spent,
    }))
  }

  function recoverItem(itemKey) {
    updateTracker(itemKey, (current) => ({
      available: current.available + 1,
      spent: Math.max(0, current.spent - 1),
    }))
  }

  function addItem(itemKey) {
    updateTracker(itemKey, (current) => ({
      ...current,
      available: current.available + 1,
      deleted: false,
    }))
  }

  function deleteItem(itemKey, item) {
    const confirmed = window.confirm(
      `Eliminare ${item.name} dall'inventario?`
    )

    if (!confirmed) return

    updateTracker(itemKey, (current) => ({
      available: current.available ?? item.quantity ?? 0,
      spent: current.spent ?? 0,
      deleted: true,
    }))
  }

  return (
    <div className="equipment-section">
      <SectionCard title="Monete">
        <CurrencyRow currency={currency} />
      </SectionCard>

      {EQUIPMENT_GROUPS.map((group) => {
        const items = (equipment[group.id] ?? []).filter(
          (item) => !tracker[getItemKey(item)]?.deleted
        )

        if (items.length === 0) {
          return null
        }

        return (
          <SectionCard key={group.id} title={group.title}>
            <div className="equipment-list">
              {items.map((item) => (
                <EquipmentItem
                  key={getItemKey(item)}
                  item={item}
                  tracker={tracker[getItemKey(item)]}
                  onUse={useItem}
                  onRecover={recoverItem}
                  onAdd={addItem}
                  onDelete={deleteItem}
                />
              ))}
            </div>
          </SectionCard>
        )
      })}

      {!hasAnyItems && (
        <SectionCard title="Inventario">
          <div className="list-empty">
            Nessun equipaggiamento registrato.
          </div>
        </SectionCard>
      )}
    </div>
  )
}

export default EquipmentSection
