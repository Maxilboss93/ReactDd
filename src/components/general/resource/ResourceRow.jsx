import { useState, useRef } from 'react'

function ResourceRow({ label, current, max, resetOn, shortRestRecover = null, onChange }) {
  const usesCompactControls = max > 8
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
    const next = allowToggle && current === value ? 0 : value
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
    const nextValue = Math.max(0, Math.min(max, Number(value) || 0))
    onChange(nextValue)
  }


  return (
    <div className="resource-row">
      <div className="resource-info">
        <div className="resource-name">{label}</div>
        {resetLabel && <div className="resource-sub">{resetLabel}</div>}
      </div>

      {usesCompactControls ? (
        <div className="resource-stepper">
          <button
            type="button"
            onClick={() => setCompactValue(current - 1)}
            disabled={current <= 0}
            aria-label={`Riduci ${label}`}
          >
            -
          </button>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            max={max}
            value={current}
            onChange={(event) => setCompactValue(event.target.value)}
            aria-label={label}
          />
          <button
            type="button"
            onClick={() => setCompactValue(current + 1)}
            disabled={current >= max}
            aria-label={`Aumenta ${label}`}
          >
            +
          </button>
        </div>
      ) : (
        <div
          className="resource-dots"
          onPointerMove={handlePointerMove}
          onPointerUp={() => setDragging(false)}
          onPointerLeave={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
        >
          {Array.from({ length: max }).map((_, i) => (
          <button
            key={i}
            data-index={i}
            className={`resource-dot ${i < current ? 'is-filled' : ''}`}
            onPointerDown={(e) => handlePointerDown(i, e)}
            onClick={() => handleClick(i)}
            aria-label={`Imposta ${label} a ${i + 1}`}
          />
          ))}
        </div>
      )}

      <div className="resource-count">
        {current}/{max}
      </div>
    </div>
  )
}

export default ResourceRow
