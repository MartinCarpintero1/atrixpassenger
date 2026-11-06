package com.atrixpassenger.backend.dto.auth;

import jakarta.validation.constraints.*;

import java.time.LocalDate;

public record PassengerRegisterRequest(

    @NotBlank
    @Size(max = 50)
    String username,

    @NotBlank
    @Email
    @Size(max = 100)
    String email,

    @NotBlank
    @Size(min = 8, max = 100)
    String password,

    @NotBlank
    @Size(max = 60)
    String nombre,

    @NotBlank
    @Size(max = 60)
    String apellido,

    @NotBlank
    @Pattern(regexp = "DNI|Pasaporte|Otro")
    String tipoDocumento,

    @NotBlank
    @Size(max = 20)
    String nroDocumento,

    @NotNull
    LocalDate fechaNacimiento,

    @Size(max = 60)
    String nacionalidad,

    @Size(max = 30)
    String contactoTel

) {}