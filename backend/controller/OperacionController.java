package com.atrixpassenger.backend.controller;

import com.atrixpassenger.backend.dto.portal.ManifiestoItemDto;
import com.atrixpassenger.backend.entity.Pasajero;
import com.atrixpassenger.backend.entity.Reserva;
import com.atrixpassenger.backend.repository.ReservaPasajeroRepository;
import com.atrixpassenger.backend.repository.SalidaRepository;

import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;

/**
 * Módulo "Control pasajeros" (OPERADOR / ADMINISTRADOR): manifiesto de pasajeros
 * por viaje con datos de salud/emergencia y estado de check-in.
 * El check-in se marca con PATCH /api/reserva-pasajeros/{id}/check-in.
 */
@RestController
@RequestMapping("/api/operacion")
public class OperacionController {

    private final SalidaRepository salidaRepository;
    private final ReservaPasajeroRepository reservaPasajeroRepository;

    public OperacionController(
            SalidaRepository salidaRepository,
            ReservaPasajeroRepository reservaPasajeroRepository) {
        this.salidaRepository = salidaRepository;
        this.reservaPasajeroRepository = reservaPasajeroRepository;
    }

    @GetMapping("/salidas/{idSalida}/manifiesto")
    @Transactional(readOnly = true)
    public List<ManifiestoItemDto> manifiesto(@PathVariable Integer idSalida) {
        if (!salidaRepository.existsById(idSalida)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "No se encontró el viaje con ID: " + idSalida);
        }

        return reservaPasajeroRepository.findByReserva_Salida_IdSalida(idSalida).stream()
                .filter(rp -> rp.getReserva().getEstadoReserva() != Reserva.EstadoReserva.Cancelada)
                .map(rp -> {
                    Pasajero p = rp.getPasajero();
                    String emergencia = p.getContactoEmergenciaNombre() == null ? null
                            : p.getContactoEmergenciaNombre()
                              + (p.getContactoEmergenciaTel() != null ? " (" + p.getContactoEmergenciaTel() + ")" : "");
                    return new ManifiestoItemDto(
                            rp.getIdReservaPasajero(),
                            rp.getReserva().getIdReserva(),
                            rp.getReserva().getQrCodigoSeguridad(),
                            rp.getReserva().getEstadoReserva().name(),
                            p.getIdPasajero(),
                            p.getApellido() + ", " + p.getNombre(),
                            p.getNroDocumento(),
                            p.getContactoTel(),
                            p.getAlergias(),
                            p.getMedicacionHabitual(),
                            p.getGrupoSanguineo(),
                            emergencia,
                            rp.getCheckInRealizado());
                })
                .sorted(Comparator.comparing(ManifiestoItemDto::pasajero, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }
}
