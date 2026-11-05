import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import '../Auth.css'

function Register() {
  const { registerPassenger } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    nombre: '',
    apellido: '',
    tipoDocumento: 'DNI',
    nroDocumento: '',
    fechaNacimiento: '',
    nacionalidad: '',
    contactoTel: '',
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
      await registerPassenger(form)
      navigate('/mi-cuenta', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link to="/" className="auth-back">
          ← Volver a Atrix Passenger
        </Link>

        <div className="auth-logo">A</div>

        <p className="auth-eyebrow">ATRIX PASSENGER</p>

        <h1>Crear cuenta de pasajero</h1>

        <p className="auth-description">
          Registrate para organizar y consultar tus viajes.
        </p>

        {error && (
          <div className="auth-message auth-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">

          <div className="auth-grid">
            <label>
              Nombre
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Apellido
              <input
                name="apellido"
                value={form.apellido}
                onChange={handleChange}
                required
              />
            </label>
          </div>

          <label>
            Tipo de documento
            <select
              name="tipoDocumento"
              value={form.tipoDocumento}
              onChange={handleChange}
              required
            >
              <option value="DNI">DNI</option>
              <option value="Pasaporte">Pasaporte</option>
              <option value="Otro">Otro</option>
            </select>
          </label>

          <label>
            Número de documento
            <input
              name="nroDocumento"
              value={form.nroDocumento}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Fecha de nacimiento
            <input
              type="date"
              name="fechaNacimiento"
              value={form.fechaNacimiento}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Nacionalidad
            <input
              name="nacionalidad"
              value={form.nacionalidad}
              onChange={handleChange}
            />
          </label>

          <label>
            Teléfono
            <input
              name="contactoTel"
              value={form.contactoTel}
              onChange={handleChange}
              required
            />
          </label>

          <hr />

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

          <button
            type="submit"
            className="auth-primary-button"
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="auth-footer-text">
          ¿Ya tenés una cuenta? <Link to="/login">Iniciar sesión</Link>
        </p>
      </section>
    </main>
  )
}

export default Register