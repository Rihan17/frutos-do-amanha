package br.org.ong.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.Map;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableMethodSecurity
public class SecurityConfiguration {
    @Bean
    SecurityFilterChain filterChain(HttpSecurity http, ObjectMapper mapper) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.POST,
                                "/auth/login",
                                "/auth/esqueci-senha",
                                "/auth/redefinir-senha").permitAll()
                        .requestMatchers(HttpMethod.GET, "/gestao", "/gestão").permitAll()
                        // The static shell must load before JavaScript can attach the bearer token.
                        // Admin data and mutations remain protected by authenticated API endpoints.
                        .requestMatchers(HttpMethod.GET, "/admin*.html").permitAll()
                        .requestMatchers(HttpMethod.GET, "/login.html", "/cadastro.html",
                                "/conta.html", "/conta-doar.html", "/conta-doacoes.html",
                                "/conta-voluntariado.html").denyAll()
                        .requestMatchers(HttpMethod.GET, "/", "/*.html", "/assets/**", "/favicon.ico").permitAll()
                        .requestMatchers(HttpMethod.POST, "/webhooks/mercadopago").permitAll()
                        .requestMatchers(HttpMethod.POST, "/doacoes/publico").permitAll()
                        .requestMatchers(HttpMethod.POST, "/voluntarios/publico").permitAll()
                        .requestMatchers(HttpMethod.POST, "/solicitacoes").permitAll()
                        .requestMatchers(HttpMethod.GET, "/projetos/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/publico/**").permitAll()
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth -> oauth.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())))
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint((request, response, exception) -> escreverErro(mapper, response, 401, "Autenticação necessária"))
                        .accessDeniedHandler((request, response, exception) -> escreverErro(mapper, response, 403, "Acesso negado")));
        return http.build();
    }

    @Bean
    JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter authorities = new JwtGrantedAuthoritiesConverter();
        authorities.setAuthoritiesClaimName("roles");
        authorities.setAuthorityPrefix("ROLE_");
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(authorities);
        return converter;
    }

    private static void escreverErro(ObjectMapper mapper, jakarta.servlet.http.HttpServletResponse response,
                                     int status, String mensagem) throws java.io.IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        mapper.writeValue(response.getOutputStream(), Map.of(
                "timestamp", Instant.now(), "status", status, "mensagem", mensagem, "campos", Map.of()));
    }
}
