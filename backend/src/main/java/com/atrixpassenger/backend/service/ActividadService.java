package com.atrixpassenger.backend.service;

import com.atrixpassenger.backend.entity.Actividad;
import com.atrixpassenger.backend.entity.Destino;
import com.atrixpassenger.backend.repository.ActividadRepository;
import com.atrixpassenger.backend.repository.DestinoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ActividadService {

    private final ActividadRepository actividadRepository;
    private final DestinoRepository destinoRepository;

    public ActividadService(
            ActividadRepository actividadRepository,
            DestinoRepository destinoRepository) {
        this.actividadRepository = actividadRepository;
        this.destinoRepository = destinoRepository;
    }

    public List<Actividad> listarTodas() {
        return actividadRepository.findAll();
    }

    public List<Actividad> listarActivas() {
        return actividadRepository.findByActivoTrue();
    }

    public Actividad buscarPorId(Integer id) {
        return actividadRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No se encontró la actividad con ID: " + id
                ));
    }

    public List<Actividad> listarPorDestino(Integer idDestino) {
        if (!destinoRepository.existsById(idDestino)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "No se encontró el destino con ID: " + idDestino
            );
        }

        return actividadRepository.findByDestino_IdDestino(idDestino);
    }

    public Actividad crear(Actividad datos) {
        validarActividad(datos);

        Destino destino = buscarDestino(
                datos.getDestino().getIdDestino()
        );

        datos.setIdActividad(null);
        datos.setDestino(destino);

        if (datos.getActivo() == null) {
            datos.setActivo(true);
        }

        return actividadRepository.save(datos);
    }

    public Actividad actualizar(Integer id, Actividad datos) {
        validarActividad(datos);

        Actividad actividad = buscarPorId(id);

        Destino destino = buscarDestino(
                datos.getDestino().getIdDestino()
        );

        actividad.setNombre(datos.getNombre().trim());
        actividad.setDescripcion(datos.getDescripcion());
        actividad.setDuracionEstimada(datos.getDuracionEstimada());
        actividad.setDestino(destino);

        if (datos.getActivo() != null) {
            actividad.setActivo(datos.getActivo());
        }

        return actividadRepository.save(actividad);
    }

    public void eliminar(Integer id) {
        Actividad actividad = buscarPorId(id);

        try {
            actividadRepository.delete(actividad);
            actividadRepository.flush();
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No se puede eliminar esta actividad porque tiene salidas asociadas."
            );
        }
    }

    private Destino buscarDestino(Integer idDestino) {
        if (idDestino == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Debés indicar el destino de la actividad."
            );
        }

        return destinoRepository.findById(idDestino)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No se encontró el destino con ID: " + idDestino
                ));
    }

    private void validarActividad(Actividad actividad) {
        if (actividad == null
                || actividad.getNombre() == null
                || actividad.getNombre().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El nombre de la actividad es obligatorio."
            );
        }

        if (actividad.getNombre().trim().length() > 120) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El nombre no puede superar los 120 caracteres."
            );
        }

        if (actividad.getDestino() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Debés indicar el destino de la actividad."
            );
        }
    }
}