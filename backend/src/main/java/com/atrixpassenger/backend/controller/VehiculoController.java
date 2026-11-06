package com.atrixpassenger.backend.controller;

import com.atrixpassenger.backend.entity.Vehiculo;
import com.atrixpassenger.backend.service.VehiculoService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehiculos")
public class VehiculoController {

    private final VehiculoService vehiculoService;

    public VehiculoController(VehiculoService vehiculoService) {
        this.vehiculoService = vehiculoService;
    }

    @GetMapping
    public List<Vehiculo> listarTodos() {
        return vehiculoService.listarTodos();
    }

    @GetMapping("/{id}")
    public Vehiculo buscarPorId(@PathVariable Integer id) {
        return vehiculoService.buscarPorId(id);
    }

    @GetMapping("/patente/{patente}")
    public Vehiculo buscarPorPatente(
            @PathVariable String patente) {
        return vehiculoService.buscarPorPatente(patente);
    }

    @GetMapping("/buscar")
    public List<Vehiculo> buscarPorMarca(
            @RequestParam String marca) {
        return vehiculoService.buscarPorMarca(marca);
    }

    @GetMapping("/mantenimiento/{estado}")
    public List<Vehiculo> listarPorMantenimiento(
            @PathVariable Boolean estado) {
        return vehiculoService.listarPorMantenimiento(estado);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Vehiculo crear(@RequestBody Vehiculo vehiculo) {
        return vehiculoService.crear(vehiculo);
    }

    @PutMapping("/{id}")
    public Vehiculo actualizar(
            @PathVariable Integer id,
            @RequestBody Vehiculo vehiculo) {
        return vehiculoService.actualizar(id, vehiculo);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Integer id) {
        vehiculoService.eliminar(id);
    }
}
