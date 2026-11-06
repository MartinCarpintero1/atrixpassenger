package com.atrixpassenger.backend.controller;

import com.atrixpassenger.backend.entity.Salida;
import com.atrixpassenger.backend.service.SalidaService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/salidas")
public class SalidaController {

    private final SalidaService salidaService;

    public SalidaController(SalidaService salidaService) {
        this.salidaService = salidaService;
    }

    @GetMapping
    public List<Salida> listarTodas() {
        return salidaService.listarTodas();
    }

    @GetMapping("/disponibles")
    public List<Salida> listarConCuposDisponibles() {
        return salidaService.listarConCuposDisponibles();
    }

    @GetMapping("/estado/{estado}")
    public List<Salida> listarPorEstado(
            @PathVariable String estado) {
        return salidaService.listarPorEstado(estado);
    }

    @GetMapping("/actividad/{idActividad}")
    public List<Salida> listarPorActividad(
            @PathVariable Integer idActividad) {
        return salidaService.listarPorActividad(idActividad);
    }

    @GetMapping("/{id}")
    public Salida buscarPorId(@PathVariable Integer id) {
        return salidaService.buscarPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Salida crear(@RequestBody Salida salida) {
        return salidaService.crear(salida);
    }

    @PutMapping("/{id}")
    public Salida actualizar(
            @PathVariable Integer id,
            @RequestBody Salida salida) {
        return salidaService.actualizar(id, salida);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Integer id) {
        salidaService.eliminar(id);
    }

    /** Cambio de estado operativo (Programada, En Curso, Finalizada, Cancelada). */
    @PatchMapping("/{id}/estado")
    public Salida cambiarEstado(
            @PathVariable Integer id,
            @RequestParam String estado) {
        return salidaService.cambiarEstado(id, estado);
    }
}
