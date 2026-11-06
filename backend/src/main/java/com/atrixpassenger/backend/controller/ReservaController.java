
package com.atrixpassenger.backend.controller;

import com.atrixpassenger.backend.entity.Reserva;
import com.atrixpassenger.backend.entity.Reserva.EstadoReserva;
import com.atrixpassenger.backend.service.ReservaService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reservas")
public class ReservaController {

    private final ReservaService reservaService;

    public ReservaController(ReservaService reservaService) {
        this.reservaService = reservaService;
    }

    @GetMapping
    public List<Reserva> listarTodas() {
        return reservaService.listarTodas();
    }

    @GetMapping("/{id}")
    public Reserva buscarPorId(@PathVariable Integer id) {
        return reservaService.buscarPorId(id);
    }

    @GetMapping("/estado/{estado}")
    public List<Reserva> listarPorEstado(
            @PathVariable EstadoReserva estado) {
        return reservaService.listarPorEstado(estado);
    }

    @GetMapping("/salida/{idSalida}")
    public List<Reserva> listarPorSalida(
            @PathVariable Integer idSalida) {
        return reservaService.listarPorSalida(idSalida);
    }

    @GetMapping("/codigo/{codigo}")
    public Reserva buscarPorCodigo(@PathVariable String codigo) {
        return reservaService.buscarPorCodigo(codigo);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Reserva crear(@RequestBody Reserva reserva) {
        return reservaService.crear(reserva);
    }

    @PutMapping("/{id}")
    public Reserva actualizar(
            @PathVariable Integer id,
            @RequestBody Reserva reserva) {
        return reservaService.actualizar(id, reserva);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Integer id) {
        reservaService.eliminar(id);
    }
}
