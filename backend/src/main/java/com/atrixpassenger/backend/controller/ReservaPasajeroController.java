
package com.atrixpassenger.backend.controller;

import com.atrixpassenger.backend.entity.ReservaPasajero;
import com.atrixpassenger.backend.service.ReservaPasajeroService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reserva-pasajeros")
public class ReservaPasajeroController {

    private final ReservaPasajeroService reservaPasajeroService;

    public ReservaPasajeroController(
            ReservaPasajeroService reservaPasajeroService) {
        this.reservaPasajeroService = reservaPasajeroService;
    }

    @GetMapping
    public List<ReservaPasajero> listarTodos() {
        return reservaPasajeroService.listarTodos();
    }

    @GetMapping("/{id}")
    public ReservaPasajero buscarPorId(@PathVariable Integer id) {
        return reservaPasajeroService.buscarPorId(id);
    }

    @GetMapping("/reserva/{idReserva}")
    public List<ReservaPasajero> listarPorReserva(
            @PathVariable Integer idReserva) {
        return reservaPasajeroService.listarPorReserva(idReserva);
    }

    @GetMapping("/pasajero/{idPasajero}")
    public List<ReservaPasajero> listarPorPasajero(
            @PathVariable Integer idPasajero) {
        return reservaPasajeroService.listarPorPasajero(idPasajero);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReservaPasajero asociar(
            @RequestBody ReservaPasajero reservaPasajero) {
        return reservaPasajeroService.asociar(reservaPasajero);
    }

    @PatchMapping("/{id}/check-in")
    public ReservaPasajero actualizarCheckIn(
            @PathVariable Integer id,
            @RequestParam Boolean realizado) {
        return reservaPasajeroService.actualizarCheckIn(id, realizado);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void desasociar(@PathVariable Integer id) {
        reservaPasajeroService.desasociar(id);
    }
}
