import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import '../Auth.css'

function AdminRegister() {
  const { registerOperator } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    nombreCompleto: '',
    nombreAgencia: '',
    telefono: '',
    // Código entregado por la administración (STAFF_REGISTRATION_CODE en Railway).
    codigoRegistro: '',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const user = await registerOperator(form)

      if (user.role !== 'OPERADOR') {
        throw new Error('No se pudo validar el rol de operador.')
      }

      navigate('/admin', { replace: true })
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

        <h1>Registro administrativo</h1>

        <p className="auth-description">
          Creá tu cuenta para acceder al espacio de gestión.
        </p>

        {error && (
          <div className="auth-message auth-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Nombre completo
            <input
              name="nombreCompleto"
              value={form.nombreCompleto}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Nombre de la agencia
            <input
              name="nombreAgencia"
              value={form.nombreAgencia}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Teléfono
            <input
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Nombre de usuario
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
              required
            />
          </label>

          <label>
            Correo electrónico
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>

          <label>
            Código de alta administrativa
            <input
              name="codigoRegistro"
              type="password"
              value={form.codigoRegistro}
              onChange={handleChange}
              autoComplete="off"
              required
            />
            <small className="auth-hint">
              Solicitalo a un administrador. Los administradores se dan de alta
              desde Configuración dentro del panel.
            </small>
          </label>

          <button
            type="submit"
            className="auth-primary-button"
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Crear cuenta de operador'}
          </button>
        </form>

        <p className="auth-footer-text">
          ¿Ya tenés una cuenta? <Link to="/admin/login">Iniciar sesión</Link>
        </p>
      </section>
    </main>
  )
}

export default AdminRegister