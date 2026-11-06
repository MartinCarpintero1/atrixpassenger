
package com.atrixpassenger.backend.repository;

import com.atrixpassenger.backend.entity.Actividad;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ActividadRepository
        extends JpaRepository<Actividad, Integer> {

    List<Actividad> findByActivoTrue();

    List<Actividad> findByDestino_IdDestino(Integer idDestino);

    List<Actividad> findByNombreContainingIgnoreCase(String nombre);
}
