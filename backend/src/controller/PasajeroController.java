
package com.atrixpassenger.backend.controller;

import com.atrixpassenger.backend.entity.Pasajero;
import com.atrixpassenger.backend.service.PasajeroService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pasajeros")
@CrossOrigin(origins = "http://localhost:5173")
public class PasajeroController {

    private final PasajeroService pasajeroService;

    public PasajeroController(PasajeroService pasajeroService) {
        this.pasajeroService = pasajeroService;
    }

    @GetMapping
    public List<Pasajero> listarTodos() {
        return pasajeroService.listarTodos();
    }

    @GetMapping("/buscar")
    public List<Pasajero> buscarPorNombre(
            @RequestParam String nombre) {
        return pasajeroService.buscarPorNombre(nombre);
    }

    @GetMapping("/documento/{documento}")
    public Pasajero buscarPorDocumento(
            @PathVariable String documento) {
        return pasajeroService.buscarPorDocumento(documento);
    }

    @GetMapping("/{id}")
    public Pasajero buscarPorId(@PathVariable Integer id) {
        return pasajeroService.buscarPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Pasajero crear(@RequestBody Pasajero pasajero) {
        return pasajeroService.crear(pasajero);
    }

    @PutMapping("/{id}")
    public Pasajero actualizar(
            @PathVariable Integer id,
            @RequestBody Pasajero pasajero) {
        return pasajeroService.actualizar(id, pasajero);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Integer id) {
        pasajeroService.eliminar(id);
    }
}
