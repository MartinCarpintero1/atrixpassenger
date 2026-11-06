package com.atrixpassenger.backend.controller;

import com.atrixpassenger.backend.entity.Actividad;
import com.atrixpassenger.backend.service.ActividadService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/actividades")
@CrossOrigin(origins = "http://localhost:5173")
public class ActividadController {

    private final ActividadService actividadService;

    public ActividadController(ActividadService actividadService) {
        this.actividadService = actividadService;
    }

    @GetMapping
    public List<Actividad> listarTodas() {
        return actividadService.listarTodas();
    }

    @GetMapping("/activas")
    public List<Actividad> listarActivas() {
        return actividadService.listarActivas();
    }

    @GetMapping("/{id}")
    public Actividad buscarPorId(@PathVariable Integer id) {
        return actividadService.buscarPorId(id);
    }

    @GetMapping("/destino/{idDestino}")
    public List<Actividad> listarPorDestino(
            @PathVariable Integer idDestino) {
        return actividadService.listarPorDestino(idDestino);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Actividad crear(@RequestBody Actividad actividad) {
        return actividadService.crear(actividad);
    }

    @PutMapping("/{id}")
    public Actividad actualizar(
            @PathVariable Integer id,
            @RequestBody Actividad actividad) {
        return actividadService.actualizar(id, actividad);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Integer id) {
        actividadService.eliminar(id);
    }
}