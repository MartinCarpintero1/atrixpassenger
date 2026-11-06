package com.atrixpassenger.backend.service;

import com.atrixpassenger.backend.entity.Pago;
import com.atrixpassenger.backend.entity.Reserva;
import com.atrixpassenger.backend.repository.PagoRepository;
import com.atrixpassenger.backend.repository.ReservaRepository;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

@Service
public class PagoService {

    private final PagoRepository pagoRepository;
    private final ReservaRepository reservaRepository;

    private static final Set<String> METODOS_VALIDOS = Set.of(
        "Efectivo",
        "Transferencia",
        "Tarjeta",
        "Mercado Pago",
        "Otro"
    );

    private static final Set<String> ESTADOS_VALIDOS = Set.of(
        "Pendiente",
        "Completado",
        "Fallido",
        "Reembolsado"
    );

    public PagoService(
            PagoRepository pagoRepository,
            ReservaRepository reservaRepository) {
        this.pagoRepository = pagoRepository;
        this.reservaRepository = reservaRepository;
    }

    public List<Pago> listarTodos() {
        return pagoRepository.findAll();
    }

    public Pago buscarPorId(Integer id) {
        return pagoRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "No se encontró el pago con ID: " + id
            ));
    }

    public List<Pago> listarPorReserva(Integer idReserva) {
        if (!reservaRepository.existsById(idReserva)) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "No se encontró la reserva con ID: " + idReserva
            );
        }

        return pagoRepository.findByReserva_IdReserva(idReserva);
    }

    public List<Pago> listarPorEstado(String estado) {
        validarEstado(estado);
        return pagoRepository.findByEstadoPago(estado);
    }

    public List<Pago> listarPorMetodo(String metodo) {
        validarMetodo(metodo);
        return pagoRepository.findByMetodoPago(metodo);
    }

    @Transactional
    public Pago crear(Pago datos) {
        validar(datos);

        Reserva reserva = buscarReserva(
            datos.getReserva().getIdReserva()
        );

        String metodo = datos.getMetodoPago().trim();
        validarMetodo(metodo);

        String estado = datos.getEstadoPago();

        if (estado == null || estado.isBlank()) {
            estado = "Pendiente";
        } else {
            estado = estado.trim();
        }

        validarEstado(estado);

        datos.setIdPago(null);
        datos.setReserva(reserva);
        datos.setMetodoPago(metodo);
        datos.setEstadoPago(estado);
        datos.setReferenciaExterna(limpiarReferencia(
            datos.getReferenciaExterna()
        ));

        return pagoRepository.save(datos);
    }

    @Transactional
    public Pago actualizar(Integer id, Pago datos) {
        validar(datos);

        Pago pago = buscarPorId(id);

        Integer idReserva = datos.getReserva().getIdReserva();
        Reserva reserva = buscarReserva(idReserva);

        String metodo = datos.getMetodoPago().trim();
        validarMetodo(metodo);

        String estado = datos.getEstadoPago();

        if (estado == null || estado.isBlank()) {
            estado = pago.getEstadoPago();
        } else {
            estado = estado.trim();
        }

        validarEstado(estado);

        pago.setReserva(reserva);
        pago.setMonto(datos.getMonto());
        pago.setMetodoPago(metodo);
        pago.setEstadoPago(estado);
        pago.setReferenciaExterna(limpiarReferencia(
            datos.getReferenciaExterna()
        ));
        pago.setObservaciones(datos.getObservaciones());

        return pagoRepository.save(pago);
    }

    @Transactional
    public void eliminar(Integer id) {
        Pago pago = buscarPorId(id);

        try {
            pagoRepository.delete(pago);
            pagoRepository.flush();
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "No se puede eliminar el pago porque tiene registros asociados."
            );
        }
    }

    private Reserva buscarReserva(Integer idReserva) {
        if (idReserva == null) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Debés indicar una reserva."
            );
        }

        return reservaRepository.findById(idReserva)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "No se encontró la reserva con ID: " + idReserva
            ));
    }

    private void validar(Pago pago) {
        if (pago == null) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Los datos del pago son obligatorios."
            );
        }

        if (pago.getReserva() == null
                || pago.getReserva().getIdReserva() == null) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Debés indicar la reserva del pago."
            );
        }

        if (pago.getMonto() == null
                || pago.getMonto().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "El monto del pago debe ser mayor que cero."
            );
        }

        if (pago.getMetodoPago() == null
                || pago.getMetodoPago().isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Debés indicar el método de pago."
            );
        }
    }

    private void validarMetodo(String metodo) {
        if (metodo == null || !METODOS_VALIDOS.contains(metodo)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Método inválido. Opciones: Efectivo, Transferencia, "
                    + "Tarjeta, Mercado Pago u Otro."
            );
        }
    }

    private void validarEstado(String estado) {
        if (estado == null || !ESTADOS_VALIDOS.contains(estado)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Estado inválido. Opciones: Pendiente, Completado, "
                    + "Fallido o Reembolsado."
            );
        }
    }

    private String limpiarReferencia(String referencia) {
        if (referencia == null || referencia.isBlank()) {
            return null;
        }

        return referencia.trim();
    }
}
