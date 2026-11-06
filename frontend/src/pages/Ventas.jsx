import { useCallback, useEffect, useState } from 'react'

import RoleLayout from '../components/RoleLayout'
import BarList from '../components/BarList'
import { api } from '../services/api'
import { formatDateTime, formatMoney, statusClass } from '../utils/format'

/** Ventas y cobros por período (sólo ADMINISTRADOR). */
function Ventas() {
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const cargar = useCallback(() => {
    const params = new URLSearchParams()
    if (desde) params.set('desde', desde)
    if (hasta) params.set('hasta', hasta)
    api.get(`/api/metricas/ventas?${params}`)
      .then((result) => {
        setData(result)
        setError('')
      })
      .catch((err) => setError(err.message))
  }, [desde, hasta])

  useEffect(cargar, [cargar])

  function exportarCsv() {
    const rows = [
      ['ID pago', 'Reserva', 'Código', 'Viaje', 'Monto', 'Método', 'Estado', 'Fecha'],
      ...data.pagos.map((p) => [p.idPago, p.idReserva, p.codigoReserva, p.viaje, p.monto, p.metodoPago, p.estadoPago, p.fechaPago]),
    ]
    const csv = rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\n')
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
    const link = Object.assign(document.createElement('a'), { href: url, download: 'ventas-atrix.csv' })
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <RoleLayout
      eyebrow="ADMINISTRACIÓN"
      title="Ventas"
      description="Cobros registrados por período y método de pago."
      actions={data?.pagos?.length > 0 && (
        <button type="button" className="secondary-button" onClick={exportarCsv}>Exportar CSV</button>
      )}
    >
      <div className="module-filter">
        <label>Desde<input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /></label>
        <label>Hasta<input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} /></label>
        {(desde || hasta) && (
          <button type="button" className="secondary-button" onClick={() => { setDesde(''); setHasta('') }}>Limpiar</button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {data && (
        <>
          <div className="stat-grid">
            <div className="stat-card"><span>Total cobrado</span><strong>{formatMoney(data.totalCobrado)}</strong></div>
            <div className="stat-card"><span>Pagos completados</span><strong>{data.cantidadPagos}</strong></div>
            <div className="stat-card"><span>Ticket promedio</span><strong>{formatMoney(data.ticketPromedio)}</strong></div>
          </div>

          <div className="two-columns">
            <section className="module-panel">
              <h2>Cobrado por mes</h2>
              <p>Pagos completados.</p>
              <BarList data={data.porMes} format={formatMoney} />
            </section>
            <section className="module-panel">
              <h2>Por método de pago</h2>
              <p>Pagos completados.</p>
              <BarList data={data.porMetodo} format={formatMoney} />
            </section>
          </div>

          <section className="module-panel">
            <h2>Detalle de pagos</h2>
            <p>{data.pagos.length} pago(s) en el período.</p>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr><th>Fecha</th><th>Reserva</th><th>Viaje</th><th>Método</th><th>Estado</th><th>Monto</th></tr>
                </thead>
                <tbody>
                  {data.pagos.map((p) => (
                    <tr key={p.idPago}>
                      <td>{formatDateTime(p.fechaPago)}</td>
                      <td>#{p.idReserva}<small>{p.codigoReserva}</small></td>
                      <td>{p.viaje || '—'}</td>
                      <td>{p.metodoPago}</td>
                      <td><span className={statusClass(p.estadoPago)}>{p.estadoPago}</span></td>
                      <td><strong>{formatMoney(p.monto)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </RoleLayout>
  )
}

export default Ventas
