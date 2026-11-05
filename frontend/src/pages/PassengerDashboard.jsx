import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import '../Auth.css'

function PassengerDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <main className="auth-page">
      <section className="auth-card auth-card-compact">
        <div className="auth-logo">A</div>

        <p className="auth-eyebrow">MI CUENTA</p>

        <h1>¡Hola, {user?.nombreCompleto}!</h1>

        <p className="auth-description">
          Ya ingresaste a Atrix Passenger.
        </p>

        <div className="passenger-info">
          <p><strong>Usuario:</strong> {user?.username}</p>
          <p><strong>Email:</strong> {user?.email}</p>
        </div>

        <Link to="/" className="auth-secondary-button">
          Volver al inicio
        </Link>

        <button
          className="auth-primary-button"
          onClick={handleLogout}
        >
          Cerrar sesión
        </button>
      </section>
    </main>
  )
}

export default PassengerDashboard