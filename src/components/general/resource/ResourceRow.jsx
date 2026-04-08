import { useState, useRef } from 'react'



function ResourceRow({ label, current, max, resetOn, onChange }) {
  const resetLabel =
    resetOn === 'short_rest' ? 'Riposo breve'
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

  function handlePointerEnter(index) {
    // Se stiamo trascinando, aggiorniamo il valore senza permettere il toggle  
    if (dragging) {
      setValueForIndex(index, false)
    }
  }

  function handleClick(index) {
    if (ignoreClickRef.current) {
      ignoreClickRef.current = false
      return
    }
    setValueForIndex(index, true)
  }


  return (
    <div className="resource-row">
      <div className="resource-info">
        <div className="resource-name">{label}</div>
        {resetLabel && <div className="resource-sub">{resetLabel}</div>}
      </div>

      <div
        className="resource-dots"
        onPointerUp={() => setDragging(false)}
        onPointerLeave={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
      >
        {Array.from({ length: max }).map((_, i) => (
        <button
          key={i}
          className={`resource-dot ${i < current ? 'is-filled' : ''}`}
          onPointerDown={(e) => handlePointerDown(i, e)}
          onPointerEnter={() => handlePointerEnter(i)}
          onClick={() => handleClick(i)}
          aria-label={`Imposta ${label} a ${i + 1}`}
        />
        ))}
      </div>

      <div className="resource-count">
        {current}/{max}
      </div>
    </div>
  )
}

export default ResourceRow
