import { Link } from 'react-router-dom'
import '../Admin.css'

function AdminLogin() {
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
          Ingresá al espacio de gestión de la plataforma.
        </p>

        <form onSubmit={(event) => event.preventDefault()}>
          <label htmlFor="username">Usuario</label>
          <input
            id="username"
            name="username"
            type="text"
            placeholder="Tu nombre de usuario"
            autoComplete="username"
            required
          />

          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Tu contraseña"
            autoComplete="current-password"
            required
          />

          <button type="submit" className="admin-primary-button">
            Ingresar
          </button>
        </form>

        <p className="admin-login-note">
          El inicio de sesión se conectará al backend en la etapa de seguridad.
        </p>
      </section>
    </main>
  )
}

export default AdminLogin
