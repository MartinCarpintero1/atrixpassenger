package com.atrixpassenger.backend.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
    @NotBlank(message = "El nombre completo es obligatorio")
    @Size(max = 100)
    String nombreCompleto,

    @NotBlank(message = "El correo electrónico es obligatorio")
    @Email(message = "El correo electrónico no tiene un formato válido")
    @Size(max = 100)
    String email,

    @Size(max = 30)
    String telefono,

    @Size(max = 120)
    String nombreAgencia
) {}
