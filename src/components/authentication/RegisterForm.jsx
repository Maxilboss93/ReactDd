import { useState } from "react"
import { useAuth } from "./AuthContext.jsx"

function RegisterForm() {
    const { register, loading } = useAuth()

    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [error, setError] = useState(null)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)

        const cleanUsername = username.trim()
        const cleanEmail = email.trim()
        const cleanPassword = password.trim()
        const cleanConfirm = confirm.trim()

        if (!cleanUsername || !cleanEmail || !cleanPassword || !cleanConfirm) {
            setError('Tutti i campi sono obbligatori')
            return
        }

        if (cleanPassword !== cleanConfirm) {
            setError('Le password non coincidono')
            return
        }

        if (!/[A-Z]/.test(cleanPassword) || !/\d/.test(cleanPassword) || !/[!@#$%^&*]/.test(cleanPassword)) {
            setError('La password deve avere almeno una maiuscola, un numero e un carattere speciale')
            return
        }

        if (!/\S+@\S+\.\S+/.test(cleanEmail)) {
            setError('Email non valida')
            return
        }


        try {
            await register({
                username: cleanUsername,
                email: cleanEmail,
                password: cleanPassword,
            })
        } catch (err) {
            if (err?.code === 'USER_EXISTS') {
                setError('Utente gia esistente')
            } else {
                setError('Errore di registrazione')
            }
        }
    }



    return (
        <>
        <div className="auth-section-title">Registrazione</div>
        <form className="auth-form" onSubmit={handleSubmit}>
            <input
                className="auth-input"
                type="text"
                name="username"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <input
                className="auth-input"
                type="email"
                name="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                className="auth-input"
                type="password"
                name="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <input
                className="auth-input"
                type="password"
                name="confirm"
                placeholder="Conferma password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
            />
            <button className="auth-submit" type="submit" disabled={loading}>
                {loading ? 'Registrazione...' : 'Registrati'}
            </button>
        </form>

        {error && <div className="auth-error"><p>{error}</p></div>}
        </>
    )
}
 
export default RegisterForm
