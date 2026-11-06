package com.atrixpassenger.backend.controller;

import com.atrixpassenger.backend.entity.Pago;
import com.atrixpassenger.backend.service.PagoService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pagos")
@CrossOrigin(origins = "http://localhost:5173")
public class PagoController {

    private final PagoService pagoService;

    public PagoController(PagoService pagoService) {
        this.pagoService = pagoService;
    }

    @GetMapping
    public List<Pago> listarTodos() {
        return pagoService.listarTodos();
    }

    @GetMapping("/{id}")
    public Pago buscarPorId(@PathVariable Integer id) {
        return pagoService.buscarPorId(id);
    }

    @GetMapping("/reserva/{idReserva}")
    public List<Pago> listarPorReserva(
            @PathVariable Integer idReserva) {
        return pagoService.listarPorReserva(idReserva);
    }

    @GetMapping("/estado/{estado}")
    public List<Pago> listarPorEstado(
            @PathVariable String estado) {
        return pagoService.listarPorEstado(estado);
    }

    @GetMapping("/metodo/{metodo}")
    public List<Pago> listarPorMetodo(
            @PathVariable String metodo) {
        return pagoService.listarPorMetodo(metodo);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Pago crear(@RequestBody Pago pago) {
        return pagoService.crear(pago);
    }

    @PutMapping("/{id}")
    public Pago actualizar(
            @PathVariable Integer id,
            @RequestBody Pago pago) {
        return pagoService.actualizar(id, pago);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Integer id) {
        pagoService.eliminar(id);
    }
}
