function ResourceRow({ label, current, max, resetOn, onChange }) {
  const resetLabel =
    resetOn === 'short_rest' ? 'Riposo breve'
    : resetOn === 'long_rest' ? 'Riposo lungo'
    : null

  return (
    <div className="resource-row">
      <div className="resource-info">
        <div className="resource-name">{label}</div>
        {resetLabel && <div className="resource-sub">{resetLabel}</div>}
      </div>

      <div className="resource-dots">
        {Array.from({ length: max }).map((_, i) => (
          <button
            key={i}
            className={`resource-dot ${i < current ? 'is-filled' : ''}`}
            onClick={() => onChange(current === i + 1 ? 0 : i + 1)}
            aria-label={current === i + 1 ? `Imposta ${label} a 0` : `Imposta ${label} a ${i + 1}`}
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
