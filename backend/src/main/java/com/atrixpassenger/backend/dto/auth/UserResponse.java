package com.atrixpassenger.backend.dto.auth;

public record UserResponse(
    Integer idUsuario,
    String username,
    String email,
    String nombreCompleto,
    String role,
    String telefono,
    String nombreAgencia,
    Boolean activo
) {}
