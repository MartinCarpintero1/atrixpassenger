package com.atrixpassenger.backend.service;

import com.atrixpassenger.backend.entity.Actividad;
import com.atrixpassenger.backend.entity.Salida;
import com.atrixpassenger.backend.repository.ActividadRepository;
import com.atrixpassenger.backend.repository.SalidaRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

@Service
public class SalidaService {

    private static final Set<String> ESTADOS_VALIDOS = Set.of(
            "Programada", "En Curso", "Finalizada", "Cancelada"
    );

    private final SalidaRepository salidaRepository;
    private final ActividadRepository actividadRepository;

    public SalidaService(
            SalidaRepository salidaRepository,
            ActividadRepository actividadRepository) {
        this.salidaRepository = salidaRepository;
        this.actividadRepository = actividadRepository;
    }

    public List<Salida> listarTodas() {
        return salidaRepository.findAll();
    }

    public Salida buscarPorId(Integer id) {
        return salidaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No se encontró la salida con ID: " + id
                ));
    }

    public List<Salida> listarPorActividad(Integer idActividad) {
        if (!actividadRepository.existsById(idActividad)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "No se encontró la actividad con ID: " + idActividad
            );
        }

        return salidaRepository.findByActividad_IdActividad(idActividad);
    }

    public List<Salida> listarPorEstado(String estado) {
        validarEstado(estado);
        return salidaRepository.findByEstadoSalida(estado);
    }

    public List<Salida> listarConCuposDisponibles() {
        return salidaRepository.findByCuposDisponiblesGreaterThan(0);
    }

    @Transactional
    public Salida crear(Salida datos) {
        validarSalida(datos);

        Actividad actividad = buscarActividad(
                datos.getActividad().getIdActividad()
        );

        validarReferenciasOpcionales(datos);

        datos.setIdSalida(null);
        datos.setActividad(actividad);

        if (datos.getEstadoSalida() == null
                || datos.getEstadoSalida().isBlank()) {
            datos.setEstadoSalida("Programada");
        }

        return salidaRepository.save(datos);
    }

    @Transactional
    public Salida actualizar(Integer id, Salida datos) {
        validarSalida(datos);

        Salida salida = buscarPorId(id);

        Actividad actividad = buscarActividad(
                datos.getActividad().getIdActividad()
        );

        validarReferenciasOpcionales(datos);

        salida.setActividad(actividad);
        salida.setIdGuia(datos.getIdGuia());
        salida.setIdVehiculo(datos.getIdVehiculo());
        salida.setFechaHoraSalida(datos.getFechaHoraSalida());
        salida.setCuposTotales(datos.getCuposTotales());
        salida.setCuposDisponibles(datos.getCuposDisponibles());
        salida.setPrecioPorPersona(datos.getPrecioPorPersona());

        if (datos.getEstadoSalida() != null
                && !datos.getEstadoSalida().isBlank()) {
            salida.setEstadoSalida(datos.getEstadoSalida());
        }

        return salidaRepository.save(salida);
    }

    @Transactional
    public void eliminar(Integer id) {
        Salida salida = buscarPorId(id);

        try {
            salidaRepository.delete(salida);
            salidaRepository.flush();
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No se puede eliminar la salida porque tiene reservas asociadas."
            );
        }
    }

    private Actividad buscarActividad(Integer idActividad) {
        if (idActividad == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Debés indicar la actividad de la salida."
            );
        }

        return actividadRepository.findById(idActividad)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No se encontró la actividad con ID: " + idActividad
                ));
    }

    private void validarSalida(Salida salida) {
        if (salida == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Los datos de la salida son obligatorios."
            );
        }

        if (salida.getActividad() == null
                || salida.getActividad().getIdActividad() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Debés indicar una actividad existente."
            );
        }

        if (salida.getFechaHoraSalida() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La fecha y hora de salida son obligatorias."
            );
        }

        if (salida.getCuposTotales() == null
                || salida.getCuposTotales() <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Los cupos totales deben ser mayores que cero."
            );
        }

        if (salida.getCuposDisponibles() == null
                || salida.getCuposDisponibles() < 0
                || salida.getCuposDisponibles() > salida.getCuposTotales()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Los cupos disponibles deben estar entre cero y los cupos totales."
            );
        }

        if (salida.getPrecioPorPersona() == null
                || salida.getPrecioPorPersona().compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El precio por persona no puede ser negativo."
            );
        }

        if (salida.getEstadoSalida() != null
                && !salida.getEstadoSalida().isBlank()) {
            validarEstado(salida.getEstadoSalida());
        }
    }

    private void validarEstado(String estado) {
        if (estado == null || !ESTADOS_VALIDOS.contains(estado)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Estado inválido. Usá: Programada, En Curso, Finalizada o Cancelada."
            );
        }
    }

    private void validarReferenciasOpcionales(Salida salida) {
        // La base de datos verifica las claves foráneas de guía y vehículo.
        // Cuando implementemos esas entidades agregaremos validaciones de negocio.
    }
}