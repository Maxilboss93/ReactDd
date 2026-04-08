import './SectionCard.css'

function SectionCard({ title, children }) {
  return (
    <section className="section-card">
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