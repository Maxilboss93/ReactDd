import SectionCard from '../../general/card/SectionCard.jsx'

function RestSection({
  restPanel,
  setRestPanel,
  restMethod,
  setRestMethod,
  restResult,
  hitDice,
  shortRestDice,
  setShortRestDice,
  manualHeal,
  setManualHeal,
  manualDiceSpent,
  setManualDiceSpent,
  applyShortRestRoll,
  applyShortRestManual,
  applyLongRest,
}) {
  return (
    <SectionCard title="Riposi">
      <div className="rest-actions">
        <button
          className="rest-btn"
          onClick={() => setRestPanel(restPanel === 'short' ? null : 'short')}
        >
          Riposo breve
        </button>
        <button
          className="rest-btn"
          onClick={() => setRestPanel(restPanel === 'long' ? null : 'long')}
        >
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
  )
}

export default RestSection
