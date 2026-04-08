import { useState } from 'react'
import './App.css'
import SectionCard from '../components/general/card/SectionCard.jsx'
import shisui from '../data/characters/shisui.json'
import ResourceRow from '../components/general/resource/ResourceRow.jsx'

const TABS = [
  { id: 'overview', label: 'Panoramica' },
  { id: 'spells', label: 'Incantesimi' },
  { id: 'details', label: 'Dettagli' },
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
                    <div className="stat-value">{shisui.combat.speed} ft</div>
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
