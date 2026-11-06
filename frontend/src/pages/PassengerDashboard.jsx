import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import RoleLayout from '../components/RoleLayout'
import TicketPreview from '../components/TicketPreview'
import { api } from '../services/api'
import {
  formatDateTime,
  formatDuration,
  formatMoney,
  statusClass,
} from '../utils/format'

/**
 * Módulo "Mis viajes" del pasajero.
 * Lista los viajes en los que está registrado; al seleccionar uno
 * muestra el detalle completo y la vista previa del ticket PDF.
 */
function PassengerDashboard() {
  const [viajes, setViajes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('proximos')
  const [searchParams, setSearchParams] = useSearchParams()

  const selectedId = Number(searchParams.get('reserva')) || null

  useEffect(() => {
    api.get('/api/me/viajes')
      .then((lista) => {
        // Se calcula una sola vez al cargar (evita Date.now() en el render).
        const ahora = Date.now()
        setViajes(lista.map((v) => ({
          ...v,
          futuro: Boolean(v.fechaHoraSalida) && new Date(v.fechaHoraSalida).getTime() >= ahora,
        })))
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const visibles = useMemo(() => {
    return viajes.filter((v) => {
      if (filtro === 'proximos') return v.futuro && v.estadoReserva !== 'Cancelada'
      if (filtro === 'pasados') return !v.futuro || v.estadoReserva === 'Cancelada'
      return true
    })
  }, [viajes, filtro])

  const seleccionado =
    viajes.find((v) => v.idReserva === selectedId) || visibles[0] || null

  function seleccionar(viaje) {
    setSearchParams({ reserva: String(viaje.idReserva) })
  }

  return (
    <RoleLayout
      eyebrow="MI CUENTA"
      title="Mis viajes"
      description="Seleccioná un viaje para ver el detalle y tu ticket."
      actions={
        <div className="module-filter" style={{ margin: 0 }}>
          <select value={filtro} onChange={(e) => setFiltro(e.target.value)} aria-label="Filtrar viajes">
            <option value="proximos">Próximos</option>
            <option value="pasados">Pasados / cancelados</option>
            <option value="todos">Todos</option>
          </select>
        </div>
      }
    >
      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="module-panel empty-state">Cargando tus viajes...</div>
      ) : visibles.length === 0 ? (
        <div className="module-panel empty-state">
          <strong>No tenés viajes en esta vista</strong>
          Buscá lugares disponibles en <Link to="/mi-cuenta/cupos">Cupos</Link>.
        </div>
      ) : (
        <div className="trip-layout">
          <div className="trip-list">
            {visibles.map((viaje) => (
              <button
                key={viaje.idReserva}
                type="button"
                className={`trip-card ${seleccionado?.idReserva === viaje.idReserva ? 'selected' : ''}`}
                onClick={() => seleccionar(viaje)}
              >
                <strong>{viaje.actividad}</strong>
                <small>{viaje.destino}</small>
                <small>{formatDateTime(viaje.fechaHoraSalida)}</small>
                <div className="trip-card-footer">
                  <span className={statusClass(viaje.estadoReserva)}>{viaje.estadoReserva}</span>
                  <small>{viaje.cantidadPasajeros} pax · {formatMoney(viaje.valorTotal)}</small>
                </div>
              </button>
            ))}
          </div>

          {seleccionado && (
            <div>
              <section className="module-panel">
                <h2>{seleccionado.actividad}</h2>
                <p>{seleccionado.descripcionActividad || seleccionado.descripcionDestino}</p>

                <div className="detail-grid">
                  <div><span>Código</span><strong>{seleccionado.codigoReserva}</strong></div>
                  <div><span>Destino</span><strong>{seleccionado.destino}</strong></div>
                  <div><span>Salida</span><strong>{formatDateTime(seleccionado.fechaHoraSalida)}</strong></div>
                  <div><span>Duración</span><strong>{formatDuration(seleccionado.duracionEstimada)}</strong></div>
                  <div><span>Dificultad</span><strong>{seleccionado.dificultad || '—'}</strong></div>
                  <div><span>Estado del viaje</span><strong><span className={statusClass(seleccionado.estadoSalida)}>{seleccionado.estadoSalida}</span></strong></div>
                  <div><span>Guía</span><strong>{seleccionado.guia || 'A confirmar'}</strong></div>
                  <div><span>Vehículo</span><strong>{seleccionado.vehiculo ? `${seleccionado.vehiculo} · ${seleccionado.patente}` : 'A confirmar'}</strong></div>
                  <div><span>Pasajeros</span><strong>{seleccionado.cantidadPasajeros}</strong></div>
                  <div><span>Total</span><strong>{formatMoney(seleccionado.valorTotal)}</strong></div>
                  <div><span>Pago</span><strong><span className={statusClass(seleccionado.estadoPago)}>{seleccionado.estadoPago}</span></strong></div>
                  <div><span>Check-in</span><strong>{seleccionado.checkInRealizado ? 'Realizado' : 'Pendiente'}</strong></div>
                </div>
              </section>

              <TicketPreview key={seleccionado.idReserva} viaje={seleccionado} />
            </div>
          )}
        </div>
      )}
    </RoleLayout>
  )
}

export default PassengerDashboard
