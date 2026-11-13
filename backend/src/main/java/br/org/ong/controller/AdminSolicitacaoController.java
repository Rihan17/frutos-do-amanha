package br.org.ong.controller;

import br.org.ong.dto.request.RecusaRequest;
import br.org.ong.dto.request.SolicitacaoRequest;
import br.org.ong.dto.response.SolicitacaoResponse;
import br.org.ong.service.SolicitacaoService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/adm/solicitacoes")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSolicitacaoController {
    private final SolicitacaoService solicitacoes;
    public AdminSolicitacaoController(SolicitacaoService solicitacoes) { this.solicitacoes = solicitacoes; }
    @GetMapping public List<SolicitacaoResponse> listar(@RequestParam(required = false) String status) {
        return solicitacoes.listar(status).stream().map(SolicitacaoResponse::from).toList();
    }
    @GetMapping("/{id}") public SolicitacaoResponse obter(@PathVariable String id) {
        return SolicitacaoResponse.from(solicitacoes.obter(id));
    }
    @PostMapping public SolicitacaoResponse criar(@Valid @RequestBody SolicitacaoRequest request) {
        return SolicitacaoResponse.from(solicitacoes.criar(request));
    }
    @PutMapping("/{id}/aprovar") public SolicitacaoResponse aprovar(@PathVariable String id,@AuthenticationPrincipal Jwt jwt) {
        return SolicitacaoResponse.from(solicitacoes.aprovar(id, jwt.getSubject()));
    }
    @PutMapping("/{id}/recusar") public SolicitacaoResponse recusar(@PathVariable String id,@AuthenticationPrincipal Jwt jwt,@Valid @RequestBody RecusaRequest request) {
        return SolicitacaoResponse.from(solicitacoes.recusar(id, jwt.getSubject(), request.justificativaRecusa()));
    }
    @DeleteMapping("/{id}") public void excluir(@PathVariable String id) { solicitacoes.excluir(id); }
}
