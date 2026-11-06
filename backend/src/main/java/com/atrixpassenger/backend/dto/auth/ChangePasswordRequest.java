package com.atrixpassenger.backend.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
    @NotBlank(message = "Ingresá tu contraseña actual")
    String passwordActual,

    @NotBlank(message = "Ingresá la nueva contraseña")
    @Size(min = 8, max = 100, message = "La nueva contraseña debe tener al menos 8 caracteres")
    String passwordNueva
) {}
