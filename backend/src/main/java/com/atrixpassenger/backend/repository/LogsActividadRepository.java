package com.atrixpassenger.backend.repository;

import com.atrixpassenger.backend.entity.LogsActividad;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LogsActividadRepository
        extends JpaRepository<LogsActividad, Integer> {

    List<LogsActividad> findByIdUsuario(Integer idUsuario);

    List<LogsActividad> findByTablaAfectadaIgnoreCase(
        String tablaAfectada
    );

    List<LogsActividad> findByAccionContainingIgnoreCase(
        String accion
    );
}
