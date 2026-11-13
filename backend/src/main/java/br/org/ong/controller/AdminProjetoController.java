package br.org.ong.controller;

import br.org.ong.dto.request.ProjetoRequest;
import br.org.ong.dto.request.ProjetoUpdateRequest;
import br.org.ong.dto.response.ProjetoResponse;
import br.org.ong.service.ProjetoService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/adm/projetos")
@PreAuthorize("hasRole('ADMIN')")
public class AdminProjetoController {
    private final ProjetoService service;
    public AdminProjetoController(ProjetoService service) { this.service = service; }
    @GetMapping public List<ProjetoResponse> listar() { return service.todos().stream().map(ProjetoResponse::from).toList(); }
    @PostMapping public ProjetoResponse criar(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ProjetoRequest request) {
        return ProjetoResponse.from(service.criar(request, jwt.getSubject()));
    }
    @PutMapping("/{id}") public ProjetoResponse atualizar(@PathVariable String id, @Valid @RequestBody ProjetoUpdateRequest request) {
        return ProjetoResponse.from(service.atualizar(id, request));
    }
    @DeleteMapping("/{id}") public void desativar(@PathVariable String id) { service.desativar(id); }
}
