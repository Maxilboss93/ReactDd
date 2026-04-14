import { useState } from "react"
import LoginForm from "./LoginForm.jsx"
import RegisterForm from "./RegisterForm.jsx"
import '../../app/App.css'

function AuthPage() {
    const [mode, setMode] = useState('login')

    return (
        <div className="auth-shell">
            <div className="auth-card">
                <div className="auth-title">Scheda Personaggio</div>
                <div className="auth-subtitle">
                    Accedi o crea un profilo per gestire le tue schede.
                </div>

                <div className="auth-tabs">
                    <button
                        className={"auth-tabs__button " + (mode === "login" ? "auth-tabs__button--active" : "")}
                        onClick={() => setMode('login')}
                    >
                        Login
                    </button>
                    <button
                        className={"auth-tabs__button " + (mode === "register" ? "auth-tabs__button--active" : "")}
                        onClick={() => setMode('register')}
                    >
                        Registrazione
                    </button>
                </div>

                <div className="auth-body">
                    {mode === 'login' && <LoginForm />}
                    {mode === 'register' && <RegisterForm />}
                </div>
            </div>
        </div>
    )
}

export default AuthPage
