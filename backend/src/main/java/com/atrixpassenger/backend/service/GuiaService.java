package com.atrixpassenger.backend.service;

import com.atrixpassenger.backend.entity.Guia;
import com.atrixpassenger.backend.repository.GuiaRepository;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class GuiaService {

    private final GuiaRepository guiaRepository;

    public GuiaService(GuiaRepository guiaRepository) {
        this.guiaRepository = guiaRepository;
    }

    public List<Guia> listarTodos() {
        return guiaRepository.findAll();
    }

    public Guia buscarPorId(Integer id) {
        return guiaRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "No se encontró el guía con ID: " + id
            ));
    }

    public Guia buscarPorDni(String dni) {
        if (dni == null || dni.isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Debés indicar un DNI."
            );
        }

        return guiaRepository.findByDni(dni.trim())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "No se encontró un guía con ese DNI."
            ));
    }

    public List<Guia> buscarPorNombre(String nombre) {
        if (nombre == null || nombre.isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Debés ingresar un nombre o apellido para buscar."
            );
        }

        String termino = nombre.trim();

        return guiaRepository
            .findByNombreContainingIgnoreCaseOrApellidoContainingIgnoreCase(
                termino, termino
            );
    }

    @Transactional
    public Guia crear(Guia datos) {
        validar(datos);

        String dni = datos.getDni().trim();

        if (guiaRepository.existsByDni(dni)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Ya existe un guía registrado con ese DNI."
            );
        }

        datos.setIdGuia(null);
        datos.setDni(dni);
        datos.setNombre(datos.getNombre().trim());
        datos.setApellido(datos.getApellido().trim());

        if (datos.getTelefono() != null) {
            datos.setTelefono(datos.getTelefono().trim());
        }

        return guiaRepository.save(datos);
    }

    @Transactional
    public Guia actualizar(Integer id, Guia datos) {
        validar(datos);

        Guia guia = buscarPorId(id);
        String dni = datos.getDni().trim();

        guiaRepository.findByDni(dni)
            .filter(existente -> !existente.getIdGuia().equals(id))
            .ifPresent(existente -> {
                throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ese DNI ya pertenece a otro guía."
                );
            });

        guia.setDni(dni);
        guia.setNombre(datos.getNombre().trim());
        guia.setApellido(datos.getApellido().trim());
        guia.setTelefono(
            datos.getTelefono() == null
                ? null
                : datos.getTelefono().trim()
        );
        guia.setVencimientoCarnet(datos.getVencimientoCarnet());
        guia.setIdiomas(datos.getIdiomas());

        return guiaRepository.save(guia);
    }

    @Transactional
    public void eliminar(Integer id) {
        Guia guia = buscarPorId(id);

        try {
            guiaRepository.delete(guia);
            guiaRepository.flush();
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "No se puede eliminar el guía porque está asociado a una o más salidas."
            );
        }
    }

    private void validar(Guia guia) {
        if (guia == null) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Los datos del guía son obligatorios."
            );
        }

        if (guia.getDni() == null || guia.getDni().isBlank()
                || guia.getDni().trim().length() > 20) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "El DNI es obligatorio y no puede superar los 20 caracteres."
            );
        }

        if (guia.getNombre() == null || guia.getNombre().isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "El nombre es obligatorio."
            );
        }

        if (guia.getApellido() == null || guia.getApellido().isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "El apellido es obligatorio."
            );
        }
    }
}
