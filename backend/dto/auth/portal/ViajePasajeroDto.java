package com.atrixpassenger.backend.dto.portal;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Detalle completo de un viaje (reserva + salida + actividad + destino)
 * para el portal del pasajero y el ticket PDF.
 */
public record ViajePasajeroDto(
    Integer idReserva,
    String codigoReserva,
    String estadoReserva,
    LocalDateTime fechaReserva,
    Integer cantidadPasajeros,
    BigDecimal valorTotal,
    String observaciones,
    Boolean checkInRealizado,
    String estadoPago,
    BigDecimal montoPagado,

    Integer idSalida,
    LocalDateTime fechaHoraSalida,
    String estadoSalida,
    BigDecimal precioPorPersona,
    Integer cuposTotales,
    Integer cuposDisponibles,

    String actividad,
    String descripcionActividad,
    LocalTime duracionEstimada,
    String destino,
    String descripcionDestino,
    String dificultad,

    String guia,
    String guiaTelefono,
    String vehiculo,
    String patente,

    String pasajeroNombre,
    String pasajeroDocumento,
    String pasajeroTipoDocumento
) {}
