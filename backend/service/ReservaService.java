package com.atrixpassenger.backend.service;

import com.atrixpassenger.backend.entity.Reserva;
import com.atrixpassenger.backend.entity.Reserva.EstadoReserva;
import com.atrixpassenger.backend.entity.Salida;
import com.atrixpassenger.backend.repository.ReservaRepository;
import com.atrixpassenger.backend.repository.SalidaRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class ReservaService {

    private final ReservaRepository reservaRepository;
    private final SalidaRepository salidaRepository;

    public ReservaService(
            ReservaRepository reservaRepository,
            SalidaRepository salidaRepository) {
        this.reservaRepository = reservaRepository;
        this.salidaRepository = salidaRepository;
    }

    public List<Reserva> listarTodas() {
        return reservaRepository.findAll();
    }

    public Reserva buscarPorId(Integer id) {
        return reservaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No se encontró la reserva con ID: " + id
                ));
    }

    public List<Reserva> listarPorEstado(EstadoReserva estado) {
        return reservaRepository.findByEstadoReserva(estado);
    }

    public List<Reserva> listarPorSalida(Integer idSalida) {
        return reservaRepository.findBySalida_IdSalida(idSalida);
    }

    public Reserva buscarPorCodigo(String codigo) {
        return reservaRepository.findByQrCodigoSeguridad(codigo)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No se encontró una reserva con ese código."
                ));
    }

    @Transactional
    public Reserva crear(Reserva datos) {
        validar(datos);

        Salida salida = buscarSalida(datos.getSalida().getIdSalida());

        EstadoReserva estado = datos.getEstadoReserva() != null
                ? datos.getEstadoReserva()
                : EstadoReserva.Pendiente;

        int cantidad = datos.getCantidadPasajeros();

        if (estado != EstadoReserva.Cancelada) {
            descontarCupos(salida, cantidad);
        }

        datos.setIdReserva(null);
        datos.setSalida(salida);
        datos.setEstadoReserva(estado);

        if (datos.getQrCodigoSeguridad() == null
                || datos.getQrCodigoSeguridad().isBlank()) {
            datos.setQrCodigoSeguridad(generarCodigoUnico());
        } else {
            String codigo = datos.getQrCodigoSeguridad().trim();

            if (reservaRepository.existsByQrCodigoSeguridad(codigo)) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "El código de seguridad ya está en uso."
                );
            }

            datos.setQrCodigoSeguridad(codigo);
        }

        return reservaRepository.save(datos);
    }

    @Transactional
    public Reserva actualizar(Integer id, Reserva datos) {
        validar(datos);

        Reserva reserva = buscarPorId(id);
        Salida salidaAnterior = reserva.getSalida();

        Salida nuevaSalida = buscarSalida(
                datos.getSalida().getIdSalida()
        );

        EstadoReserva estadoAnterior = reserva.getEstadoReserva();
        EstadoReserva nuevoEstado = datos.getEstadoReserva() != null
                ? datos.getEstadoReserva()
                : estadoAnterior;

        int cantidadAnterior = reserva.getCantidadPasajeros();
        int cantidadNueva = datos.getCantidadPasajeros();

        boolean ocupabaCuposAntes =
                estadoAnterior != EstadoReserva.Cancelada;
        boolean ocuparaCuposAhora =
                nuevoEstado != EstadoReserva.Cancelada;

        if (salidaAnterior.getIdSalida().equals(nuevaSalida.getIdSalida())) {
            int diferencia = (ocuparaCuposAhora ? cantidadNueva : 0)
                    - (ocupabaCuposAntes ? cantidadAnterior : 0);

            if (diferencia > 0) {
                descontarCupos(nuevaSalida, diferencia);
            } else if (diferencia < 0) {
                devolverCupos(salidaAnterior, -diferencia);
            }
        } else {
            if (ocupabaCuposAntes) {
                devolverCupos(salidaAnterior, cantidadAnterior);
            }

            if (ocuparaCuposAhora) {
                descontarCupos(nuevaSalida, cantidadNueva);
            }
        }

        reserva.setSalida(nuevaSalida);
        reserva.setCantidadPasajeros(cantidadNueva);
        reserva.setEstadoReserva(nuevoEstado);
        reserva.setValorTotal(datos.getValorTotal());
        reserva.setObservaciones(datos.getObservaciones());
        reserva.setIdUsuarioCreador(datos.getIdUsuarioCreador());

        if (datos.getQrCodigoSeguridad() != null
                && !datos.getQrCodigoSeguridad().isBlank()) {
            String codigo = datos.getQrCodigoSeguridad().trim();

            reservaRepository.findByQrCodigoSeguridad(codigo)
                    .filter(existente ->
                            !existente.getIdReserva().equals(id))
                    .ifPresent(existente -> {
                        throw new ResponseStatusException(
                                HttpStatus.CONFLICT,
                                "El código de seguridad ya está en uso."
                        );
                    });

            reserva.setQrCodigoSeguridad(codigo);
        }

        return reservaRepository.save(reserva);
    }

    @Transactional
    public void eliminar(Integer id) {
        Reserva reserva = buscarPorId(id);
        Salida salida = reserva.getSalida();
        boolean debeDevolverCupos =
                reserva.getEstadoReserva() != EstadoReserva.Cancelada;
        int cantidad = reserva.getCantidadPasajeros();

        try {
            reservaRepository.delete(reserva);
            reservaRepository.flush();

            if (debeDevolverCupos) {
                devolverCupos(salida, cantidad);
            }
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No se puede eliminar la reserva porque tiene pasajeros o pagos asociados."
            );
        }
    }

    private Salida buscarSalida(Integer idSalida) {
        if (idSalida == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Debés indicar la salida de la reserva."
            );
        }

        return salidaRepository.findById(idSalida)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No se encontró la salida con ID: " + idSalida
                ));
    }

    private void descontarCupos(Salida salida, int cantidad) {
        if (salida.getCuposDisponibles() < cantidad) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No hay suficientes cupos disponibles para esa salida."
            );
        }

        salida.setCuposDisponibles(
                salida.getCuposDisponibles() - cantidad
        );
        salidaRepository.save(salida);
    }

    private void devolverCupos(Salida salida, int cantidad) {
        int disponibles = salida.getCuposDisponibles() + cantidad;

        if (disponibles > salida.getCuposTotales()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "La devolución superaría los cupos totales de la salida."
            );
        }

        salida.setCuposDisponibles(disponibles);
        salidaRepository.save(salida);
    }

    private String generarCodigoUnico() {
        String codigo;

        do {
            codigo = UUID.randomUUID().toString().replace("-", "");
        } while (reservaRepository.existsByQrCodigoSeguridad(codigo));

        return codigo;
    }

    private void validar(Reserva reserva) {
        if (reserva == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Los datos de la reserva son obligatorios."
            );
        }

        if (reserva.getSalida() == null
                || reserva.getSalida().getIdSalida() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Debés indicar una salida existente."
            );
        }

        if (reserva.getCantidadPasajeros() == null
                || reserva.getCantidadPasajeros() <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La cantidad de pasajeros debe ser mayor que cero."
            );
        }

        if (reserva.getValorTotal() != null
                && reserva.getValorTotal().compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El valor total no puede ser negativo."
            );
        }
    }
}