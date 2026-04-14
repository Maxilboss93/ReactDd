import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../components/authentication/AuthContext.jsx'
import AuthPage from '../components/authentication/AuthPage.jsx'
import CharacterListPage from '../pages/CharacterListPage.jsx'
import CharacterPage from '../pages/CharacterPage.jsx'

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return children
}

function App() {
  const { isAuthenticated } = useAuth()

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? '/schede' : '/login'} replace />}
        />

        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/schede" replace /> : <AuthPage />}
        />

        <Route
          path="/schede"
          element={
            <RequireAuth>
              <CharacterListPage />
            </RequireAuth>
          }
        />

        <Route
          path="/scheda/:id"
          element={
            <RequireAuth>
              <CharacterPage />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
