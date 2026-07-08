import './SectionCard.css'

function SectionCard({ title, children, className = '' }) {
  return (
    <section className={`section-card ${className}`.trim()}>
      <div className="section-card__header">
        <h3>{title}</h3>
      </div>
      <div className="section-card__body">
        {children}
      </div>
    </section>
  )
}

export default SectionCard
