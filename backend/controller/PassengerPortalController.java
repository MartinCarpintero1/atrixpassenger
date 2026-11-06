package com.atrixpassenger.backend.controller;

import com.atrixpassenger.backend.dto.portal.*;
import com.atrixpassenger.backend.service.PassengerPortalService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Portal del pasajero (rol USUARIO). Todos los datos se filtran
 * por el usuario autenticado: un pasajero nunca ve datos ajenos.
 */
@RestController
@RequestMapping("/api/me")
public class PassengerPortalController {

    private final PassengerPortalService portalService;

    public PassengerPortalController(PassengerPortalService portalService) {
        this.portalService = portalService;
    }

    @GetMapping("/viajes")
    public List<ViajePasajeroDto> misViajes(@AuthenticationPrincipal UserDetails user) {
        return portalService.misViajes(user.getUsername());
    }

    @GetMapping("/viajes/{idReserva}")
    public ViajePasajeroDto miViaje(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Integer idReserva) {
        return portalService.miViaje(user.getUsername(), idReserva);
    }

    @GetMapping("/cupos")
    public List<CupoDto> cupos(@AuthenticationPrincipal UserDetails user) {
        return portalService.cuposDisponibles(user.getUsername());
    }

    @PostMapping("/reservas")
    @ResponseStatus(HttpStatus.CREATED)
    public ViajePasajeroDto reservar(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody ReservaPortalRequest request) {
        return portalService.reservar(user.getUsername(), request);
    }

    @GetMapping("/ficha")
    public FichaPasajeroDto ficha(@AuthenticationPrincipal UserDetails user) {
        return portalService.ficha(user.getUsername());
    }

    @PutMapping("/ficha")
    public FichaPasajeroDto actualizarFicha(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody FichaPasajeroDto ficha) {
        return portalService.actualizarFicha(user.getUsername(), ficha);
    }
}
