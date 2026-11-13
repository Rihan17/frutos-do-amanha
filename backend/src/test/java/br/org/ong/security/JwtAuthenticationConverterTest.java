package br.org.ong.security;

import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;
import static org.junit.jupiter.api.Assertions.*;

class JwtAuthenticationConverterTest {
    @Test void claimRoleViraAuthoritySpring() {
        Jwt jwt=Jwt.withTokenValue("token").header("alg","HS256").subject("000000000000000000000001")
                .claim("roles",List.of("ADMIN")).issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(60)).build();
        var authentication=new SecurityConfiguration().jwtAuthenticationConverter().convert(jwt);
        assertTrue(authentication.getAuthorities().stream().anyMatch(authority->authority.getAuthority().equals("ROLE_ADMIN")));
    }
}
