import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import '../Admin.css'

const API_URL = '/api/actividades'
const DESTINOS_URL = '/api/destinos'

const formularioInicial = {
  nombre: '',
  descripcion: '',
  duracionEstimada: '01:00',
  destinoId: '',
  activo: true,
}

function Actividades() {
  const [actividades, setActividades] = useState([])
  const [destinos, setDestinos] = useState([])
  const [busqueda, setBusqueda] = useState('')

  const [formulario, setFormulario] = useState(formularioInicial)
  const [actividadEditando, setActividadEditando] = useState(null)

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)

  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  // Cargar actividades y destinos
  async function cargarDatos() {
    setCargando(true)
    setError('')

    try {
      const [respuestaActividades, respuestaDestinos] = await Promise.all([
        fetch(API_URL),
        fetch(DESTINOS_URL),
      ])

      if (!respuestaActividades.ok || !respuestaDestinos.ok) {
        throw new Error('No se pudieron cargar los datos.')
      }

      const datosActividades = await respuestaActividades.json()
      const datosDestinos = await respuestaDestinos.json()

      setActividades(datosActividades)
      setDestinos(datosDestinos)
    } catch (err) {
      setError(err.message || 'Error al conectar con el servidor.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  // Filtrar actividades
  const actividadesFiltradas = useMemo(() => {
    const termino = busqueda.toLowerCase().trim()

    if (!termino) return actividades

    return actividades.filter((actividad) => {
      const nombre = actividad.nombre?.toLowerCase() || ''
      const descripcion = actividad.descripcion?.toLowerCase() || ''
      const destino = actividad.destino?.nombreDestino?.toLowerCase() || ''

      return (
        nombre.includes(termino) ||
        descripcion.includes(termino) ||
        destino.includes(termino)
      )
    })
  }, [actividades, busqueda])

  // Abrir formulario para crear
  function abrirNuevo() {
    setActividadEditando(null)
    setFormulario(formularioInicial)
    setError('')
    setMensaje('')
    setMostrarFormulario(true)
  }

  // Abrir formulario para editar
  function abrirEdicion(actividad) {
    setActividadEditando(actividad)

    setFormulario({
      nombre: actividad.nombre || '',
      descripcion: actividad.descripcion || '',
      duracionEstimada: String(
        actividad.duracionEstimada || '01:00:00'
      ).slice(0, 5),
      destinoId: String(actividad.destino?.idDestino || ''),
      activo: actividad.activo ?? true,
    })

    setError('')
    setMensaje('')
    setMostrarFormulario(true)
  }

  // Cerrar formulario
  function cerrarFormulario() {
    setMostrarFormulario(false)
    setActividadEditando(null)
    setFormulario(formularioInicial)
    setError('')
  }

  // Actualizar campos
  function cambiarCampo(evento) {
    const { name, value, type, checked } = evento.target

    setFormulario((anterior) => ({
      ...anterior,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  // Crear o actualizar actividad
  async function guardarActividad(evento) {
    evento.preventDefault()

    if (!formulario.destinoId) {
      setError('Debés seleccionar un destino.')
      return
    }

    setGuardando(true)
    setError('')
    setMensaje('')

    const actividad = {
      nombre: formulario.nombre.trim(),
      descripcion: formulario.descripcion.trim(),
      duracionEstimada: formulario.duracionEstimada
        ? `${formulario.duracionEstimada}:00`
        : null,
      destino: {
        idDestino: Number(formulario.destinoId),
      },
      activo: formulario.activo,
    }

    const editando = Boolean(actividadEditando)

    const url = editando
      ? `${API_URL}/${actividadEditando.idActividad}`
      : API_URL

    try {
      const respuesta = await fetch(url, {
        method: editando ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(actividad),
      })

      if (!respuesta.ok) {
        const detalle = await respuesta.text()
        throw new Error(
          detalle || 'No se pudo guardar la actividad.'
        )
      }

      await cargarDatos()
      cerrarFormulario()

      setMensaje(
        editando
          ? 'Actividad actualizada correctamente.'
          : 'Actividad creada correctamente.'
      )
    } catch (err) {
      setError(err.message || 'Ocurrió un error al guardar.')
    } finally {
      setGuardando(false)
    }
  }

  // Eliminar actividad
  async function eliminarActividad(actividad) {
    const confirmar = window.confirm(
      `¿Estás seguro de eliminar la actividad "${actividad.nombre}"?`
    )

    if (!confirmar) return

    setError('')
    setMensaje('')

    try {
      const respuesta = await fetch(
        `${API_URL}/${actividad.idActividad}`,
        { method: 'DELETE' }
      )

      if (!respuesta.ok) {
        const detalle = await respuesta.text()
        throw new Error(
          detalle || 'No se pudo eliminar la actividad.'
        )
      }

      await cargarDatos()
      setMensaje('Actividad eliminada correctamente.')
    } catch (err) {
      setError(err.message || 'Ocurrió un error al eliminar.')
    }
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-logo-small">A</div>
          <span>Atrix Passenger</span>
        </div>

        <nav className="admin-menu">
          <Link to="/admin">
            <span>📊</span>
            Dashboard
          </Link>

          <Link to="/admin/destinos">
            <span>🗺️</span>
            Destinos
          </Link>

          <Link to="/admin/actividades" className="admin-menu-active">
            <span>🏞️</span>
            Actividades
          </Link>
        </nav>

        <div className="admin-sidebar-footer">
          <Link to="/">Volver al sitio web</Link>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-eyebrow">GESTIÓN TURÍSTICA</span>
            <h1>Actividades</h1>
            <p>Administrá las experiencias disponibles en cada destino.</p>
          </div>

          <button
            className="admin-primary-button"
            onClick={abrirNuevo}
            disabled={destinos.length === 0}
          >
            + Nueva actividad
          </button>
        </header>

        <section className="destinos-panel">
          <div className="destinos-toolbar">
            <div>
              <h2>Listado de actividades</h2>
              <p>
                {actividades.length} actividad
                {actividades.length !== 1 ? 'es' : ''} registrada
                {actividades.length !== 1 ? 's' : ''}
              </p>
            </div>

            <input
              type="search"
              className="destinos-search"
              placeholder="Buscar por nombre o destino..."
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
            />
          </div>

          {mensaje && (
            <div className="destinos-success">
              {mensaje}
            </div>
          )}

          {error && (
            <div className="destinos-error">
              {error}
            </div>
          )}

          {destinos.length === 0 && !cargando && (
            <div className="destinos-empty">
              <h3>Primero necesitás registrar un destino</h3>
              <p>
                Las actividades deben estar asociadas a un destino existente.
              </p>
              <Link to="/admin/destinos">
                Ir a Destinos
              </Link>
            </div>
          )}

          {mostrarFormulario && (
            <form
              className="destinos-form"
              onSubmit={guardarActividad}
            >
              <h3>
                {actividadEditando
                  ? 'Editar actividad'
                  : 'Registrar nueva actividad'}
              </h3>

              <label>
                Nombre de la actividad *
                <input
                  type="text"
                  name="nombre"
                  value={formulario.nombre}
                  onChange={cambiarCampo}
                  placeholder="Ej. Senderismo"
                  maxLength={120}
                  required
                />
              </label>

              <label>
                Descripción
                <textarea
                  name="descripcion"
                  value={formulario.descripcion}
                  onChange={cambiarCampo}
                  placeholder="Descripción de la actividad..."
                  rows={3}
                />
              </label>

              <div className="destinos-form-row">
                <label>
                  Destino *
                  <select
                    name="destinoId"
                    value={formulario.destinoId}
                    onChange={cambiarCampo}
                    required
                  >
                    <option value="">Seleccionar destino</option>

                    {destinos.map((destino) => (
                      <option
                        key={destino.idDestino}
                        value={destino.idDestino}
                      >
                        {destino.nombreDestino}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Duración estimada
                  <input
                    type="time"
                    name="duracionEstimada"
                    value={formulario.duracionEstimada}
                    onChange={cambiarCampo}
                  />
                </label>
              </div>

              <label className="destinos-checkbox">
                <input
                  type="checkbox"
                  name="activo"
                  checked={formulario.activo}
                  onChange={cambiarCampo}
                />
                Actividad activa
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
                    : actividadEditando
                      ? 'Guardar cambios'
                      : 'Crear actividad'}
                </button>
              </div>
            </form>
          )}

          {cargando ? (
            <div className="destinos-empty">
              Cargando actividades...
            </div>
          ) : actividadesFiltradas.length === 0 ? (
            <div className="destinos-empty">
              <h3>No se encontraron actividades</h3>
              <p>
                {busqueda
                  ? 'Probá con otro término de búsqueda.'
                  : 'Todavía no hay actividades registradas.'}
              </p>
            </div>
          ) : (
            <div className="destinos-table-container">
              <table className="destinos-table">
                <thead>
                  <tr>
                    <th>Actividad</th>
                    <th>Destino</th>
                    <th>Duración</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {actividadesFiltradas.map((actividad) => (
                    <tr key={actividad.idActividad}>
                      <td>
                        <strong>{actividad.nombre}</strong>
                        <small>
                          {actividad.descripcion || 'Sin descripción'}
                        </small>
                      </td>

                      <td>
                        {actividad.destino?.nombreDestino || 'Sin destino'}
                      </td>

                      <td>
                        {actividad.duracionEstimada
                          ? actividad.duracionEstimada.slice(0, 5)
                          : 'No especificada'}
                      </td>

                      <td>
                        <span
                          className={
                            actividad.activo
                              ? 'destinos-status-active'
                              : 'destinos-status-inactive'
                          }
                        >
                          {actividad.activo ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>

                      <td>
                        <div className="destinos-actions">
                          <button
                            type="button"
                            onClick={() => abrirEdicion(actividad)}
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            className="destinos-delete-button"
                            onClick={() => eliminarActividad(actividad)}
                          >
                            Eliminar
                          </button>
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

export default Actividades
