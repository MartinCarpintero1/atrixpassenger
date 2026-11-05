package com.atrixpassenger.backend.service;

import com.atrixpassenger.backend.dto.auth.*;
import com.atrixpassenger.backend.entity.Rol;
import com.atrixpassenger.backend.entity.Usuario;
import com.atrixpassenger.backend.repository.RolRepository;
import com.atrixpassenger.backend.repository.UsuarioRepository;
import com.atrixpassenger.backend.repository.PasajeroRepository;
import com.atrixpassenger.backend.security.JwtService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasajeroRepository pasajeroRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final JdbcTemplate jdbcTemplate;

    @Value("${app.jwt.expiration}")
    private long expiration;

    public AuthService(
            UsuarioRepository usuarioRepository,
            RolRepository rolRepository,
            PasajeroRepository pasajeroRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            JdbcTemplate jdbcTemplate) {

        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.pasajeroRepository = pasajeroRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.jdbcTemplate = jdbcTemplate;
    }

    public AuthResponse login(LoginRequest request) {

        String identifier = request.identifier().trim();

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        identifier,
                        request.password()
                )
        );

        Usuario usuario = usuarioRepository
                .findByUsernameIgnoreCase(identifier)
                .or(() -> usuarioRepository.findByEmailIgnoreCase(identifier))
                .orElseThrow(() ->
                        new IllegalArgumentException("Credenciales incorrectas"));

        return createAuthResponse(usuario);
    }

    @Transactional
    public AuthResponse registerPassenger(PassengerRegisterRequest request) {

        validateNewAccount(request.username(), request.email());

        if (pasajeroRepository.existsByNroDocumento(
                request.nroDocumento().trim())) {

            throw new IllegalArgumentException(
                    "Ya existe un pasajero con ese documento"
            );
        }

        Rol role = findRole("USUARIO");

        Usuario usuario = new Usuario();

        usuario.setNombreCompleto(
                request.nombre().trim() + " " + request.apellido().trim()
        );

        usuario.setUsername(request.username().trim());
        usuario.setEmail(normalizeEmail(request.email()));
        usuario.setPasswordHash(passwordEncoder.encode(request.password()));
        usuario.setRol(role);
        usuario.setActivo(true);
        usuarioRepository.save(usuario);

        /*
         * Se inserta el perfil directamente en PostgreSQL.
         *
         * Esto permite utilizar la columna id_usuario existente
         * sin depender todavía de modificar el mapeo JPA de Pasajero.
         */
        jdbcTemplate.queryForObject(
                """
                INSERT INTO public.pasajeros (
                    tipo_documento,
                    nro_documento,
                    nombre,
                    apellido,
                    nacionalidad,
                    fecha_nacimiento,
                    contacto_tel,
                    id_usuario
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                RETURNING id_pasajero
                """,
                Integer.class,
                request.tipoDocumento(),
                request.nroDocumento().trim(),
                request.nombre().trim(),
                request.apellido().trim(),
                request.nacionalidad(),
                request.fechaNacimiento(),
                request.contactoTel(),
                usuario.getIdUsuario()
        );

        return createAuthResponse(usuario);
    }

    @Transactional
    public AuthResponse registerOperator(OperatorRegisterRequest request) {

        validateNewAccount(request.username(), request.email());

        Rol role = findRole("OPERADOR");

        Usuario usuario = new Usuario();

        usuario.setNombreCompleto(request.nombreCompleto().trim());
        usuario.setUsername(request.username().trim());
        usuario.setEmail(normalizeEmail(request.email()));
        usuario.setPasswordHash(passwordEncoder.encode(request.password()));
        usuario.setRol(role);
        usuario.setActivo(true);
        usuario.setNombreAgencia(request.nombreAgencia().trim());
        usuario.setTelefono(request.telefono().trim());

        usuarioRepository.save(usuario);

        return createAuthResponse(usuario);
    }

    @Transactional
    public UserResponse createAdministrator(OperatorRegisterRequest request) {

        validateNewAccount(request.username(), request.email());

        Rol role = findRole("ADMINISTRADOR");

        Usuario usuario = new Usuario();

        usuario.setNombreCompleto(request.nombreCompleto().trim());
        usuario.setUsername(request.username().trim());
        usuario.setEmail(normalizeEmail(request.email()));
        usuario.setPasswordHash(passwordEncoder.encode(request.password()));
        usuario.setRol(role);
        usuario.setActivo(true);
        usuario.setNombreAgencia(request.nombreAgencia().trim());
        usuario.setTelefono(request.telefono().trim());

        usuarioRepository.save(usuario);

        return toUserResponse(usuario);
    }

    public UserResponse getCurrentUser(String username) {

        Usuario usuario = usuarioRepository
                .findByUsernameIgnoreCase(username)
                .orElseThrow(() ->
                        new IllegalArgumentException("Usuario no encontrado"));

        return toUserResponse(usuario);
    }

    private void validateNewAccount(String username, String email) {

        String normalizedUsername = username.trim();

        if (usuarioRepository.existsByUsernameIgnoreCase(normalizedUsername)) {
            throw new IllegalArgumentException(
                    "Ese nombre de usuario ya está registrado"
            );
        }

        if (usuarioRepository.existsByEmailIgnoreCase(normalizeEmail(email))) {
            throw new IllegalArgumentException(
                    "Ese correo electrónico ya está registrado"
            );
        }
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private Rol findRole(String name) {

        return rolRepository.findByNombreRolIgnoreCase(name)
                .orElseThrow(() ->
                        new IllegalStateException(
                                "No existe el rol " + name + " en la base de datos"
                        ));
    }

    private AuthResponse createAuthResponse(Usuario usuario) {

        String token = jwtService.generateToken(usuario.getUsername());

        return new AuthResponse(
                token,
                "Bearer",
                expiration,
                toUserResponse(usuario)
        );
    }

    private UserResponse toUserResponse(Usuario usuario) {

        return new UserResponse(
                usuario.getIdUsuario(),
                usuario.getUsername(),
                usuario.getEmail(),
                usuario.getNombreCompleto(),
                usuario.getRol().getNombreRol()
        );
    }
}