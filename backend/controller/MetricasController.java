package com.atrixpassenger.backend.controller;

import com.atrixpassenger.backend.entity.*;
import com.atrixpassenger.backend.repository.*;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Métricas y ventas (sólo ADMINISTRADOR, ver SecurityConfig).
 * Se calculan en memoria a partir de las tablas existentes.
 */
@RestController
@RequestMapping("/api/metricas")
@Transactional(readOnly = true)
public class MetricasController {

    private static final String COMPLETADO = "Completado";

    private final ReservaRepository reservaRepository;
    private final SalidaRepository salidaRepository;
    private final PagoRepository pagoRepository;
    private final PasajeroRepository pasajeroRepository;

    public MetricasController(
            ReservaRepository reservaRepository,
            SalidaRepository salidaRepository,
            PagoRepository pagoRepository,
            PasajeroRepository pasajeroRepository) {
        this.reservaRepository = reservaRepository;
        this.salidaRepository = salidaRepository;
        this.pagoRepository = pagoRepository;
        this.pasajeroRepository = pasajeroRepository;
    }

    /** Indicadores generales del negocio. */
    @GetMapping("/resumen")
    public Map<String, Object> resumen() {
        List<Reserva> reservas = reservaRepository.findAll();
        List<Salida> salidas = salidaRepository.findAll();
        List<Pago> pagos = pagoRepository.findAll();

        Map<String, Long> reservasPorEstado = new LinkedHashMap<>();
        for (Reserva.EstadoReserva e : Reserva.EstadoReserva.values()) {
            reservasPorEstado.put(e.name(),
                    reservas.stream().filter(r -> r.getEstadoReserva() == e).count());
        }

        Map<String, Long> viajesPorEstado = salidas.stream().collect(Collectors.groupingBy(
                s -> Objects.toString(s.getEstadoSalida(), "Sin estado"),
                LinkedHashMap::new, Collectors.counting()));

        int cuposTotales = salidas.stream().mapToInt(s -> nz(s.getCuposTotales())).sum();
        int cuposLibres = salidas.stream().mapToInt(s -> nz(s.getCuposDisponibles())).sum();
        BigDecimal ocupacion = cuposTotales == 0 ? BigDecimal.ZERO
                : BigDecimal.valueOf((cuposTotales - cuposLibres) * 100.0 / cuposTotales)
                        .setScale(1, RoundingMode.HALF_UP);

        BigDecimal ingresos = sum(pagos.stream().filter(p -> COMPLETADO.equalsIgnoreCase(p.getEstadoPago())));
        BigDecimal pendiente = sum(pagos.stream().filter(p -> "Pendiente".equalsIgnoreCase(p.getEstadoPago())));

        LocalDateTime ahora = LocalDateTime.now();
        long proximos = salidas.stream()
                .filter(s -> s.getFechaHoraSalida() != null && s.getFechaHoraSalida().isAfter(ahora))
                .filter(s -> "Programada".equalsIgnoreCase(s.getEstadoSalida()))
                .count();

        // Top 5 destinos por pasajeros reservados (excluye canceladas).
        Map<String, Integer> porDestino = new HashMap<>();
        reservas.stream()
                .filter(r -> r.getEstadoReserva() != Reserva.EstadoReserva.Cancelada)
                .forEach(r -> {
                    Actividad a = r.getSalida().getActividad();
                    String destino = a != null && a.getDestino() != null
                            ? a.getDestino().getNombreDestino() : "Sin destino";
                    porDestino.merge(destino, nz(r.getCantidadPasajeros()), Integer::sum);
                });
        List<Map<String, Object>> topDestinos = porDestino.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(5)
                .map(e -> Map.<String, Object>of("destino", e.getKey(), "pasajeros", e.getValue()))
                .toList();

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("totalReservas", reservas.size());
        out.put("reservasPorEstado", reservasPorEstado);
        out.put("totalViajes", salidas.size());
        out.put("viajesProximos", proximos);
        out.put("viajesPorEstado", viajesPorEstado);
        out.put("totalPasajeros", pasajeroRepository.count());
        out.put("cuposTotales", cuposTotales);
        out.put("cuposDisponibles", cuposLibres);
        out.put("ocupacionPorcentaje", ocupacion);
        out.put("ingresosCobrados", ingresos);
        out.put("ingresosPendientes", pendiente);
        out.put("topDestinos", topDestinos);
        return out;
    }

    /** Ventas: pagos filtrables por rango de fechas, agrupados por mes y método. */
    @GetMapping("/ventas")
    public Map<String, Object> ventas(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {

        List<Pago> pagos = pagoRepository.findAll().stream()
                .filter(p -> desde == null || (p.getFechaPago() != null && !p.getFechaPago().toLocalDate().isBefore(desde)))
                .filter(p -> hasta == null || (p.getFechaPago() != null && !p.getFechaPago().toLocalDate().isAfter(hasta)))
                .sorted(Comparator.comparing(Pago::getFechaPago,
                        Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .toList();

        List<Pago> cobrados = pagos.stream().filter(p -> COMPLETADO.equalsIgnoreCase(p.getEstadoPago())).toList();

        Map<String, BigDecimal> porMes = new TreeMap<>();
        cobrados.stream().filter(p -> p.getFechaPago() != null).forEach(p ->
                porMes.merge(YearMonth.from(p.getFechaPago()).toString(), nz(p.getMonto()), BigDecimal::add));

        Map<String, BigDecimal> porMetodo = new TreeMap<>();
        cobrados.forEach(p ->
                porMetodo.merge(Objects.toString(p.getMetodoPago(), "Sin método"), nz(p.getMonto()), BigDecimal::add));

        Map<String, BigDecimal> porEstado = new TreeMap<>();
        pagos.forEach(p ->
                porEstado.merge(Objects.toString(p.getEstadoPago(), "Sin estado"), nz(p.getMonto()), BigDecimal::add));

        BigDecimal total = sum(cobrados.stream());
        BigDecimal ticketPromedio = cobrados.isEmpty() ? BigDecimal.ZERO
                : total.divide(BigDecimal.valueOf(cobrados.size()), 2, RoundingMode.HALF_UP);

        List<Map<String, Object>> detalle = pagos.stream().map(p -> {
            Map<String, Object> row = new LinkedHashMap<>();
            Reserva r = p.getReserva();
            Actividad a = r != null && r.getSalida() != null ? r.getSalida().getActividad() : null;
            row.put("idPago", p.getIdPago());
            row.put("idReserva", r != null ? r.getIdReserva() : null);
            row.put("codigoReserva", r != null ? r.getQrCodigoSeguridad() : null);
            row.put("viaje", a != null ? a.getNombre() : null);
            row.put("monto", p.getMonto());
            row.put("metodoPago", p.getMetodoPago());
            row.put("estadoPago", p.getEstadoPago());
            row.put("fechaPago", p.getFechaPago());
            return row;
        }).toList();

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("totalCobrado", total);
        out.put("cantidadPagos", cobrados.size());
        out.put("ticketPromedio", ticketPromedio);
        out.put("porMes", porMes);
        out.put("porMetodo", porMetodo);
        out.put("porEstado", porEstado);
        out.put("pagos", detalle);
        return out;
    }

    private static int nz(Integer v) {
        return v == null ? 0 : v;
    }

    private static BigDecimal nz(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }

    private static BigDecimal sum(java.util.stream.Stream<Pago> pagos) {
        return pagos.map(Pago::getMonto).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
