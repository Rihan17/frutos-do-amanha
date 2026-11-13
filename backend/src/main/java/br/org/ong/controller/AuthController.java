package br.org.ong.controller;

import br.org.ong.dto.request.LoginRequest;
import br.org.ong.dto.request.AlterarSenhaRequest;
import br.org.ong.dto.request.ForgotPasswordRequest;
import br.org.ong.dto.request.ResetPasswordRequest;
import br.org.ong.dto.response.AuthResponse;
import br.org.ong.dto.response.MessageResponse;
import br.org.ong.service.AuthService;
import br.org.ong.service.PasswordResetService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthService auth;
    private final PasswordResetService passwordReset;
    public AuthController(AuthService auth, PasswordResetService passwordReset) {
        this.auth = auth;
        this.passwordReset = passwordReset;
    }
    @PostMapping("/login") public AuthResponse login(@Valid @RequestBody LoginRequest request) { return auth.login(request); }
    @PostMapping("/esqueci-senha")
    public ResponseEntity<MessageResponse> solicitarRecuperacao(@Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.accepted().body(new MessageResponse(passwordReset.solicitar(request.email())));
    }
    @PostMapping("/redefinir-senha")
    public MessageResponse redefinirSenha(@Valid @RequestBody ResetPasswordRequest request) {
        return new MessageResponse(passwordReset.redefinir(request));
    }

    @PutMapping("/alterar-senha")
    public MessageResponse alterarSenha(@AuthenticationPrincipal Jwt jwt,
                                        @Valid @RequestBody AlterarSenhaRequest request) {
        return new MessageResponse(auth.alterarSenha(jwt.getSubject(), request));
    }
}
