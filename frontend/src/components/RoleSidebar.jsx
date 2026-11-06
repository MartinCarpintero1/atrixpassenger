import { Link, NavLink, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { menuFor, roleLabel } from '../config/navigation'

/**
 * Barra lateral con el menú correspondiente al rol del usuario.
 * Reemplaza los menús fijos de cada módulo.
 */
function RoleSidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { main, extra } = menuFor(user?.role)

  function handleLogout() {
    const isStaff = user?.role !== 'USUARIO'
    logout()
    navigate(isStaff ? '/admin/login' : '/login', { replace: true })
  }

  const renderItem = (item) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.to === '/admin' || item.to === '/mi-cuenta'}
      className={({ isActive }) => (isActive ? 'admin-menu-active' : undefined)}
    >
      <span>{item.icon}</span> {item.label}
    </NavLink>
  )

  return (
    <aside className="admin-sidebar">
      <Link to="/" className="admin-brand">
        <span className="admin-logo-small">A</span>
        <span>
          <strong>ATRIX</strong>
          <small>PASSENGER</small>
        </span>
      </Link>

      <p className="admin-menu-label">MENÚ PRINCIPAL</p>
      <nav className="admin-menu">{main.map(renderItem)}</nav>

      {extra.length > 0 && (
        <>
          <p className="admin-menu-label">CATÁLOGO</p>
          <nav className="admin-menu">{extra.map(renderItem)}</nav>
        </>
      )}

      <div className="admin-sidebar-bottom sidebar-user">
        {user && (
          <div className="sidebar-user-info">
            <strong>{user.nombreCompleto || user.username}</strong>
            <small>{roleLabel(user.role)}</small>
          </div>
        )}
        <button type="button" className="sidebar-logout" onClick={handleLogout}>
          Cerrar sesión
        </button>
        <Link to="/">← Volver a la web pública</Link>
      </div>
    </aside>
  )
}

export default RoleSidebar
