package com.atrixpassenger.backend.dto.portal;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReservaPortalRequest(
    @NotNull(message = "Seleccioná un viaje")
    Integer idSalida,

    @NotNull
    @Min(value = 1, message = "La cantidad mínima es 1")
    @Max(value = 10, message = "La cantidad máxima por reserva es 10")
    Integer cantidadPasajeros,

    @Size(max = 500)
    String observaciones
) {}
