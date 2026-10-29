import { Link } from 'react-router-dom'
import '../Admin.css'

const sections = [
  { icon: '🗺️', title: 'Destinos', description: 'Administrar destinos turísticos' },
  { icon: '🏞️', title: 'Actividades', description: 'Gestionar experiencias' },
  { icon: '🚌', title: 'Salidas', description: 'Organizar salidas programadas' },
  { icon: '🎟️', title: 'Reservas', description: 'Consultar y gestionar reservas' },
  { icon: '👥', title: 'Pasajeros', description: 'Administrar pasajeros' },
  { icon: '💳', title: 'Pagos', description: 'Consultar pagos y estados' },
  { icon: '🧭', title: 'Guías', description: 'Administrar guías turísticos' },
  { icon: '🚐', title: 'Vehículos', description: 'Gestionar la flota' },
  { icon: '🔐', title: 'Usuarios y roles', description: 'Administrar accesos' },
  { icon: '📋', title: 'Auditoría', description: 'Consultar actividad del sistema' },
]

function AdminDashboard() {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link to="/" className="admin-brand">
          <span className="admin-logo-small">A</span>
          <span>
            <strong>ATRIX</strong>
            <small>PASSENGER</small>
          </span>
        </Link>

        <p className="admin-menu-label">MENÚ PRINCIPAL</p>

        <nav className="admin-menu">
          <a className="admin-menu-active" href="#resumen">
            <span>▦</span> Dashboard
          </a>
          <a href="#gestion">
            <span>☷</span> Gestión
          </a>
        </nav>

        <div className="admin-sidebar-bottom">
          <Link to="/">← Volver a la web pública</Link>
        </div>
      </aside>

      <main className="admin-main" id="resumen">
        <header className="admin-topbar">
          <div>
            <p className="admin-eyebrow">ADMINISTRACIÓN</p>
            <h1>Dashboard</h1>
          </div>
          <span className="admin-preview-badge">Vista inicial</span>
        </header>

        <section className="admin-welcome">
          <div>
            <p>BIENVENIDO A ATRIX PASSENGER</p>
            <h2>Gestioná tu operación turística.</h2>
            <span>
              Accedé a los módulos principales desde un solo lugar.
            </span>
          </div>
          <div className="admin-welcome-icon">✦</div>
        </section>

        <section className="admin-section" id="gestion">
          <div className="admin-section-heading">
            <div>
              <h2>Módulos del sistema</h2>
              <p>Seleccioná un área para comenzar a trabajar.</p>
            </div>
          </div>

          <div className="admin-module-grid">

            {sections.map((section) => {
              const rutas = {
                Destinos: '/admin/destinos',
                Actividades: '/admin/actividades',
              }

              const ruta = rutas[section.title]

              return ruta ? (
                <Link
                  to={ruta}
                  className="admin-module-card"
                  key={section.title}
                  style={{ color: 'inherit', textDecoration: 'none' }}
                >
                  <span className="admin-module-icon">{section.icon}</span>
                  <h3>{section.title}</h3>
                  <p>{section.description}</p>
                  <span className="admin-module-link">
                    Administrar <span>→</span>
                  </span>
                </Link>
              ) : (
                <article className="admin-module-card" key={section.title}>
                  <span className="admin-module-icon">{section.icon}</span>
                  <h3>{section.title}</h3>
                  <p>{section.description}</p>
                  <span className="admin-module-link">
                    Próximamente <span>→</span>
                  </span>
                </article>
              )
            })}

          </div>

        </section>

        <footer className="admin-footer">
          Atrix Passenger · Panel de administración
        </footer>
      </main>
    </div>
  )
}

export default AdminDashboard
