
import { Link } from 'react-router-dom'
import '../App.css'

const activities = [
  {
    id: 1,
    category: 'Naturaleza',
    title: 'Aventura entre montañas',
    location: 'Mendoza, Argentina',
    duration: 'Día completo',
    price: 'Consultar tarifa',
    image:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 2,
    category: 'Paisajes',
    title: 'Descubrí lagos y senderos',
    location: 'Circuito natural',
    duration: 'Media jornada',
    price: 'Consultar tarifa',
    image:
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 3,
    category: 'Experiencias',
    title: 'Una escapada inolvidable',
    location: 'Turismo regional',
    duration: 'Salida programada',
    price: 'Consultar tarifa',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=85',
  },
]

function Promocional() {
  return (
    <div className="app-shell" id="inicio">
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Atrix Passenger, inicio">
          <span className="brand-mark">A</span>
          <span>
            <strong>ATRIX</strong>
            <small>PASSENGER</small>
          </span>
        </a>

        <nav className="main-nav" aria-label="Navegación principal">
          <a className="nav-active" href="#inicio">Inicio</a>
          <a href="#actividades">Actividades</a>
          <a href="#como-funciona">Cómo funciona</a>
        </nav>

        <Link className="button button-outline header-button" to="/login">
          Ingresar
        </Link>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">
              VIAJÁ · DESCUBRÍ · DISFRUTÁ
            </span>

            <h1>
              Tu próxima aventura
              <span> empieza acá.</span>
            </h1>

            <p>
              Encontrá experiencias, conocé nuevos destinos y organizá
              tus viajes en un solo lugar.
            </p>

            <div className="hero-actions">
              <a className="button button-primary" href="#actividades">
                Explorar actividades <span aria-hidden="true">→</span>
              </a>

              <a className="button button-light" href="#como-funciona">
                Conocer más
              </a>
            </div>

            <div className="hero-trust">
              <span className="trust-icon">✓</span>
              Información clara, reservas organizadas y atención personalizada.
            </div>
          </div>

          <div className="hero-visual">
            <img
              src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=90"
              alt="Paisaje de montañas que invita a descubrir nuevos destinos"
            />

            <div className="image-caption">
              <span className="caption-dot" />
              <div>
                <strong>Tu próxima historia</strong>
                <small>Empieza con un destino</small>
              </div>
              <span className="caption-arrow">↗</span>
            </div>

            <div className="floating-label">
              <span className="floating-icon">✦</span>
              Nuevas experiencias te esperan
            </div>
          </div>
        </section>

        <section className="quick-benefits" aria-label="Beneficios">
          <article>
            <span className="benefit-icon">⌖</span>
            <div>
              <strong>Destinos para descubrir</strong>
              <p>Encontrá experiencias turísticas.</p>
            </div>
          </article>

          <article>
            <span className="benefit-icon">▦</span>
            <div>
              <strong>Salidas organizadas</strong>
              <p>Consultá fechas y disponibilidad.</p>
            </div>
          </article>

          <article>
            <span className="benefit-icon">✓</span>
            <div>
              <strong>Reservas centralizadas</strong>
              <p>Gestioná tus viajes en un mismo lugar.</p>
            </div>
          </article>
        </section>

        <section className="activities-section" id="actividades">
          <div className="section-heading">
            <div>
              <span className="eyebrow">INSPIRACIÓN PARA TU VIAJE</span>
              <h2>Experiencias para descubrir</h2>
              <p>
                Explorá algunas ideas para tu próxima aventura.
              </p>
            </div>

            <span className="demo-label">Contenido de demostración</span>
          </div>

          <div className="activity-grid">
            {activities.map((activity) => (
              <article className="activity-card" key={activity.id}>
                <div className="activity-image">
                  <img src={activity.image} alt={activity.title} />
                  <span className="activity-category">
                    {activity.category}
                  </span>
                </div>

                <div className="activity-content">
                  <p className="activity-location">
                    <span aria-hidden="true">⌖</span> {activity.location}
                  </p>

                  <h3>{activity.title}</h3>

                  <div className="activity-footer">
                    <span>{activity.duration}</span>
                    <strong>{activity.price}</strong>
                  </div>

                  <Link className="activity-link" to="/login">
                    Conocer más <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="how-section" id="como-funciona">
          <div>
            <span className="eyebrow">SIMPLE Y ORGANIZADO</span>
            <h2>Tu viaje, en tres pasos</h2>
            <p>
              La idea es que puedas encontrar una actividad, elegir una
              salida disponible y administrar tu reserva desde la plataforma.
            </p>
          </div>

          <div className="steps-grid">
            <article className="step-card">
              <span>01</span>
              <h3>Elegí tu experiencia</h3>
              <p>Explorá actividades y consultá sus detalles.</p>
            </article>

            <article className="step-card">
              <span>02</span>
              <h3>Organizá tu salida</h3>
              <p>Seleccioná una fecha y revisá la disponibilidad.</p>
            </article>

            <article className="step-card">
              <span>03</span>
              <h3>Gestioná tu reserva</h3>
              <p>Consultá los datos de tu viaje desde tu cuenta.</p>
            </article>
          </div>
        </section>

        <section className="access-section" id="acceso">
          <div>
            <span className="eyebrow">ÁREA DE USUARIOS</span>
            <h2>Tu espacio de viaje</h2>
            <p>
              Accedé a tu cuenta para organizar tus reservas o administrar
              las operaciones de la empresa.
            </p>

            <div className="hero-actions access-actions">
              <Link className="button button-primary" to="/login">
                Acceso pasajeros
              </Link>

              <Link className="button button-light" to="/registro">
                Crear cuenta
              </Link>

              <Link className="button button-outline" to="/admin/login">
                Acceso administrativo
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#inicio">
          <span className="brand-mark">A</span>
          <span>
            <strong>ATRIX</strong>
            <small>PASSENGER</small>
          </span>
        </a>

        <p>Una mejor forma de organizar tus viajes.</p>
      </footer>
    </div>
  )
}

export default Promocional
