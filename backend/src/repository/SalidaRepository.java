package com.atrixpassenger.backend.repository;

import com.atrixpassenger.backend.entity.Salida;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SalidaRepository extends JpaRepository<Salida, Integer> {

    List<Salida> findByActividad_IdActividad(Integer idActividad);

    List<Salida> findByEstadoSalida(String estadoSalida);

    List<Salida> findByCuposDisponiblesGreaterThan(Integer cupos);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Salida s WHERE s.idSalida = :id")
    Optional<Salida> buscarPorIdConBloqueo(@Param("id") Integer id);
}
