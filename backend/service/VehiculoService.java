package com.atrixpassenger.backend.service;

import com.atrixpassenger.backend.entity.Vehiculo;
import com.atrixpassenger.backend.repository.VehiculoRepository;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class VehiculoService {

    private final VehiculoRepository vehiculoRepository;

    public VehiculoService(VehiculoRepository vehiculoRepository) {
        this.vehiculoRepository = vehiculoRepository;
    }

    public List<Vehiculo> listarTodos() {
        return vehiculoRepository.findAll();
    }

    public Vehiculo buscarPorId(Integer id) {
        return vehiculoRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "No se encontró el vehículo con ID: " + id
            ));
    }

    public Vehiculo buscarPorPatente(String patente) {
        if (patente == null || patente.isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Debés ingresar una patente."
            );
        }

        return vehiculoRepository.findByPatenteIgnoreCase(
                patente.trim()
            )
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "No se encontró un vehículo con esa patente."
            ));
    }

    public List<Vehiculo> buscarPorMarca(String marca) {
        if (marca == null || marca.isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Debés ingresar una marca."
            );
        }

        return vehiculoRepository
            .findByMarcaContainingIgnoreCase(marca.trim());
    }

    public List<Vehiculo> listarPorMantenimiento(Boolean estado) {
        if (estado == null) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Debés indicar el estado de mantenimiento."
            );
        }

        return vehiculoRepository
            .findByEstadoMantenimiento(estado);
    }

    @Transactional
    public Vehiculo crear(Vehiculo datos) {
        validar(datos);

        String patente = datos.getPatente().trim().toUpperCase();

        if (vehiculoRepository.existsByPatenteIgnoreCase(patente)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Ya existe un vehículo registrado con esa patente."
            );
        }

        datos.setIdVehiculo(null);
        datos.setPatente(patente);

        if (datos.getEstadoMantenimiento() == null) {
            datos.setEstadoMantenimiento(false);
        }

        return vehiculoRepository.save(datos);
    }

    @Transactional
    public Vehiculo actualizar(Integer id, Vehiculo datos) {
        validar(datos);

        Vehiculo vehiculo = buscarPorId(id);
        String patente = datos.getPatente().trim().toUpperCase();

        vehiculoRepository.findByPatenteIgnoreCase(patente)
            .filter(existente ->
                !existente.getIdVehiculo().equals(id)
            )
            .ifPresent(existente -> {
                throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Esa patente ya pertenece a otro vehículo."
                );
            });

        vehiculo.setPatente(patente);
        vehiculo.setMarca(datos.getMarca());
        vehiculo.setModelo(datos.getModelo());
        vehiculo.setCapacidadMax(datos.getCapacidadMax());
        vehiculo.setEstadoMantenimiento(
            datos.getEstadoMantenimiento() != null
                ? datos.getEstadoMantenimiento()
                : false
        );
        vehiculo.setUltimaItv(datos.getUltimaItv());

        return vehiculoRepository.save(vehiculo);
    }

    @Transactional
    public void eliminar(Integer id) {
        Vehiculo vehiculo = buscarPorId(id);

        try {
            vehiculoRepository.delete(vehiculo);
            vehiculoRepository.flush();
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "No se puede eliminar el vehículo porque está asociado a una o más salidas."
            );
        }
    }

    private void validar(Vehiculo vehiculo) {
        if (vehiculo == null) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Los datos del vehículo son obligatorios."
            );
        }

        if (vehiculo.getPatente() == null
                || vehiculo.getPatente().isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "La patente es obligatoria."
            );
        }

        if (vehiculo.getCapacidadMax() == null
                || vehiculo.getCapacidadMax() <= 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "La capacidad máxima debe ser mayor que cero."
            );
        }
    }
}
