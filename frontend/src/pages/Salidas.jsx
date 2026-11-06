import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import RoleSidebar from '../components/RoleSidebar'
import { useAuth } from '../context/AuthContext'
import '../Admin.css'

const API_URL = '/api/salidas'
const ACTIVIDADES_URL = '/api/actividades'

const estados = ['Programada', 'En Curso', 'Finalizada', 'Cancelada']

const formularioInicial = {
  actividadId: '',
  idGuia: '',
  idVehiculo: '',
  fechaHoraSalida: '',
  cuposTotales: '',
  cuposDisponibles: '',
  precioPorPersona: '',
  estadoSalida: 'Programada',
}

function Salidas() {
  // Sólo ADMINISTRADOR crea, edita y elimina viajes.
  // OPERADOR visualiza y controla el estado operativo.
  const { user } = useAuth()
  const esAdmin = user?.role === 'ADMINISTRADOR'
  const [actualizandoEstado, setActualizandoEstado] = useState(null)
  const [salidas, setSalidas] = useState([])
  const [actividades, setActividades] = useState([])
  const [busqueda, setBusqueda] = useState('')

  const [formulario, setFormulario] = useState(formularioInicial)
  const [salidaEditando, setSalidaEditando] = useState(null)

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)

  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  async function cargarDatos() {
    setCargando(true)
    setError('')

    try {
      const [respuestaSalidas, respuestaActividades] = await Promise.all([
        fetch(API_URL),
        fetch(ACTIVIDADES_URL),
      ])

      if (!respuestaSalidas.ok || !respuestaActividades.ok) {
        throw new Error('No se pudieron cargar los datos.')
      }

      const datosSalidas = await respuestaSalidas.json()
      const datosActividades = await respuestaActividades.json()

      setSalidas(datosSalidas)
      setActividades(datosActividades)
    } catch (err) {
      setError(err.message || 'Error al conectar con el servidor.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const salidasFiltradas = useMemo(() => {
    const termino = busqueda.toLowerCase().trim()

    if (!termino) return salidas

    return salidas.filter((salida) => {
      const actividad = salida.actividad?.nombre?.toLowerCase() || ''
      const destino =
        salida.actividad?.destino?.nombreDestino?.toLowerCase() || ''
      const estado = salida.estadoSalida?.toLowerCase() || ''

      return (
        actividad.includes(termino) ||
        destino.includes(termino) ||
        estado.includes(termino)
      )
    })
  }, [salidas, busqueda])

  function abrirNuevo() {
    setSalidaEditando(null)
    setFormulario(formularioInicial)
    setError('')
    setMensaje('')
    setMostrarFormulario(true)
  }

  function abrirEdicion(salida) {
    setSalidaEditando(salida)

    setFormulario({
      actividadId: String(salida.actividad?.idActividad || ''),
      idGuia: salida.idGuia ?? '',
      idVehiculo: salida.idVehiculo ?? '',
      fechaHoraSalida: salida.fechaHoraSalida
        ? salida.fechaHoraSalida.slice(0, 16)
        : '',
      cuposTotales: String(salida.cuposTotales ?? ''),
      cuposDisponibles: String(salida.cuposDisponibles ?? ''),
      precioPorPersona: String(salida.precioPorPersona ?? ''),
      estadoSalida: salida.estadoSalida || 'Programada',
    })

    setError('')
    setMensaje('')
    setMostrarFormulario(true)
  }

  function cerrarFormulario() {
    setMostrarFormulario(false)
    setSalidaEditando(null)
    setFormulario(formularioInicial)
    setError('')
  }

  function cambiarCampo(evento) {
    const { name, value } = evento.target

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }))
  }

  async function guardarSalida(evento) {
    evento.preventDefault()

    if (!formulario.actividadId) {
      setError('Debés seleccionar una actividad.')
      return
    }

    const cuposTotales = Number(formulario.cuposTotales)
    const cuposDisponibles = Number(formulario.cuposDisponibles)
    const precio = Number(formulario.precioPorPersona)

    if (
      !Number.isInteger(cuposTotales) ||
      !Number.isInteger(cuposDisponibles) ||
      cuposTotales <= 0 ||
      cuposDisponibles < 0 ||
      cuposDisponibles > cuposTotales
    ) {
      setError('Revisá los cupos: los disponibles no pueden superar los totales.')
      return
    }

    if (!Number.isFinite(precio) || precio < 0) {
      setError('Ingresá un precio válido.')
      return
    }

    setGuardando(true)
    setError('')
    setMensaje('')

    const salida = {
      actividad: {
        idActividad: Number(formulario.actividadId),
      },
      idGuia: formulario.idGuia
        ? Number(formulario.idGuia)
        : null,
      idVehiculo: formulario.idVehiculo
        ? Number(formulario.idVehiculo)
        : null,
      fechaHoraSalida: formulario.fechaHoraSalida,
      cuposTotales,
      cuposDisponibles,
      precioPorPersona: precio,
      estadoSalida: formulario.estadoSalida,
    }

    const editando = Boolean(salidaEditando)

    const url = editando
      ? `${API_URL}/${salidaEditando.idSalida}`
      : API_URL

    try {
      const respuesta = await fetch(url, {
        method: editando ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(salida),
      })

      if (!respuesta.ok) {
        const detalle = await respuesta.text()
        throw new Error(detalle || 'No se pudo guardar la salida.')
      }

      await cargarDatos()
      cerrarFormulario()

      setMensaje(
        editando
          ? 'Salida actualizada correctamente.'
          : 'Salida creada correctamente.'
      )
    } catch (err) {
      setError(err.message || 'Ocurrió un error al guardar.')
    } finally {
      setGuardando(false)
    }
  }

  async function cambiarEstado(salida, estadoSalida) {
    if (estadoSalida === salida.estadoSalida) return

    setActualizandoEstado(salida.idSalida)
    setError('')
    setMensaje('')

    try {
      const respuesta = await fetch(
        `${API_URL}/${salida.idSalida}/estado?estado=${encodeURIComponent(estadoSalida)}`,
        { method: 'PATCH' }
      )

      if (!respuesta.ok) {
        const detalle = await respuesta.json().catch(() => null)
        throw new Error(detalle?.message || 'No se pudo actualizar el estado.')
      }

      const actualizada = await respuesta.json()
      setSalidas((actuales) =>
        actuales.map((item) =>
          item.idSalida === actualizada.idSalida ? actualizada : item
        )
      )
      setMensaje(`Estado actualizado a "${estadoSalida}".`)
    } catch (err) {
      setError(err.message)
    } finally {
      setActualizandoEstado(null)
    }
  }

  async function eliminarSalida(salida) {
    const confirmar = window.confirm(
      `¿Estás seguro de eliminar la salida de "${salida.actividad?.nombre || 'esta actividad'}"?`
    )

    if (!confirmar) return

    setError('')
    setMensaje('')

    try {
      const respuesta = await fetch(`${API_URL}/${salida.idSalida}`, {
        method: 'DELETE',
      })

      if (!respuesta.ok) {
        const detalle = await respuesta.text()
        throw new Error(detalle || 'No se pudo eliminar la salida.')
      }

      await cargarDatos()
      setMensaje('Salida eliminada correctamente.')
    } catch (err) {
      setError(err.message || 'Ocurrió un error al eliminar.')
    }
  }

  return (
    <div className="admin-layout">
      <RoleSidebar />

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-eyebrow">GESTIÓN TURÍSTICA</p>
            <h1>Viajes</h1>
            <p>Programá y administrá las salidas de tus actividades.</p>
          </div>

          {esAdmin ? (
            <button
              className="admin-primary-button"
              onClick={abrirNuevo}
              disabled={actividades.filter((actividad) => actividad.activo).length === 0}
            >
              + Nueva salida
            </button>
          ) : (
            <span className="admin-preview-badge">Control operativo</span>
          )}
        </header>

        <section className="destinos-panel">
          <div className="destinos-toolbar">
            <div>
              <h2>Listado de salidas</h2>
              <p>
                {salidas.length} salida{salidas.length !== 1 ? 's' : ''} registrada
                {salidas.length !== 1 ? 's' : ''}
              </p>
            </div>

            <input
              type="search"
              className="destinos-search"
              placeholder="Buscar por actividad, destino o estado..."
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
            />
          </div>

          {mensaje && (
            <div className="destinos-success">{mensaje}</div>
          )}

          {error && (
            <div className="destinos-error">{error}</div>
          )}

          {actividades.filter((actividad) => actividad.activo).length === 0 && !cargando && (
            <div className="destinos-empty">
              <h3>No hay actividades activas</h3>
              <p>Necesitás tener al menos una actividad activa para programar una salida.</p>
              <Link to="/admin/actividades">Ir a Actividades</Link>
            </div>
          )}

          {esAdmin && mostrarFormulario && (
            <form className="destinos-form" onSubmit={guardarSalida}>
              <h3>
                {salidaEditando ? 'Editar salida' : 'Programar nueva salida'}
              </h3>

              <label>
                Actividad *
                <select
                  name="actividadId"
                  value={formulario.actividadId}
                  onChange={cambiarCampo}
                  required
                >
                  <option value="">Seleccionar actividad</option>
                  {actividades
                    .filter((actividad) => actividad.activo || actividad.idActividad === salidaEditando?.actividad?.idActividad)
                    .map((actividad) => (
                      <option
                        key={actividad.idActividad}
                        value={actividad.idActividad}
                      >
                        {actividad.nombre} — {actividad.destino?.nombreDestino || 'Sin destino'}
                      </option>
                    ))}
                </select>
              </label>

              <div className="destinos-form-row">
                <label>
                  ID del guía
                  <input
                    type="number"
                    name="idGuia"
                    min="1"
                    value={formulario.idGuia}
                    onChange={cambiarCampo}
                    placeholder="Opcional"
                  />
                </label>

                <label>
                  ID del vehículo
                  <input
                    type="number"
                    name="idVehiculo"
                    min="1"
                    value={formulario.idVehiculo}
                    onChange={cambiarCampo}
                    placeholder="Opcional"
                  />
                </label>
              </div>

              <div className="destinos-form-row">
                <label>
                  Fecha y hora de salida *
                  <input
                    type="datetime-local"
                    name="fechaHoraSalida"
                    value={formulario.fechaHoraSalida}
                    onChange={cambiarCampo}
                    required
                  />
                </label>

                <label>
                  Estado
                  <select
                    name="estadoSalida"
                    value={formulario.estadoSalida}
                    onChange={cambiarCampo}
                  >
                    {estados.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="destinos-form-row">
                <label>
                  Cupos totales *
                  <input
                    type="number"
                    name="cuposTotales"
                    min="1"
                    value={formulario.cuposTotales}
                    onChange={cambiarCampo}
                    required
                  />
                </label>

                <label>
                  Cupos disponibles *
                  <input
                    type="number"
                    name="cuposDisponibles"
                    min="0"
                    max={formulario.cuposTotales || undefined}
                    value={formulario.cuposDisponibles}
                    onChange={cambiarCampo}
                    required
                  />
                </label>
              </div>

              <label>
                Precio por persona *
                <input
                  type="number"
                  name="precioPorPersona"
                  min="0"
                  step="0.01"
                  value={formulario.precioPorPersona}
                  onChange={cambiarCampo}
                  required
                />
              </label>

              <div className="destinos-form-actions">
                <button
                  type="button"
                  className="destinos-cancel-button"
                  onClick={cerrarFormulario}
                  disabled={guardando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="admin-primary-button"
                  disabled={guardando}
                >
                  {guardando
                    ? 'Guardando...'
                    : salidaEditando
                      ? 'Guardar cambios'
                      : 'Crear salida'}
                </button>
              </div>
            </form>
          )}

          {cargando ? (
            <div className="destinos-empty">Cargando salidas...</div>
          ) : salidasFiltradas.length === 0 ? (
            <div className="destinos-empty">
              <h3>No se encontraron salidas</h3>
              <p>
                {busqueda
                  ? 'Probá con otro término de búsqueda.'
                  : 'Todavía no hay salidas programadas.'}
              </p>
            </div>
          ) : (
            <div className="destinos-table-container">
              <table className="destinos-table">
                <thead>
                  <tr>
                    <th>Actividad</th>
                    <th>Fecha y hora</th>
                    <th>Cupos</th>
                    <th>Precio</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {salidasFiltradas.map((salida) => (
                    <tr key={salida.idSalida}>
                      <td>
                        <strong>{salida.actividad?.nombre || 'Sin actividad'}</strong>
                        <small>
                          {salida.actividad?.destino?.nombreDestino || 'Sin destino'}
                        </small>
                      </td>

                      <td>
                        {salida.fechaHoraSalida
                          ? new Date(salida.fechaHoraSalida).toLocaleString('es-AR')
                          : 'Sin fecha'}
                      </td>

                      <td>
                        {salida.cuposDisponibles} / {salida.cuposTotales}
                      </td>

                      <td>
                        {Number(salida.precioPorPersona).toLocaleString('es-AR', {
                          style: 'currency',
                          currency: 'ARS',
                        })}
                      </td>

                      <td>
                        <span
                          className={
                            salida.estadoSalida === 'Cancelada'
                              ? 'destinos-status-inactive'
                              : 'destinos-status-active'
                          }
                        >
                          {salida.estadoSalida}
                        </span>
                      </td>

                      <td>
                        <div className="destinos-row-actions">
                          <select
                            className="estado-select"
                            aria-label="Cambiar estado del viaje"
                            value={salida.estadoSalida}
                            disabled={actualizandoEstado === salida.idSalida}
                            onChange={(event) => cambiarEstado(salida, event.target.value)}
                          >
                            {estados.map((estado) => (
                              <option key={estado} value={estado}>{estado}</option>
                            ))}
                          </select>

                          {esAdmin && (
                            <>
                              <button
                                type="button"
                                onClick={() => abrirEdicion(salida)}
                              >
                                Editar
                              </button>

                              <button
                                type="button"
                                className="destinos-delete-button"
                                onClick={() => eliminarSalida(salida)}
                              >
                                Eliminar
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default Salidas
