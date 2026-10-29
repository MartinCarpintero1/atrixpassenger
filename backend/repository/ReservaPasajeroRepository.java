
package com.atrixpassenger.backend.repository;

import com.atrixpassenger.backend.entity.ReservaPasajero;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReservaPasajeroRepository
        extends JpaRepository<ReservaPasajero, Integer> {

    List<ReservaPasajero> findByReserva_IdReserva(Integer idReserva);

    List<ReservaPasajero> findByPasajero_IdPasajero(Integer idPasajero);

    boolean existsByReserva_IdReservaAndPasajero_IdPasajero(
        Integer idReserva,
        Integer idPasajero
    );

    long countByReserva_IdReserva(Integer idReserva);
}
