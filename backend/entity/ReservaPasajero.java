package com.atrixpassenger.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "reserva_pasajeros",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uq_reserva_pasajero",
            columnNames = {"id_reserva", "id_pasajero"}
        )
    }
)
public class ReservaPasajero {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_reserva_pasajero")
    private Integer idReservaPasajero;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "id_reserva", nullable = false)
    private Reserva reserva;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "id_pasajero", nullable = false)
    private Pasajero pasajero;

    @Column(name = "check_in_realizado", nullable = false)
    private Boolean checkInRealizado = false;

    @Column(
        name = "fecha_asociacion",
        insertable = false,
        updatable = false
    )
    private LocalDateTime fechaAsociacion;

    public ReservaPasajero() {
    }

    public Integer getIdReservaPasajero() {
        return idReservaPasajero;
    }

    public void setIdReservaPasajero(Integer idReservaPasajero) {
        this.idReservaPasajero = idReservaPasajero;
    }

    public Reserva getReserva() {
        return reserva;
    }

    public void setReserva(Reserva reserva) {
        this.reserva = reserva;
    }

    public Pasajero getPasajero() {
        return pasajero;
    }

    public void setPasajero(Pasajero pasajero) {
        this.pasajero = pasajero;
    }

    public Boolean getCheckInRealizado() {
        return checkInRealizado;
    }

    public void setCheckInRealizado(Boolean checkInRealizado) {
        this.checkInRealizado = checkInRealizado;
    }

    public LocalDateTime getFechaAsociacion() {
        return fechaAsociacion;
    }

    public void setFechaAsociacion(LocalDateTime fechaAsociacion) {
        this.fechaAsociacion = fechaAsociacion;
    }
}
