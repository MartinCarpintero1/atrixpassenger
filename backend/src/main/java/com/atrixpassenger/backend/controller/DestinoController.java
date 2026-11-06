
package com.atrixpassenger.backend.controller;

import com.atrixpassenger.backend.entity.Destino;
import com.atrixpassenger.backend.service.DestinoService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/destinos")
public class DestinoController {

    private final DestinoService destinoService;

    public DestinoController(DestinoService destinoService) {
        this.destinoService = destinoService;
    }

    @GetMapping
    public List<Destino> listarTodos() {
        return destinoService.listarTodos();
    }

    @GetMapping("/{id}")
    public Destino buscarPorId(@PathVariable Integer id) {
        return destinoService.buscarPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Destino crear(@RequestBody Destino destino) {
        return destinoService.crear(destino);
    }

    @PutMapping("/{id}")
    public Destino actualizar(
            @PathVariable Integer id,
            @RequestBody Destino destino) {
        return destinoService.actualizar(id, destino);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Integer id) {
        destinoService.eliminar(id);
    }
}
