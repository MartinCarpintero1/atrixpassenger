package com.atrixpassenger.backend.repository;

import com.atrixpassenger.backend.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {

    Optional<Usuario> findByUsernameIgnoreCase(String username);

    Optional<Usuario> findByEmailIgnoreCase(String email);

    boolean existsByUsernameIgnoreCase(String username);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByRol_NombreRolIgnoreCase(String nombreRol);

    List<Usuario> findByRol_IdRol(Integer idRol);

    List<Usuario> findByActivo(Boolean activo);

    List<Usuario> findByNombreCompletoContainingIgnoreCase(String nombre);
}