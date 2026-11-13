package br.org.ong.security;

import br.org.ong.model.Usuario;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private final JwtEncoder encoder;
    private final String issuer;
    private final long expirationMinutes;

    public JwtService(JwtEncoder encoder,
                      @Value("${app.jwt.issuer:https://ong-api}") String issuer,
                      @Value("${app.jwt.expiration-minutes:30}") long expirationMinutes) {
        this.encoder = encoder;
        this.issuer = issuer;
        this.expirationMinutes = expirationMinutes;
    }

    public String gerarToken(Usuario usuario) {
        Instant agora = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(issuer)
                .issuedAt(agora)
                .expiresAt(agora.plus(expirationMinutes, ChronoUnit.MINUTES))
                .subject(usuario.getId())
                .claim("email", usuario.getEmail())
                .claim("roles", List.of(usuario.getTipo().name()))
                .build();
        return encoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }

    public long expiraEmSegundos() {
        return expirationMinutes * 60;
    }
}
