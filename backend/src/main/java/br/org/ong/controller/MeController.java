package br.org.ong.controller;

import br.org.ong.dto.request.AtualizarPerfilRequest;
import br.org.ong.dto.response.UsuarioResponse;
import br.org.ong.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/me")
@PreAuthorize("hasAnyRole('COMUM', 'ADMIN')")
public class MeController {
    private final UsuarioService usuarios;
    public MeController(UsuarioService usuarios) { this.usuarios = usuarios; }
    @GetMapping public UsuarioResponse me(@AuthenticationPrincipal Jwt jwt) { return UsuarioResponse.from(usuarios.obter(jwt.getSubject())); }
    @PutMapping public UsuarioResponse atualizar(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody AtualizarPerfilRequest request) {
        return UsuarioResponse.from(usuarios.atualizarPerfil(jwt.getSubject(), request));
    }
}
