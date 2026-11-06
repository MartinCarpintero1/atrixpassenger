
package com.atrixpassenger.backend.repository;

import com.atrixpassenger.backend.entity.Pasajero;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PasajeroRepository
        extends JpaRepository<Pasajero, Integer> {

    Optional<Pasajero> findByNroDocumento(String nroDocumento);

    boolean existsByNroDocumento(String nroDocumento);

    List<Pasajero> findByNombreContainingIgnoreCaseOrApellidoContainingIgnoreCase(
            String nombre,
            String apellido
    );

    Optional<Pasajero> findFirstByIdUsuario(Integer idUsuario);
}
