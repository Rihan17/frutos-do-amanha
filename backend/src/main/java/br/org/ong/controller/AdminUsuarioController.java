package br.org.ong.controller;

import br.org.ong.dto.request.CargoRequest;
import br.org.ong.dto.request.AdminCriacaoRequest;
import br.org.ong.dto.response.UsuarioAdminResponse;
import br.org.ong.service.UsuarioService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/adm/usuarios")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUsuarioController {
    private final UsuarioService usuarios;
    public AdminUsuarioController(UsuarioService usuarios) { this.usuarios = usuarios; }
    @GetMapping public List<UsuarioAdminResponse> listar() { return usuarios.listarParaAdmin(); }
    @PostMapping public UsuarioAdminResponse criar(@AuthenticationPrincipal Jwt jwt,@Valid @RequestBody AdminCriacaoRequest request) {
        return usuarios.criarAdministrador(request,jwt.getClaimAsString("email"));
    }
    @PutMapping("/{id}/promover") public UsuarioAdminResponse promover(@AuthenticationPrincipal Jwt jwt,@PathVariable String id,@Valid @RequestBody CargoRequest request) {
        return usuarios.promover(id, request.cargo(), jwt.getClaimAsString("email"));
    }
    @PutMapping("/{id}/rebaixar") public void rebaixar(@AuthenticationPrincipal Jwt jwt,@PathVariable String id) { usuarios.rebaixar(id, jwt.getClaimAsString("email")); }
}
