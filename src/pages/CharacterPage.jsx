import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import '../app/App.css'
import SectionCard from '../components/general/card/SectionCard.jsx'
import OverviewSection from '../components/character/sections/OverviewSection.jsx'
import HpSection from '../components/character/sections/HpSection.jsx'
import KeyStatsSection from '../components/character/sections/KeyStatsSection.jsx'
import AbilitiesSection from '../components/character/sections/AbilitiesSection.jsx'
import ResourcesSection from '../components/character/sections/ResourcesSection.jsx'
import RestSection from '../components/character/sections/RestSection.jsx'
import { fetchCharacterById } from '../services/fakeApi.js'
import { useAuth } from '../components/authentication/AuthContext.jsx'

const TABS = [
  { id: 'overview', label: 'Panoramica' },
  { id: 'spells', label: 'Incantesimi' },
  { id: 'details', label: 'Dettagli' },
]

function CharacterPage() {
  const { id } = useParams()
  const { user, logout } = useAuth()
  const [character, setCharacter] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [overviewTab, setOverviewTab] = useState('panoramica')

  const mainClass = character?.classes?.[0] ?? null
  const level = mainClass?.level ?? 1
  const proficiencyBonus = Math.min(6, 2 + Math.floor((level - 1) / 4))

  const [hpCurrent, setHpCurrent] = useState(0)
  const hpMax = character?.combat?.hp?.max ?? 0
  const dexMod = Math.floor(((character?.abilities?.dex ?? 10) - 10) / 2)
  const dexModLabel = dexMod >= 0 ? `+${dexMod}` : `${dexMod}`
  const [resources, setResources] = useState([])
  const kiResource = resources.find((r) => r.id === 'ki')
  const [hitDice, setHitDice] = useState({ current: 0, max: 0, type: 'd8' })
  const conMod = Math.floor(((character?.abilities?.con ?? 10) - 10) / 2)
  const [restPanel, setRestPanel] = useState(null)
  const [restMethod, setRestMethod] = useState(null)
  const [shortRestDice, setShortRestDice] = useState(1)
  const [manualHeal, setManualHeal] = useState(0)
  const [manualDiceSpent, setManualDiceSpent] = useState(0)
  const [restResult, setRestResult] = useState('')
  const [skills, setSkills] = useState([])
  const [savingThrows, setSavingThrows] = useState({})
  const navigate = useNavigate()
  
  const abilities = character
    ? [
        { id: 'str', label: 'FOR', value: character.abilities.str },
        { id: 'dex', label: 'DES', value: character.abilities.dex },
        { id: 'con', label: 'COS', value: character.abilities.con },
        { id: 'int', label: 'INT', value: character.abilities.int },
        { id: 'wis', label: 'SAG', value: character.abilities.wis },
        { id: 'cha', label: 'CAR', value: character.abilities.cha },
      ]
    : []

  useEffect(() => {
    if (!restResult) return
    const timer = setTimeout(() => setRestResult(''), 5000)
    return () => clearTimeout(timer)
  }, [restResult])

  useEffect(() => {
    let active = true
    if (!user?.id) return

    setLoading(true)
    fetchCharacterById(user.id, id).then((data) => {
      if (!active) return
      setCharacter(data)
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [user?.id, id])

  useEffect(() => {
    if (!character) return
    setHpCurrent(character.combat?.hp?.current ?? 0)
    setResources(character.resources ?? [])
    setHitDice(character.combat?.hitDice ?? { current: 0, max: 0, type: 'd8' })
    setSkills(character.skills ?? [])
    setSavingThrows(character.savingThrows ?? {})
  }, [character])

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

  if (loading) {
    return (
      <div className="app">
        <header className="topbar">
        <button className="icon-btn" aria-label="Torna alle schede" onClick={() => navigate('/schede')}>
            &#8592;
        </button>
        <div className="topbar__title">Scheda Personaggio</div>
        <button className="icon-btn icon-btn--text" onClick={() => { logout(); navigate('/login', { replace: true }) }}>
            Esci
        </button>
        </header>
        <main className="screen">
          <div className="panel_content">
            <div className="list-empty">Caricamento scheda...</div>
          </div>
        </main>
      </div>
    )
  }

  if (!character) {
    return (
      <div className="app">
        <header className="topbar">
          <div className="topbar__spacer" />
          <div className="topbar__title">Scheda Personaggio</div>
          <div className="topbar__spacer" />
        </header>
        <main className="screen">
          <div className="panel_content">
            <div className="list-empty">Scheda non trovata.</div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="topbar">
        <button
          className="icon-btn"
          aria-label="Torna alle schede"
          onClick={() => navigate('/schede')}
        >
          &#8592;
        </button>
        <div className="topbar__title">Scheda Personaggio</div>
        <button
          className="icon-btn icon-btn--text"
          onClick={() => {
            logout()
            navigate('/login', { replace: true })
          }}
        >
          Esci
        </button>
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
                  <OverviewSection character={character} mainClass={mainClass} />
                  <HpSection
                    hpCurrent={hpCurrent}
                    hpMax={hpMax}
                    onDec={() => setHpCurrent(Math.max(0, hpCurrent - 1))}
                    onInc={() => setHpCurrent(Math.min(hpMax, hpCurrent + 1))}
                  />
                  <KeyStatsSection
                    ac={character.combat?.ac ?? 0}
                    speed={character.combat?.speed ?? 0}
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

export default CharacterPage
