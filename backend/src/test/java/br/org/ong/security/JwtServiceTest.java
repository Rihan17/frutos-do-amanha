package br.org.ong.security;

import br.org.ong.model.Usuario;
import br.org.ong.model.enums.TipoUsuario;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {
    @Test void tokenTemSubjectEroleDoUsuario() {
        var key = new SecretKeySpec(new byte[32], "HmacSHA256");
        var encoder = new NimbusJwtEncoder(new ImmutableSecret<>(key));
        var service = new JwtService(encoder, "https://ong-api.test", 30);
        Usuario user = new Usuario();
        user.setId("000000000000000000000001");
        user.setEmail("admin@ong.org");
        user.setTipo(TipoUsuario.ADMIN);

        String token = service.gerarToken(user);
        var jwt = NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build().decode(token);

        assertEquals(user.getId(), jwt.getSubject());
        assertEquals("https://ong-api.test", jwt.getIssuer().toString());
        assertEquals(java.util.List.of("ADMIN"), jwt.getClaimAsStringList("roles"));
        assertEquals(1800, service.expiraEmSegundos());
    }
}
