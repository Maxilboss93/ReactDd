import { useState } from 'react'
import SectionCard from '../../general/card/SectionCard.jsx'
import '../AbilityGrid/AbilityGrid.css'

function abilityMod(score) {
  return Math.floor((score - 10) / 2)
}

function formatMod(mod) {
  return mod >= 0 ? `+${mod}` : `${mod}`
}

function AbilitiesSection({ abilities, skills, proficiencyBonus, onToggleSkill, savingThrows, onToggleSavingThrow}) {
  const [openAbilityId, setOpenAbilityId] = useState(null)

  function toggleAbility(id) {
    setOpenAbilityId(prev => (prev === id ? null : id))
  }

  /*  
    Per ora questa sezione mostra il punteggio 
    in base a skill.ability
  */
  const abilityMap = Object.fromEntries(
    abilities.map((ab) => [ab.id, ab.value])
  )

  return (
    <SectionCard title="Caratteristiche">
      <div className="abilities-grid">
        {abilities.map((ab) => {
          const isOpen = openAbilityId === ab.id
          const relatedSkills = skills.filter((skill) => skill.ability === ab.id)
          
          const saveIsOn = !!savingThrows?.[ab.id]
          const saveMod = abilityMod(ab.value) + (saveIsOn ? proficiencyBonus : 0)

          return (
            <div key={ab.id} className={`ability-card ${isOpen ? 'is-open' : ''}`}>
              <div className="ability-pill" onClick={() => toggleAbility(ab.id)}>
                <div className="ability-label">{ab.label}</div>
                <div className="ability-score">{ab.value}</div>
                <div className="ability-mod">{formatMod(abilityMod(ab.value))}</div>
              </div>

              {isOpen && (
                <div className="skills-list">
                  <div className="skill-row skill-row--save">
                    <button
                      className={`skill-dot ${saveIsOn ? 'is-on' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleSavingThrow(ab.id)
                      }}
                      aria-label={`Competenza tiro salvezza ${ab.label}`}
                    />
                    <div className="skill-name">Tiro salvezza</div>
                    <div className="skill-mod">{formatMod(saveMod)}</div>
                  </div>

                  {relatedSkills.length > 0 && <div className="skills-divider" />}

                  {relatedSkills.map((skill) => {
                    const base = abilityMod(abilityMap[skill.ability] ?? 10)
                    const total = base + (skill.proficient ? proficiencyBonus : 0)

                    return (
                      <div key={skill.id} className="skill-row">
                        <button
                          className={`skill-dot ${skill.proficient ? 'is-on' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            onToggleSkill(skill.id)
                          }}
                          aria-label={`Competenza ${skill.label}`}
                        />
                        <div className="skill-name">{skill.label}</div>
                        <div className="skill-mod">{formatMod(total)}</div>
                      </div>
                    )
                  })}
                </div>
              )}

            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}

export default AbilitiesSection
