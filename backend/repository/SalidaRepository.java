package com.atrixpassenger.backend.repository;

import com.atrixpassenger.backend.entity.Salida;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SalidaRepository extends JpaRepository<Salida, Integer> {

    List<Salida> findByActividad_IdActividad(Integer idActividad);

    List<Salida> findByEstadoSalida(String estadoSalida);

    List<Salida> findByCuposDisponiblesGreaterThan(Integer cupos);
}