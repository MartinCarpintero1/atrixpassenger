import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import '../Admin.css'

const STAFF_ROLES = ['ADMINISTRADOR', 'OPERADOR']

/**
 * Login del panel administrativo (administradores y operadores).
 * Rechaza cuentas de pasajeros, que deben usar /login.
 */
function AdminLogin() {
  const { login, logout } = useAuth()
  const navigate = useNavigate()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const user = await login(identifier.trim(), password)

      if (!STAFF_ROLES.includes(user.role)) {
        logout()
        throw new Error(
          'Esta cuenta es de pasajero. Ingresá desde el acceso general.'
        )
      }

      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <Link to="/" className="admin-back-link">
          ← Volver a Atrix Passenger
        </Link>

        <div className="admin-logo">A</div>

        <p className="admin-eyebrow">ATRIX PASSENGER</p>
        <h1>Panel administrativo</h1>
        <p className="admin-description">
          Acceso exclusivo para administradores y operadores.
        </p>

        {error && <div className="admin-login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label htmlFor="identifier">Usuario o correo electrónico</label>
          <input
            id="identifier"
            name="identifier"
            type="text"
            placeholder="Tu usuario o correo"
            autoComplete="username"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            required
          />

          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Tu contraseña"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <button
            type="submit"
            className="admin-primary-button"
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Ingresar al panel'}
          </button>
        </form>

        <p className="admin-login-note">
          ¿Sos operador nuevo?{' '}
          <Link to="/admin/registro">Registrate con tu código de alta</Link>
        </p>
      </section>
    </main>
  )
}

export default AdminLogin
