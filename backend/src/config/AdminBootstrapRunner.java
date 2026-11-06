package com.atrixpassenger.backend.config;

import com.atrixpassenger.backend.entity.Rol;
import com.atrixpassenger.backend.entity.Usuario;
import com.atrixpassenger.backend.repository.RolRepository;
import com.atrixpassenger.backend.repository.UsuarioRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class AdminBootstrapRunner implements ApplicationRunner {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap.username}")
    private String username;

    @Value("${app.bootstrap.email}")
    private String email;

    @Value("${app.bootstrap.password}")
    private String password;

    @Value("${app.bootstrap.name}")
    private String name;

    public AdminBootstrapRunner(
            UsuarioRepository usuarioRepository,
            RolRepository rolRepository,
            PasswordEncoder passwordEncoder) {

        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {

        if (username.isBlank() || email.isBlank()
                || password.isBlank() || name.isBlank()) {
            return;
        }

        if (usuarioRepository.existsByRol_NombreRolIgnoreCase(
                "ADMINISTRADOR")) {
            return;
        }

        Rol role = rolRepository
                .findByNombreRolIgnoreCase("ADMINISTRADOR")
                .orElseThrow(() ->
                        new IllegalStateException(
                                "No existe el rol ADMINISTRADOR"
                        ));

        Usuario admin = new Usuario();

        admin.setNombreCompleto(name.trim());
        admin.setUsername(username.trim());
        admin.setEmail(email.trim().toLowerCase());
        admin.setPasswordHash(passwordEncoder.encode(password));
        admin.setRol(role);
        admin.setActivo(true);

        usuarioRepository.save(admin);
    }
}