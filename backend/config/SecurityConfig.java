package com.atrixpassenger.backend.config;

import com.atrixpassenger.backend.security.CustomUserDetailsService;
import com.atrixpassenger.backend.security.JwtAuthenticationFilter;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Seguridad HTTP: CORS, JWT stateless y permisos por rol.
 *
 * Roles (tabla roles.nombre_rol): ADMINISTRADOR, OPERADOR, USUARIO.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private static final String ADMIN = "ADMINISTRADOR";
    private static final String OPERADOR = "OPERADOR";
    private static final String USUARIO = "USUARIO";

    private final JwtAuthenticationFilter jwtFilter;
    private final CustomUserDetailsService userDetailsService;

    /**
     * Orígenes permitidos leídos directamente desde la variable de entorno CORS_ALLOWED_ORIGINS.
     */
    @Value("${CORS_ALLOWED_ORIGINS}")
    private String allowedOrigins;

    public SecurityConfig(
            JwtAuthenticationFilter jwtFilter,
            CustomUserDetailsService userDetailsService) {
        this.jwtFilter = jwtFilter;
        this.userDetailsService = userDetailsService;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider(PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    // ---------------------------------------------------------
    // CORS
    // ---------------------------------------------------------
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Se normalizan los orígenes: sin espacios y sin "/" final
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .map(origin -> origin.replaceAll("/+$", ""))
                .filter(origin -> !origin.isBlank())
                .toList();

        // Uso de setAllowedOrigins para emparejar exactamente los dominios
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(
                List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of(
                "Authorization", "Content-Type", "Accept", "Origin",
                "X-Requested-With", "Cache-Control"));
        configuration.setExposedHeaders(List.of("Authorization", "Content-Disposition"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    // ---------------------------------------------------------
    // Filtros y permisos
    // ---------------------------------------------------------
    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            DaoAuthenticationProvider authenticationProvider) throws Exception {

        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .httpBasic(basic -> basic.disable())
            .formLogin(form -> form.disable())
            .sessionManagement(session ->
                    session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authenticationProvider(authenticationProvider)

            // Respuestas JSON (con cabeceras CORS) para 401 / 403.
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, e) ->
                        writeJson(response, HttpStatus.UNAUTHORIZED,
                                "Tu sesión no es válida o expiró. Iniciá sesión nuevamente."))
                .accessDeniedHandler((request, response, e) ->
                        writeJson(response, HttpStatus.FORBIDDEN,
                                "No tenés permisos para realizar esta acción."))
            )

            .authorizeHttpRequests(auth -> auth
                // Preflight CORS
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // Público
                .requestMatchers("/api/health", "/error").permitAll()
                .requestMatchers(HttpMethod.POST,
                        "/api/auth/login",
                        "/api/auth/register/passenger",
                        "/api/auth/register/operator").permitAll()

                // Cuenta propia (todos los roles)
                .requestMatchers("/api/auth/me", "/api/auth/profile", "/api/auth/password")
                    .authenticated()

                // Alta de personal desde el panel
                .requestMatchers("/api/auth/staff", "/api/auth/admins").hasRole(ADMIN)

                // Portal del pasajero
                .requestMatchers("/api/me/**").hasRole(USUARIO)

                // Viajes (salidas)
                .requestMatchers(HttpMethod.GET, "/api/salidas/**").hasAnyRole(ADMIN, OPERADOR)
                .requestMatchers(HttpMethod.PATCH, "/api/salidas/*/estado").hasAnyRole(ADMIN, OPERADOR)
                .requestMatchers("/api/salidas/**").hasRole(ADMIN)

                // Catálogo
                .requestMatchers(HttpMethod.GET,
                        "/api/destinos/**", "/api/actividades/**",
                        "/api/guias/**", "/api/vehiculos/**").hasAnyRole(ADMIN, OPERADOR)
                .requestMatchers(
                        "/api/destinos/**", "/api/actividades/**",
                        "/api/guias/**", "/api/vehiculos/**").hasRole(ADMIN)

                // Gestión operativa
                .requestMatchers(
                        "/api/reservas/**", "/api/pasajeros/**",
                        "/api/reserva-pasajeros/**", "/api/pagos/**",
                        "/api/operacion/**").hasAnyRole(ADMIN, OPERADOR)

                // Sólo administrador
                .requestMatchers(
                        "/api/metricas/**", "/api/usuarios/**",
                        "/api/roles/**", "/api/logs/**").hasRole(ADMIN)

                .requestMatchers("/api/**").authenticated()
                .anyRequest().permitAll()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    private static void writeJson(
            jakarta.servlet.http.HttpServletResponse response,
            HttpStatus status,
            String message) throws java.io.IOException {
        response.setStatus(status.value());
        response.setCharacterEncoding("UTF-8");
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"message\":\"" + message + "\"}");
    }
}