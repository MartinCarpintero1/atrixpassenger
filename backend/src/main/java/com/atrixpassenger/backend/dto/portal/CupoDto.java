package com.atrixpassenger.backend.dto.portal;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;

/** Salida programada con cupos disponibles (módulo "Cupos"). */
public record CupoDto(
    Integer idSalida,
    String actividad,
    String descripcion,
    String destino,
    String dificultad,
    LocalTime duracionEstimada,
    LocalDateTime fechaHoraSalida,
    Integer cuposTotales,
    Integer cuposDisponibles,
    BigDecimal precioPorPersona,
    String estadoSalida,
    boolean yaReservado
) {}
