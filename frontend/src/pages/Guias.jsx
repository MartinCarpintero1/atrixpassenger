import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import '../Admin.css'

const API_URL = '/api/guias'

const formularioInicial = {
  dni: '',
  nombre: '',
  apellido: '',
  telefono: '',
  vencimientoCarnet: '',
  idiomas: '',
}

function Guias() {
  const [guias, setGuias] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [formulario, setFormulario] = useState(formularioInicial)
  const [guiaEditando, setGuiaEditando] = useState(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  async function cargarGuias() {
    try {
      setCargando(true)
      setError('')

      const respuesta = await fetch(API_URL)

      if (!respuesta.ok) {
        throw new Error('No se pudieron obtener los guías.')
      }

      const datos = await respuesta.json()
      setGuias(datos)
    } catch (err) {
      setError(err.message || 'Ocurrió un error al cargar los guías.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarGuias()
  }, [])

  const guiasFiltrados = useMemo(() => {
    const termino = busqueda.toLowerCase().trim()

    if (!termino) return guias

    return guias.filter((guia) => {
      const texto = [
        guia.dni,
        guia.nombre,
        guia.apellido,
        guia.telefono,
        guia.idiomas,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return texto.includes(termino)
    })
  }, [guias, busqueda])

  function abrirNuevo() {
    setGuiaEditando(null)
    setFormulario(formularioInicial)
    setError('')
    setMensaje('')
    setMostrarFormulario(true)
  }

  function abrirEdicion(guia) {
    setGuiaEditando(guia)

    setFormulario({
      dni: guia.dni ?? '',
      nombre: guia.nombre ?? '',
      apellido: guia.apellido ?? '',
      telefono: guia.telefono ?? '',
      vencimientoCarnet: guia.vencimientoCarnet ?? '',
      idiomas: guia.idiomas ?? '',
    })

    setError('')
    setMensaje('')
    setMostrarFormulario(true)
  }

  function cerrarFormulario() {
    setMostrarFormulario(false)
    setGuiaEditando(null)
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

  async function guardarGuia(evento) {
    evento.preventDefault()

    try {
      setGuardando(true)
      setError('')
      setMensaje('')

      const datos = {
        dni: formulario.dni.trim(),
        nombre: formulario.nombre.trim(),
        apellido: formulario.apellido.trim(),
        telefono: formulario.telefono.trim(),
        vencimientoCarnet: formulario.vencimientoCarnet || null,
        idiomas: formulario.idiomas.trim(),
      }

      const url = guiaEditando
        ? `${API_URL}/${guiaEditando.idGuia}`
        : API_URL

      const metodo = guiaEditando ? 'PUT' : 'POST'

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
          detalle || 'No se pudo guardar el guía. Verificá los datos.'
        )
      }

      await cargarGuias()
      cerrarFormulario()

      setMensaje(
        guiaEditando
          ? 'Guía actualizado correctamente.'
          : 'Guía registrado correctamente.'
      )
    } catch (err) {
      setError(err.message || 'Ocurrió un error al guardar el guía.')
    } finally {
      setGuardando(false)
    }
  }

  async function eliminarGuia(guia) {
    const confirmar = window.confirm(
      `¿Estás seguro de que deseas eliminar a ${guia.nombre} ${guia.apellido}?`
    )

    if (!confirmar) return

    try {
      setError('')
      setMensaje('')

      const respuesta = await fetch(`${API_URL}/${guia.idGuia}`, {
        method: 'DELETE',
      })

      if (!respuesta.ok) {
        const detalle = await respuesta.text()
        throw new Error(
          detalle || 'No se pudo eliminar el guía.'
        )
      }

      await cargarGuias()
      setMensaje('Guía eliminado correctamente.')
    } catch (err) {
      setError(err.message || 'Ocurrió un error al eliminar el guía.')
    }
  }

  function formatoFecha(fecha) {
    if (!fecha) return 'Sin fecha'

    const [anio, mes, dia] = fecha.split('-')
    return `${dia}/${mes}/${anio}`
  }

  function estadoCarnet(fecha) {
    if (!fecha) return 'Sin vencimiento'

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const vencimiento = new Date(`${fecha}T00:00:00`)

    return vencimiento < hoy ? 'Vencido' : 'Vigente'
  }

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

          <Link to="/admin/guias" className="admin-nav-link active">
            <span>🧭</span>
            Guías
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
              Gestión turística / Guías
            </span>
            <h1>Guías turísticos</h1>
          </div>

          <button
            className="admin-primary-button"
            onClick={abrirNuevo}
          >
            + Nuevo guía
          </button>
        </header>

        <section className="admin-content">
          <div className="admin-page-heading">
            <div>
              <h2>Administración de guías</h2>
              <p>
                Registrá y administrá los guías turísticos de la agencia.
              </p>
            </div>

            <div className="admin-stat-card">
              <span>Total de guías</span>
              <strong>{guias.length}</strong>
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
                <h3>Listado de guías</h3>
                <p>Consultá, buscá y administrá los registros.</p>
              </div>

              <input
                type="search"
                placeholder="Buscar por DNI, nombre o apellido..."
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
                className="admin-search-input"
              />
            </div>

            {cargando ? (
              <div className="admin-empty-state">
                Cargando guías...
              </div>
            ) : guiasFiltrados.length === 0 ? (
              <div className="admin-empty-state">
                {busqueda
                  ? 'No se encontraron guías con esa búsqueda.'
                  : 'Todavía no hay guías registrados.'}
              </div>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>DNI</th>
                      <th>Nombre y apellido</th>
                      <th>Teléfono</th>
                      <th>Vencimiento carnet</th>
                      <th>Estado carnet</th>
                      <th>Idiomas</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {guiasFiltrados.map((guia) => (
                      <tr key={guia.idGuia}>
                        <td>{guia.dni}</td>
                        <td>
                          <strong>
                            {guia.nombre} {guia.apellido}
                          </strong>
                        </td>
                        <td>{guia.telefono || '—'}</td>
                        <td>
                          {formatoFecha(guia.vencimientoCarnet)}
                        </td>
                        <td>
                          <span
                            className={
                              estadoCarnet(guia.vencimientoCarnet) === 'Vencido'
                                ? 'admin-status-badge inactive'
                                : 'admin-status-badge active'
                            }
                          >
                            {estadoCarnet(guia.vencimientoCarnet)}
                          </span>
                        </td>
                        <td>{guia.idiomas || '—'}</td>
                        <td>
                          <div className="admin-actions">
                            <button
                              className="admin-action-button"
                              onClick={() => abrirEdicion(guia)}
                            >
                              Editar
                            </button>

                            <button
                              className="admin-action-button danger"
                              onClick={() => eliminarGuia(guia)}
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
                      {guiaEditando ? 'Editar guía' : 'Registrar guía'}
                    </h2>
                    <p>
                      Completá los datos personales y profesionales.
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

                <form onSubmit={guardarGuia}>
                  <div className="admin-form-grid">
                    <label>
                      DNI *
                      <input
                        name="dni"
                        value={formulario.dni}
                        onChange={cambiarCampo}
                        maxLength={20}
                        required
                      />
                    </label>

                    <label>
                      Nombre *
                      <input
                        name="nombre"
                        value={formulario.nombre}
                        onChange={cambiarCampo}
                        required
                      />
                    </label>

                    <label>
                      Apellido *
                      <input
                        name="apellido"
                        value={formulario.apellido}
                        onChange={cambiarCampo}
                        required
                      />
                    </label>

                    <label>
                      Teléfono
                      <input
                        name="telefono"
                        value={formulario.telefono}
                        onChange={cambiarCampo}
                        placeholder="Ej. 2611234567"
                      />
                    </label>

                    <label>
                      Vencimiento del carnet
                      <input
                        type="date"
                        name="vencimientoCarnet"
                        value={formulario.vencimientoCarnet}
                        onChange={cambiarCampo}
                      />
                    </label>

                    <label className="admin-form-full">
                      Idiomas
                      <textarea
                        name="idiomas"
                        value={formulario.idiomas}
                        onChange={cambiarCampo}
                        rows={3}
                        placeholder="Ej. Español, Inglés, Portugués"
                      />
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
                        : guiaEditando
                          ? 'Guardar cambios'
                          : 'Registrar guía'}
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

export default Guias
