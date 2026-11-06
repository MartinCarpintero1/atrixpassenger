
package com.atrixpassenger.backend.repository;

import com.atrixpassenger.backend.entity.Reserva;
import com.atrixpassenger.backend.entity.Reserva.EstadoReserva;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReservaRepository extends JpaRepository<Reserva, Integer> {

    List<Reserva> findByEstadoReserva(EstadoReserva estadoReserva);

    List<Reserva> findBySalida_IdSalida(Integer idSalida);

    Optional<Reserva> findByQrCodigoSeguridad(String codigo);

    boolean existsByQrCodigoSeguridad(String codigo);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Reserva r WHERE r.idReserva = :id")
    Optional<Reserva> buscarPorIdConBloqueo(@Param("id") Integer id);
}
