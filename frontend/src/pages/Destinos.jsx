import { useEffect, useMemo, useState } from 'react'
import RoleSidebar from '../components/RoleSidebar'
import '../Admin.css'

const API_URL = '/api/destinos'

const formularioInicial = {
  nombreDestino: '',
  descripcion: '',
  dificultad: 'Baja',
  duracionEstimada: '01:00',
}

function Destinos() {
  const [destinos, setDestinos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [formulario, setFormulario] = useState(formularioInicial)
  const [destinoEditando, setDestinoEditando] = useState(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  async function cargarDestinos() {
    setCargando(true)
    setError('')

    try {
      const respuesta = await fetch(API_URL)

      if (!respuesta.ok) {
        throw new Error('No se pudieron cargar los destinos.')
      }

      const datos = await respuesta.json()
      setDestinos(Array.isArray(datos) ? datos : [])
    } catch (err) {
      setError(err.message || 'Error al conectar con la API.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDestinos()
  }, [])

  const destinosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()

    return destinos.filter((destino) =>
      [
        destino.nombreDestino,
        destino.descripcion,
        destino.dificultad,
      ].some((valor) =>
        String(valor ?? '').toLowerCase().includes(termino)
      )
    )
  }, [destinos, busqueda])

  function abrirNuevo() {
    setDestinoEditando(null)
    setFormulario(formularioInicial)
    setMostrarFormulario(true)
    setError('')
    setMensaje('')
  }

  function abrirEdicion(destino) {
    setDestinoEditando(destino)
    setFormulario({
      nombreDestino: destino.nombreDestino ?? '',
      descripcion: destino.descripcion ?? '',
      dificultad: destino.dificultad ?? 'Baja',
      duracionEstimada: String(destino.duracionEstimada ?? '01:00:00')
        .slice(0, 5),
    })
    setMostrarFormulario(true)
    setError('')
    setMensaje('')
  }

  function cerrarFormulario() {
    setMostrarFormulario(false)
    setDestinoEditando(null)
    setFormulario(formularioInicial)
  }

  function cambiarCampo(event) {
    const { name, value } = event.target
    setFormulario((actual) => ({ ...actual, [name]: value }))
  }

  async function guardarDestino(event) {
    event.preventDefault()
    setGuardando(true)
    setError('')
    setMensaje('')

    const editando = destinoEditando !== null
    const url = editando
      ? `${API_URL}/${destinoEditando.idDestino}`
      : API_URL

    const datos = {
      ...formulario,
      duracionEstimada: formulario.duracionEstimada.length === 5
        ? `${formulario.duracionEstimada}:00`
        : formulario.duracionEstimada,
    }

    try {
      const respuesta = await fetch(url, {
        method: editando ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      })

      if (!respuesta.ok) {
        const detalle = await respuesta.text()
        throw new Error(
          detalle || 'No se pudo guardar el destino. Revisá los datos.'
        )
      }

      await cargarDestinos()
      cerrarFormulario()
      setMensaje(editando
        ? 'Destino actualizado correctamente.'
        : 'Destino creado correctamente.')
    } catch (err) {
      setError(err.message || 'Ocurrió un error al guardar.')
    } finally {
      setGuardando(false)
    }
  }

  async function eliminarDestino(destino) {
    const confirmar = window.confirm(
      `¿Seguro que querés eliminar el destino "${destino.nombreDestino}"?`
    )

    if (!confirmar) return

    setError('')
    setMensaje('')

    try {
      const respuesta = await fetch(
        `${API_URL}/${destino.idDestino}`,
        { method: 'DELETE' }
      )

      if (!respuesta.ok) {
        const detalle = await respuesta.text()
        throw new Error(
          detalle || 'No se pudo eliminar el destino.'
        )
      }

      await cargarDestinos()
      setMensaje('Destino eliminado correctamente.')
    } catch (err) {
      setError(err.message || 'Ocurrió un error al eliminar.')
    }
  }

  return (
    <div className="admin-layout">
      <RoleSidebar />

      <main className="admin-main" id="destinos">
        <header className="admin-topbar">
          <div>
            <p className="admin-eyebrow">GESTIÓN TURÍSTICA</p>
            <h1>Destinos</h1>
          </div>

          <button
            type="button"
            className="admin-primary-button"
            onClick={abrirNuevo}
          >
            + Nuevo destino
          </button>
        </header>

        <section className="admin-section destinos-panel">
          <div className="destinos-toolbar">
            <div>
              <h2>Destinos registrados</h2>
              <p>Administrá los destinos turísticos de la plataforma.</p>
            </div>

            <input
              className="destinos-search"
              type="search"
              placeholder="Buscar destino..."
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              aria-label="Buscar destinos"
            />
          </div>

          {mensaje && (
            <p className="destinos-message destinos-success" role="status">
              {mensaje}
            </p>
          )}

          {error && (
            <p className="destinos-message destinos-error" role="alert">
              {error}
            </p>
          )}

          {mostrarFormulario && (
            <form className="destinos-form" onSubmit={guardarDestino}>
              <h2>
                {destinoEditando ? 'Editar destino' : 'Registrar destino'}
              </h2>

              <div className="destinos-form-grid">
                <label>
                  Nombre del destino *
                  <input
                    name="nombreDestino"
                    value={formulario.nombreDestino}
                    onChange={cambiarCampo}
                    required
                    maxLength={100}
                  />
                </label>

                <label>
                  Dificultad *
                  <select
                    name="dificultad"
                    value={formulario.dificultad}
                    onChange={cambiarCampo}
                    required
                  >
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                  </select>
                </label>

                <label>
                  Duración estimada *
                  <input
                    type="time"
                    name="duracionEstimada"
                    value={formulario.duracionEstimada}
                    onChange={cambiarCampo}
                    required
                  />
                </label>

                <label className="destinos-description-field">
                  Descripción
                  <textarea
                    name="descripcion"
                    value={formulario.descripcion}
                    onChange={cambiarCampo}
                    rows={3}
                  />
                </label>
              </div>

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
                  {guardando ? 'Guardando...' : 'Guardar destino'}
                </button>
              </div>
            </form>
          )}

          {cargando ? (
            <p className="destinos-empty">Cargando destinos...</p>
          ) : destinosFiltrados.length === 0 ? (
            <div className="destinos-empty">
              <span>🗺️</span>
              <h3>No hay destinos para mostrar</h3>
              <p>
                {busqueda
                  ? 'Probá con otro término de búsqueda.'
                  : 'Cuando registres destinos, aparecerán en esta tabla.'}
              </p>
            </div>
          ) : (
            <div className="destinos-table-wrapper">
              <table className="destinos-table">
                <thead>
                  <tr>
                    <th>Destino</th>
                    <th>Dificultad</th>
                    <th>Duración</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {destinosFiltrados.map((destino) => (
                    <tr key={destino.idDestino}>
                      <td>
                        <strong>{destino.nombreDestino}</strong>
                        <span className="destinos-description">
                          {destino.descripcion || 'Sin descripción'}
                        </span>
                      </td>

                      <td>
                        <span className={`destinos-difficulty dificultad-${String(
                          destino.dificultad ?? 'baja'
                        ).toLowerCase()}`}>
                          {destino.dificultad}
                        </span>
                      </td>

                      <td>
                        {destino.duracionEstimada
                          ? String(destino.duracionEstimada).slice(0, 5)
                          : '—'}
                      </td>

                      <td>
                        <div className="destinos-row-actions">
                          <button
                            type="button"
                            onClick={() => abrirEdicion(destino)}
                            aria-label={`Editar ${destino.nombreDestino}`}
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            className="destinos-delete-button"
                            onClick={() => eliminarDestino(destino)}
                            aria-label={`Eliminar ${destino.nombreDestino}`}
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

        <footer className="admin-footer">
          Atrix Passenger · Gestión de destinos
        </footer>
      </main>
    </div>
  )
}

export default Destinos
