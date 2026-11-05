import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

import { apiRequest } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(
    () => sessionStorage.getItem('atrix_token')
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
        sessionStorage.removeItem('atrix_token')
        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    restoreSession()
  }, [token])

  async function saveAuthentication(response) {
    sessionStorage.setItem('atrix_token', response.token)
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

  function logout() {
    sessionStorage.removeItem('atrix_token')
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