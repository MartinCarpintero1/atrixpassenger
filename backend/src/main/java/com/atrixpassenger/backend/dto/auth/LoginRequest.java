package com.atrixpassenger.backend.dto.auth;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
    @NotBlank(message = "Ingresá tu usuario o correo electrónico")
    String identifier,

    @NotBlank(message = "Ingresá tu contraseña")
    String password
) {}
