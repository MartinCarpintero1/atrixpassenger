package com.atrixpassenger.backend.repository;

import com.atrixpassenger.backend.entity.Guia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GuiaRepository extends JpaRepository<Guia, Integer> {

    Optional<Guia> findByDni(String dni);

    boolean existsByDni(String dni);

    List<Guia> findByNombreContainingIgnoreCaseOrApellidoContainingIgnoreCase(
        String nombre,
        String apellido
    );
}
