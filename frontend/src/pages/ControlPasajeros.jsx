import { useCallback, useEffect, useMemo, useState } from 'react'

import RoleLayout from '../components/RoleLayout'
import { api } from '../services/api'
import { formatDateTime, statusClass } from '../utils/format'

/**
 * Módulo extra del OPERADOR: "Control pasajeros" (colectivo/avión).
 * Manifiesto de pasajeros por viaje con datos de salud/emergencia y
 * check-in en tiempo real. Imprimible para llevar en el vehículo.
 */
function ControlPasajeros() {
  const [salidas, setSalidas] = useState([])
  const [idSalida, setIdSalida] = useState('')
  const [manifiesto, setManifiesto] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Viajes activos ordenados por cercanía a la fecha actual.
  useEffect(() => {
    api.get('/api/salidas')
      .then((lista) => {
        const activos = lista
          .filter((s) => s.estadoSalida !== 'Cancelada')
          .sort((a, b) => new Date(a.fechaHoraSalida) - new Date(b.fechaHoraSalida))
        setSalidas(activos)
        const proximo = activos.find((s) => new Date(s.fechaHoraSalida) >= new Date(Date.now() - 12 * 3600e3))
        if (proximo) seleccionarSalida(String(proximo.idSalida))
      })
      .catch((err) => setError(err.message))
  }, [])

  function seleccionarSalida(id) {
    setIdSalida(id)
    setManifiesto([])
    setError('')
    setLoading(Boolean(id))
  }

  const cargarManifiesto = useCallback(() => {
    if (!idSalida) return
    api.get(`/api/operacion/salidas/${idSalida}/manifiesto`)
      .then(setManifiesto)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [idSalida])

  useEffect(cargarManifiesto, [cargarManifiesto])

  async function toggleCheckIn(item) {
    try {
      await api.patch(`/api/reserva-pasajeros/${item.idReservaPasajero}/check-in?realizado=${!item.checkInRealizado}`)
      setManifiesto((rows) =>
        rows.map((r) =>
          r.idReservaPasajero === item.idReservaPasajero ? { ...r, checkInRealizado: !r.checkInRealizado } : r
        )
      )
    } catch (err) {
      setError(err.message)
    }
  }

  const salida = salidas.find((s) => String(s.idSalida) === idSalida)
  const aBordo = manifiesto.filter((m) => m.checkInRealizado).length
  const termino = busqueda.trim().toLowerCase()
  const visibles = useMemo(
    () => manifiesto.filter((m) =>
      !termino || [m.pasajero, m.documento, m.codigoReserva].some((v) => v?.toLowerCase().includes(termino))
    ),
    [manifiesto, termino]
  )

  return (
    <RoleLayout
      eyebrow="OPERACIÓN"
      title="Control pasajeros"
      description="Lista de abordaje y control de pasajeros a bordo por viaje."
      actions={manifiesto.length > 0 && (
        <button type="button" className="secondary-button" onClick={() => window.print()}>Imprimir lista de pasajeros</button>
      )}
    >
      <div className="module-filter">
        <label>
          Viaje
          <select value={idSalida} onChange={(e) => seleccionarSalida(e.target.value)}>
            <option value="">Seleccioná un viaje</option>
            {salidas.map((s) => (
              <option key={s.idSalida} value={s.idSalida}>
                {formatDateTime(s.fechaHoraSalida)} · {s.actividad?.nombre} ({s.estadoSalida})
              </option>
            ))}
          </select>
        </label>
        <label>
          Buscar
          <input placeholder="Pasajero, documento o código" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </label>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {salida && (
        <div className="stat-grid">
          <div className="stat-card"><span>Viaje</span><strong style={{ fontSize: 16 }}>{salida.actividad?.nombre}</strong><small>{salida.actividad?.destino?.nombreDestino}</small></div>
          <div className="stat-card"><span>Salida</span><strong style={{ fontSize: 16 }}>{formatDateTime(salida.fechaHoraSalida)}</strong><small><span className={statusClass(salida.estadoSalida)}>{salida.estadoSalida}</span></small></div>
          <div className="stat-card"><span>A bordo</span><strong>{aBordo} / {manifiesto.length}</strong></div>
          <div className="stat-card"><span>Con alertas médicas</span><strong>{manifiesto.filter((m) => m.alergias || m.medicacionHabitual).length}</strong></div>
        </div>
      )}

      <section className="module-panel">
        {loading ? (
          <div className="empty-state">Cargando lista de abordaje...</div>
        ) : visibles.length === 0 ? (
          <div className="empty-state"><strong>Sin pasajeros</strong>No hay pasajeros asociados a este viaje.</div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>Pasajero</th><th>Reserva</th><th>Salud</th><th>Emergencia</th><th>Check-in</th></tr>
              </thead>
              <tbody>
                {visibles.map((m) => (
                  <tr key={m.idReservaPasajero} className={m.checkInRealizado ? 'row-done' : undefined}>
                    <td><strong>{m.pasajero}</strong><small>Doc. {m.documento}{m.telefono ? ` · ${m.telefono}` : ''}</small></td>
                    <td>{m.codigoReserva}<small><span className={statusClass(m.estadoReserva)}>{m.estadoReserva}</span></small></td>
                    <td>
                      {m.grupoSanguineo && <small>Grupo {m.grupoSanguineo}</small>}
                      {m.alergias && <small>⚠ Alergias: {m.alergias}</small>}
                      {m.medicacionHabitual && <small>💊 {m.medicacionHabitual}</small>}
                      {!m.grupoSanguineo && !m.alergias && !m.medicacionHabitual && <small>—</small>}
                    </td>
                    <td><small>{m.contactoEmergencia || '—'}</small></td>
                    <td>
                      <button
                        type="button"
                        className={m.checkInRealizado ? 'secondary-button' : 'admin-primary-button'}
                        onClick={() => toggleCheckIn(m)}
                      >
                        {m.checkInRealizado ? '✓ A bordo' : 'Marcar a bordo'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </RoleLayout>
  )
}

export default ControlPasajeros
