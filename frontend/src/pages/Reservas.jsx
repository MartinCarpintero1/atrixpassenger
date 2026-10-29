import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import '../Admin.css'

const API_RESERVAS = '/api/reservas'
const API_SALIDAS = '/api/salidas'
const API_PASAJEROS = '/api/pasajeros'
const API_ASOCIACIONES = '/api/reserva-pasajeros'

const formularioInicial = {
  salidaId: '',
  cantidadPasajeros: 1,
  estadoReserva: 'Pendiente',
  observaciones: '',
}

async function solicitar(url, opciones = {}) {
  const respuesta = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...opciones.headers,
    },
    ...opciones,
  })

  if (!respuesta.ok) {
    let mensaje = `Error HTTP ${respuesta.status}`

    try {
      const error = await respuesta.json()
      mensaje = error.message || error.detail || mensaje
    } catch {
      // La respuesta puede no contener JSON.
    }

    throw new Error(mensaje)
  }

  if (respuesta.status === 204) return null
  return respuesta.json()
}

function nombrePasajero(pasajero) {
  return `${pasajero.nombre || ''} ${pasajero.apellido || ''}`.trim()
}

function fechaLegible(fecha) {
  if (!fecha) return '—'

  const valor = new Date(fecha)
  if (Number.isNaN(valor.getTime())) return fecha

  return valor.toLocaleString('es-AR')
}

function moneda(valor) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(Number(valor || 0))
}

function obtenerActividad(salida) {
  return salida?.actividad?.nombre || 'Actividad sin nombre'
}

function obtenerDestino(salida) {
  return salida?.actividad?.destino?.nombreDestino || '—'
}

function Reservas() {
  const [reservas, setReservas] = useState([])
  const [salidas, setSalidas] = useState([])
  const [pasajeros, setPasajeros] = useState([])
  const [asociaciones, setAsociaciones] = useState([])

  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('Todos')

  const [modalReserva, setModalReserva] = useState(false)
  const [modalPasajeros, setModalPasajeros] = useState(false)
  const [reservaSeleccionada, setReservaSeleccionada] = useState(null)

  const [formulario, setFormulario] = useState(formularioInicial)
  const [pasajeroSeleccionado, setPasajeroSeleccionado] = useState('')

  const [pagina, setPagina] = useState(1)
  const elementosPorPagina = 8

  const cargarDatos = async () => {
    setCargando(true)
    setError('')

    try {
      const [reservasData, salidasData, pasajerosData] = await Promise.all([
        solicitar(API_RESERVAS),
        solicitar(API_SALIDAS),
        solicitar(API_PASAJEROS),
      ])

      setReservas(reservasData)
      setSalidas(salidasData)
      setPasajeros(pasajerosData)
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los datos.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const reservasFiltradas = useMemo(() => {
    return reservas.filter((reserva) => {
      const salida = reserva.salida
      const texto = busqueda.toLowerCase()

      const coincideBusqueda =
        String(reserva.idReserva).includes(texto) ||
        String(reserva.qrCodigoSeguridad || '').toLowerCase().includes(texto) ||
        obtenerActividad(salida).toLowerCase().includes(texto) ||
        obtenerDestino(salida).toLowerCase().includes(texto)

      const coincideEstado =
        filtroEstado === 'Todos' ||
        reserva.estadoReserva === filtroEstado

      return coincideBusqueda && coincideEstado
    })
  }, [reservas, busqueda, filtroEstado])

  const totalPaginas = Math.max(
    1,
    Math.ceil(reservasFiltradas.length / elementosPorPagina)
  )

  const reservasPagina = reservasFiltradas.slice(
    (pagina - 1) * elementosPorPagina,
    pagina * elementosPorPagina
  )

  const salidaElegida = salidas.find(
    (salida) => String(salida.idSalida) === String(formulario.salidaId)
  )

  const precioUnitario = Number(
    salidaElegida?.precioPorPersona || 0
  )

  const totalEstimado =
    precioUnitario * Number(formulario.cantidadPasajeros || 0)

  const abrirNuevaReserva = () => {
    setReservaSeleccionada(null)
    setFormulario(formularioInicial)
    setError('')
    setMensaje('')
    setModalReserva(true)
  }

  const abrirEdicion = (reserva) => {
    setReservaSeleccionada(reserva)

    setFormulario({
      salidaId: reserva.salida?.idSalida || '',
      cantidadPasajeros: reserva.cantidadPasajeros || 1,
      estadoReserva: reserva.estadoReserva || 'Pendiente',
      observaciones: reserva.observaciones || '',
    })

    setError('')
    setMensaje('')
    setModalReserva(true)
  }

  const guardarReserva = async (evento) => {
    evento.preventDefault()
    setError('')
    setMensaje('')

    if (!formulario.salidaId) {
      setError('Seleccioná una salida.')
      return
    }

    const cantidad = Number(formulario.cantidadPasajeros)

    if (!Number.isInteger(cantidad) || cantidad < 1) {
      setError('La cantidad de pasajeros debe ser mayor que cero.')
      return
    }

    if (!salidaElegida) {
      setError('La salida seleccionada no existe.')
      return
    }

    if (reservaSeleccionada) {
      const cantidadAsociada = asociaciones.length

      if (cantidad < cantidadAsociada) {
        setError(
          `Esta reserva ya tiene ${cantidadAsociada} pasajeros asociados. No podés reducir la cantidad por debajo de ese número.`
        )
        return
      }
    }

    if (
      formulario.estadoReserva !== 'Cancelada' &&
      !reservaSeleccionada &&
      cantidad > Number(salidaElegida.cuposDisponibles)
    ) {
      setError('La salida no tiene suficientes cupos disponibles.')
      return
    }

    if (
      formulario.estadoReserva !== 'Cancelada' &&
      reservaSeleccionada &&
      reservaSeleccionada.estadoReserva === 'Cancelada' &&
      cantidad > Number(salidaElegida.cuposDisponibles)
    ) {
      setError('La salida no tiene suficientes cupos disponibles.')
      return
    }

    const datos = {
      salida: {
        idSalida: Number(formulario.salidaId),
      },
      cantidadPasajeros: cantidad,
      estadoReserva: formulario.estadoReserva,
      valorTotal: Number((precioUnitario * cantidad).toFixed(2)),
      observaciones: formulario.observaciones.trim(),
      idUsuarioCreador: reservaSeleccionada?.idUsuarioCreador ?? null,
    }

    setGuardando(true)

    try {
      const url = reservaSeleccionada
        ? `${API_RESERVAS}/${reservaSeleccionada.idReserva}`
        : API_RESERVAS

      await solicitar(url, {
        method: reservaSeleccionada ? 'PUT' : 'POST',
        body: JSON.stringify(datos),
      })

      setModalReserva(false)
      setMensaje(
        reservaSeleccionada
          ? 'Reserva actualizada correctamente.'
          : 'Reserva creada correctamente. Ahora podés asociarle sus pasajeros.'
      )

      await cargarDatos()
    } catch (err) {
      setError(err.message || 'No se pudo guardar la reserva.')
    } finally {
      setGuardando(false)
    }
  }

  const abrirPasajeros = async (reserva) => {
    setReservaSeleccionada(reserva)
    setError('')
    setMensaje('')
    setPasajeroSeleccionado('')
    setAsociaciones([])
    setModalPasajeros(true)

    try {
      const datos = await solicitar(
        `${API_ASOCIACIONES}/reserva/${reserva.idReserva}`
      )
      setAsociaciones(datos)
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los pasajeros.')
    }
  }

  const asociarPasajero = async (evento) => {
    evento.preventDefault()
    setError('')
    setMensaje('')

    if (!pasajeroSeleccionado || !reservaSeleccionada) {
      setError('Seleccioná un pasajero.')
      return
    }

    if (reservaSeleccionada.estadoReserva === 'Cancelada') {
      setError('No se pueden agregar pasajeros a una reserva cancelada.')
      return
    }

    if (asociaciones.length >= reservaSeleccionada.cantidadPasajeros) {
      setError('La reserva ya tiene todos sus pasajeros asociados.')
      return
    }

    setGuardando(true)

    try {
      await solicitar(API_ASOCIACIONES, {
        method: 'POST',
        body: JSON.stringify({
          reserva: {
            idReserva: reservaSeleccionada.idReserva,
          },
          pasajero: {
            idPasajero: Number(pasajeroSeleccionado),
          },
        }),
      })

      const datos = await solicitar(
        `${API_ASOCIACIONES}/reserva/${reservaSeleccionada.idReserva}`
      )

      setAsociaciones(datos)
      setPasajeroSeleccionado('')
      setMensaje('Pasajero asociado correctamente.')
    } catch (err) {
      setError(err.message || 'No se pudo asociar el pasajero.')
    } finally {
      setGuardando(false)
    }
  }

  const actualizarCheckIn = async (asociacion, realizado) => {
    setError('')
    setMensaje('')

    try {
      await solicitar(
        `${API_ASOCIACIONES}/${asociacion.idReservaPasajero}/check-in?realizado=${realizado}`,
        { method: 'PATCH' }
      )

      const datos = await solicitar(
        `${API_ASOCIACIONES}/reserva/${reservaSeleccionada.idReserva}`
      )

      setAsociaciones(datos)
      setMensaje(
        realizado
          ? 'Check-in realizado correctamente.'
          : 'Check-in desmarcado.'
      )
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el check-in.')
    }
  }

  const desasociarPasajero = async (asociacion) => {
    const nombre = nombrePasajero(asociacion.pasajero)

    if (!window.confirm(`¿Querés quitar a ${nombre} de esta reserva?`)) {
      return
    }

    setError('')
    setMensaje('')

    try {
      await solicitar(
        `${API_ASOCIACIONES}/${asociacion.idReservaPasajero}`,
        { method: 'DELETE' }
      )

      const datos = await solicitar(
        `${API_ASOCIACIONES}/reserva/${reservaSeleccionada.idReserva}`
      )

      setAsociaciones(datos)
      setMensaje('Pasajero desasociado correctamente.')
    } catch (err) {
      setError(err.message || 'No se pudo desasociar el pasajero.')
    }
  }

  const cancelarReserva = async (reserva) => {
    if (reserva.estadoReserva === 'Cancelada') return

    const confirmar = window.confirm(
      `¿Querés cancelar la reserva #${reserva.idReserva}? Se devolverán sus cupos disponibles.`
    )

    if (!confirmar) return

    setError('')
    setMensaje('')

    try {
      await solicitar(`${API_RESERVAS}/${reserva.idReserva}`, {
        method: 'PUT',
        body: JSON.stringify({
          salida: { idSalida: reserva.salida.idSalida },
          cantidadPasajeros: reserva.cantidadPasajeros,
          estadoReserva: 'Cancelada',
          valorTotal: reserva.valorTotal,
          observaciones: reserva.observaciones || '',
          idUsuarioCreador: reserva.idUsuarioCreador ?? null,
        }),
      })

      setMensaje(`Reserva #${reserva.idReserva} cancelada correctamente.`)
      await cargarDatos()
    } catch (err) {
      setError(err.message || 'No se pudo cancelar la reserva.')
    }
  }

  const pasajerosDisponibles = pasajeros.filter((pasajero) => {
    return !asociaciones.some(
      (asociacion) =>
        asociacion.pasajero?.idPasajero === pasajero.idPasajero
    )
  })

  const totalCheckIn = asociaciones.filter(
    (asociacion) => asociacion.checkInRealizado
  ).length

  const estadoClase = (estado) => {
    if (estado === 'Confirmada') return 'reserva-estado confirmada'
    if (estado === 'Cancelada') return 'reserva-estado cancelada'
    return 'reserva-estado pendiente'
  }

  return (
    <main className="admin-page">
      <header className="admin-page-header">
        <div>
          <Link to="/admin" className="reserva-volver">
            ← Volver al panel
          </Link>
          <h1>Reservas</h1>
          <p>Administrá las reservas y los pasajeros de cada salida.</p>
        </div>

        <button
          type="button"
          className="admin-btn-primary"
          onClick={abrirNuevaReserva}
        >
          + Nueva reserva
        </button>
      </header>

      {error && <div className="reserva-alerta error">{error}</div>}
      {mensaje && <div className="reserva-alerta exito">{mensaje}</div>}

      <section className="reserva-resumen">
        <article>
          <span>Total de reservas</span>
          <strong>{reservas.length}</strong>
        </article>
        <article>
          <span>Pendientes</span>
          <strong>
            {reservas.filter((r) => r.estadoReserva === 'Pendiente').length}
          </strong>
        </article>
        <article>
          <span>Confirmadas</span>
          <strong>
            {reservas.filter((r) => r.estadoReserva === 'Confirmada').length}
          </strong>
        </article>
        <article>
          <span>Canceladas</span>
          <strong>
            {reservas.filter((r) => r.estadoReserva === 'Cancelada').length}
          </strong>
        </article>
      </section>

      <section className="reserva-panel">
        <div className="reserva-filtros">
          <input
            type="search"
            placeholder="Buscar por ID, QR, actividad o destino..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value)
              setPagina(1)
            }}
          />

          <select
            value={filtroEstado}
            onChange={(e) => {
              setFiltroEstado(e.target.value)
              setPagina(1)
            }}
          >
            <option value="Todos">Todos los estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Confirmada">Confirmada</option>
            <option value="Cancelada">Cancelada</option>
          </select>
        </div>

        {cargando ? (
          <p className="reserva-vacio">Cargando reservas...</p>
        ) : reservasPagina.length === 0 ? (
          <p className="reserva-vacio">No se encontraron reservas.</p>
        ) : (
          <div className="reserva-tabla-contenedor">
            <table className="reserva-tabla">
              <thead>
                <tr>
                  <th>Reserva</th>
                  <th>Salida</th>
                  <th>Pasajeros</th>
                  <th>Importe</th>
                  <th>Estado</th>
                  <th>Fecha de reserva</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {reservasPagina.map((reserva) => (
                  <tr key={reserva.idReserva}>
                    <td>
                      <strong>#{reserva.idReserva}</strong>
                      <small>
                        {reserva.qrCodigoSeguridad
                          ? `QR: ${reserva.qrCodigoSeguridad.slice(0, 10)}…`
                          : 'Sin código'}
                      </small>
                    </td>

                    <td>
                      <strong>{obtenerActividad(reserva.salida)}</strong>
                      <small>{obtenerDestino(reserva.salida)}</small>
                      <small>
                        {fechaLegible(reserva.salida?.fechaHoraSalida)}
                      </small>
                    </td>

                    <td>{reserva.cantidadPasajeros}</td>
                    <td>{moneda(reserva.valorTotal)}</td>

                    <td>
                      <span className={estadoClase(reserva.estadoReserva)}>
                        {reserva.estadoReserva}
                      </span>
                    </td>

                    <td>{fechaLegible(reserva.fechaReserva)}</td>

                    <td>
                      <div className="reserva-acciones">
                        <button
                          type="button"
                          onClick={() => abrirPasajeros(reserva)}
                        >
                          Pasajeros
                        </button>

                        <button
                          type="button"
                          onClick={() => abrirEdicion(reserva)}
                        >
                          Editar
                        </button>

                        {reserva.estadoReserva !== 'Cancelada' && (
                          <button
                            type="button"
                            className="peligro"
                            onClick={() => cancelarReserva(reserva)}
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="reserva-paginacion">
          <span>
            {reservasFiltradas.length} resultado(s)
          </span>

          <div>
            <button
              type="button"
              disabled={pagina <= 1}
              onClick={() => setPagina((p) => p - 1)}
            >
              Anterior
            </button>

            <span>
              Página {pagina} de {totalPaginas}
            </span>

            <button
              type="button"
              disabled={pagina >= totalPaginas}
              onClick={() => setPagina((p) => p + 1)}
            >
              Siguiente
            </button>
          </div>
        </div>
      </section>

      {modalReserva && (
        <div className="reserva-modal-fondo">
          <section className="reserva-modal">
            <header>
              <div>
                <h2>
                  {reservaSeleccionada ? 'Editar reserva' : 'Nueva reserva'}
                </h2>
                <p>Completá los datos de la reserva.</p>
              </div>

              <button
                type="button"
                className="reserva-cerrar"
                onClick={() => setModalReserva(false)}
              >
                ×
              </button>
            </header>

            <form onSubmit={guardarReserva}>
              <label>
                Salida programada
                <select
                  required
                  value={formulario.salidaId}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      salidaId: e.target.value,
                    })
                  }
                >
                  <option value="">Seleccionar salida</option>

                  {salidas.map((salida) => (
                    <option
                      key={salida.idSalida}
                      value={salida.idSalida}
                    >
                      #{salida.idSalida} — {obtenerActividad(salida)} —{' '}
                      {obtenerDestino(salida)} —{' '}
                      {fechaLegible(salida.fechaHoraSalida)}
                    </option>
                  ))}
                </select>
              </label>

              {salidaElegida && (
                <div className="reserva-detalle-salida">
                  <p>
                    <strong>Actividad:</strong>{' '}
                    {obtenerActividad(salidaElegida)}
                  </p>
                  <p>
                    <strong>Destino:</strong>{' '}
                    {obtenerDestino(salidaElegida)}
                  </p>
                  <p>
                    <strong>Precio por persona:</strong>{' '}
                    {moneda(salidaElegida.precioPorPersona)}
                  </p>
                  <p>
                    <strong>Cupos disponibles:</strong>{' '}
                    {salidaElegida.cuposDisponibles}
                  </p>
                </div>
              )}

              <label>
                Cantidad de pasajeros
                <input
                  type="number"
                  min="1"
                  required
                  value={formulario.cantidadPasajeros}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      cantidadPasajeros: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Estado de la reserva
                <select
                  value={formulario.estadoReserva}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      estadoReserva: e.target.value,
                    })
                  }
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Confirmada">Confirmada</option>
                  <option value="Cancelada">Cancelada</option>
                </select>
              </label>

              <label>
                Observaciones
                <textarea
                  rows="3"
                  value={formulario.observaciones}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      observaciones: e.target.value,
                    })
                  }
                  placeholder="Información adicional..."
                />
              </label>

              <div className="reserva-total">
                <span>Importe total estimado</span>
                <strong>{moneda(totalEstimado)}</strong>
              </div>

              <footer>
                <button
                  type="button"
                  className="reserva-btn-secundario"
                  onClick={() => setModalReserva(false)}
                >
                  Volver
                </button>

                <button
                  type="submit"
                  className="admin-btn-primary"
                  disabled={guardando}
                >
                  {guardando
                    ? 'Guardando...'
                    : reservaSeleccionada
                      ? 'Guardar cambios'
                      : 'Crear reserva'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {modalPasajeros && reservaSeleccionada && (
        <div className="reserva-modal-fondo">
          <section className="reserva-modal reserva-modal-amplio">
            <header>
              <div>
                <h2>Pasajeros de la reserva #{reservaSeleccionada.idReserva}</h2>
                <p>
                  {asociaciones.length} de{' '}
                  {reservaSeleccionada.cantidadPasajeros} pasajeros asociados.
                </p>
              </div>

              <button
                type="button"
                className="reserva-cerrar"
                onClick={() => setModalPasajeros(false)}
              >
                ×
              </button>
            </header>

            <div className="reserva-checkin-resumen">
              <span>Check-in realizados</span>
              <strong>
                {totalCheckIn} / {asociaciones.length}
              </strong>
            </div>

            {reservaSeleccionada.estadoReserva !== 'Cancelada' &&
              asociaciones.length <
                reservaSeleccionada.cantidadPasajeros && (
                <form
                  className="reserva-asociar-form"
                  onSubmit={asociarPasajero}
                >
                  <label>
                    Agregar pasajero registrado
                    <select
                      required
                      value={pasajeroSeleccionado}
                      onChange={(e) =>
                        setPasajeroSeleccionado(e.target.value)
                      }
                    >
                      <option value="">Seleccionar pasajero</option>

                      {pasajerosDisponibles.map((pasajero) => (
                        <option
                          key={pasajero.idPasajero}
                          value={pasajero.idPasajero}
                        >
                          {nombrePasajero(pasajero)} —{' '}
                          {pasajero.tipoDocumento} {pasajero.nroDocumento}
                        </option>
                      ))}
                    </select>
                  </label>

                  <button
                    type="submit"
                    className="admin-btn-primary"
                    disabled={guardando || !pasajeroSeleccionado}
                  >
                    {guardando ? 'Agregando...' : 'Agregar pasajero'}
                  </button>
                </form>
              )}

            {asociaciones.length === 0 ? (
              <p className="reserva-vacio">
                Todavía no hay pasajeros asociados a esta reserva.
              </p>
            ) : (
              <div className="reserva-tabla-contenedor">
                <table className="reserva-tabla">
                  <thead>
                    <tr>
                      <th>Pasajero</th>
                      <th>Documento</th>
                      <th>Check-in</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {asociaciones.map((asociacion) => (
                      <tr key={asociacion.idReservaPasajero}>
                        <td>
                          {nombrePasajero(asociacion.pasajero)}
                        </td>
                        <td>
                          {asociacion.pasajero?.tipoDocumento}{' '}
                          {asociacion.pasajero?.nroDocumento}
                        </td>
                        <td>
                          <span
                            className={
                              asociacion.checkInRealizado
                                ? 'reserva-estado confirmada'
                                : 'reserva-estado pendiente'
                            }
                          >
                            {asociacion.checkInRealizado
                              ? 'Realizado'
                              : 'Pendiente'}
                          </span>
                        </td>
                        <td>
                          <div className="reserva-acciones">
                            {reservaSeleccionada.estadoReserva !==
                              'Cancelada' && (
                              <button
                                type="button"
                                onClick={() =>
                                  actualizarCheckIn(
                                    asociacion,
                                    !asociacion.checkInRealizado
                                  )
                                }
                              >
                                {asociacion.checkInRealizado
                                  ? 'Desmarcar'
                                  : 'Check-in'}
                              </button>
                            )}

                            {!asociacion.checkInRealizado && (
                              <button
                                type="button"
                                className="peligro"
                                onClick={() =>
                                  desasociarPasajero(asociacion)
                                }
                              >
                                Quitar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <footer>
              <button
                type="button"
                className="reserva-btn-secundario"
                onClick={() => setModalPasajeros(false)}
              >
                Cerrar
              </button>
            </footer>
          </section>
        </div>
      )}
    </main>
  )
}

export default Reservas
