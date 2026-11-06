import { useEffect, useState } from 'react'

import RoleLayout from '../components/RoleLayout'
import { api } from '../services/api'
import { formatDate } from '../utils/format'

/**
 * Módulo extra del pasajero: "Ficha de viaje".
 * Datos de salud y contacto de emergencia que el operador ve en el
 * lista de abordaje. Mejora la seguridad en excursiones.
 */
function FichaViaje() {
  const [ficha, setFicha] = useState(null)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    api.get('/api/me/ficha').then(setFicha).catch((err) => setError(err.message))
  }, [])

  function handleChange(event) {
    setFicha({ ...ficha, [event.target.name]: event.target.value })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setGuardando(true)
    setError('')
    setMensaje('')
    try {
      setFicha(await api.put('/api/me/ficha', ficha))
      setMensaje('Ficha actualizada correctamente.')
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  const field = (name, label, props = {}) => (
    <label className={props.full ? 'full' : undefined}>
      {label}
      {props.textarea ? (
        <textarea name={name} value={ficha[name] || ''} onChange={handleChange} />
      ) : (
        <input name={name} value={ficha[name] || ''} onChange={handleChange} maxLength={props.maxLength} />
      )}
    </label>
  )

  return (
    <RoleLayout
      eyebrow="MI CUENTA"
      title="Ficha de viaje"
      description="Esta información la ve el equipo operativo el día del viaje, al momento de abordar."
    >
      {error && <div className="alert alert-error">{error}</div>}
      {mensaje && <div className="alert alert-success">{mensaje}</div>}

      {ficha && (
        <form className="module-panel module-form" onSubmit={handleSubmit}>
          <label>Nombre<input value={`${ficha.nombre} ${ficha.apellido}`} disabled /></label>
          <label>Documento<input value={`${ficha.tipoDocumento} ${ficha.nroDocumento}`} disabled /></label>
          <label>Fecha de nacimiento<input value={formatDate(ficha.fechaNacimiento)} disabled /></label>
          {field('nacionalidad', 'Nacionalidad', { maxLength: 60 })}
          {field('contactoTel', 'Teléfono de contacto', { maxLength: 30 })}
          <label>
            Grupo sanguíneo
            <select name="grupoSanguineo" value={ficha.grupoSanguineo || ''} onChange={handleChange}>
              <option value="">Sin informar</option>
              {['0+', '0-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </label>
          {field('contactoEmergenciaNombre', 'Contacto de emergencia', { maxLength: 120 })}
          {field('contactoEmergenciaTel', 'Teléfono de emergencia', { maxLength: 30 })}
          {field('alergias', 'Alergias', { textarea: true, full: true })}
          {field('medicacionHabitual', 'Medicación habitual', { textarea: true, full: true })}

          <div className="module-form-actions">
            <button type="submit" className="admin-primary-button" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar ficha'}
            </button>
          </div>
        </form>
      )}
    </RoleLayout>
  )
}

export default FichaViaje
