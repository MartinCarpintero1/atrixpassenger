package com.atrixpassenger.backend.dto.auth;

/**
 * Respuesta de login/registro: token JWT + datos del usuario autenticado.
 * El frontend consume {@code token} y {@code user}.
 */
public record AuthResponse(
    String token,
    String tokenType,
    long expiresIn,
    UserResponse user
) {}
