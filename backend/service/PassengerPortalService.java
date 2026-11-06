package com.atrixpassenger.backend.service;

import com.atrixpassenger.backend.dto.portal.*;
import com.atrixpassenger.backend.entity.*;
import com.atrixpassenger.backend.repository.*;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Lógica del portal del pasajero (rol USUARIO): sus viajes, cupos
 * disponibles, reservas propias y ficha de salud/emergencia.
 */
@Service
public class PassengerPortalService {

    private final UsuarioRepository usuarioRepository;
    private final PasajeroRepository pasajeroRepository;
    private final ReservaRepository reservaRepository;
    private final ReservaPasajeroRepository reservaPasajeroRepository;
    private final SalidaRepository salidaRepository;
    private final PagoRepository pagoRepository;
    private final GuiaRepository guiaRepository;
    private final VehiculoRepository vehiculoRepository;
    private final ReservaService reservaService;

    public PassengerPortalService(
            UsuarioRepository usuarioRepository,
            PasajeroRepository pasajeroRepository,
            ReservaRepository reservaRepository,
            ReservaPasajeroRepository reservaPasajeroRepository,
            SalidaRepository salidaRepository,
            PagoRepository pagoRepository,
            GuiaRepository guiaRepository,
            VehiculoRepository vehiculoRepository,
            ReservaService reservaService) {
        this.usuarioRepository = usuarioRepository;
        this.pasajeroRepository = pasajeroRepository;
        this.reservaRepository = reservaRepository;
        this.reservaPasajeroRepository = reservaPasajeroRepository;
        this.salidaRepository = salidaRepository;
        this.pagoRepository = pagoRepository;
        this.guiaRepository = guiaRepository;
        this.vehiculoRepository = vehiculoRepository;
        this.reservaService = reservaService;
    }

    // ---------------------------------------------------------
    // MIS VIAJES
    // ---------------------------------------------------------
    @Transactional(readOnly = true)
    public List<ViajePasajeroDto> misViajes(String username) {
        Usuario usuario = usuario(username);
        Optional<Pasajero> pasajero = pasajeroRepository.findFirstByIdUsuario(usuario.getIdUsuario());

        // Reservas donde el pasajero está asociado + reservas creadas por la cuenta.
        Map<Integer, ReservaPasajero> asociaciones = new LinkedHashMap<>();
        reservaPasajeroRepository.findByPasajero_IdUsuario(usuario.getIdUsuario())
                .forEach(rp -> asociaciones.put(rp.getReserva().getIdReserva(), rp));

        Map<Integer, Reserva> reservas = new LinkedHashMap<>();
        asociaciones.values().forEach(rp -> reservas.put(rp.getReserva().getIdReserva(), rp.getReserva()));
        reservaRepository.findByIdUsuarioCreador(usuario.getIdUsuario())
                .forEach(r -> reservas.putIfAbsent(r.getIdReserva(), r));

        return reservas.values().stream()
                .sorted(Comparator.comparing(
                        (Reserva r) -> r.getSalida().getFechaHoraSalida(),
                        Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .map(r -> toViaje(r, asociaciones.get(r.getIdReserva()), pasajero.orElse(null), usuario))
                .toList();
    }

    @Transactional(readOnly = true)
    public ViajePasajeroDto miViaje(String username, Integer idReserva) {
        return misViajes(username).stream()
                .filter(v -> v.idReserva().equals(idReserva))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No encontramos ese viaje entre tus reservas."));
    }

    // ---------------------------------------------------------
    // CUPOS
    // ---------------------------------------------------------
    @Transactional(readOnly = true)
    public List<CupoDto> cuposDisponibles(String username) {
        Set<Integer> reservadas = new HashSet<>();
        misViajes(username).stream()
                .filter(v -> !"Cancelada".equals(v.estadoReserva()))
                .forEach(v -> reservadas.add(v.idSalida()));

        LocalDateTime ahora = LocalDateTime.now();

        return salidaRepository.findByCuposDisponiblesGreaterThan(0).stream()
                .filter(s -> "Programada".equalsIgnoreCase(s.getEstadoSalida()))
                .filter(s -> s.getFechaHoraSalida() == null || s.getFechaHoraSalida().isAfter(ahora))
                .sorted(Comparator.comparing(Salida::getFechaHoraSalida,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .map(s -> {
                    Actividad a = s.getActividad();
                    Destino d = a != null ? a.getDestino() : null;
                    return new CupoDto(
                            s.getIdSalida(),
                            a != null ? a.getNombre() : null,
                            a != null ? a.getDescripcion() : null,
                            d != null ? d.getNombreDestino() : null,
                            d != null && d.getDificultad() != null ? d.getDificultad().name() : null,
                            a != null ? a.getDuracionEstimada() : null,
                            s.getFechaHoraSalida(),
                            s.getCuposTotales(),
                            s.getCuposDisponibles(),
                            s.getPrecioPorPersona(),
                            s.getEstadoSalida(),
                            reservadas.contains(s.getIdSalida()));
                })
                .toList();
    }

    /** Reserva de cupos desde el portal: crea la reserva y asocia al titular. */
    @Transactional
    public ViajePasajeroDto reservar(String username, ReservaPortalRequest request) {
        Usuario usuario = usuario(username);
        Pasajero pasajero = pasajeroRepository.findFirstByIdUsuario(usuario.getIdUsuario())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT,
                        "Tu cuenta no tiene un perfil de pasajero asociado."));

        Salida salida = salidaRepository.findById(request.idSalida())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "El viaje seleccionado no existe."));
        if (!"Programada".equalsIgnoreCase(salida.getEstadoSalida())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "El viaje ya no admite reservas.");
        }

        Reserva datos = new Reserva();
        datos.setSalida(salida);
        datos.setCantidadPasajeros(request.cantidadPasajeros());
        datos.setObservaciones(request.observaciones());
        datos.setIdUsuarioCreador(usuario.getIdUsuario());

        // ReservaService bloquea la salida, descuenta cupos y calcula el total.
        Reserva reserva = reservaService.crear(datos);

        ReservaPasajero rp = new ReservaPasajero();
        rp.setReserva(reserva);
        rp.setPasajero(pasajero);
        rp.setCheckInRealizado(false);
        rp = reservaPasajeroRepository.save(rp);

        return toViaje(reserva, rp, pasajero, usuario);
    }

    // ---------------------------------------------------------
    // FICHA DE VIAJE (salud y emergencia)
    // ---------------------------------------------------------
    @Transactional(readOnly = true)
    public FichaPasajeroDto ficha(String username) {
        return toFicha(pasajero(username));
    }

    @Transactional
    public FichaPasajeroDto actualizarFicha(String username, FichaPasajeroDto datos) {
        Pasajero p = pasajero(username);
        p.setNacionalidad(blankToNull(datos.nacionalidad()));
        p.setContactoTel(blankToNull(datos.contactoTel()));
        p.setAlergias(blankToNull(datos.alergias()));
        p.setMedicacionHabitual(blankToNull(datos.medicacionHabitual()));
        p.setGrupoSanguineo(blankToNull(datos.grupoSanguineo()));
        p.setContactoEmergenciaNombre(blankToNull(datos.contactoEmergenciaNombre()));
        p.setContactoEmergenciaTel(blankToNull(datos.contactoEmergenciaTel()));
        return toFicha(pasajeroRepository.save(p));
    }

    // ---------------------------------------------------------
    // Mapeos
    // ---------------------------------------------------------
    private ViajePasajeroDto toViaje(Reserva r, ReservaPasajero rp, Pasajero pasajero, Usuario usuario) {
        Salida s = r.getSalida();
        Actividad a = s.getActividad();
        Destino d = a != null ? a.getDestino() : null;
        Guia g = s.getIdGuia() != null ? guiaRepository.findById(s.getIdGuia()).orElse(null) : null;
        Vehiculo v = s.getIdVehiculo() != null ? vehiculoRepository.findById(s.getIdVehiculo()).orElse(null) : null;

        List<Pago> pagos = pagoRepository.findByReserva_IdReserva(r.getIdReserva());
        BigDecimal pagado = pagos.stream()
                .filter(p -> "Completado".equalsIgnoreCase(p.getEstadoPago()))
                .map(Pago::getMonto)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        String estadoPago = pagos.isEmpty() ? "Sin pagos"
                : r.getValorTotal() != null && pagado.compareTo(r.getValorTotal()) >= 0 ? "Pagado"
                : pagado.signum() > 0 ? "Pago parcial" : "Pendiente";

        Pasajero titular = rp != null ? rp.getPasajero() : pasajero;
        String nombre = titular != null
                ? (titular.getNombre() + " " + titular.getApellido()).trim()
                : usuario.getNombreCompleto();

        return new ViajePasajeroDto(
                r.getIdReserva(),
                r.getQrCodigoSeguridad(),
                r.getEstadoReserva() != null ? r.getEstadoReserva().name() : null,
                r.getFechaReserva(),
                r.getCantidadPasajeros(),
                r.getValorTotal(),
                r.getObservaciones(),
                rp != null ? rp.getCheckInRealizado() : Boolean.FALSE,
                estadoPago,
                pagado,
                s.getIdSalida(),
                s.getFechaHoraSalida(),
                s.getEstadoSalida(),
                s.getPrecioPorPersona(),
                s.getCuposTotales(),
                s.getCuposDisponibles(),
                a != null ? a.getNombre() : null,
                a != null ? a.getDescripcion() : null,
                a != null ? a.getDuracionEstimada() : null,
                d != null ? d.getNombreDestino() : null,
                d != null ? d.getDescripcion() : null,
                d != null && d.getDificultad() != null ? d.getDificultad().name() : null,
                g != null ? g.getNombre() + " " + g.getApellido() : null,
                g != null ? g.getTelefono() : null,
                v != null ? String.join(" ", Objects.toString(v.getMarca(), ""), Objects.toString(v.getModelo(), "")).trim() : null,
                v != null ? v.getPatente() : null,
                nombre,
                titular != null ? titular.getNroDocumento() : null,
                titular != null && titular.getTipoDocumento() != null ? titular.getTipoDocumento().name() : null);
    }

    private FichaPasajeroDto toFicha(Pasajero p) {
        return new FichaPasajeroDto(
                p.getIdPasajero(),
                p.getTipoDocumento() != null ? p.getTipoDocumento().name() : null,
                p.getNroDocumento(),
                p.getNombre(),
                p.getApellido(),
                p.getFechaNacimiento(),
                p.getNacionalidad(),
                p.getContactoTel(),
                p.getAlergias(),
                p.getMedicacionHabitual(),
                p.getGrupoSanguineo(),
                p.getContactoEmergenciaNombre(),
                p.getContactoEmergenciaTel());
    }

    private Usuario usuario(String username) {
        return usuarioRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));
    }

    private Pasajero pasajero(String username) {
        return pasajeroRepository.findFirstByIdUsuario(usuario(username).getIdUsuario())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Tu cuenta no tiene un perfil de pasajero asociado."));
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
