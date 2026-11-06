import { useCallback, useEffect, useState } from 'react'

import RoleLayout from '../components/RoleLayout'
import { useAuth } from '../context/AuthContext'
import { roleLabel } from '../config/navigation'
import { api } from '../services/api'

const STAFF_INITIAL = {
  nombreCompleto: '',
  username: '',
  email: '',
  password: '',
  telefono: '',
  nombreAgencia: '',
  rol: 'OPERADOR',
}

/**
 * Configuración (todos los roles): perfil y contraseña.
 * El ADMINISTRADOR además da de alta operadores/administradores
 * y habilita o deshabilita cuentas del personal.
 */
function Configuracion() {
  const { user, updateUser } = useAuth()
  const esAdmin = user?.role === 'ADMINISTRADOR'
  const esStaff = user?.role !== 'USUARIO'

  const [perfil, setPerfil] = useState({
    nombreCompleto: user?.nombreCompleto || '',
    email: user?.email || '',
    telefono: user?.telefono || '',
    nombreAgencia: user?.nombreAgencia || '',
  })
  const [passwords, setPasswords] = useState({ passwordActual: '', passwordNueva: '', confirmacion: '' })
  const [staff, setStaff] = useState(STAFF_INITIAL)
  const [usuarios, setUsuarios] = useState([])
  const [feedback, setFeedback] = useState({ section: '', type: '', text: '' })
  const [busy, setBusy] = useState('')

  const cargarUsuarios = useCallback(() => {
    if (!esAdmin) return
    api.get('/api/usuarios')
      .then((lista) => setUsuarios(lista.filter((u) => u.rol?.nombreRol?.toUpperCase() !== 'USUARIO')))
      .catch(() => setUsuarios([]))
  }, [esAdmin])

  useEffect(cargarUsuarios, [cargarUsuarios])

  async function run(section, action, successText) {
    setBusy(section)
    setFeedback({ section: '', type: '', text: '' })
    try {
      await action()
      setFeedback({ section, type: 'success', text: successText })
    } catch (err) {
      setFeedback({ section, type: 'error', text: err.message })
    } finally {
      setBusy('')
    }
  }

  const saveProfile = (event) => {
    event.preventDefault()
    run('perfil', async () => updateUser(await api.put('/api/auth/profile', perfil)), 'Perfil actualizado.')
  }

  const savePassword = (event) => {
    event.preventDefault()
    run('password', async () => {
      if (passwords.passwordNueva !== passwords.confirmacion) {
        throw new Error('Las contraseñas nuevas no coinciden.')
      }
      await api.put('/api/auth/password', {
        passwordActual: passwords.passwordActual,
        passwordNueva: passwords.passwordNueva,
      })
      setPasswords({ passwordActual: '', passwordNueva: '', confirmacion: '' })
    }, 'Contraseña actualizada.')
  }

  const createStaff = (event) => {
    event.preventDefault()
    run('staff', async () => {
      await api.post('/api/auth/staff', staff)
      setStaff(STAFF_INITIAL)
      cargarUsuarios()
    }, `Cuenta de ${roleLabel(staff.rol).toLowerCase()} creada.`)
  }

  const toggleActivo = (cuenta) =>
    run('usuarios', async () => {
      await api.patch(`/api/usuarios/${cuenta.idUsuario}/activo?activo=${!cuenta.activo}`)
      cargarUsuarios()
    }, 'Estado de la cuenta actualizado.')

  const message = (section) =>
    feedback.section === section && (
      <div className={`alert alert-${feedback.type}`}>{feedback.text}</div>
    )

  return (
    <RoleLayout
      eyebrow={roleLabel(user?.role).toUpperCase()}
      title="Configuración"
      description="Datos de tu cuenta y seguridad."
    >
      <div className="two-columns">
        <form className="module-panel module-form" onSubmit={saveProfile}>
          <div className="full"><h2>Perfil</h2></div>
          <div className="full">{message('perfil')}</div>
          <label>Usuario<input value={user?.username || ''} disabled /></label>
          <label>Rol<input value={roleLabel(user?.role)} disabled /></label>
          <label className="full">
            Nombre completo
            <input required maxLength={120} value={perfil.nombreCompleto}
              onChange={(e) => setPerfil({ ...perfil, nombreCompleto: e.target.value })} />
          </label>
          <label>
            Correo electrónico
            <input type="email" required value={perfil.email}
              onChange={(e) => setPerfil({ ...perfil, email: e.target.value })} />
          </label>
          <label>
            Teléfono
            <input maxLength={30} value={perfil.telefono}
              onChange={(e) => setPerfil({ ...perfil, telefono: e.target.value })} />
          </label>
          {esStaff && (
            <label className="full">
              Agencia
              <input maxLength={120} value={perfil.nombreAgencia}
                onChange={(e) => setPerfil({ ...perfil, nombreAgencia: e.target.value })} />
            </label>
          )}
          <div className="module-form-actions">
            <button className="admin-primary-button" disabled={busy === 'perfil'}>Guardar perfil</button>
          </div>
        </form>

        <form className="module-panel module-form" onSubmit={savePassword}>
          <div className="full"><h2>Contraseña</h2></div>
          <div className="full">{message('password')}</div>
          <label className="full">
            Contraseña actual
            <input type="password" required autoComplete="current-password" value={passwords.passwordActual}
              onChange={(e) => setPasswords({ ...passwords, passwordActual: e.target.value })} />
          </label>
          <label>
            Nueva contraseña
            <input type="password" required minLength={8} autoComplete="new-password" value={passwords.passwordNueva}
              onChange={(e) => setPasswords({ ...passwords, passwordNueva: e.target.value })} />
          </label>
          <label>
            Repetir contraseña
            <input type="password" required minLength={8} autoComplete="new-password" value={passwords.confirmacion}
              onChange={(e) => setPasswords({ ...passwords, confirmacion: e.target.value })} />
          </label>
          <div className="module-form-actions">
            <button className="admin-primary-button" disabled={busy === 'password'}>Cambiar contraseña</button>
          </div>
        </form>
      </div>

      {esAdmin && (
        <>
          <form className="module-panel module-form" onSubmit={createStaff}>
            <div className="full">
              <h2>Alta de personal</h2>
              <p className="module-description">Registro seguro de operadores y administradores (sólo administradores).</p>
            </div>
            <div className="full">{message('staff')}</div>
            <label>Nombre completo<input required maxLength={120} value={staff.nombreCompleto}
              onChange={(e) => setStaff({ ...staff, nombreCompleto: e.target.value })} /></label>
            <label>
              Rol
              <select value={staff.rol} onChange={(e) => setStaff({ ...staff, rol: e.target.value })}>
                <option value="OPERADOR">Operador</option>
                <option value="ADMINISTRADOR">Administrador</option>
              </select>
            </label>
            <label>Usuario<input required minLength={3} maxLength={50} value={staff.username}
              onChange={(e) => setStaff({ ...staff, username: e.target.value })} /></label>
            <label>Correo electrónico<input type="email" required value={staff.email}
              onChange={(e) => setStaff({ ...staff, email: e.target.value })} /></label>
            <label>Contraseña inicial<input type="password" required minLength={8} autoComplete="new-password" value={staff.password}
              onChange={(e) => setStaff({ ...staff, password: e.target.value })} /></label>
            <label>Teléfono<input maxLength={30} value={staff.telefono}
              onChange={(e) => setStaff({ ...staff, telefono: e.target.value })} /></label>
            <label className="full">Agencia<input maxLength={120} value={staff.nombreAgencia}
              onChange={(e) => setStaff({ ...staff, nombreAgencia: e.target.value })} /></label>
            <div className="module-form-actions">
              <button className="admin-primary-button" disabled={busy === 'staff'}>Crear cuenta</button>
            </div>
          </form>

          <section className="module-panel">
            <h2>Personal registrado</h2>
            <p>Deshabilitá cuentas sin perder su historial.</p>
            {message('usuarios')}
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr><th>Nombre</th><th>Usuario</th><th>Rol</th><th>Estado</th><th /></tr>
                </thead>
                <tbody>
                  {usuarios.map((cuenta) => (
                    <tr key={cuenta.idUsuario}>
                      <td>{cuenta.nombreCompleto}<small>{cuenta.email}</small></td>
                      <td>{cuenta.username}</td>
                      <td>{roleLabel(cuenta.rol?.nombreRol?.toUpperCase())}</td>
                      <td>
                        <span className={`status-pill ${cuenta.activo ? 'status-confirmada' : 'status-cancelada'}`}>
                          {cuenta.activo ? 'Activa' : 'Deshabilitada'}
                        </span>
                      </td>
                      <td>
                        {cuenta.idUsuario !== user.idUsuario && (
                          <button type="button" className="secondary-button" onClick={() => toggleActivo(cuenta)}>
                            {cuenta.activo ? 'Deshabilitar' : 'Habilitar'}
                          </button>
                        )}
                      </td>
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

export default Configuracion
