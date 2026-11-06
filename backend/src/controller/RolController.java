package com.atrixpassenger.backend.controller;

import com.atrixpassenger.backend.entity.Rol;
import com.atrixpassenger.backend.service.RolService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
@CrossOrigin(origins = "http://localhost:5173")
public class RolController {

    private final RolService rolService;

    public RolController(RolService rolService) {
        this.rolService = rolService;
    }

    @GetMapping
    public List<Rol> listarTodos() {
        return rolService.listarTodos();
    }

    @GetMapping("/{id}")
    public Rol buscarPorId(@PathVariable Integer id) {
        return rolService.buscarPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Rol crear(@RequestBody Rol rol) {
        return rolService.crear(rol);
    }

    @PutMapping("/{id}")
    public Rol actualizar(
            @PathVariable Integer id,
            @RequestBody Rol rol) {
        return rolService.actualizar(id, rol);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Integer id) {
        rolService.eliminar(id);
    }
}
