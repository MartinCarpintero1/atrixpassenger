package com.atrixpassenger.backend.service;

import com.atrixpassenger.backend.entity.LogsActividad;
import com.atrixpassenger.backend.repository.LogsActividadRepository;
import com.atrixpassenger.backend.repository.UsuarioRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class LogsActividadService {

    private final LogsActividadRepository logsRepository;
    private final UsuarioRepository usuarioRepository;

    public LogsActividadService(
            LogsActividadRepository logsRepository,
            UsuarioRepository usuarioRepository) {
        this.logsRepository = logsRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public List<LogsActividad> listarTodos() {
        return logsRepository.findAll();
    }

    public LogsActividad buscarPorId(Integer id) {
        return logsRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "No se encontró el registro de actividad con ID: " + id
            ));
    }

    public List<LogsActividad> listarPorUsuario(Integer idUsuario) {
        if (idUsuario == null || idUsuario <= 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "El ID del usuario debe ser válido."
            );
        }

        return logsRepository.findByIdUsuario(idUsuario);
    }

    public List<LogsActividad> listarPorTabla(String tabla) {
        if (tabla == null || tabla.isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Debés indicar la tabla afectada."
            );
        }

        return logsRepository.findByTablaAfectadaIgnoreCase(
            tabla.trim()
        );
    }

    public List<LogsActividad> buscarPorAccion(String accion) {
        if (accion == null || accion.isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Debés ingresar una acción para buscar."
            );
        }

        return logsRepository.findByAccionContainingIgnoreCase(
            accion.trim()
        );
    }

    @Transactional
    public LogsActividad registrar(LogsActividad datos) {
        if (datos == null) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Los datos del registro son obligatorios."
            );
        }

        if (datos.getAccion() == null
                || datos.getAccion().isBlank()
                || datos.getAccion().trim().length() > 255) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "La acción es obligatoria y no puede superar 255 caracteres."
            );
        }

        if (datos.getTablaAfectada() == null
                || datos.getTablaAfectada().isBlank()
                || datos.getTablaAfectada().trim().length() > 50) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "La tabla afectada es obligatoria y no puede superar 50 caracteres."
            );
        }

        if (datos.getIdUsuario() != null
                && !usuarioRepository.existsById(datos.getIdUsuario())) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "El usuario indicado no existe."
            );
        }

        datos.setIdLog(null);
        datos.setAccion(datos.getAccion().trim());
        datos.setTablaAfectada(datos.getTablaAfectada().trim());
        datos.setFechaHora(null);

        return logsRepository.saveAndFlush(datos);
    }
}
