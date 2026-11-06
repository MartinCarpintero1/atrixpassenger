package com.atrixpassenger.backend.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Alta de personal (operadores / administradores).
 *
 * - {@code rol}: OPERADOR o ADMINISTRADOR. Si se omite se asume OPERADOR.
 * - {@code codigoRegistro}: requerido sólo en el registro público
 *   (/api/auth/register/operator). Debe coincidir con STAFF_REGISTRATION_CODE.
 */
public record OperatorRegisterRequest(
    @NotBlank(message = "El nombre completo es obligatorio")
    @Size(max = 100, message = "El nombre completo no puede superar los 100 caracteres")
    String nombreCompleto,

    @NotBlank(message = "El nombre de usuario es obligatorio")
    @Size(min = 4, max = 50, message = "El usuario debe tener entre 4 y 50 caracteres")
    String username,

    @NotBlank(message = "El correo electrónico es obligatorio")
    @Email(message = "El correo electrónico no tiene un formato válido")
    @Size(max = 100, message = "El correo no puede superar los 100 caracteres")
    String email,

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 8, max = 100, message = "La contraseña debe tener al menos 8 caracteres")
    String password,

    @Size(max = 120, message = "El nombre de la agencia no puede superar los 120 caracteres")
    String nombreAgencia,

    @Size(max = 30, message = "El teléfono no puede superar los 30 caracteres")
    String telefono,

    @Pattern(regexp = "OPERADOR|ADMINISTRADOR", message = "Rol inválido")
    String rol,

    String codigoRegistro
) {}
