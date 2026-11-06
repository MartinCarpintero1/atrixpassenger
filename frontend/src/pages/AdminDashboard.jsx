import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import RoleLayout from '../components/RoleLayout'
import { useAuth } from '../context/AuthContext'
import { menuFor, roleLabel } from '../config/navigation'
import { api } from '../services/api'
import { formatDateTime, formatMoney, statusClass } from '../utils/format'

/**
 * Dashboard del panel. Las tarjetas de módulos se generan a partir
 * del menú del rol (ADMINISTRADOR u OPERADOR).
 */
function AdminDashboard() {
  const { user } = useAuth()
  const esAdmin = user?.role === 'ADMINISTRADOR'
  const { main, extra } = menuFor(user?.role)
  const modulos = [...main.filter((m) => m.to !== '/admin'), ...extra]

  const [resumen, setResumen] = useState(null)
  const [proximos, setProximos] = useState([])

  useEffect(() => {
    if (esAdmin) {
      api.get('/api/metricas/resumen').then(setResumen).catch(() => setResumen(null))
    }
    api.get('/api/salidas')
      .then((lista) => {
        const ahora = Date.now()
        setProximos(
          lista
            .filter((s) => new Date(s.fechaHoraSalida).getTime() >= ahora && s.estadoSalida !== 'Cancelada')
            .sort((a, b) => new Date(a.fechaHoraSalida) - new Date(b.fechaHoraSalida))
            .slice(0, 5)
        )
      })
      .catch(() => setProximos([]))
  }, [esAdmin])

  return (
    <RoleLayout eyebrow={roleLabel(user?.role).toUpperCase()} title="Dashboard">
      <section className="admin-welcome">
        <div>
          <p>HOLA, {(user?.nombreCompleto || user?.username || '').toUpperCase()}</p>
          <h2>{esAdmin ? 'Gestioná tu operación turística.' : 'Controlá la operación del día.'}</h2>
          <span>Accedé a los módulos habilitados para tu rol.</span>
        </div>
        <div className="admin-welcome-icon">✦</div>
      </section>

      {resumen && (
        <div className="stat-grid">
          <div className="stat-card"><span>Reservas</span><strong>{resumen.totalReservas}</strong></div>
          <div className="stat-card"><span>Viajes próximos</span><strong>{resumen.viajesProximos}</strong></div>
          <div className="stat-card"><span>Ocupación</span><strong>{resumen.ocupacionPorcentaje}%</strong></div>
          <div className="stat-card"><span>Cobrado</span><strong>{formatMoney(resumen.ingresosCobrados)}</strong></div>
        </div>
      )}

      <section className="module-panel">
        <h2>Próximos viajes</h2>
        <p>Las cinco salidas más cercanas.</p>
        {proximos.length === 0 ? (
          <div className="empty-state">No hay viajes próximos.</div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead><tr><th>Viaje</th><th>Salida</th><th>Cupos</th><th>Estado</th></tr></thead>
              <tbody>
                {proximos.map((s) => (
                  <tr key={s.idSalida}>
                    <td><strong>{s.actividad?.nombre}</strong><small>{s.actividad?.destino?.nombreDestino}</small></td>
                    <td>{formatDateTime(s.fechaHoraSalida)}</td>
                    <td>{s.cuposDisponibles} / {s.cuposTotales}</td>
                    <td><span className={statusClass(s.estadoSalida)}>{s.estadoSalida}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-section">
        <div className="admin-section-heading">
          <div>
            <h2>Módulos</h2>
            <p>Seleccioná un área para comenzar a trabajar.</p>
          </div>
        </div>

        <div className="admin-module-grid">
          {modulos.map((modulo) => (
            <Link
              to={modulo.to}
              className="admin-module-card"
              key={modulo.to}
              style={{ color: 'inherit', textDecoration: 'none' }}
            >
              <span className="admin-module-icon">{modulo.icon}</span>
              <h3>{modulo.label}</h3>
              <p>{modulo.description}</p>
              <span className="admin-module-link">Abrir <span>→</span></span>
            </Link>
          ))}
        </div>
      </section>
    </RoleLayout>
  )
}

export default AdminDashboard
