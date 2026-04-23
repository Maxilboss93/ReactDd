import { useState } from "react"
import { useAuth } from './AuthContext.jsx'

function LoginForm(){
  const { login, loading } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    const cleanIdentifier = identifier.trim()
    const cleanPassword = password.trim()
    
    if(!cleanIdentifier || !cleanPassword){
      setError('Tutti i campi sono obbligatori')
      return
    }    
    try {
        await login(cleanIdentifier, cleanPassword)
    } catch (err) {
        setError('Credenziali non valide')
    }
  }

  return (
    <div>
        <div className="auth-section-title">Login</div>
        <form className="auth-form" onSubmit={handleSubmit}>
            <input
              className="auth-input"
              type="text"
              name="identifier"
              placeholder="Username o email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
            <input
              className="auth-input"
              type="password"
              name="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className="auth-submit" type="submit" disabled={loading}>
                {loading ? 'Accesso...' : 'Accedi'}
            </button>
        </form>
        {error && <div className="auth-error"><p>{error}</p></div>}
    </div>
  )
}

export default LoginForm
