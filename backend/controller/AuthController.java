package com.atrixpassenger.backend.controller;

import com.atrixpassenger.backend.dto.auth.*;
import com.atrixpassenger.backend.service.AuthService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/register/passenger")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse registerPassenger(@Valid @RequestBody PassengerRegisterRequest request) {
        return authService.registerPassenger(request);
    }

    /** Registro público de operadores protegido por STAFF_REGISTRATION_CODE. */
    @PostMapping("/register/operator")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse registerOperator(@Valid @RequestBody OperatorRegisterRequest request) {
        return authService.registerOperator(request);
    }

    /** Alta de operadores o administradores por un administrador autenticado. */
    @PostMapping("/staff")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public UserResponse createStaff(@Valid @RequestBody OperatorRegisterRequest request) {
        return authService.createStaff(request);
    }

    @PostMapping("/admins")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public UserResponse createAdministrator(@Valid @RequestBody OperatorRegisterRequest request) {
        return authService.createAdministrator(request);
    }

    @GetMapping("/me")
    public UserResponse currentUser(@AuthenticationPrincipal UserDetails userDetails) {
        return authService.getCurrentUser(userDetails.getUsername());
    }

    @PutMapping("/profile")
    public UserResponse updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request) {
        return authService.updateProfile(userDetails.getUsername(), request);
    }

    @PutMapping("/password")
    public Map<String, String> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(userDetails.getUsername(), request);
        return Map.of("message", "Contraseña actualizada correctamente");
    }
}
