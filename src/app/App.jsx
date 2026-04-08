import { useState, useEffect } from 'react'

import './App.css'
import SectionCard from '../components/general/card/SectionCard.jsx'
import shisui from '../data/characters/shisui.json'
import OverviewSection from '../components/character/sections/OverviewSection.jsx'
import HpSection from '../components/character/sections/HpSection.jsx'
import KeyStatsSection from '../components/character/sections/KeyStatsSection.jsx'
import AbilitiesSection from '../components/character/sections/AbilitiesSection.jsx'
import ResourcesSection from '../components/character/sections/ResourcesSection.jsx'
import RestSection from '../components/character/sections/RestSection.jsx'

const TABS = [
  { id: 'overview', label: 'Panoramica' },
  { id: 'spells', label: 'Incantesimi' },
  { id: 'details', label: 'Dettagli' },
]

const abilities = [
  { id: 'str', label: 'FOR', value: shisui.abilities.str },
  { id: 'dex', label: 'DES', value: shisui.abilities.dex },
  { id: 'con', label: 'COS', value: shisui.abilities.con },
  { id: 'int', label: 'INT', value: shisui.abilities.int },
  { id: 'wis', label: 'SAG', value: shisui.abilities.wis },
  { id: 'cha', label: 'CAR', value: shisui.abilities.cha },
]


function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [overviewTab, setOverviewTab] = useState('panoramica')
  const mainClass = shisui.classes[0];
  const level = mainClass?.level ?? 1
  const proficiencyBonus = Math.min(6, 2 + Math.floor((level - 1) / 4))

  /*hpCurrent deve poter cambiare → quindi useState
    hpMax è fisso (per ora) → basta una costante */

  const [hpCurrent, setHpCurrent] = useState(shisui.combat.hp.current);
  const hpMax = shisui.combat.hp.max;
  const dexMod = Math.floor((shisui.abilities.dex - 10) / 2)
  const dexModLabel = dexMod >= 0 ? `+${dexMod}` : `${dexMod}`
  const [resources, setResources] = useState(shisui.resources)
  const kiResource = resources.find((r) => r.id === 'ki')
  const [hitDice, setHitDice] = useState(shisui.combat.hitDice)
  const conMod = Math.floor((shisui.abilities.con - 10) / 2)
  const [restPanel, setRestPanel] = useState(null) // 'short' | 'long' | null
  const [restMethod, setRestMethod] = useState(null) // 'roll' | 'manual' | null
  const [shortRestDice, setShortRestDice] = useState(1)
  const [manualHeal, setManualHeal] = useState(0)
  const [manualDiceSpent, setManualDiceSpent] = useState(0)
  const [restResult, setRestResult] = useState('')
  const [skills, setSkills] = useState(shisui.skills)
  const [savingThrows, setSavingThrows] = useState(shisui.savingThrows)

  useEffect(() => {
    if (!restResult) return
    const timer = setTimeout(() => setRestResult(''), 5000)
    return () => clearTimeout(timer)
  }, [restResult])

  function toggleSkillProficiency(id) {
    setSkills((prev) =>
      prev.map((sk) =>
        sk.id === id ? { ...sk, proficient: !sk.proficient } : sk
      )
    )
  }

  function toggleSavingThrow(id) {
    setSavingThrows((prev) => ({ ...prev, [id]: !prev[id] }))
  }




  /**
   * Aggiorna la quantità di una risorsa specifica. 
   * @param {string} id - L'ID della risorsa da aggiornare.
   * @param {number} newValue - Il nuovo valore per la risorsa.
   */
  function updateResource(id, newValue) {
    setResources((prev) =>
      prev.map((res) =>
        res.id === id ? { ...res, current: newValue } : res
      )
    )
  }

  function resetResources(kind) {
    setResources((prev) =>
      prev.map((res) => {
        const shouldReset =
          kind === 'short'
            ? res.resetOn === 'short_rest'
            : kind === 'long'
              ? res.resetOn === 'short_rest' || res.resetOn === 'long_rest'
              : false

        return shouldReset ? { ...res, current: res.max } : res
      })
    )
  }

  function getDieSize(type) {
    const size = Number(String(type || '').replace('d', ''))
    return Number.isNaN(size) ? 8 : size
  }

  function applyShortRestRoll() {
    if (hitDice.current <= 0) return

    const diceToSpend = Math.max(1, Math.min(shortRestDice, hitDice.current))
    const dieSize = getDieSize(hitDice.type)

    let total = 0
    for (let i = 0; i < diceToSpend; i++) {
      const roll = Math.floor(Math.random() * dieSize) + 1
      total += Math.max(0, roll + conMod)
    }

    setRestResult(`Recuperati +${total} PF (${diceToSpend}d${dieSize} + ${conMod} per dado)`)
    
    setHpCurrent((prev) => Math.min(hpMax, prev + total))
    setHitDice((prev) => ({ ...prev, current: prev.current - diceToSpend }))
    resetResources('short')

    setRestPanel(null)
    setRestMethod(null)
    setShortRestDice(1)
  }

  function applyShortRestManual() {
    const heal = Math.max(0, Number(manualHeal) || 0)
    const diceSpent = Math.max(0, Math.min(Number(manualDiceSpent) || 0, hitDice.current))

    setHpCurrent((prev) => Math.min(hpMax, prev + heal))
    setHitDice((prev) => ({ ...prev, current: prev.current - diceSpent }))
    resetResources('short')

    setRestResult(`Recuperati +${heal} PF, spesi ${diceSpent} dadi vita`)
    setRestPanel(null)
    setRestMethod(null)
    setManualHeal(0)
    setManualDiceSpent(0)
  }

  function applyLongRest() {
    setHpCurrent(hpMax)
    resetResources('long')
    const recover = Math.max(1, Math.floor(hitDice.max / 2))

    setHitDice((prev) => ({
      ...prev,
      current: Math.min(prev.max, prev.current + recover),
    }))

    setRestResult(`Riposo lungo: PF al massimo, recuperi ${recover} dadi vita`)
    setRestPanel(null)
    setRestMethod(null)
  }



  /**
   * La struttura dell'app è composta da:
   * - Un header (topbar) con un menu, un titolo e un pulsante per altre opzioni.
   * - Un'area principale (screen) che mostra il contenuto della scheda personaggio.
   * - Una barra di navigazione (panel_nav) con i tab per cambiare sezione.
   * - Un'area di contenuto (panel_content) che mostra il contenuto relativo al tab selezionato.
   */
  return (
    <div className="app">
      <header className="topbar">
        <button className="icon-btn" aria-label="Menu">☰</button>
        <div className="topbar__title">Scheda Personaggio</div>
        <button className="icon-btn" aria-label="Altro">⋮</button>
      </header>

      <main className="screen">
        <div className="panel_content">
          {activeTab === 'overview' && (
            <>
              <div className="subtabs">
                <button
                  className={`subtabs__btn ${overviewTab === 'panoramica' ? 'subtabs__btn--active' : ''}`}
                  onClick={() => setOverviewTab('panoramica')}
                >
                  Panoramica
                </button>
                <button
                  className={`subtabs__btn ${overviewTab === 'caratteristiche' ? 'subtabs__btn--active' : ''}`}
                  onClick={() => setOverviewTab('caratteristiche')}
                >
                  Caratteristiche
                </button>
              </div>

              {overviewTab === 'panoramica' && (
                <>
                  <OverviewSection character={shisui} mainClass={mainClass} />
                  <HpSection
                    hpCurrent={hpCurrent}
                    hpMax={hpMax}
                    onDec={() => setHpCurrent(Math.max(0, hpCurrent - 1))}
                    onInc={() => setHpCurrent(Math.min(hpMax, hpCurrent + 1))}
                  />
                  <KeyStatsSection
                    ac={shisui.combat.ac}
                    speed={shisui.combat.speed}
                    dexModLabel={dexModLabel ?? dexMod}
                    kiCurrent={kiResource ? kiResource.current : 0}
                    kiMax={kiResource ? kiResource.max : 0}
                  />
                  <ResourcesSection
                    hitDice={hitDice}
                    onHitDiceChange={(value) =>
                      setHitDice((prev) => ({ ...prev, current: value }))
                    }
                    resources={resources}
                    onResourceChange={updateResource}
                  />
                  <RestSection
                    restPanel={restPanel}
                    setRestPanel={setRestPanel}
                    restMethod={restMethod}
                    setRestMethod={setRestMethod}
                    restResult={restResult}
                    hitDice={hitDice}
                    shortRestDice={shortRestDice}
                    setShortRestDice={setShortRestDice}
                    manualHeal={manualHeal}
                    setManualHeal={setManualHeal}
                    manualDiceSpent={manualDiceSpent}
                    setManualDiceSpent={setManualDiceSpent}
                    applyShortRestRoll={applyShortRestRoll}
                    applyShortRestManual={applyShortRestManual}
                    applyLongRest={applyLongRest}
                  />
                </>
              )}

              {overviewTab === 'caratteristiche' && (
                <AbilitiesSection
                  abilities={abilities}
                  skills={skills}
                  proficiencyBonus={proficiencyBonus}
                  onToggleSkill={toggleSkillProficiency}
                  savingThrows={savingThrows}
                  onToggleSavingThrow={toggleSavingThrow}
                />
              )}
            </>
          )}
          {activeTab === 'spells' && <SectionCard title="Incantesimi">Contenuto Incantesimi</SectionCard>}
          {activeTab === 'details' && <SectionCard title="Dettagli">Contenuto Dettagli</SectionCard>}
        </div>
      </main>

      <nav className="panel_nav">
        {/* panel_nav__item--active si applica solo al bottone selezionato */}
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`panel_nav__item ${activeTab === tab.id ? 'panel_nav__item--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}


export default App
