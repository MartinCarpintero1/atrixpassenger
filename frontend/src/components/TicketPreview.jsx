import { useEffect, useState } from 'react'

import { buildTicketPdf, ticketFileName } from '../services/ticketPdf'

/**
 * Vista previa interactiva del ticket en PDF.
 * El PDF se genera en memoria, se muestra en un <iframe> (visor nativo
 * del navegador: zoom, páginas, impresión) y sólo se guarda en el
 * dispositivo cuando el usuario pulsa "Descargar PDF".
 * Usar con key={viaje.idReserva} para reiniciar el estado al cambiar de viaje.
 */
function TicketPreview({ viaje }) {
  const [doc, setDoc] = useState(null)
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let objectUrl = ''
    let cancelled = false

    buildTicketPdf(viaje)
      .then((pdf) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(pdf.output('blob'))
        setDoc(pdf)
        setUrl(objectUrl)
      })
      .catch(() => !cancelled && setError('No se pudo generar el ticket.'))

    // Libera el blob al cambiar de viaje o desmontar.
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [viaje])

  return (
    <section className="ticket-preview">
      <div className="ticket-preview-toolbar">
        <strong>Vista previa del ticket</strong>
        <div className="module-actions">
          <a
            className="secondary-button"
            href={url || undefined}
            target="_blank"
            rel="noreferrer"
            aria-disabled={!url}
            style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
          >
            Abrir en pestaña
          </a>
          <button
            type="button"
            className="admin-primary-button"
            disabled={!doc}
            onClick={() => doc.save(ticketFileName(viaje))}
          >
            ⬇ Descargar PDF
          </button>
        </div>
      </div>

      {error && <div className="ticket-preview-loading">{error}</div>}
      {!error && !url && <div className="ticket-preview-loading">Generando ticket...</div>}
      {url && <iframe title={`Ticket ${viaje.codigoReserva}`} src={url} />}
    </section>
  )
}

export default TicketPreview
