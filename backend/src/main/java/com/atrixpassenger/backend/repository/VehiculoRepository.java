package com.atrixpassenger.backend.repository;

import com.atrixpassenger.backend.entity.Vehiculo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VehiculoRepository
        extends JpaRepository<Vehiculo, Integer> {

    Optional<Vehiculo> findByPatenteIgnoreCase(String patente);

    boolean existsByPatenteIgnoreCase(String patente);

    List<Vehiculo> findByMarcaContainingIgnoreCase(String marca);

    List<Vehiculo> findByEstadoMantenimiento(Boolean estadoMantenimiento);
}
