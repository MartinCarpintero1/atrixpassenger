package com.atrixpassenger.backend.controller;

import com.atrixpassenger.backend.entity.Usuario;
import com.atrixpassenger.backend.service.UsuarioService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping
    public List<Usuario> listarTodos() {
        return usuarioService.listarTodos();
    }

    @GetMapping("/{id}")
    public Usuario buscarPorId(@PathVariable Integer id) {
        return usuarioService.buscarPorId(id);
    }

    @GetMapping("/rol/{idRol}")
    public List<Usuario> listarPorRol(@PathVariable Integer idRol) {
        return usuarioService.listarPorRol(idRol);
    }

    @GetMapping("/activo/{activo}")
    public List<Usuario> listarPorEstado(@PathVariable Boolean activo) {
        return usuarioService.listarPorEstado(activo);
    }

    @GetMapping("/buscar")
    public List<Usuario> buscarPorNombre(@RequestParam String nombre) {
        return usuarioService.buscarPorNombre(nombre);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Usuario crear(@RequestBody Usuario usuario) {
        return usuarioService.crear(usuario);
    }

    @PutMapping("/{id}")
    public Usuario actualizar(
            @PathVariable Integer id,
            @RequestBody Usuario usuario) {
        return usuarioService.actualizar(id, usuario);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Integer id) {
        usuarioService.eliminar(id);
    }

    @PatchMapping("/{id}/activo")
    public Usuario cambiarEstado(
            @PathVariable Integer id,
            @RequestParam Boolean activo) {
        return usuarioService.cambiarEstado(id, activo);
    }
}
