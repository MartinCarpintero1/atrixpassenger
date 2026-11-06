package com.atrixpassenger.backend.security;

import com.atrixpassenger.backend.entity.Usuario;
import com.atrixpassenger.backend.repository.UsuarioRepository;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    public CustomUserDetailsService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String identifier)
            throws UsernameNotFoundException {

        Usuario usuario = usuarioRepository
                .findByUsernameIgnoreCase(identifier)
                .or(() -> usuarioRepository.findByEmailIgnoreCase(identifier))
                .orElseThrow(() ->
                        new UsernameNotFoundException("Usuario no encontrado"));

        String role = usuario.getRol().getNombreRol();

        return User.builder()
                .username(usuario.getUsername())
                .password(usuario.getPasswordHash())
                .authorities(List.of(
                        new SimpleGrantedAuthority("ROLE_" + role)
                ))
                .disabled(!Boolean.TRUE.equals(usuario.getActivo()))
                .build();
    }
}
