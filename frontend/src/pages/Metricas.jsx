import { useEffect, useState } from 'react'

import RoleLayout from '../components/RoleLayout'
import { api } from '../services/api'
import BarList from '../components/BarList'
import { formatMoney } from '../utils/format'

/** Métricas del negocio (sólo ADMINISTRADOR). */
function Metricas() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/api/metricas/resumen').then(setData).catch((err) => setError(err.message))
  }, [])

  return (
    <RoleLayout eyebrow="ADMINISTRACIÓN" title="Métricas" description="Indicadores clave de la operación.">
      {error && <div className="alert alert-error">{error}</div>}
      {!data && !error && <div className="module-panel empty-state">Calculando métricas...</div>}

      {data && (
        <>
          <div className="stat-grid">
            <div className="stat-card"><span>Reservas</span><strong>{data.totalReservas}</strong></div>
            <div className="stat-card"><span>Viajes próximos</span><strong>{data.viajesProximos}</strong><small>de {data.totalViajes} viajes</small></div>
            <div className="stat-card"><span>Pasajeros</span><strong>{data.totalPasajeros}</strong></div>
            <div className="stat-card"><span>Ocupación</span><strong>{data.ocupacionPorcentaje}%</strong><small>{data.cuposTotales - data.cuposDisponibles} / {data.cuposTotales} cupos</small></div>
            <div className="stat-card"><span>Cobrado</span><strong>{formatMoney(data.ingresosCobrados)}</strong></div>
            <div className="stat-card"><span>Pendiente de cobro</span><strong>{formatMoney(data.ingresosPendientes)}</strong></div>
          </div>

          <div className="two-columns">
            <section className="module-panel">
              <h2>Reservas por estado</h2>
              <p>Distribución actual.</p>
              <BarList data={data.reservasPorEstado} />
            </section>
            <section className="module-panel">
              <h2>Viajes por estado</h2>
              <p>Programados, en curso, finalizados y cancelados.</p>
              <BarList data={data.viajesPorEstado} />
            </section>
          </div>

          <section className="module-panel">
            <h2>Destinos más elegidos</h2>
            <p>Pasajeros reservados (excluye cancelaciones).</p>
            <BarList data={data.topDestinos.map((d) => [d.destino, d.pasajeros])} />
          </section>
        </>
      )}
    </RoleLayout>
  )
}

export default Metricas
