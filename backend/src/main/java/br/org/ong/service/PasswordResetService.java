package br.org.ong.service;

import br.org.ong.dto.request.ResetPasswordRequest;
import br.org.ong.exception.RequisicaoInvalidaException;
import br.org.ong.model.PasswordResetToken;
import br.org.ong.model.Usuario;
import br.org.ong.repository.PasswordResetTokenRepository;
import br.org.ong.repository.UsuarioRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Locale;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class PasswordResetService {
    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String GENERIC_MESSAGE =
            "Se existir uma conta com esse e-mail, o link de recuperação será enviado.";
    private static final String INVALID_TOKEN_MESSAGE = "Link de recuperação inválido ou expirado";

    private final UsuarioRepository usuarios;
    private final PasswordResetTokenRepository tokens;
    private final MongoTemplate mongo;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetEmailService emailService;
    private final long expirationMinutes;

    public PasswordResetService(UsuarioRepository usuarios,
                                PasswordResetTokenRepository tokens,
                                MongoTemplate mongo,
                                PasswordEncoder passwordEncoder,
                                PasswordResetEmailService emailService,
                                @Value("${app.password-reset.expiration-minutes:60}") long expirationMinutes) {
        this.usuarios = usuarios;
        this.tokens = tokens;
        this.mongo = mongo;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.expirationMinutes = expirationMinutes;
    }

    public String solicitar(String email) {
        emailService.requireConfigured();
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        Optional<Usuario> candidate = usuarios.findByEmailIgnoreCase(normalizedEmail)
                .filter(Usuario::isAtivo);
        if (candidate.isEmpty()) return GENERIC_MESSAGE;

        Usuario usuario = candidate.get();
        tokens.deleteByUsuarioId(usuario.getId());
        String rawToken = gerarToken();
        Instant now = Instant.now();

        PasswordResetToken token = new PasswordResetToken();
        token.setUsuarioId(usuario.getId());
        token.setTokenHash(hash(rawToken));
        token.setCriadoEm(now);
        token.setExpiraEm(now.plus(expirationMinutes, ChronoUnit.MINUTES));
        tokens.save(token);

        try {
            emailService.sendPasswordReset(usuario.getEmail(), usuario.getNome(), rawToken, expirationMinutes);
        } catch (RuntimeException failure) {
            tokens.deleteById(token.getId());
            log.warn("E-mail de recuperação não enviado; verifique a configuração SMTP ({})",
                    failure.getClass().getSimpleName());
        }
        return GENERIC_MESSAGE;
    }

    public String redefinir(ResetPasswordRequest request) {
        Instant now = Instant.now();
        Query query = Query.query(Criteria.where("tokenHash").is(hash(request.token()))
                .and("expiraEm").gt(now));
        PasswordResetToken token = mongo.findAndRemove(query, PasswordResetToken.class);
        if (token == null) throw new RequisicaoInvalidaException(INVALID_TOKEN_MESSAGE);

        Usuario usuario = usuarios.findById(token.getUsuarioId())
                .filter(Usuario::isAtivo)
                .orElseThrow(() -> new RequisicaoInvalidaException(INVALID_TOKEN_MESSAGE));
        usuario.setSenhaHash(passwordEncoder.encode(request.senha()));
        usuarios.save(usuario);
        tokens.deleteByUsuarioId(usuario.getId());
        return "Senha redefinida. Entre novamente com a senha nova.";
    }

    private String gerarToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException("SHA-256 indisponível", impossible);
        }
    }
}
