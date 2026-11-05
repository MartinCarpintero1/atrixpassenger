import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import '../Auth.css'

function Login() {
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
      const user = await login(identifier, password)

      if (user.role !== 'USUARIO') {
        logout()
        throw new Error(
          'Esta cuenta debe ingresar desde el acceso administrativo.'
        )
      }

      navigate('/mi-cuenta', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card auth-card-compact">
        <Link to="/" className="auth-back">
          ← Volver a Atrix Passenger
        </Link>

        <div className="auth-logo">A</div>

        <p className="auth-eyebrow">ATRIX PASSENGER</p>

        <h1>Bienvenido nuevamente</h1>

        <p className="auth-description">
          Ingresá a tu cuenta de pasajero.
        </p>

        {error && (
          <div className="auth-message auth-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Usuario o correo electrónico
            <input
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              autoComplete="username"
              required
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          <button
            type="submit"
            className="auth-primary-button"
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="auth-footer-text">
          ¿Todavía no tenés una cuenta? <Link to="/registro">Registrarse</Link>
        </p>
      </section>
    </main>
  )
}

export default Login