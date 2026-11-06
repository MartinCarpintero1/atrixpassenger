import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import RoleLayout from '../components/RoleLayout'
import { api } from '../services/api'
import { formatDateTime, formatDuration, formatMoney } from '../utils/format'

/**
 * Módulo "Cupos" del pasajero: viajes programados con lugares libres
 * y reserva directa (descuenta cupos en el backend de forma atómica).
 */
function Cupos() {
  const navigate = useNavigate()
  const [cupos, setCupos] = useState([])
  const [cantidades, setCantidades] = useState({})
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)
  const [reservando, setReservando] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/api/me/cupos')
      .then(setCupos)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function reservar(cupo) {
    const cantidad = Number(cantidades[cupo.idSalida] || 1)
    const confirmado = window.confirm(
      `¿Reservar ${cantidad} lugar(es) para "${cupo.actividad}" por ${formatMoney(cupo.precioPorPersona * cantidad)}?`
    )
    if (!confirmado) return

    setReservando(cupo.idSalida)
    setError('')

    try {
      const viaje = await api.post('/api/me/reservas', {
        idSalida: cupo.idSalida,
        cantidadPasajeros: cantidad,
      })
      navigate(`/mi-cuenta?reserva=${viaje.idReserva}`)
    } catch (err) {
      setError(err.message)
      setReservando(null)
    }
  }

  const termino = busqueda.trim().toLowerCase()
  const visibles = cupos.filter((c) =>
    !termino ||
    [c.actividad, c.destino].some((v) => v?.toLowerCase().includes(termino))
  )

  return (
    <RoleLayout
      eyebrow="MI CUENTA"
      title="Cupos disponibles"
      description="Viajes programados con lugares libres."
      actions={
        <div className="module-filter" style={{ margin: 0 }}>
          <input
            placeholder="Buscar actividad o destino"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      }
    >
      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="module-panel empty-state">Buscando cupos...</div>
      ) : visibles.length === 0 ? (
        <div className="module-panel empty-state">
          <strong>No hay cupos disponibles</strong>
          Volvé a consultar más tarde.
        </div>
      ) : (
        <div className="cupo-grid">
          {visibles.map((cupo) => {
            const ocupacion = cupo.cuposTotales
              ? ((cupo.cuposTotales - cupo.cuposDisponibles) / cupo.cuposTotales) * 100
              : 0
            return (
              <article className="cupo-card" key={cupo.idSalida}>
                <div>
                  <h3>{cupo.actividad}</h3>
                  <p>{cupo.destino} · {cupo.dificultad || 'Sin dificultad'}</p>
                </div>
                <p>{formatDateTime(cupo.fechaHoraSalida)} · {formatDuration(cupo.duracionEstimada)}</p>

                <div className="cupo-meta">
                  <span><strong>{cupo.cuposDisponibles}</strong> de {cupo.cuposTotales} libres</span>
                  <strong>{formatMoney(cupo.precioPorPersona)}</strong>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${ocupacion}%` }} />
                </div>

                {cupo.yaReservado ? (
                  <span className="status-pill status-confirmada">Ya tenés una reserva</span>
                ) : (
                  <div className="cupo-reserve">
                    <input
                      type="number"
                      min="1"
                      max={Math.min(10, cupo.cuposDisponibles)}
                      value={cantidades[cupo.idSalida] || 1}
                      aria-label="Cantidad de pasajeros"
                      onChange={(e) =>
                        setCantidades({ ...cantidades, [cupo.idSalida]: e.target.value })
                      }
                    />
                    <button
                      type="button"
                      className="admin-primary-button"
                      disabled={reservando === cupo.idSalida}
                      onClick={() => reservar(cupo)}
                    >
                      {reservando === cupo.idSalida ? 'Reservando...' : 'Reservar'}
                    </button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </RoleLayout>
  )
}

export default Cupos
