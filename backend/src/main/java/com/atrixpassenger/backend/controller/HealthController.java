
package com.atrixpassenger.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    public HealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public Map<String, Object> checkHealth() {

        try {
            String database = jdbcTemplate.queryForObject(
                "SELECT current_database()",
                String.class
            );

            return Map.of(
                "status", "UP",
                "backend", "OK",
                "database", "CONNECTED",
                "databaseName", database
            );

        } catch (Exception e) {

            return Map.of(
                "status", "ERROR",
                "backend", "OK",
                "database", "DISCONNECTED"
            );
        }
    }
}
