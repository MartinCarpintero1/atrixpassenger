
package com.atrixpassenger.backend.service;

import com.atrixpassenger.backend.entity.Pasajero;
import com.atrixpassenger.backend.repository.PasajeroRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
public class PasajeroService {

    private final PasajeroRepository pasajeroRepository;

    public PasajeroService(PasajeroRepository pasajeroRepository) {
        this.pasajeroRepository = pasajeroRepository;
    }

    public List<Pasajero> listarTodos() {
        return pasajeroRepository.findAll();
    }

    public Pasajero buscarPorId(Integer id) {
        return pasajeroRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No se encontró el pasajero con ID: " + id
                ));
    }

    public Pasajero buscarPorDocumento(String documento) {
        return pasajeroRepository.findByNroDocumento(documento)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No se encontró un pasajero con ese documento."
                ));
    }

    public List<Pasajero> buscarPorNombre(String nombre) {
        if (nombre == null || nombre.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ingresá un nombre o apellido para buscar."
            );
        }

        String termino = nombre.trim();

        return pasajeroRepository
                .findByNombreContainingIgnoreCaseOrApellidoContainingIgnoreCase(
                        termino, termino
                );
    }

    @Transactional
    public Pasajero crear(Pasajero datos) {
        validar(datos);

        String documento = datos.getNroDocumento().trim();

        if (pasajeroRepository.existsByNroDocumento(documento)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ya existe un pasajero registrado con ese documento."
            );
        }

        datos.setIdPasajero(null);
        datos.setNroDocumento(documento);
        datos.setNombre(datos.getNombre().trim());
        datos.setApellido(datos.getApellido().trim());

        if (datos.getTipoDocumento() == null) {
            datos.setTipoDocumento(Pasajero.TipoDocumento.DNI);
        }

        return pasajeroRepository.save(datos);
    }

    @Transactional
    public Pasajero actualizar(Integer id, Pasajero datos) {
        validar(datos);

        Pasajero pasajero = buscarPorId(id);
        String documento = datos.getNroDocumento().trim();

        pasajeroRepository.findByNroDocumento(documento)
                .filter(existente ->
                        !existente.getIdPasajero().equals(id))
                .ifPresent(existente -> {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            "Ese documento ya pertenece a otro pasajero."
                    );
                });

        pasajero.setTipoDocumento(
                datos.getTipoDocumento() != null
                        ? datos.getTipoDocumento()
                        : Pasajero.TipoDocumento.DNI
        );
        pasajero.setNroDocumento(documento);
        pasajero.setNombre(datos.getNombre().trim());
        pasajero.setApellido(datos.getApellido().trim());
        pasajero.setNacionalidad(datos.getNacionalidad());
        pasajero.setFechaNacimiento(datos.getFechaNacimiento());
        pasajero.setContactoTel(datos.getContactoTel());
        pasajero.setAlergias(datos.getAlergias());
        pasajero.setMedicacionHabitual(datos.getMedicacionHabitual());
        pasajero.setGrupoSanguineo(datos.getGrupoSanguineo());
        pasajero.setContactoEmergenciaNombre(
                datos.getContactoEmergenciaNombre()
        );
        pasajero.setContactoEmergenciaTel(
                datos.getContactoEmergenciaTel()
        );
        pasajero.setNfcTagUid(datos.getNfcTagUid());

        return pasajeroRepository.save(pasajero);
    }

    @Transactional
    public void eliminar(Integer id) {
        Pasajero pasajero = buscarPorId(id);

        try {
            pasajeroRepository.delete(pasajero);
            pasajeroRepository.flush();
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No se puede eliminar el pasajero porque está asociado a una reserva."
            );
        }
    }

    private void validar(Pasajero pasajero) {
        if (pasajero == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Los datos del pasajero son obligatorios."
            );
        }

        if (pasajero.getNroDocumento() == null
                || pasajero.getNroDocumento().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El número de documento es obligatorio."
            );
        }

        if (pasajero.getNroDocumento().trim().length() > 20) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El documento no puede superar los 20 caracteres."
            );
        }

        if (pasajero.getNombre() == null
                || pasajero.getNombre().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El nombre es obligatorio."
            );
        }

        if (pasajero.getNombre().trim().length() > 100) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El nombre no puede superar los 100 caracteres."
            );
        }

        if (pasajero.getApellido() == null
                || pasajero.getApellido().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El apellido es obligatorio."
            );
        }

        if (pasajero.getApellido().trim().length() > 100) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El apellido no puede superar los 100 caracteres."
            );
        }

        if (pasajero.getFechaNacimiento() != null
                && pasajero.getFechaNacimiento().isAfter(LocalDate.now())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La fecha de nacimiento no puede estar en el futuro."
            );
        }

        if (pasajero.getNfcTagUid() != null
                && pasajero.getNfcTagUid().isBlank()) {
            pasajero.setNfcTagUid(null);
        }
    }
}
