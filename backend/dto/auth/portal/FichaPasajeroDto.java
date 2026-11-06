package com.atrixpassenger.backend.dto.portal;

import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Ficha de viaje del pasajero: datos de contacto, salud y emergencia.
 * Documento, nombre y fecha de nacimiento son de sólo lectura.
 */
public record FichaPasajeroDto(
    Integer idPasajero,
    String tipoDocumento,
    String nroDocumento,
    String nombre,
    String apellido,
    LocalDate fechaNacimiento,

    @Size(max = 60) String nacionalidad,
    @Size(max = 30) String contactoTel,
    String alergias,
    String medicacionHabitual,
    @Size(max = 10) String grupoSanguineo,
    @Size(max = 120) String contactoEmergenciaNombre,
    @Size(max = 30) String contactoEmergenciaTel
) {}
