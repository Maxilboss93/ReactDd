import { useState, useRef } from 'react'

import StatIcon from '../../character/StatIcon.jsx'

function ResourceRow({ iconKey = null, label, current, max, resetOn, shortRestRecover = null, onChange }) {
  const safeMax = Math.max(0, Number(max) || 0)
  const safeCurrent = Math.max(0, Math.min(safeMax, Number(current) || 0))
  const usesCompactControls = safeMax > 8
  const rowClassName = `resource-row ${usesCompactControls ? 'resource-row--stepper' : 'resource-row--dots'}`
  const dotTrackStyle = {
    '--resource-dot-count': Math.max(1, safeMax),
    '--resource-dots-width': `${Math.max(1, safeMax) * 32 + Math.max(0, safeMax - 1) * 6}px`,
  }
  const resetLabel =
    shortRestRecover ? `+${shortRestRecover} riposo breve, tutto riposo lungo`
    : resetOn === 'short_rest' ? 'Riposo breve'
    : resetOn === 'long_rest' ? 'Riposo lungo'
    : null
  
  const [dragging, setDragging] = useState(false)
  // Ref per ignorare il click dopo un drag
  const ignoreClickRef = useRef(false)

  function setValueForIndex(index, allowToggle) {
    const value = index + 1
    const next = allowToggle && safeCurrent === value ? 0 : value
    onChange(next)
  }
  
  function handlePointerDown(index, e) {
    // Iniziamo il drag, impedendo il toggle immediato
    e.preventDefault()
    ignoreClickRef.current = true
    setDragging(true)
    setValueForIndex(index, true)
  }

  function handlePointerMove(e) {
    if (!dragging) return
    e.preventDefault()
    const el = document.elementFromPoint(e.clientX, e.clientY)
    if (!el) return
    const btn = el.closest('.resource-dot')
    if (!btn) return
    const idx = Number(btn.dataset.index)
    if (Number.isNaN(idx)) return
    setValueForIndex(idx, false)
  }

  function handleClick(index) {
    if (ignoreClickRef.current) {
      ignoreClickRef.current = false
      return
    }
    setValueForIndex(index, true)
  }

  function setCompactValue(value) {
    const nextValue = Math.max(0, Math.min(safeMax, Number(value) || 0))
    onChange(nextValue)
  }


  return (
    <div className={rowClassName}>
      <div className="resource-info">
        <div className="resource-name">
          <StatIcon statKey={iconKey} size="sm" />
          <span>{label}</span>
        </div>
        {resetLabel && <div className="resource-sub">{resetLabel}</div>}
      </div>

      {usesCompactControls ? (
        <div className="resource-stepper">
          <button
            type="button"
            onClick={() => setCompactValue(safeCurrent - 1)}
            disabled={safeCurrent <= 0}
            aria-label={`Riduci ${label}`}
          >
            -
          </button>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            max={safeMax}
            value={safeCurrent}
            onChange={(event) => setCompactValue(event.target.value)}
            aria-label={label}
          />
          <button
            type="button"
            onClick={() => setCompactValue(safeCurrent + 1)}
            disabled={safeCurrent >= safeMax}
            aria-label={`Aumenta ${label}`}
          >
            +
          </button>
        </div>
      ) : (
        <div
          className="resource-dots"
          style={dotTrackStyle}
          onPointerMove={handlePointerMove}
          onPointerUp={() => setDragging(false)}
          onPointerLeave={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
        >
          {Array.from({ length: safeMax }).map((_, i) => (
          <button
            key={i}
            data-index={i}
            className={`resource-dot ${i < safeCurrent ? 'is-filled' : ''}`}
            onPointerDown={(e) => handlePointerDown(i, e)}
            onClick={() => handleClick(i)}
            aria-label={`Imposta ${label} a ${i + 1}`}
          />
          ))}
        </div>
      )}

      <div className="resource-count">
        {safeCurrent}/{safeMax}
      </div>
    </div>
  )
}

export default ResourceRow
