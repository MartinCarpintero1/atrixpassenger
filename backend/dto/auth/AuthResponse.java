package com.atrixpassenger.backend.dto.auth;

public class AuthResponse {

    private String token;
    private Integer idUsuario;
    private String nombreCompleto;
    private String username;
    private String email;
    private String rol;

    public AuthResponse(
            String token,
            Integer idUsuario,
            String nombreCompleto,
            String username,
            String email,
            String rol
    ) {
        this.token = token;
        this.idUsuario = idUsuario;
        this.nombreCompleto = nombreCompleto;
        this.username = username;
        this.email = email;
        this.rol = rol;
    }

    public String getToken() { return token; }
    public Integer getIdUsuario() { return idUsuario; }
    public String getNombreCompleto() { return nombreCompleto; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getRol() { return rol; }
}