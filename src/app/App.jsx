import { useState, useEffect } from 'react'

import './App.css'
import SectionCard from '../components/general/card/SectionCard.jsx'
import shisui from '../data/characters/shisui.json'
import ResourceRow from '../components/general/resource/ResourceRow.jsx'

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
  const mainClass = shisui.classes[0];
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

  useEffect(() => {
    if (!restResult) return
    const timer = setTimeout(() => setRestResult(''), 5000)
    return () => clearTimeout(timer)
  }, [restResult])

  
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
              <SectionCard title="Panoramica">
                <div className="character-block">
                  <div className="character-name">{shisui.name}</div>
                  <div className="character-line">
                    {shisui.race} - {mainClass.name} Livello {mainClass.level}
                  </div>
                  <div className="character-line">{mainClass.subclass}</div>
                </div>
              </SectionCard>

              <SectionCard title="Punti Ferita">
                <div className="hp-row">
                  <button
                    className="hp-btn"
                    onClick={() => setHpCurrent(Math.max(0, hpCurrent - 1))}
                  >
                    -
                  </button>

                  <div className="hp-value">
                    {hpCurrent} / {hpMax}
                  </div>

                  <button
                    className="hp-btn"
                    onClick={() => setHpCurrent(Math.min(hpMax, hpCurrent + 1))}
                  >
                    +
                  </button>
                </div>
              </SectionCard>

              <SectionCard title="Statistiche Chiave">
                <div className="stats-grid">
                  <div className="stat-pill">
                    <div className="stat-label">CA</div>
                    <div className="stat-value">{shisui.combat.ac}</div>
                  </div>

                  <div className="stat-pill">
                    <div className="stat-label">Vel.</div>
                    <div className="stat-value">{shisui.combat.speed} mt</div>
                  </div>

                  <div className="stat-pill">
                    <div className="stat-label">DES</div>
                    <div className="stat-value">{dexModLabel ?? dexMod}</div>
                  </div>

                  <div className="stat-pill">
                    <div className="stat-label">Ki</div>
                    <div className="stat-value">
                      {kiResource ? `${kiResource.current}/${kiResource.max}` : '—'}
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Risorse">
                <div className="resource-list">
                  <ResourceRow
                    label={`Dadi Vita (${hitDice.type})`}
                    current={hitDice.current}
                    max={hitDice.max}
                    resetOn="long_rest"
                    onChange={(value) =>
                      setHitDice((prev) => ({ ...prev, current: value }))
                    }
                  />
                  {resources.map((res) => (
                    <ResourceRow
                      key={res.id}
                      label={res.label}
                      current={res.current}
                      max={res.max}
                      resetOn={res.resetOn}
                      onChange={(value) => updateResource(res.id, value)}
                    />
                  ))}
                </div>
              </SectionCard>
              <SectionCard title="Riposi">
                <div className="rest-actions">
                  <button
                    className="rest-btn"
                    onClick={() => setRestPanel(restPanel === 'short' ? null : 'short')}
                  >
                    <span className="action-icon">⏳</span>
                    Riposo breve
                  </button>
                  <button
                    className="rest-btn"
                    onClick={() => setRestPanel(restPanel === 'long' ? null : 'long')}
                  >
                    <span className="action-icon">🌙</span>
                    Riposo lungo
                  </button>

                </div>
                {restResult && <div className="rest-result">{restResult}</div>}


                {restPanel === 'short' && (
                  <div className="rest-panel">
                    <div className="rest-label">Come vuoi recuperare i PF?</div>
                    <div className="rest-options">
                      <button className="rest-option" onClick={() => setRestMethod('roll')}>
                        Tira i dadi
                      </button>
                      <button className="rest-option" onClick={() => setRestMethod('manual')}>
                        Inserisci manualmente
                      </button>
                    </div>

                    <div className="rest-hint">
                      Dadi vita: {hitDice.current}/{hitDice.max} ({hitDice.type})
                    </div>

                    {restMethod === 'roll' && (
                      <div className="rest-form">
                        <label className="rest-field">
                          <span>Quanti dadi vuoi spendere?</span>
                          <input
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            step="1"
                            min="1"
                            max={hitDice.current}
                            value={shortRestDice}
                            onChange={(e) => {
                              const value = Math.max(1, Math.min(Number(e.target.value) || 1, hitDice.current))
                              setShortRestDice(value)
                            }}
                          />
                        </label>
                        {hitDice.current <= 0 && (
                          <div className="rest-hint">Non hai dadi vita disponibili.</div>
                        )}
                        <button
                          className="rest-option"
                          onClick={applyShortRestRoll}
                          disabled={hitDice.current <= 0}
                        >
                          Tira e recupera
                        </button>
                      </div>
                    )}

                    {restMethod === 'manual' && (
                      <div className="rest-form">
                        <label className="rest-field">
                          <span>PF recuperati</span>
                          <input
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            step="1"
                            min="0"
                            value={manualHeal}
                            onChange={(e) => setManualHeal(Number(e.target.value) || 0)}
                          />
                        </label>
                        <label className="rest-field">
                          <span>Dadi vita spesi</span>
                          <input
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            step="1"
                            min="0"
                            max={hitDice.current}
                            value={manualDiceSpent}
                            onChange={(e) => {
                              const value = Math.max(0, Math.min(Number(e.target.value) || 0, hitDice.current))
                              setManualDiceSpent(value)
                            }}
                          />
                        </label>
                        <button className="rest-option" onClick={applyShortRestManual}>
                          Applica recupero
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {restPanel === 'long' && (
                  <div className="rest-panel">
                    
                    <div className="rest-label">Riposo lungo</div>
                    <div className="rest-hint">Ripristina PF e risorse da riposo lungo.</div>
                    <button className="rest-option" onClick={applyLongRest}>
                      Conferma
                    </button>
                  </div>
                )}
              </SectionCard>
              

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
