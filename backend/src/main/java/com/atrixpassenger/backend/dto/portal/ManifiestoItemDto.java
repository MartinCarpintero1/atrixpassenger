package com.atrixpassenger.backend.dto.portal;

/** Fila del lista de abordaje de un viaje (módulo operador). */
public record ManifiestoItemDto(
    Integer idReservaPasajero,
    Integer idReserva,
    String codigoReserva,
    String estadoReserva,
    Integer idPasajero,
    String pasajero,
    String documento,
    String telefono,
    String alergias,
    String medicacionHabitual,
    String grupoSanguineo,
    String contactoEmergencia,
    Boolean checkInRealizado
) {}
