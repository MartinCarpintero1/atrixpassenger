package com.atrixpassenger.backend.service;

import com.atrixpassenger.backend.entity.Rol;
import com.atrixpassenger.backend.repository.RolRepository;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class RolService {

    private final RolRepository rolRepository;

    public RolService(RolRepository rolRepository) {
        this.rolRepository = rolRepository;
    }

    public List<Rol> listarTodos() {
        return rolRepository.findAll();
    }

    public Rol buscarPorId(Integer id) {
        return rolRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "No se encontró el rol con ID: " + id
            ));
    }

    @Transactional
    public Rol crear(Rol datos) {
        validar(datos);

        String nombre = datos.getNombreRol().trim().toUpperCase();

        if (rolRepository.existsByNombreRolIgnoreCase(nombre)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Ya existe un rol con ese nombre."
            );
        }

        datos.setIdRol(null);
        datos.setNombreRol(nombre);

        return rolRepository.save(datos);
    }

    @Transactional
    public Rol actualizar(Integer id, Rol datos) {
        validar(datos);

        Rol rol = buscarPorId(id);
        String nombre = datos.getNombreRol().trim().toUpperCase();

        rolRepository.findByNombreRolIgnoreCase(nombre)
            .filter(existente -> !existente.getIdRol().equals(id))
            .ifPresent(existente -> {
                throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ya existe otro rol con ese nombre."
                );
            });

        rol.setNombreRol(nombre);
        rol.setDescripcion(datos.getDescripcion());

        return rolRepository.save(rol);
    }

    @Transactional
    public void eliminar(Integer id) {
        Rol rol = buscarPorId(id);

        try {
            rolRepository.delete(rol);
            rolRepository.flush();
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "No se puede eliminar el rol porque tiene usuarios asociados."
            );
        }
    }

    private void validar(Rol rol) {
        if (rol == null || rol.getNombreRol() == null
                || rol.getNombreRol().isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "El nombre del rol es obligatorio."
            );
        }

        if (rol.getNombreRol().trim().length() > 30) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "El nombre del rol no puede superar los 30 caracteres."
            );
        }

        if (rol.getDescripcion() != null
                && rol.getDescripcion().length() > 255) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "La descripción no puede superar los 255 caracteres."
            );
        }
    }
}
