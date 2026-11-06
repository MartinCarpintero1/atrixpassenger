import RoleSidebar from './RoleSidebar'
import '../Admin.css'
import '../Modules.css'

/**
 * Estructura común de los paneles (administrador, operador y pasajero):
 * barra lateral por rol + encabezado + contenido.
 */
function RoleLayout({ eyebrow, title, description, actions, children }) {
  return (
    <div className="admin-layout">
      <RoleSidebar />

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            {eyebrow && <p className="admin-eyebrow">{eyebrow}</p>}
            <h1>{title}</h1>
            {description && <p className="module-description">{description}</p>}
          </div>
          {actions && <div className="module-actions">{actions}</div>}
        </header>

        {children}

        <footer className="admin-footer">Atrix Passenger</footer>
      </main>
    </div>
  )
}

export default RoleLayout
