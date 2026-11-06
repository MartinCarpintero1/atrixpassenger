package com.atrixpassenger.backend.service;

import com.atrixpassenger.backend.entity.Reserva;
import com.atrixpassenger.backend.entity.Reserva.EstadoReserva;
import com.atrixpassenger.backend.entity.Salida;
import com.atrixpassenger.backend.repository.PagoRepository;
import com.atrixpassenger.backend.repository.ReservaPasajeroRepository;
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
    private final ReservaPasajeroRepository reservaPasajeroRepository;
    private final PagoRepository pagoRepository;

    public ReservaService(
            ReservaRepository reservaRepository,
            SalidaRepository salidaRepository,
            ReservaPasajeroRepository reservaPasajeroRepository,
            PagoRepository pagoRepository) {

        this.reservaRepository = reservaRepository;
        this.salidaRepository = salidaRepository;
        this.reservaPasajeroRepository = reservaPasajeroRepository;
        this.pagoRepository = pagoRepository;
    }

    @Transactional(readOnly = true)
    public List<Reserva> listarTodas() {
        return reservaRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Reserva buscarPorId(Integer id) {
        return reservaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No se encontró la reserva con ID: " + id
                ));
    }

    @Transactional(readOnly = true)
    public List<Reserva> listarPorEstado(EstadoReserva estado) {
        return reservaRepository.findByEstadoReserva(estado);
    }

    @Transactional(readOnly = true)
    public List<Reserva> listarPorSalida(Integer idSalida) {
        return reservaRepository.findBySalida_IdSalida(idSalida);
    }

    @Transactional(readOnly = true)
    public Reserva buscarPorCodigo(String codigo) {
        return reservaRepository.findByQrCodigoSeguridad(codigo)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No se encontró una reserva con ese código."
                ));
    }

    // ---------------------------------------------------------
    // CREAR RESERVA
    // ---------------------------------------------------------

    @Transactional
    public Reserva crear(Reserva datos) {

        validar(datos);

        Integer idSalida = datos.getSalida().getIdSalida();

        // Bloquea la salida para evitar sobreventa de cupos.
        Salida salida = buscarSalidaConBloqueo(idSalida);

        validarSalidaDisponible(salida);

        EstadoReserva estado = datos.getEstadoReserva() != null
                ? datos.getEstadoReserva()
                : EstadoReserva.Pendiente;

        if (estado == EstadoReserva.Cancelada) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "No se puede crear una reserva directamente como cancelada."
            );
        }

        int cantidad = datos.getCantidadPasajeros();

        descontarCupos(salida, cantidad);

        // El importe siempre se calcula en el servidor.
        BigDecimal total = calcularTotal(salida, cantidad);

        datos.setIdReserva(null);
        datos.setSalida(salida);
        datos.setEstadoReserva(estado);
        datos.setValorTotal(total);

        // El QR nunca se acepta desde el cliente.
        datos.setQrCodigoSeguridad(generarCodigoUnico());

        return reservaRepository.save(datos);
    }

    // ---------------------------------------------------------
    // ACTUALIZAR RESERVA
    // ---------------------------------------------------------

    @Transactional
    public Reserva actualizar(Integer id, Reserva datos) {

        validar(datos);

        Reserva reserva = reservaRepository
                .buscarPorIdConBloqueo(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No se encontró la reserva con ID: " + id
                ));

        Integer idSalidaAnterior = reserva.getSalida().getIdSalida();
        Integer idSalidaNueva = datos.getSalida().getIdSalida();

        /*
         * Bloqueamos las salidas en orden ascendente para reducir
         * el riesgo de bloqueos cruzados cuando se cambia de salida.
         */
        Salida salidaAnterior;
        Salida nuevaSalida;

        if (idSalidaAnterior.equals(idSalidaNueva)) {
            salidaAnterior = buscarSalidaConBloqueo(idSalidaAnterior);
            nuevaSalida = salidaAnterior;
        } else if (idSalidaAnterior < idSalidaNueva) {
            salidaAnterior = buscarSalidaConBloqueo(idSalidaAnterior);
            nuevaSalida = buscarSalidaConBloqueo(idSalidaNueva);
        } else {
            nuevaSalida = buscarSalidaConBloqueo(idSalidaNueva);
            salidaAnterior = buscarSalidaConBloqueo(idSalidaAnterior);
        }

        EstadoReserva estadoAnterior = reserva.getEstadoReserva();

        EstadoReserva nuevoEstado = datos.getEstadoReserva() != null
                ? datos.getEstadoReserva()
                : estadoAnterior;

        int cantidadAnterior = reserva.getCantidadPasajeros();
        int cantidadNueva = datos.getCantidadPasajeros();

        long pasajerosAsociados =
                reservaPasajeroRepository.countByReserva_IdReserva(id);

        if (pasajerosAsociados > cantidadNueva) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "La cantidad nueva no puede ser menor que los pasajeros ya asociados."
            );
        }

        long checkInsRealizados =
                reservaPasajeroRepository
                        .countByReserva_IdReservaAndCheckInRealizadoTrue(id);

        if (checkInsRealizados > 0
            && (!idSalidaAnterior.equals(idSalidaNueva)
            || cantidadAnterior != cantidadNueva)) {

            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "No se puede cambiar la salida ni la cantidad de pasajeros porque ya hay pasajeros con check-in realizado."
            );
        }
        boolean seCancela =
                estadoAnterior != EstadoReserva.Cancelada
                && nuevoEstado == EstadoReserva.Cancelada;

        if (seCancela && checkInsRealizados > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No se puede cancelar una reserva que ya tiene pasajeros con check-in realizado."
            );
        }

        if (seCancela
                && pagoRepository.existsByReserva_IdReservaAndEstadoPago(
                        id, "Completado")) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "La reserva tiene pagos completados. Primero debés gestionar el reembolso."
            );
        }

        boolean ocupabaCuposAntes =
                estadoAnterior != EstadoReserva.Cancelada;

        boolean ocuparaCuposAhora =
                nuevoEstado != EstadoReserva.Cancelada;

        if (ocuparaCuposAhora) {
            validarSalidaDisponible(nuevaSalida);
        }

        if (idSalidaAnterior.equals(idSalidaNueva)) {

            int diferencia =
                    (ocuparaCuposAhora ? cantidadNueva : 0)
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

        // Importe recalculado en el servidor.
        reserva.setValorTotal(
                calcularTotal(nuevaSalida, cantidadNueva)
        );

        reserva.setObservaciones(datos.getObservaciones());

        // No modificamos el QR ni el usuario creador.
        // El QR existente permanece asociado a la reserva.

        return reservaRepository.save(reserva);
    }

    // ---------------------------------------------------------
    // ELIMINAR RESERVA
    // ---------------------------------------------------------

    @Transactional
    public void eliminar(Integer id) {

        Reserva reserva = reservaRepository
                .buscarPorIdConBloqueo(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No se encontró la reserva con ID: " + id
                ));

        if (pagoRepository.existsByReserva_IdReserva(id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No se puede eliminar la reserva porque tiene pagos asociados. Conservá el registro y gestioná su estado."
            );
        }

        if (reservaPasajeroRepository.countByReserva_IdReserva(id) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No se puede eliminar la reserva porque tiene pasajeros asociados."
            );
        }

        Salida salida = buscarSalidaConBloqueo(
                reserva.getSalida().getIdSalida()
        );

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
                    "No se puede eliminar la reserva porque existen registros relacionados."
            );
        }
    }

    // ---------------------------------------------------------
    // MÉTODOS AUXILIARES
    // ---------------------------------------------------------

    private Salida buscarSalidaConBloqueo(Integer idSalida) {

        return salidaRepository.buscarPorIdConBloqueo(idSalida)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No se encontró la salida con ID: " + idSalida
                ));
    }

    private void validarSalidaDisponible(Salida salida) {

        if (!"Programada".equals(salida.getEstadoSalida())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Solo se pueden reservar salidas que estén programadas."
            );
        }

        if (salida.getPrecioPorPersona() == null
                || salida.getPrecioPorPersona()
                        .compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "La salida tiene un precio inválido."
            );
        }

        if (salida.getCuposTotales() == null
                || salida.getCuposDisponibles() == null
                || salida.getCuposTotales() < 0
                || salida.getCuposDisponibles() < 0
                || salida.getCuposDisponibles() > salida.getCuposTotales()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "La disponibilidad de cupos de la salida es inválida."
            );
        }
    }

    private void descontarCupos(Salida salida, int cantidad) {

        if (cantidad <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La cantidad de cupos debe ser mayor que cero."
            );
        }

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

        if (cantidad <= 0) {
            return;
        }

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

    private BigDecimal calcularTotal(Salida salida, int cantidad) {

        if (salida.getPrecioPorPersona() == null) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "La salida no tiene un precio configurado."
            );
        }

        return salida.getPrecioPorPersona()
                .multiply(BigDecimal.valueOf(cantidad))
                .setScale(2, java.math.RoundingMode.HALF_UP);
    }

    private String generarCodigoUnico() {

        String codigo;

        do {
            codigo = UUID.randomUUID()
                    .toString()
                    .replace("-", "");
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
    }
}
