package com.atrixpassenger.backend.service;

import com.atrixpassenger.backend.dto.auth.*;
import com.atrixpassenger.backend.entity.Pasajero;
import com.atrixpassenger.backend.entity.Rol;
import com.atrixpassenger.backend.entity.Usuario;
import com.atrixpassenger.backend.repository.PasajeroRepository;
import com.atrixpassenger.backend.repository.RolRepository;
import com.atrixpassenger.backend.repository.UsuarioRepository;
import com.atrixpassenger.backend.security.JwtService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Locale;

/**
 * Autenticación, registro y gestión de la cuenta propia.
 */
@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasajeroRepository pasajeroRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Value("${app.jwt.expiration}")
    private long expiration;

    /** Código que habilita el registro público de personal. Vacío = deshabilitado. */
    @Value("${app.staff.registration-code:}")
    private String staffRegistrationCode;

    public AuthService(
            UsuarioRepository usuarioRepository,
            RolRepository rolRepository,
            PasajeroRepository pasajeroRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService) {
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.pasajeroRepository = pasajeroRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    // ---------------------------------------------------------
    // LOGIN
    // ---------------------------------------------------------
    public AuthResponse login(LoginRequest request) {
        String identifier = request.identifier().trim();

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(identifier, request.password()));

        return createAuthResponse(findByIdentifier(identifier));
    }

    // ---------------------------------------------------------
    // REGISTRO DE PASAJEROS (público)
    // ---------------------------------------------------------
    @Transactional
    public AuthResponse registerPassenger(PassengerRegisterRequest request) {
        validateNewAccount(request.username(), request.email());

        String documento = request.nroDocumento().trim();
        if (pasajeroRepository.existsByNroDocumento(documento)) {
            throw new IllegalArgumentException("Ya existe un pasajero con ese documento");
        }

        Usuario usuario = new Usuario();
        usuario.setNombreCompleto(request.nombre().trim() + " " + request.apellido().trim());
        usuario.setUsername(request.username().trim());
        usuario.setEmail(normalizeEmail(request.email()));
        usuario.setPasswordHash(passwordEncoder.encode(request.password()));
        usuario.setTelefono(trimOrNull(request.contactoTel()));
        usuario.setRol(findRole("USUARIO"));
        usuario.setActivo(true);
        usuarioRepository.save(usuario);

        // Perfil de pasajero vinculado a la cuenta (pasajeros.id_usuario).
        Pasajero pasajero = new Pasajero();
        pasajero.setTipoDocumento(Pasajero.TipoDocumento.valueOf(request.tipoDocumento()));
        pasajero.setNroDocumento(documento);
        pasajero.setNombre(request.nombre().trim());
        pasajero.setApellido(request.apellido().trim());
        pasajero.setNacionalidad(trimOrNull(request.nacionalidad()));
        pasajero.setFechaNacimiento(request.fechaNacimiento());
        pasajero.setContactoTel(trimOrNull(request.contactoTel()));
        pasajero.setIdUsuario(usuario.getIdUsuario());
        pasajeroRepository.save(pasajero);

        return createAuthResponse(usuario);
    }

    // ---------------------------------------------------------
    // REGISTRO PÚBLICO DE PERSONAL (requiere código de registro)
    // ---------------------------------------------------------
    @Transactional
    public AuthResponse registerOperator(OperatorRegisterRequest request) {
        if (staffRegistrationCode == null || staffRegistrationCode.isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "El registro público de personal está deshabilitado. "
                    + "Solicitá el alta a un administrador.");
        }
        if (!constantTimeEquals(staffRegistrationCode, request.codigoRegistro())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "El código de registro administrativo no es válido.");
        }

        // El registro público sólo crea OPERADORES; los administradores
        // se dan de alta desde el panel por otro administrador.
        Usuario usuario = buildStaff(request, "OPERADOR");
        return createAuthResponse(usuario);
    }

    // ---------------------------------------------------------
    // ALTA DE PERSONAL DESDE EL PANEL (sólo ADMINISTRADOR)
    // ---------------------------------------------------------
    @Transactional
    public UserResponse createStaff(OperatorRegisterRequest request) {
        String rol = request.rol() == null || request.rol().isBlank()
                ? "OPERADOR" : request.rol();
        return toUserResponse(buildStaff(request, rol));
    }

    @Transactional
    public UserResponse createAdministrator(OperatorRegisterRequest request) {
        return toUserResponse(buildStaff(request, "ADMINISTRADOR"));
    }

    // ---------------------------------------------------------
    // CUENTA PROPIA
    // ---------------------------------------------------------
    public UserResponse getCurrentUser(String username) {
        return toUserResponse(findByUsername(username));
    }

    @Transactional
    public UserResponse updateProfile(String username, UpdateProfileRequest request) {
        Usuario usuario = findByUsername(username);
        String email = normalizeEmail(request.email());

        usuarioRepository.findByEmailIgnoreCase(email)
                .filter(other -> !other.getIdUsuario().equals(usuario.getIdUsuario()))
                .ifPresent(other -> {
                    throw new IllegalArgumentException("Ese correo electrónico ya está registrado");
                });

        usuario.setNombreCompleto(request.nombreCompleto().trim());
        usuario.setEmail(email);
        usuario.setTelefono(trimOrNull(request.telefono()));
        if (!"USUARIO".equalsIgnoreCase(usuario.getRol().getNombreRol())) {
            usuario.setNombreAgencia(trimOrNull(request.nombreAgencia()));
        }
        return toUserResponse(usuarioRepository.save(usuario));
    }

    @Transactional
    public void changePassword(String username, ChangePasswordRequest request) {
        Usuario usuario = findByUsername(username);

        if (!passwordEncoder.matches(request.passwordActual(), usuario.getPasswordHash())) {
            throw new IllegalArgumentException("La contraseña actual no es correcta");
        }
        usuario.setPasswordHash(passwordEncoder.encode(request.passwordNueva()));
        usuarioRepository.save(usuario);
    }

    // ---------------------------------------------------------
    // Utilidades
    // ---------------------------------------------------------
    private Usuario buildStaff(OperatorRegisterRequest request, String roleName) {
        validateNewAccount(request.username(), request.email());

        Usuario usuario = new Usuario();
        usuario.setNombreCompleto(request.nombreCompleto().trim());
        usuario.setUsername(request.username().trim());
        usuario.setEmail(normalizeEmail(request.email()));
        usuario.setPasswordHash(passwordEncoder.encode(request.password()));
        usuario.setRol(findRole(roleName));
        usuario.setActivo(true);
        usuario.setNombreAgencia(trimOrNull(request.nombreAgencia()));
        usuario.setTelefono(trimOrNull(request.telefono()));
        return usuarioRepository.save(usuario);
    }

    private Usuario findByIdentifier(String identifier) {
        return usuarioRepository.findByUsernameIgnoreCase(identifier)
                .or(() -> usuarioRepository.findByEmailIgnoreCase(identifier))
                .orElseThrow(() -> new IllegalArgumentException("Credenciales incorrectas"));
    }

    private Usuario findByUsername(String username) {
        return usuarioRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
    }

    private void validateNewAccount(String username, String email) {
        if (usuarioRepository.existsByUsernameIgnoreCase(username.trim())) {
            throw new IllegalArgumentException("Ese nombre de usuario ya está registrado");
        }
        if (usuarioRepository.existsByEmailIgnoreCase(normalizeEmail(email))) {
            throw new IllegalArgumentException("Ese correo electrónico ya está registrado");
        }
    }

    private Rol findRole(String name) {
        return rolRepository.findByNombreRolIgnoreCase(name)
                .orElseThrow(() -> new IllegalStateException(
                        "No existe el rol " + name + " en la base de datos"));
    }

    private AuthResponse createAuthResponse(Usuario usuario) {
        String token = jwtService.generateToken(usuario.getUsername());
        return new AuthResponse(token, "Bearer", expiration, toUserResponse(usuario));
    }

    public static UserResponse toUserResponse(Usuario usuario) {
        return new UserResponse(
                usuario.getIdUsuario(),
                usuario.getUsername(),
                usuario.getEmail(),
                usuario.getNombreCompleto(),
                usuario.getRol() != null ? usuario.getRol().getNombreRol().toUpperCase(Locale.ROOT) : null,
                usuario.getTelefono(),
                usuario.getNombreAgencia(),
                usuario.getActivo());
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static String trimOrNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static boolean constantTimeEquals(String expected, String provided) {
        if (provided == null) {
            return false;
        }
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                provided.trim().getBytes(StandardCharsets.UTF_8));
    }
}
