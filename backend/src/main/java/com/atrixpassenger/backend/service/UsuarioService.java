package com.atrixpassenger.backend.service;

import com.atrixpassenger.backend.entity.Rol;
import com.atrixpassenger.backend.entity.Usuario;
import com.atrixpassenger.backend.repository.RolRepository;
import com.atrixpassenger.backend.repository.UsuarioRepository;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final BCryptPasswordEncoder passwordEncoder =
        new BCryptPasswordEncoder();

    public UsuarioService(
            UsuarioRepository usuarioRepository,
            RolRepository rolRepository) {
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
    }

    public List<Usuario> listarTodos() {
        return usuarioRepository.findAll();
    }

    public Usuario buscarPorId(Integer id) {
        return usuarioRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "No se encontró el usuario con ID: " + id
            ));
    }

    public List<Usuario> listarPorRol(Integer idRol) {
        if (!rolRepository.existsById(idRol)) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "No se encontró el rol con ID: " + idRol
            );
        }

        return usuarioRepository.findByRol_IdRol(idRol);
    }

    public List<Usuario> listarPorEstado(Boolean activo) {
        return usuarioRepository.findByActivo(activo);
    }

    public List<Usuario> buscarPorNombre(String nombre) {
        if (nombre == null || nombre.isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Debés indicar un nombre para buscar."
            );
        }

        return usuarioRepository
            .findByNombreCompletoContainingIgnoreCase(nombre.trim());
    }

    @Transactional
    public Usuario crear(Usuario datos) {
        validar(datos, true);

        String username = datos.getUsername().trim();

        if (usuarioRepository.existsByUsernameIgnoreCase(username)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Ese nombre de usuario ya está registrado."
            );
        }

        String email = normalizarEmail(datos.getEmail());
        comprobarEmailDisponible(email, null);

        Rol rol = buscarRolOpcional(datos.getRol());

        datos.setIdUsuario(null);
        datos.setUsername(username);
        datos.setEmail(email);
        datos.setRol(rol);
        datos.setPasswordHash(
            passwordEncoder.encode(datos.getPassword())
        );
        datos.setPassword(null);

        if (datos.getActivo() == null) {
            datos.setActivo(true);
        }

        return usuarioRepository.save(datos);
    }

    @Transactional
    public Usuario actualizar(Integer id, Usuario datos) {
        validar(datos, false);

        Usuario usuario = buscarPorId(id);

        String username = datos.getUsername().trim();

        usuarioRepository.findByUsernameIgnoreCase(username)
            .filter(existente -> !existente.getIdUsuario().equals(id))
            .ifPresent(existente -> {
                throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ese nombre de usuario ya está registrado."
                );
            });

        String email = normalizarEmail(datos.getEmail());
        comprobarEmailDisponible(email, id);

        Rol rol = buscarRolOpcional(datos.getRol());

        usuario.setNombreCompleto(datos.getNombreCompleto().trim());
        usuario.setUsername(username);
        usuario.setEmail(email);
        usuario.setRol(rol);
        usuario.setActivo(
            datos.getActivo() != null
                ? datos.getActivo()
                : usuario.getActivo()
        );
        usuario.setNombreAgencia(datos.getNombreAgencia());
        usuario.setTelefono(datos.getTelefono());

        if (datos.getPassword() != null
                && !datos.getPassword().isBlank()) {
            usuario.setPasswordHash(
                passwordEncoder.encode(datos.getPassword())
            );
        }

        return usuarioRepository.save(usuario);
    }

    @Transactional
    public void eliminar(Integer id) {
        Usuario usuario = buscarPorId(id);

        try {
            usuarioRepository.delete(usuario);
            usuarioRepository.flush();
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "No se puede eliminar el usuario porque tiene registros asociados."
            );
        }
    }

    private Rol buscarRolOpcional(Rol rolDatos) {
        if (rolDatos == null || rolDatos.getIdRol() == null) {
            return null;
        }

        Integer idRol = rolDatos.getIdRol();

        return rolRepository.findById(idRol)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "No se encontró el rol con ID: " + idRol
            ));
    }

    
        private void comprobarEmailDisponible(String email, Integer idUsuario) {
            if (email == null) {
            return;
            }

            usuarioRepository.findByEmailIgnoreCase(email)
            .filter(existente -> idUsuario == null || !existente.getIdUsuario().equals(idUsuario))
            .ifPresent(existente -> {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Ese correo electrónico ya está registrado."
            );
        });
    }


    private String normalizarEmail(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }

        String normalizado = email.trim().toLowerCase(Locale.ROOT);

        if (normalizado.length() > 100 || !normalizado.matches(
                "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "El correo electrónico no es válido."
            );
        }

        return normalizado;
    }

    private void validar(Usuario usuario, boolean esNuevo) {
        if (usuario == null) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Los datos del usuario son obligatorios."
            );
        }

        if (usuario.getNombreCompleto() == null
                || usuario.getNombreCompleto().isBlank()
                || usuario.getNombreCompleto().trim().length() > 100) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "El nombre completo es obligatorio y no puede superar los 100 caracteres."
            );
        }

        if (usuario.getUsername() == null
                || usuario.getUsername().isBlank()
                || usuario.getUsername().trim().length() > 50) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "El nombre de usuario es obligatorio y no puede superar los 50 caracteres."
            );
        }

        if (esNuevo && (usuario.getPassword() == null
                || usuario.getPassword().length() < 8)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "La contraseña debe tener al menos 8 caracteres."
            );
        }

        if (usuario.getPassword() != null
                && !usuario.getPassword().isBlank()
                && usuario.getPassword().length() < 8) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "La nueva contraseña debe tener al menos 8 caracteres."
            );
        }

        if (usuario.getNombreAgencia() != null
                && usuario.getNombreAgencia().length() > 120) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "El nombre de la agencia no puede superar los 120 caracteres."
            );
        }

        if (usuario.getTelefono() != null
                && usuario.getTelefono().length() > 30) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "El teléfono no puede superar los 30 caracteres."
            );
        }
    }

    /** Habilita o deshabilita una cuenta (no elimina datos). */
    @Transactional
    public Usuario cambiarEstado(Integer id, Boolean activo) {
        Usuario usuario = buscarPorId(id);
        usuario.setActivo(Boolean.TRUE.equals(activo));
        return usuarioRepository.save(usuario);
    }
}
