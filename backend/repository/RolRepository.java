package com.atrixpassenger.backend.repository;

import com.atrixpassenger.backend.entity.Rol;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RolRepository extends JpaRepository<Rol, Integer> {

    Optional<Rol> findByNombreRolIgnoreCase(String nombreRol);

    boolean existsByNombreRolIgnoreCase(String nombreRol);
}
