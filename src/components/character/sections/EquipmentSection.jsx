import { useEffect, useMemo, useState } from 'react'

import SectionCard from '../../general/card/SectionCard.jsx'
import {
  INVENTORY_GROUP_OPTIONS,
  createCustomInventoryItem,
  createInventoryItemFromCatalog,
  getInventoryCatalogOptions,
  syncCharacterEquipmentDerivedStats,
} from '../../../services/equipmentService.js'

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

const EQUIP_SLOTS = {
  weapons: [
    { id: 'main_hand', label: 'Arma principale' },
    { id: 'off_hand', label: 'Arma secondaria' },
    { id: 'two_hands', label: 'Due mani' },
  ],
  armor: [
    { id: 'armor', label: 'Armatura' },
    { id: 'shield', label: 'Scudo' },
  ],
  adventuringGear: [
    { id: 'focus', label: 'Focus' },
  ],
  magicItems: [
    { id: 'attuned', label: 'Sintonizzato' },
    { id: 'worn', label: 'Indossato' },
  ],
}

const DEFAULT_CATALOG_FORM = {
  itemKey: '',
  quantity: 1,
  sourceLabel: 'Trovato in avventura',
}

const DEFAULT_CUSTOM_FORM = {
  name: '',
  group: 'weapons',
  quantity: 1,
  sourceLabel: 'Oggetto del Master',
  notes: '',
  cost: '',
  weight: '',
  weaponCategory: 'semplice',
  weaponKind: 'mischia',
  damageDice: '1d4',
  damageType: 'perforante',
  properties: 'accurata, versatile',
  mastery: '',
  abilityMode: 'dex_or_str',
  attackBonus: 0,
  damageBonus: 0,
  armorKind: 'armor',
  armorCategory: 'leggera',
  armorClass: '',
  armorClassBonus: 0,
  strengthRequirement: '',
  stealthDisadvantage: false,
  toolCategory: '',
  toolAbility: '',
  consumable: false,
  recoverable: false,
}

function getItemKey(item) {
  return item.id ?? item.name
}

function isTrackableItem(item) {
  return item.consumable || item.recoverable
}

function getEquipmentFacts(item) {
  const stats = item.stats ?? {}
  const facts = []

  if (stats.type === 'weapon') {
    facts.push(
      { label: 'Danno', value: stats.damage },
      { label: 'Tipo', value: stats.kind },
      { label: 'Competenza', value: stats.category },
      { label: 'Maestria', value: stats.mastery },
      { label: 'Caratt.', value: getAbilityModeLabel(stats.ability) },
      { label: 'Colpire', value: formatSignedBonus(stats.attackBonus) },
      { label: 'Danni', value: formatSignedBonus(stats.damageBonus) },
      { label: 'Proprieta', value: (stats.properties ?? []).join(', ') }
    )
  }

  if (stats.type === 'armor') {
    facts.push(
      { label: 'CA', value: stats.armorClass },
      { label: 'Categoria', value: stats.category },
      { label: 'FOR', value: stats.strengthRequirement },
      { label: 'Furtivita', value: stats.stealthDisadvantage ? 'Svantaggio' : '' }
    )
  }

  if (stats.type === 'shield') {
    facts.push(
      { label: 'CA', value: stats.armorClassBonus ? `+${stats.armorClassBonus}` : '' },
      { label: 'Categoria', value: stats.category },
      { label: 'Equip.', value: stats.equipAction }
    )
  }

  if (stats.type === 'tool') {
    facts.push(
      { label: 'Categoria', value: stats.category },
      { label: 'Caratteristica', value: stats.ability }
    )
  }

  if (stats.type === 'gear' || stats.type === 'consumable') {
    facts.push({ label: 'Tipo', value: stats.category })
  }

  facts.push(
    { label: 'Costo', value: item.cost },
    { label: 'Peso', value: item.weight },
    { label: 'Origine', value: item.description }
  )

  return facts.filter((fact) => fact.value !== null && fact.value !== undefined && fact.value !== '')
}

function getAbilityModeLabel(mode) {
  const labels = {
    automatic: 'Automatica',
    str: 'FOR',
    dex: 'DES',
    dex_or_str: 'FOR/DES migliore',
  }

  return labels[mode] ?? mode
}

function formatSignedBonus(value) {
  const number = Number(value)

  if (!number) {
    return ''
  }

  return number > 0 ? `+${number}` : `${number}`
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

function getSlotLabel(slot) {
  return Object.values(EQUIP_SLOTS)
    .flat()
    .find((option) => option.id === slot)?.label ?? slot
}

function getSlotsForItem(groupId, item) {
  const slots = EQUIP_SLOTS[groupId] ?? []
  const statsType = item.stats?.type

  if (groupId === 'armor') {
    return statsType === 'shield'
      ? slots.filter((slot) => slot.id === 'shield')
      : slots.filter((slot) => slot.id === 'armor')
  }

  return slots
}

function isSlotExclusive(groupId, slot) {
  return Boolean(slot) && ['weapons', 'armor', 'adventuringGear', 'magicItems'].includes(groupId)
}

function shouldClearSlot(groupId, currentSlot, nextSlot) {
  if (!currentSlot || !nextSlot) {
    return false
  }

  if (groupId === 'weapons') {
    if (nextSlot === 'two_hands') {
      return ['main_hand', 'off_hand', 'two_hands'].includes(currentSlot)
    }

    if (currentSlot === 'two_hands') {
      return true
    }

    return currentSlot === nextSlot
  }

  return currentSlot === nextSlot
}

function EquipmentItem({
  groupId,
  item,
  tracker,
  onUse,
  onRecover,
  onAdd,
  onDelete,
  onEquip,
  onUnequip,
}) {
  const itemKey = getItemKey(item)
  const isTrackable = isTrackableItem(item)
  const available = tracker?.available ?? item.quantity ?? 0
  const spent = tracker?.spent ?? 0
  const quantityLabel = isTrackable ? available : item.quantity
  const facts = getEquipmentFacts(item)
  const slots = getSlotsForItem(groupId, item)

  return (
    <article className={`equipment-item ${isTrackable && available === 0 ? 'equipment-item--empty' : ''}`}>
      <div className="equipment-item__header">
        <strong className="equipment-item__name">{item.name}</strong>

        <div className="equipment-item__badges">
          {item.custom && (
            <span className="equipment-item__quantity">Custom</span>
          )}

          {item.equipped && (
            <span className="equipment-item__quantity">Equip.: {getSlotLabel(item.equippedSlot)}</span>
          )}

          {quantityLabel > 1 && (
            <span className="equipment-item__quantity">x{quantityLabel}</span>
          )}

          {isTrackable && quantityLabel === 0 && (
            <span className="equipment-item__quantity">Esaurito</span>
          )}
        </div>
      </div>

      {item.description && (
        <p className="equipment-item__text">{item.description}</p>
      )}

      {facts.length > 0 && (
        <div className="equipment-item__facts">
          {facts.map((fact) => (
            <span key={`${fact.label}-${fact.value}`}>
              <small>{fact.label}</small>
              <strong>{fact.value}</strong>
            </span>
          ))}
        </div>
      )}

      {item.notes && (
        <p className="equipment-item__notes">{item.notes}</p>
      )}

      {slots.length > 0 && (
        <div className="equipment-item__equip">
          {slots.map((slot) => (
            <button
              key={slot.id}
              className="equipment-item__btn"
              type="button"
              disabled={item.equipped && item.equippedSlot === slot.id}
              onClick={() => onEquip(groupId, itemKey, slot.id)}
            >
              {slot.label}
            </button>
          ))}

          {item.equipped && (
            <button
              className="equipment-item__btn"
              type="button"
              onClick={() => onUnequip(groupId, itemKey)}
            >
              Riponi
            </button>
          )}
        </div>
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
        onClick={() => onDelete(groupId, itemKey, item)}
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

function InventoryManager({
  catalogOptions,
  catalogForm,
  customForm,
  mode,
  setMode,
  onCatalogChange,
  onCustomChange,
  onAddCatalog,
  onAddCustom,
}) {
  const selectedCatalogItem = catalogOptions.find((item) => item.key === catalogForm.itemKey)

  return (
    <SectionCard title="Gestione inventario">
      <div className="equipment-manager">
        <div className="equipment-manager__tabs">
          <button
            className={`equipment-manager__tab ${mode === 'catalog' ? 'is-active' : ''}`}
            type="button"
            onClick={() => setMode('catalog')}
          >
            + Catalogo
          </button>
          <button
            className={`equipment-manager__tab ${mode === 'custom' ? 'is-active' : ''}`}
            type="button"
            onClick={() => setMode('custom')}
          >
            + Personalizzato
          </button>
        </div>

        {mode === 'catalog' && (
          <div className="equipment-form">
            <label className="equipment-field equipment-field--wide">
              <span>Oggetto</span>
              <select
                value={catalogForm.itemKey}
                onChange={(event) => onCatalogChange('itemKey', event.target.value)}
              >
                <option value="">Scegli dal catalogo</option>
                {catalogOptions.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.catalogLabel} - {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="equipment-field">
              <span>Quantita</span>
              <input
                type="number"
                min="1"
                value={catalogForm.quantity}
                onChange={(event) => onCatalogChange('quantity', event.target.value)}
              />
            </label>

            <label className="equipment-field equipment-field--wide">
              <span>Origine</span>
              <input
                value={catalogForm.sourceLabel}
                onChange={(event) => onCatalogChange('sourceLabel', event.target.value)}
              />
            </label>

            {selectedCatalogItem && (
              <div className="equipment-manager__hint">
                {selectedCatalogItem.cost || 'Costo non indicato'} - {selectedCatalogItem.weight || 'Peso non indicato'}
              </div>
            )}

            <button
              className="equipment-manager__submit"
              type="button"
              disabled={!catalogForm.itemKey}
              onClick={onAddCatalog}
            >
              Aggiungi all'inventario
            </button>
          </div>
        )}

        {mode === 'custom' && (
          <div className="equipment-form">
            <label className="equipment-field equipment-field--wide">
              <span>Nome</span>
              <input
                value={customForm.name}
                placeholder="Pugnale a catena"
                onChange={(event) => onCustomChange('name', event.target.value)}
              />
            </label>

            <label className="equipment-field">
              <span>Tipo</span>
              <select
                value={customForm.group}
                onChange={(event) => onCustomChange('group', event.target.value)}
              >
                {INVENTORY_GROUP_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="equipment-field">
              <span>Quantita</span>
              <input
                type="number"
                min="1"
                value={customForm.quantity}
                onChange={(event) => onCustomChange('quantity', event.target.value)}
              />
            </label>

            {customForm.group === 'weapons' && (
              <>
                <label className="equipment-field">
                  <span>Danno</span>
                  <input
                    value={customForm.damageDice}
                    onChange={(event) => onCustomChange('damageDice', event.target.value)}
                  />
                </label>

                <label className="equipment-field">
                  <span>Tipo danno</span>
                  <input
                    value={customForm.damageType}
                    onChange={(event) => onCustomChange('damageType', event.target.value)}
                  />
                </label>

                <label className="equipment-field">
                  <span>Categoria</span>
                  <select
                    value={customForm.weaponCategory}
                    onChange={(event) => onCustomChange('weaponCategory', event.target.value)}
                  >
                    <option value="semplice">Semplice</option>
                    <option value="guerra">Da guerra</option>
                    <option value="improvvisata">Improvvisata</option>
                  </select>
                </label>

                <label className="equipment-field">
                  <span>Uso</span>
                  <select
                    value={customForm.weaponKind}
                    onChange={(event) => onCustomChange('weaponKind', event.target.value)}
                  >
                    <option value="mischia">Mischia</option>
                    <option value="distanza">Distanza</option>
                  </select>
                </label>

                <label className="equipment-field">
                  <span>Caratt.</span>
                  <select
                    value={customForm.abilityMode}
                    onChange={(event) => onCustomChange('abilityMode', event.target.value)}
                  >
                    <option value="automatic">Automatica</option>
                    <option value="str">FOR</option>
                    <option value="dex">DES</option>
                    <option value="dex_or_str">FOR/DES migliore</option>
                  </select>
                </label>

                <label className="equipment-field">
                  <span>Bonus colpire</span>
                  <input
                    type="number"
                    value={customForm.attackBonus}
                    onChange={(event) => onCustomChange('attackBonus', event.target.value)}
                  />
                </label>

                <label className="equipment-field">
                  <span>Bonus danni</span>
                  <input
                    type="number"
                    value={customForm.damageBonus}
                    onChange={(event) => onCustomChange('damageBonus', event.target.value)}
                  />
                </label>

                <label className="equipment-field equipment-field--wide">
                  <span>Proprieta</span>
                  <input
                    value={customForm.properties}
                    onChange={(event) => onCustomChange('properties', event.target.value)}
                  />
                </label>
              </>
            )}

            {customForm.group === 'armor' && (
              <>
                <label className="equipment-field">
                  <span>Sottotipo</span>
                  <select
                    value={customForm.armorKind}
                    onChange={(event) => onCustomChange('armorKind', event.target.value)}
                  >
                    <option value="armor">Armatura</option>
                    <option value="shield">Scudo</option>
                  </select>
                </label>

                <label className="equipment-field">
                  <span>CA</span>
                  <input
                    value={customForm.armorClass}
                    onChange={(event) => onCustomChange('armorClass', event.target.value)}
                  />
                </label>

                <label className="equipment-field">
                  <span>Bonus CA</span>
                  <input
                    type="number"
                    value={customForm.armorClassBonus}
                    onChange={(event) => onCustomChange('armorClassBonus', event.target.value)}
                  />
                </label>
              </>
            )}

            <label className="equipment-field equipment-field--wide">
              <span>Origine</span>
              <input
                value={customForm.sourceLabel}
                onChange={(event) => onCustomChange('sourceLabel', event.target.value)}
              />
            </label>

            <label className="equipment-field equipment-field--wide">
              <span>Note</span>
              <textarea
                value={customForm.notes}
                onChange={(event) => onCustomChange('notes', event.target.value)}
              />
            </label>

            <button
              className="equipment-manager__submit"
              type="button"
              disabled={!customForm.name.trim()}
              onClick={onAddCustom}
            >
              Crea e aggiungi
            </button>
          </div>
        )}
      </div>
    </SectionCard>
  )
}

function EquipmentSection({ character, onCharacterChange }) {
  const equipment = character?.equipment ?? {}
  const currency = equipment.currency ?? {}
  const storageKey = `equipment-tracker:${character?.id ?? 'unknown'}`
  const initialTracker = useMemo(() => getInitialTracker(equipment), [equipment])
  const catalogOptions = useMemo(() => getInventoryCatalogOptions(), [])
  const [tracker, setTracker] = useState(initialTracker)
  const [managerMode, setManagerMode] = useState('catalog')
  const [catalogForm, setCatalogForm] = useState(() => ({
    ...DEFAULT_CATALOG_FORM,
    itemKey: catalogOptions[0]?.key ?? '',
  }))
  const [customForm, setCustomForm] = useState(DEFAULT_CUSTOM_FORM)
  const hasAnyItems = EQUIPMENT_GROUPS.some(
    (group) => (equipment[group.id] ?? []).length > 0
  )

  useEffect(() => {
    let savedTracker = {}

    try {
      savedTracker = JSON.parse(localStorage.getItem(storageKey) ?? '{}')
    } catch {
      savedTracker = {}
    }

    setTracker({
      ...initialTracker,
      ...savedTracker,
    })
  }, [initialTracker, storageKey])

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(tracker))
  }, [storageKey, tracker])

  function updateEquipment(nextEquipment) {
    onCharacterChange?.(syncCharacterEquipmentDerivedStats({
      ...character,
      equipment: nextEquipment,
    }, { force: true }))
  }

  function updateGroup(groupId, updater) {
    const currentItems = equipment[groupId] ?? []

    updateEquipment({
      ...equipment,
      [groupId]: updater(currentItems),
    })
  }

  function addInventoryItem(item) {
    if (!item) return

    const groupId = item.inventoryGroup ?? 'adventuringGear'

    updateGroup(groupId, (items) => [...items, item])
  }

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

  function addTrackedItem(itemKey) {
    updateTracker(itemKey, (current) => ({
      ...current,
      available: current.available + 1,
      deleted: false,
    }))
  }

  function deleteItem(groupId, itemKey, item) {
    const confirmed = window.confirm(
      `Eliminare ${item.name} dall'inventario?`
    )

    if (!confirmed) return

    updateGroup(groupId, (items) => items.filter((candidate) => getItemKey(candidate) !== itemKey))
  }

  function equipItem(groupId, itemKey, slot) {
    updateGroup(groupId, (items) => items.map((item) => {
      const currentKey = getItemKey(item)

      if (currentKey === itemKey) {
        return {
          ...item,
          equipped: true,
          equippedSlot: slot,
        }
      }

      if (isSlotExclusive(groupId, slot) && shouldClearSlot(groupId, item.equippedSlot, slot)) {
        return {
          ...item,
          equipped: false,
          equippedSlot: null,
        }
      }

      return item
    }))
  }

  function unequipItem(groupId, itemKey) {
    updateGroup(groupId, (items) => items.map((item) => {
      return getItemKey(item) === itemKey
        ? { ...item, equipped: false, equippedSlot: null }
        : item
    }))
  }

  function updateCatalogForm(field, value) {
    setCatalogForm((current) => ({
      ...current,
      [field]: field === 'quantity' ? Math.max(1, Number(value) || 1) : value,
    }))
  }

  function updateCustomForm(field, value) {
    setCustomForm((current) => ({
      ...current,
      [field]: ['quantity', 'attackBonus', 'damageBonus', 'armorClassBonus'].includes(field)
        ? Number(value)
        : value,
    }))
  }

  function addFromCatalog() {
    const item = createInventoryItemFromCatalog(catalogForm)

    addInventoryItem(item)
  }

  function addCustomItem() {
    const item = createCustomInventoryItem(customForm)

    addInventoryItem(item)
    setCustomForm(DEFAULT_CUSTOM_FORM)
  }

  return (
    <div className="equipment-section">
      <InventoryManager
        catalogOptions={catalogOptions}
        catalogForm={catalogForm}
        customForm={customForm}
        mode={managerMode}
        setMode={setManagerMode}
        onCatalogChange={updateCatalogForm}
        onCustomChange={updateCustomForm}
        onAddCatalog={addFromCatalog}
        onAddCustom={addCustomItem}
      />

      <SectionCard title="Monete">
        <CurrencyRow currency={currency} />
      </SectionCard>

      {EQUIPMENT_GROUPS.map((group) => {
        const items = equipment[group.id] ?? []

        if (items.length === 0) {
          return null
        }

        return (
          <SectionCard key={group.id} title={group.title}>
            <div className="equipment-list">
              {items.map((item) => (
                <EquipmentItem
                  key={getItemKey(item)}
                  groupId={group.id}
                  item={item}
                  tracker={tracker[getItemKey(item)]}
                  onUse={useItem}
                  onRecover={recoverItem}
                  onAdd={addTrackedItem}
                  onDelete={deleteItem}
                  onEquip={equipItem}
                  onUnequip={unequipItem}
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
