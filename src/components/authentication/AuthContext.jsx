import { createContext, useContext, useState } from "react";
import * as api from '../../services/fakeApi.js'

//contenitore dove mettiamo le info dell'utente loggato,
//e le funzioni per loggare e sloggare
const AuthContext = createContext(null)

const STORAGE_TOKEN = 'dd_token'
const STORAGE_USER = 'dd_user'

function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_USER)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}


/**
 * AuthProvider componente che fornisce il contesto di autenticazione a tutta l'app
 * sarà il “wrapper” di tutta l'app, tutto quello che è dentro potrà leggere lo stato login
 * @param {*} param0 
 * @returns 
 */
export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem(STORAGE_TOKEN) || '')
    const [user, setUser] = useState(() => readStoredUser())
    const [loading, setLoading] = useState(false)

    async function login(identifier, password) {
        setLoading(true)
        try {
            const result = await api.login(identifier, password)
            setToken(result.token)
            setUser(result.user)
            localStorage.setItem(STORAGE_TOKEN, result.token)
            localStorage.setItem(STORAGE_USER, JSON.stringify(result.user))
            return result
        } finally {
            setLoading(false)
        }
    }

    function logout() {
        setToken('')
        setUser(null)
        localStorage.removeItem(STORAGE_TOKEN)
        localStorage.removeItem(STORAGE_USER)
    }

    async function register(payload) {
        setLoading(true)
        try {
            const result = await api.register(payload)
            setToken(result.token)
            setUser(result.user)
            localStorage.setItem(STORAGE_TOKEN, result.token)
            localStorage.setItem(STORAGE_USER, JSON.stringify(result.user))
            return result
        } finally {
            setLoading(false)
        }
    }


    return (
        <AuthContext.Provider value={{ token, user, loading, login, register, logout, isAuthenticated: Boolean(token) }}>
            {children}
        </AuthContext.Provider>
    )
}


/**
 * ci permette di leggere il contesto in ogni pagina
 * @returns 
 */
export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) {
        throw new Error('useAuth deve essere usato dentro AuthProvider')
    }
    return ctx
}
