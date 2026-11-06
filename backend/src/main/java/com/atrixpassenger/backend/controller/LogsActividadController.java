package com.atrixpassenger.backend.controller;

import com.atrixpassenger.backend.entity.LogsActividad;
import com.atrixpassenger.backend.service.LogsActividadService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/logs-actividad")
public class LogsActividadController {

    private final LogsActividadService logsService;

    public LogsActividadController(
            LogsActividadService logsService) {
        this.logsService = logsService;
    }

    @GetMapping
    public List<LogsActividad> listarTodos() {
        return logsService.listarTodos();
    }

    @GetMapping("/{id}")
    public LogsActividad buscarPorId(@PathVariable Integer id) {
        return logsService.buscarPorId(id);
    }

    @GetMapping("/usuario/{idUsuario}")
    public List<LogsActividad> listarPorUsuario(
            @PathVariable Integer idUsuario) {
        return logsService.listarPorUsuario(idUsuario);
    }

    @GetMapping("/tabla/{tabla}")
    public List<LogsActividad> listarPorTabla(
            @PathVariable String tabla) {
        return logsService.listarPorTabla(tabla);
    }

    @GetMapping("/buscar")
    public List<LogsActividad> buscarPorAccion(
            @RequestParam String accion) {
        return logsService.buscarPorAccion(accion);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LogsActividad registrar(
            @RequestBody LogsActividad log) {
        return logsService.registrar(log);
    }
}
