package com.atrixpassenger.backend.repository;

import com.atrixpassenger.backend.entity.Pago;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PagoRepository extends JpaRepository<Pago, Integer> {

    List<Pago> findByReserva_IdReserva(Integer idReserva);

    List<Pago> findByEstadoPago(String estadoPago);

    List<Pago> findByMetodoPago(String metodoPago);

    boolean existsByReserva_IdReserva(Integer idReserva);

    boolean existsByReserva_IdReservaAndEstadoPago(Integer idReserva, String estadoPago);
}
