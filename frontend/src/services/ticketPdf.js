import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'

import { formatDateTime, formatDuration, formatMoney } from '../utils/format'

/**
 * Genera el ticket/comprobante de un viaje con jsPDF.
 * Se arma 100% en el navegador: no requiere endpoint adicional y el
 * mismo documento sirve para la vista previa (blob URL) y la descarga.
 *
 * @param {object} viaje ViajePasajeroDto devuelto por GET /api/me/viajes
 * @returns {Promise<jsPDF>}
 */
export async function buildTicketPdf(viaje) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 18
  const navy = [15, 39, 71]
  const blue = [29, 111, 216]
  const muted = [113, 128, 150]

  // --- Encabezado --------------------------------------------------------
  doc.setFillColor(...navy)
  doc.rect(0, 0, pageWidth, 38, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text('ATRIX PASSENGER', margin, 18)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Ticket / comprobante de viaje', margin, 27)
  doc.setFontSize(9)
  doc.text(`Emitido: ${formatDateTime(new Date())}`, pageWidth - margin, 27, { align: 'right' })

  // --- Código + QR ---------------------------------------------------------
  const codigo = viaje.codigoReserva || `RES-${viaje.idReserva}`
  const qrPayload = JSON.stringify({
    reserva: viaje.idReserva,
    codigo,
    salida: viaje.idSalida,
    documento: viaje.pasajeroDocumento,
  })
  const qr = await QRCode.toDataURL(qrPayload, { margin: 1, width: 300 })
  doc.addImage(qr, 'PNG', pageWidth - margin - 42, 46, 42, 42)

  doc.setTextColor(...muted)
  doc.setFontSize(9)
  doc.text('CÓDIGO DE RESERVA', margin, 52)
  doc.setTextColor(...blue)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(codigo, margin, 61)

  doc.setTextColor(...navy)
  doc.setFontSize(15)
  const titulo = doc.splitTextToSize(viaje.actividad || 'Viaje', pageWidth - margin * 2 - 50)
  doc.text(titulo, margin, 73)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...muted)
  doc.text(viaje.destino || '', margin, 73 + titulo.length * 6 + 2)

  // --- Bloques de datos ---------------------------------------------------
  let y = 100
  const section = (title, rows) => {
    doc.setDrawColor(225, 231, 239)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...blue)
    doc.text(title.toUpperCase(), margin, y)
    y += 7

    const colWidth = (pageWidth - margin * 2) / 2
    rows.forEach(([label, value], index) => {
      const x = margin + (index % 2) * colWidth
      if (index % 2 === 0 && index > 0) y += 13
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...muted)
      doc.text(label.toUpperCase(), x, y)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(...navy)
      doc.text(doc.splitTextToSize(String(value ?? '—'), colWidth - 6)[0], x, y + 5.5)
    })
    y += 18
  }

  section('Pasajero', [
    ['Titular', viaje.pasajeroNombre],
    ['Documento', [viaje.pasajeroTipoDocumento, viaje.pasajeroDocumento].filter(Boolean).join(' ')],
    ['Cantidad de pasajeros', viaje.cantidadPasajeros],
    ['Check-in', viaje.checkInRealizado ? 'Realizado' : 'Pendiente'],
  ])

  section('Viaje', [
    ['Fecha y hora de salida', formatDateTime(viaje.fechaHoraSalida)],
    ['Duración estimada', formatDuration(viaje.duracionEstimada)],
    ['Estado del viaje', viaje.estadoSalida],
    ['Dificultad', viaje.dificultad],
    ['Guía', viaje.guia ? `${viaje.guia}${viaje.guiaTelefono ? ` · ${viaje.guiaTelefono}` : ''}` : 'A confirmar'],
    ['Vehículo', viaje.vehiculo ? `${viaje.vehiculo} (${viaje.patente || 's/patente'})` : 'A confirmar'],
  ])

  section('Reserva y pago', [
    ['Estado de la reserva', viaje.estadoReserva],
    ['Fecha de reserva', formatDateTime(viaje.fechaReserva)],
    ['Precio por persona', formatMoney(viaje.precioPorPersona)],
    ['Total', formatMoney(viaje.valorTotal)],
    ['Estado del pago', viaje.estadoPago],
    ['Monto abonado', formatMoney(viaje.montoPagado)],
  ])

  if (viaje.observaciones) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...muted)
    doc.text(doc.splitTextToSize(`Observaciones: ${viaje.observaciones}`, pageWidth - margin * 2), margin, y)
    y += 12
  }

  // --- Pie -----------------------------------------------------------------
  const footerY = doc.internal.pageSize.getHeight() - 22
  doc.setDrawColor(225, 231, 239)
  doc.line(margin, footerY - 6, pageWidth - margin, footerY - 6)
  doc.setFontSize(8)
  doc.setTextColor(...muted)
  doc.text(
    'Presentá este comprobante (impreso o en tu celular) al momento de abordar junto a tu documento.',
    margin,
    footerY
  )
  doc.text('Atrix Passenger · atrixpassenger.vercel.app', margin, footerY + 5)

  doc.setProperties({ title: `Ticket ${codigo}`, subject: 'Comprobante de viaje', creator: 'Atrix Passenger' })
  return doc
}

export function ticketFileName(viaje) {
  return `ticket-${viaje.codigoReserva || viaje.idReserva}.pdf`
}
