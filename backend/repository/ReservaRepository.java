package com.atrixpassenger.backend.repository;

import com.atrixpassenger.backend.entity.Reserva;
import com.atrixpassenger.backend.entity.Reserva.EstadoReserva;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReservaRepository extends JpaRepository<Reserva, Integer> {

    List<Reserva> findByEstadoReserva(EstadoReserva estadoReserva);

    List<Reserva> findBySalida_IdSalida(Integer idSalida);

    Optional<Reserva> findByQrCodigoSeguridad(String codigo);

    boolean existsByQrCodigoSeguridad(String codigo);
}