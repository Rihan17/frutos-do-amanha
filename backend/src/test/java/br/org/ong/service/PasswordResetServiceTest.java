package br.org.ong.service;

import br.org.ong.dto.request.ResetPasswordRequest;
import br.org.ong.exception.RequisicaoInvalidaException;
import br.org.ong.model.PasswordResetToken;
import br.org.ong.model.Usuario;
import br.org.ong.repository.PasswordResetTokenRepository;
import br.org.ong.repository.UsuarioRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.crypto.password.PasswordEncoder;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import org.mockito.ArgumentCaptor;

class PasswordResetServiceTest {
    @Test void emailDesconhecidoRecebeRespostaGenericaSemCriarToken() {
        UsuarioRepository users = mock(UsuarioRepository.class);
        PasswordResetTokenRepository tokens = mock(PasswordResetTokenRepository.class);
        MongoTemplate mongo = mock(MongoTemplate.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        PasswordResetEmailService email = mock(PasswordResetEmailService.class);
        when(users.findByEmailIgnoreCase("nao-existe@example.org")).thenReturn(Optional.empty());
        PasswordResetService service = new PasswordResetService(users, tokens, mongo, encoder, email, 60);

        String response = service.solicitar(" NAO-EXISTE@example.org ");

        assertEquals("Se existir uma conta com esse e-mail, o link de recuperação será enviado.", response);
        verify(tokens, never()).save(any());
        verify(email, never()).sendPasswordReset(any(), any(), any(), anyLong());
    }

    @Test void tokenEnviadoEhAleatorioEArmazenadoSomenteComoHash() {
        UsuarioRepository users = mock(UsuarioRepository.class);
        PasswordResetTokenRepository tokens = mock(PasswordResetTokenRepository.class);
        MongoTemplate mongo = mock(MongoTemplate.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        PasswordResetEmailService email = mock(PasswordResetEmailService.class);
        Usuario user = new Usuario();
        user.setId("000000000000000000000001");
        user.setNome("Ana Exemplo");
        user.setEmail("ana@example.org");
        when(users.findByEmailIgnoreCase("ana@example.org")).thenReturn(Optional.of(user));
        when(tokens.save(any())).thenAnswer(call -> {
            PasswordResetToken token = call.getArgument(0);
            token.setId("000000000000000000000002");
            return token;
        });
        PasswordResetService service = new PasswordResetService(users, tokens, mongo, encoder, email, 60);

        String response = service.solicitar("ANA@example.org");

        ArgumentCaptor<PasswordResetToken> tokenCaptor = ArgumentCaptor.forClass(PasswordResetToken.class);
        ArgumentCaptor<String> rawTokenCaptor = ArgumentCaptor.forClass(String.class);
        verify(tokens).save(tokenCaptor.capture());
        verify(email).sendPasswordReset(eq("ana@example.org"), eq("Ana Exemplo"), rawTokenCaptor.capture(), eq(60L));
        String rawToken = rawTokenCaptor.getValue();
        PasswordResetToken stored = tokenCaptor.getValue();
        assertEquals("Se existir uma conta com esse e-mail, o link de recuperação será enviado.", response);
        assertNotEquals(rawToken, stored.getTokenHash());
        assertTrue(rawToken.matches("[A-Za-z0-9_-]{43}"));
        assertTrue(stored.getExpiraEm().isAfter(Instant.now().plus(59, ChronoUnit.MINUTES)));
        assertTrue(stored.getExpiraEm().isBefore(Instant.now().plus(61, ChronoUnit.MINUTES)));
    }

    @Test void tokenValidoTrocaHashDaSenhaEInvalidaOutrosTokens() {
        UsuarioRepository users = mock(UsuarioRepository.class);
        PasswordResetTokenRepository tokens = mock(PasswordResetTokenRepository.class);
        MongoTemplate mongo = mock(MongoTemplate.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        PasswordResetEmailService email = mock(PasswordResetEmailService.class);
        PasswordResetToken stored = new PasswordResetToken();
        stored.setUsuarioId("000000000000000000000001");
        Usuario user = new Usuario();
        user.setId(stored.getUsuarioId());
        user.setSenhaHash("hash-antigo");
        when(mongo.findAndRemove(any(Query.class), eq(PasswordResetToken.class))).thenReturn(stored);
        when(users.findById(stored.getUsuarioId())).thenReturn(Optional.of(user));
        when(encoder.encode("senha-nova-segura")).thenReturn("hash-novo");
        PasswordResetService service = new PasswordResetService(users, tokens, mongo, encoder, email, 60);

        String response = service.redefinir(new ResetPasswordRequest("token-valido", "senha-nova-segura"));

        assertEquals("Senha redefinida. Entre novamente com a senha nova.", response);
        assertEquals("hash-novo", user.getSenhaHash());
        verify(users).save(user);
        verify(tokens).deleteByUsuarioId(user.getId());
    }

    @Test void tokenInexistenteEhRejeitado() {
        UsuarioRepository users = mock(UsuarioRepository.class);
        PasswordResetTokenRepository tokens = mock(PasswordResetTokenRepository.class);
        MongoTemplate mongo = mock(MongoTemplate.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        PasswordResetEmailService email = mock(PasswordResetEmailService.class);
        when(mongo.findAndRemove(any(Query.class), eq(PasswordResetToken.class))).thenReturn(null);
        PasswordResetService service = new PasswordResetService(users, tokens, mongo, encoder, email, 60);

        assertThrows(RequisicaoInvalidaException.class,
                () -> service.redefinir(new ResetPasswordRequest("token-invalido", "senha-nova-segura")));
        verify(users, never()).save(any());
    }
}
