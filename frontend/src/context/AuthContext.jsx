import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

import { apiRequest, TOKEN_KEY } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(
    () => sessionStorage.getItem(TOKEN_KEY)
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function restoreSession() {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const currentUser = await apiRequest(
          '/api/auth/me',
          { method: 'GET' },
          token
        )

        setUser(currentUser)
      } catch {
        sessionStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    restoreSession()
  }, [token])

  async function saveAuthentication(response) {
    sessionStorage.setItem(TOKEN_KEY, response.token)
    setToken(response.token)
    setUser(response.user)

    return response.user
  }

  async function login(identifier, password) {
    const response = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    })

    return saveAuthentication(response)
  }

  async function registerPassenger(formData) {
    const response = await apiRequest(
      '/api/auth/register/passenger',
      {
        method: 'POST',
        body: JSON.stringify(formData),
      }
    )

    return saveAuthentication(response)
  }

  async function registerOperator(formData) {
    const response = await apiRequest(
      '/api/auth/register/operator',
      {
        method: 'POST',
        body: JSON.stringify(formData),
      }
    )

    return saveAuthentication(response)
  }

  /** Refresca el usuario en memoria tras editar el perfil. */
  function updateUser(nextUser) {
    setUser(nextUser)
  }

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        registerPassenger,
        registerOperator,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth debe utilizarse dentro de AuthProvider'
    )
  }

  return context
}