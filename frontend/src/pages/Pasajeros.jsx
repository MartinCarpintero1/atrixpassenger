
import { useEffect, useMemo, useState } from 'react'
import RoleSidebar from '../components/RoleSidebar'
import '../Admin.css'

const API_URL = '/api/pasajeros'

const formularioInicial = {
  tipoDocumento: 'DNI',
  nroDocumento: '',
  nombre: '',
  apellido: '',
  nacionalidad: '',
  fechaNacimiento: '',
  contactoTel: '',
  alergias: '',
  medicacionHabitual: '',
  grupoSanguineo: '',
  contactoEmergenciaNombre: '',
  contactoEmergenciaTel: '',
  nfcTagUid: '',
}

function Pasajeros() {
  const [pasajeros, setPasajeros] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [formulario, setFormulario] = useState(formularioInicial)
  const [pasajeroEditando, setPasajeroEditando] = useState(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  async function cargarPasajeros() {
    try {
      setCargando(true)
      setError('')

      const respuesta = await fetch(API_URL)

      if (!respuesta.ok) {
        throw new Error('No se pudieron obtener los pasajeros.')
      }

      const datos = await respuesta.json()
      setPasajeros(datos)
    } catch (err) {
      setError(err.message || 'Ocurrió un error al cargar los pasajeros.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarPasajeros()
  }, [])

  const pasajerosFiltrados = useMemo(() => {
    const termino = busqueda.toLowerCase().trim()

    if (!termino) return pasajeros

    return pasajeros.filter((pasajero) => {
      const texto = [
        pasajero.tipoDocumento,
        pasajero.nroDocumento,
        pasajero.nombre,
        pasajero.apellido,
        pasajero.nacionalidad,
        pasajero.contactoTel,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return texto.includes(termino)
    })
  }, [pasajeros, busqueda])

  function abrirNuevo() {
    setPasajeroEditando(null)
    setFormulario(formularioInicial)
    setError('')
    setMensaje('')
    setMostrarFormulario(true)
  }

  function abrirEdicion(pasajero) {
    setPasajeroEditando(pasajero)

    setFormulario({
      tipoDocumento: pasajero.tipoDocumento ?? 'DNI',
      nroDocumento: pasajero.nroDocumento ?? '',
      nombre: pasajero.nombre ?? '',
      apellido: pasajero.apellido ?? '',
      nacionalidad: pasajero.nacionalidad ?? '',
      fechaNacimiento: pasajero.fechaNacimiento ?? '',
      contactoTel: pasajero.contactoTel ?? '',
      alergias: pasajero.alergias ?? '',
      medicacionHabitual: pasajero.medicacionHabitual ?? '',
      grupoSanguineo: pasajero.grupoSanguineo ?? '',
      contactoEmergenciaNombre: pasajero.contactoEmergenciaNombre ?? '',
      contactoEmergenciaTel: pasajero.contactoEmergenciaTel ?? '',
      nfcTagUid: pasajero.nfcTagUid ?? '',
    })

    setError('')
    setMensaje('')
    setMostrarFormulario(true)
  }

  function cerrarFormulario() {
    setMostrarFormulario(false)
    setPasajeroEditando(null)
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

  async function guardarPasajero(evento) {
    evento.preventDefault()

    try {
      setGuardando(true)
      setError('')
      setMensaje('')

      const datos = {
        tipoDocumento: formulario.tipoDocumento,
        nroDocumento: formulario.nroDocumento.trim(),
        nombre: formulario.nombre.trim(),
        apellido: formulario.apellido.trim(),
        nacionalidad: formulario.nacionalidad.trim(),
        fechaNacimiento: formulario.fechaNacimiento || null,
        contactoTel: formulario.contactoTel.trim(),
        alergias: formulario.alergias.trim(),
        medicacionHabitual: formulario.medicacionHabitual.trim(),
        grupoSanguineo: formulario.grupoSanguineo || '',
        contactoEmergenciaNombre: formulario.contactoEmergenciaNombre.trim(),
        contactoEmergenciaTel: formulario.contactoEmergenciaTel.trim(),
        nfcTagUid: formulario.nfcTagUid.trim() || null,
      }

      const url = pasajeroEditando
        ? `${API_URL}/${pasajeroEditando.idPasajero}`
        : API_URL

      const metodo = pasajeroEditando ? 'PUT' : 'POST'

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
          detalle || 'No se pudo guardar el pasajero. Verificá los datos.'
        )
      }

      const estabaEditando = Boolean(pasajeroEditando)

      await cargarPasajeros()
      cerrarFormulario()

      setMensaje(
        estabaEditando
          ? 'Pasajero actualizado correctamente.'
          : 'Pasajero registrado correctamente.'
      )
    } catch (err) {
      setError(err.message || 'Ocurrió un error al guardar el pasajero.')
    } finally {
      setGuardando(false)
    }
  }

  async function eliminarPasajero(pasajero) {
    const confirmar = window.confirm(
      `¿Estás seguro de que deseas eliminar a ${pasajero.nombre} ${pasajero.apellido}?`
    )

    if (!confirmar) return

    try {
      setError('')
      setMensaje('')

      const respuesta = await fetch(
        `${API_URL}/${pasajero.idPasajero}`,
        { method: 'DELETE' }
      )

      if (!respuesta.ok) {
        const detalle = await respuesta.text()
        throw new Error(
          detalle || 'No se pudo eliminar el pasajero.'
        )
      }

      await cargarPasajeros()
      setMensaje('Pasajero eliminado correctamente.')
    } catch (err) {
      setError(err.message || 'Ocurrió un error al eliminar el pasajero.')
    }
  }

  function formatoFecha(fecha) {
    if (!fecha) return 'Sin registrar'

    const [anio, mes, dia] = fecha.split('-')
    return `${dia}/${mes}/${anio}`
  }

  function formatoFechaRegistro(fecha) {
    if (!fecha) return '—'

    return new Date(fecha).toLocaleDateString('es-AR')
  }

  return (
    <div className="admin-layout">
      <RoleSidebar />

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-breadcrumb">
              Gestión turística / Pasajeros
            </span>
            <h1>Pasajeros</h1>
          </div>

          <button
            className="admin-primary-button"
            onClick={abrirNuevo}
          >
            + Nuevo pasajero
          </button>
        </header>

        <section className="admin-content">
          <div className="admin-page-heading">
            <div>
              <h2>Administración de pasajeros</h2>
              <p>
                Gestioná los datos de las personas que participan en las excursiones.
              </p>
            </div>

            <div className="admin-stat-card">
              <span>Total de pasajeros</span>
              <strong>{pasajeros.length}</strong>
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
                <h3>Listado de pasajeros</h3>
                <p>
                  Buscá y administrá los pasajeros registrados.
                </p>
              </div>

              <input
                type="search"
                placeholder="Buscar por documento, nombre o apellido..."
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
                className="admin-search-input"
              />
            </div>

            {cargando ? (
              <div className="admin-empty-state">
                Cargando pasajeros...
              </div>
            ) : pasajerosFiltrados.length === 0 ? (
              <div className="admin-empty-state">
                {busqueda
                  ? 'No se encontraron pasajeros con esa búsqueda.'
                  : 'Todavía no hay pasajeros registrados.'}
              </div>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Documento</th>
                      <th>Nombre y apellido</th>
                      <th>Nacionalidad</th>
                      <th>Teléfono</th>
                      <th>Fecha de nacimiento</th>
                      <th>Fecha de registro</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pasajerosFiltrados.map((pasajero) => (
                      <tr key={pasajero.idPasajero}>
                        <td>
                          <strong>{pasajero.tipoDocumento}</strong>
                          <div>{pasajero.nroDocumento}</div>
                        </td>

                        <td>
                          <strong>
                            {pasajero.nombre} {pasajero.apellido}
                          </strong>
                        </td>

                        <td>{pasajero.nacionalidad || '—'}</td>

                        <td>{pasajero.contactoTel || '—'}</td>

                        <td>
                          {formatoFecha(pasajero.fechaNacimiento)}
                        </td>

                        <td>
                          {formatoFechaRegistro(pasajero.fechaRegistro)}
                        </td>

                        <td>
                          <div className="admin-actions">
                            <button
                              className="admin-action-button"
                              onClick={() => abrirEdicion(pasajero)}
                            >
                              Editar
                            </button>

                            <button
                              className="admin-action-button danger"
                              onClick={() => eliminarPasajero(pasajero)}
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
                      {pasajeroEditando
                        ? 'Editar pasajero'
                        : 'Registrar pasajero'}
                    </h2>
                    <p>
                      Completá la información personal y de contacto.
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

                <form onSubmit={guardarPasajero}>
                  <div className="admin-form-grid">
                    <label>
                      Tipo de documento *
                      <select
                        name="tipoDocumento"
                        value={formulario.tipoDocumento}
                        onChange={cambiarCampo}
                        required
                      >
                        <option value="DNI">DNI</option>
                        <option value="Pasaporte">Pasaporte</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </label>

                    <label>
                      Número de documento *
                      <input
                        name="nroDocumento"
                        value={formulario.nroDocumento}
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
                        maxLength={100}
                        required
                      />
                    </label>

                    <label>
                      Apellido *
                      <input
                        name="apellido"
                        value={formulario.apellido}
                        onChange={cambiarCampo}
                        maxLength={100}
                        required
                      />
                    </label>

                    <label>
                      Nacionalidad
                      <input
                        name="nacionalidad"
                        value={formulario.nacionalidad}
                        onChange={cambiarCampo}
                        maxLength={60}
                        placeholder="Ej. Argentina"
                      />
                    </label>

                    <label>
                      Fecha de nacimiento
                      <input
                        type="date"
                        name="fechaNacimiento"
                        value={formulario.fechaNacimiento}
                        onChange={cambiarCampo}
                      />
                    </label>

                    <label>
                      Teléfono de contacto
                      <input
                        name="contactoTel"
                        value={formulario.contactoTel}
                        onChange={cambiarCampo}
                        maxLength={30}
                      />
                    </label>

                    <label>
                      Grupo sanguíneo
                      <select
                        name="grupoSanguineo"
                        value={formulario.grupoSanguineo}
                        onChange={cambiarCampo}
                      >
                        <option value="">No especificado</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </label>

                    <label className="admin-form-full">
                      Alergias
                      <textarea
                        name="alergias"
                        value={formulario.alergias}
                        onChange={cambiarCampo}
                        rows={2}
                        placeholder="Indicá las alergias conocidas, si corresponde."
                      />
                    </label>

                    <label className="admin-form-full">
                      Medicación habitual
                      <textarea
                        name="medicacionHabitual"
                        value={formulario.medicacionHabitual}
                        onChange={cambiarCampo}
                        rows={2}
                        placeholder="Indicá la medicación habitual, si corresponde."
                      />
                    </label>

                    <label>
                      Contacto de emergencia
                      <input
                        name="contactoEmergenciaNombre"
                        value={formulario.contactoEmergenciaNombre}
                        onChange={cambiarCampo}
                        maxLength={120}
                        placeholder="Nombre y apellido"
                      />
                    </label>

                    <label>
                      Teléfono de emergencia
                      <input
                        name="contactoEmergenciaTel"
                        value={formulario.contactoEmergenciaTel}
                        onChange={cambiarCampo}
                        maxLength={30}
                      />
                    </label>

                    <label className="admin-form-full">
                      Identificador NFC
                      <input
                        name="nfcTagUid"
                        value={formulario.nfcTagUid}
                        onChange={cambiarCampo}
                        maxLength={100}
                        placeholder="UID de la tarjeta o pulsera NFC"
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
                        : pasajeroEditando
                          ? 'Guardar cambios'
                          : 'Registrar pasajero'}
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

export default Pasajeros
