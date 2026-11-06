/** Formateadores compartidos (es-AR). */
export function formatMoney(value) {
  return Number(value || 0).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
  })
}

export function formatDateTime(value) {
  if (!value) return 'Sin fecha'
  return new Date(value).toLocaleString('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('es-AR', { dateStyle: 'medium' })
}

export function formatDuration(value) {
  if (!value) return '—'
  const [h, m] = String(value).split(':').map(Number)
  return [h ? `${h} h` : '', m ? `${m} min` : ''].filter(Boolean).join(' ') || '—'
}

export function statusClass(value = '') {
  return `status-pill status-${String(value).toLowerCase().replace(/\s+/g, '-')}`
}
