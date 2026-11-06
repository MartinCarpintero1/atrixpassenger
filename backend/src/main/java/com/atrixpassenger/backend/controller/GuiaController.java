package com.atrixpassenger.backend.controller;

import com.atrixpassenger.backend.entity.Guia;
import com.atrixpassenger.backend.service.GuiaService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/guias")
public class GuiaController {

    private final GuiaService guiaService;

    public GuiaController(GuiaService guiaService) {
        this.guiaService = guiaService;
    }

    @GetMapping
    public List<Guia> listarTodos() {
        return guiaService.listarTodos();
    }

    @GetMapping("/{id}")
    public Guia buscarPorId(@PathVariable Integer id) {
        return guiaService.buscarPorId(id);
    }

    @GetMapping("/dni/{dni}")
    public Guia buscarPorDni(@PathVariable String dni) {
        return guiaService.buscarPorDni(dni);
    }

    @GetMapping("/buscar")
    public List<Guia> buscarPorNombre(@RequestParam String nombre) {
        return guiaService.buscarPorNombre(nombre);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Guia crear(@RequestBody Guia guia) {
        return guiaService.crear(guia);
    }

    @PutMapping("/{id}")
    public Guia actualizar(
            @PathVariable Integer id,
            @RequestBody Guia guia) {
        return guiaService.actualizar(id, guia);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Integer id) {
        guiaService.eliminar(id);
    }
}
