
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import '../Admin.css'

const API_URL = '/api/vehiculos'

const formularioInicial = {
  patente: '',
  marca: '',
  modelo: '',
  capacidadMax: '4',
  estadoMantenimiento: false,
  ultimaItv: '',
}

function Vehiculos() {
  const [vehiculos, setVehiculos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [formulario, setFormulario] = useState(formularioInicial)
  const [vehiculoEditando, setVehiculoEditando] = useState(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  async function cargarVehiculos() {
    try {
      setCargando(true)
      setError('')

      const respuesta = await fetch(API_URL)

      if (!respuesta.ok) {
        throw new Error('No se pudieron obtener los vehículos.')
      }

      const datos = await respuesta.json()
      setVehiculos(datos)
    } catch (err) {
      setError(err.message || 'Ocurrió un error al cargar los vehículos.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarVehiculos()
  }, [])

  const vehiculosFiltrados = useMemo(() => {
    const termino = busqueda.toLowerCase().trim()

    if (!termino) return vehiculos

    return vehiculos.filter((vehiculo) => {
      const texto = [
        vehiculo.patente,
        vehiculo.marca,
        vehiculo.modelo,
        vehiculo.capacidadMax,
      ]
        .filter((valor) => valor !== null && valor !== undefined)
        .join(' ')
        .toLowerCase()

      return texto.includes(termino)
    })
  }, [vehiculos, busqueda])

  function abrirNuevo() {
    setVehiculoEditando(null)
    setFormulario(formularioInicial)
    setError('')
    setMensaje('')
    setMostrarFormulario(true)
  }

  function abrirEdicion(vehiculo) {
    setVehiculoEditando(vehiculo)

    setFormulario({
      patente: vehiculo.patente ?? '',
      marca: vehiculo.marca ?? '',
      modelo: vehiculo.modelo ?? '',
      capacidadMax: String(vehiculo.capacidadMax ?? 4),
      estadoMantenimiento: vehiculo.estadoMantenimiento ?? false,
      ultimaItv: vehiculo.ultimaItv ?? '',
    })

    setError('')
    setMensaje('')
    setMostrarFormulario(true)
  }

  function cerrarFormulario() {
    setMostrarFormulario(false)
    setVehiculoEditando(null)
    setFormulario(formularioInicial)
    setError('')
  }

  function cambiarCampo(evento) {
    const { name, value, type, checked } = evento.target

    setFormulario((anterior) => ({
      ...anterior,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function guardarVehiculo(evento) {
    evento.preventDefault()

    try {
      setGuardando(true)
      setError('')
      setMensaje('')

      const datos = {
        patente: formulario.patente.trim().toUpperCase(),
        marca: formulario.marca.trim(),
        modelo: formulario.modelo.trim(),
        capacidadMax: Number(formulario.capacidadMax),
        estadoMantenimiento: formulario.estadoMantenimiento,
        ultimaItv: formulario.ultimaItv || null,
      }

      const url = vehiculoEditando
        ? `${API_URL}/${vehiculoEditando.idVehiculo}`
        : API_URL

      const metodo = vehiculoEditando ? 'PUT' : 'POST'

      const respuesta = await fetch(url, {
        method: metodo,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datos),
      })

      if (!respuesta.ok) {
        const detalle = await respuesta.text()
        throw new Error(
          detalle || 'No se pudo guardar el vehículo. Verificá los datos.'
        )
      }

      const estabaEditando = Boolean(vehiculoEditando)

      await cargarVehiculos()
      cerrarFormulario()

      setMensaje(
        estabaEditando
          ? 'Vehículo actualizado correctamente.'
          : 'Vehículo registrado correctamente.'
      )
    } catch (err) {
      setError(err.message || 'Ocurrió un error al guardar el vehículo.')
    } finally {
      setGuardando(false)
    }
  }

  async function eliminarVehiculo(vehiculo) {
    const confirmar = window.confirm(
      `¿Estás seguro de que deseas eliminar el vehículo ${vehiculo.patente}?`
    )

    if (!confirmar) return

    try {
      setError('')
      setMensaje('')

      const respuesta = await fetch(`${API_URL}/${vehiculo.idVehiculo}`, {
        method: 'DELETE',
      })

      if (!respuesta.ok) {
        const detalle = await respuesta.text()
        throw new Error(
          detalle || 'No se pudo eliminar el vehículo.'
        )
      }

      await cargarVehiculos()
      setMensaje('Vehículo eliminado correctamente.')
    } catch (err) {
      setError(err.message || 'Ocurrió un error al eliminar el vehículo.')
    }
  }

  function formatoFecha(fecha) {
    if (!fecha) return 'Sin registrar'

    const [anio, mes, dia] = fecha.split('-')
    return `${dia}/${mes}/${anio}`
  }

  const totalEnMantenimiento = vehiculos.filter(
    (vehiculo) => vehiculo.estadoMantenimiento
  ).length

  const totalDisponibles = vehiculos.length - totalEnMantenimiento

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-icon">A</span>
          <div>
            <strong>Atrix Passenger</strong>
            <small>Panel administrativo</small>
          </div>
        </div>

        <nav className="admin-nav">
          <span className="admin-nav-label">GENERAL</span>

          <Link to="/admin" className="admin-nav-link">
            <span>▦</span>
            Dashboard
          </Link>

          <span className="admin-nav-label">GESTIÓN TURÍSTICA</span>

          <Link to="/admin/destinos" className="admin-nav-link">
            <span>🗺️</span>
            Destinos
          </Link>

          <Link to="/admin/actividades" className="admin-nav-link">
            <span>🏞️</span>
            Actividades
          </Link>

          <Link to="/admin/salidas" className="admin-nav-link">
            <span>🚌</span>
            Salidas
          </Link>

          <Link to="/admin/guias" className="admin-nav-link">
            <span>🧭</span>
            Guías
          </Link>

          <Link to="/admin/vehiculos" className="admin-nav-link active">
            <span>🚐</span>
            Vehículos
          </Link>
        </nav>

        <div className="admin-sidebar-footer">
          <span>Panel de administración</span>
          <small>Atrix Passenger © 2026</small>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-breadcrumb">
              Gestión turística / Vehículos
            </span>
            <h1>Vehículos</h1>
          </div>

          <button
            className="admin-primary-button"
            onClick={abrirNuevo}
          >
            + Nuevo vehículo
          </button>
        </header>

        <section className="admin-content">
          <div className="admin-page-heading">
            <div>
              <h2>Administración de vehículos</h2>
              <p>
                Registrá y administrá los vehículos de la flota.
              </p>
            </div>
          </div>

          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <span>Total de vehículos</span>
              <strong>{vehiculos.length}</strong>
            </div>

            <div className="admin-stat-card">
              <span>Disponibles</span>
              <strong>{totalDisponibles}</strong>
            </div>

            <div className="admin-stat-card">
              <span>En mantenimiento</span>
              <strong>{totalEnMantenimiento}</strong>
            </div>
          </div>

          {mensaje && (
            <div className="admin-success-message">
              {mensaje}
            </div>
          )}

          {error && (
            <div className="admin-error-message">
              {error}
            </div>
          )}

          <div className="admin-table-card">
            <div className="admin-table-toolbar">
              <div>
                <h3>Listado de vehículos</h3>
                <p>
                  Consultá, buscá y administrá los vehículos registrados.
                </p>
              </div>

              <input
                type="search"
                placeholder="Buscar por patente, marca o modelo..."
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
                className="admin-search-input"
              />
            </div>

            {cargando ? (
              <div className="admin-empty-state">
                Cargando vehículos...
              </div>
            ) : vehiculosFiltrados.length === 0 ? (
              <div className="admin-empty-state">
                {busqueda
                  ? 'No se encontraron vehículos con esa búsqueda.'
                  : 'Todavía no hay vehículos registrados.'}
              </div>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Patente</th>
                      <th>Marca y modelo</th>
                      <th>Capacidad</th>
                      <th>Estado</th>
                      <th>Última ITV</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {vehiculosFiltrados.map((vehiculo) => (
                      <tr key={vehiculo.idVehiculo}>
                        <td>
                          <strong>{vehiculo.patente}</strong>
                        </td>

                        <td>
                          {[vehiculo.marca, vehiculo.modelo]
                            .filter(Boolean)
                            .join(' ') || '—'}
                        </td>

                        <td>{vehiculo.capacidadMax} pasajeros</td>

                        <td>
                          <span
                            className={
                              vehiculo.estadoMantenimiento
                                ? 'admin-status-badge inactive'
                                : 'admin-status-badge active'
                            }
                          >
                            {vehiculo.estadoMantenimiento
                              ? 'En mantenimiento'
                              : 'Disponible'}
                          </span>
                        </td>

                        <td>{formatoFecha(vehiculo.ultimaItv)}</td>

                        <td>
                          <div className="admin-actions">
                            <button
                              className="admin-action-button"
                              onClick={() => abrirEdicion(vehiculo)}
                            >
                              Editar
                            </button>

                            <button
                              className="admin-action-button danger"
                              onClick={() => eliminarVehiculo(vehiculo)}
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
          </div>

          {mostrarFormulario && (
            <div className="admin-modal-overlay">
              <div className="admin-modal">
                <div className="admin-modal-header">
                  <div>
                    <h2>
                      {vehiculoEditando
                        ? 'Editar vehículo'
                        : 'Registrar vehículo'}
                    </h2>
                    <p>
                      Completá la información del vehículo.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="admin-modal-close"
                    onClick={cerrarFormulario}
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={guardarVehiculo}>
                  <div className="admin-form-grid">
                    <label>
                      Patente *
                      <input
                        name="patente"
                        value={formulario.patente}
                        onChange={cambiarCampo}
                        required
                        maxLength={20}
                        placeholder="Ej. AB123CD"
                      />
                    </label>

                    <label>
                      Marca
                      <input
                        name="marca"
                        value={formulario.marca}
                        onChange={cambiarCampo}
                        placeholder="Ej. Mercedes-Benz"
                      />
                    </label>

                    <label>
                      Modelo
                      <input
                        name="modelo"
                        value={formulario.modelo}
                        onChange={cambiarCampo}
                        placeholder="Ej. Sprinter"
                      />
                    </label>

                    <label>
                      Capacidad máxima *
                      <input
                        type="number"
                        name="capacidadMax"
                        value={formulario.capacidadMax}
                        onChange={cambiarCampo}
                        min="1"
                        step="1"
                        required
                      />
                    </label>

                    <label>
                      Última ITV
                      <input
                        type="date"
                        name="ultimaItv"
                        value={formulario.ultimaItv}
                        onChange={cambiarCampo}
                      />
                    </label>

                    <label className="admin-form-checkbox">
                      <input
                        type="checkbox"
                        name="estadoMantenimiento"
                        checked={formulario.estadoMantenimiento}
                        onChange={cambiarCampo}
                      />
                      <span>El vehículo está en mantenimiento</span>
                    </label>
                  </div>

                  <div className="admin-modal-actions">
                    <button
                      type="button"
                      className="admin-secondary-button"
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
                        : vehiculoEditando
                          ? 'Guardar cambios'
                          : 'Registrar vehículo'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default Vehiculos
