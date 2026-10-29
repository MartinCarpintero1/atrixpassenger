
package com.atrixpassenger.backend;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    public HealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/api/health")
    public Map<String, String> health() {

        String database = jdbcTemplate.queryForObject(
            "SELECT DATABASE()",
            String.class
        );

        return Map.of(
            "status", "OK",
            "application", "Atrix Passenger Backend",
            "database", database
        );
    }
}
