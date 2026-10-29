
package com.atrixpassenger.backend.service;

import com.atrixpassenger.backend.entity.Pasajero;
import com.atrixpassenger.backend.entity.Reserva;
import com.atrixpassenger.backend.entity.Reserva.EstadoReserva;
import com.atrixpassenger.backend.entity.ReservaPasajero;
import com.atrixpassenger.backend.repository.PasajeroRepository;
import com.atrixpassenger.backend.repository.ReservaPasajeroRepository;
import com.atrixpassenger.backend.repository.ReservaRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ReservaPasajeroService {

    private final ReservaPasajeroRepository reservaPasajeroRepository;
    private final ReservaRepository reservaRepository;
    private final PasajeroRepository pasajeroRepository;

    public ReservaPasajeroService(
            ReservaPasajeroRepository reservaPasajeroRepository,
            ReservaRepository reservaRepository,
            PasajeroRepository pasajeroRepository) {

        this.reservaPasajeroRepository = reservaPasajeroRepository;
        this.reservaRepository = reservaRepository;
        this.pasajeroRepository = pasajeroRepository;
    }

    public List<ReservaPasajero> listarTodos() {
        return reservaPasajeroRepository.findAll();
    }

    public ReservaPasajero buscarPorId(Integer id) {
        return reservaPasajeroRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "No se encontró la asociación con ID: " + id
            ));
    }

    public List<ReservaPasajero> listarPorReserva(Integer idReserva) {
        if (!reservaRepository.existsById(idReserva)) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "No se encontró la reserva con ID: " + idReserva
            );
        }

        return reservaPasajeroRepository.findByReserva_IdReserva(idReserva);
    }

    public List<ReservaPasajero> listarPorPasajero(Integer idPasajero) {
        if (!pasajeroRepository.existsById(idPasajero)) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "No se encontró el pasajero con ID: " + idPasajero
            );
        }

        return reservaPasajeroRepository.findByPasajero_IdPasajero(idPasajero);
    }

    @Transactional
    public ReservaPasajero asociar(ReservaPasajero datos) {
        if (datos == null
                || datos.getReserva() == null
                || datos.getReserva().getIdReserva() == null
                || datos.getPasajero() == null
                || datos.getPasajero().getIdPasajero() == null) {

            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Debés indicar una reserva y un pasajero existentes."
            );
        }

        Integer idReserva = datos.getReserva().getIdReserva();
        Integer idPasajero = datos.getPasajero().getIdPasajero();

        Reserva reserva = reservaRepository.findById(idReserva)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "No se encontró la reserva con ID: " + idReserva
            ));

        Pasajero pasajero = pasajeroRepository.findById(idPasajero)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "No se encontró el pasajero con ID: " + idPasajero
            ));

        if (reserva.getEstadoReserva() == EstadoReserva.Cancelada) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "No se pueden asociar pasajeros a una reserva cancelada."
            );
        }

        boolean yaExiste =
            reservaPasajeroRepository
                .existsByReserva_IdReservaAndPasajero_IdPasajero(
                    idReserva, idPasajero
                );

        if (yaExiste) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Este pasajero ya está asociado a la reserva."
            );
        }

        long cantidadAsociada =
            reservaPasajeroRepository.countByReserva_IdReserva(idReserva);

        if (cantidadAsociada >= reserva.getCantidadPasajeros()) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "La reserva ya tiene asociados todos los pasajeros permitidos."
            );
        }

        datos.setIdReservaPasajero(null);
        datos.setReserva(reserva);
        datos.setPasajero(pasajero);
        datos.setCheckInRealizado(false);

        return reservaPasajeroRepository.save(datos);
    }

    @Transactional
    public ReservaPasajero actualizarCheckIn(
            Integer id,
            Boolean realizado) {

        if (realizado == null) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Debés indicar si el check-in fue realizado."
            );
        }

        ReservaPasajero asociacion = buscarPorId(id);

        if (asociacion.getReserva().getEstadoReserva()
                == EstadoReserva.Cancelada) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "No se puede modificar el check-in de una reserva cancelada."
            );
        }

        asociacion.setCheckInRealizado(realizado);

        return reservaPasajeroRepository.save(asociacion);
    }

    @Transactional
    public void desasociar(Integer id) {
        ReservaPasajero asociacion = buscarPorId(id);

        if (Boolean.TRUE.equals(asociacion.getCheckInRealizado())) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "No se puede desasociar un pasajero que ya realizó el check-in."
            );
        }

        reservaPasajeroRepository.delete(asociacion);
    }
}
