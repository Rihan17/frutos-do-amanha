package br.org.ong.controller;

import br.org.ong.dto.request.ObservacaoVoluntarioRequest;
import br.org.ong.dto.request.RecusaRequest;
import br.org.ong.dto.request.VoluntarioRequest;
import br.org.ong.dto.response.VoluntarioResponse;
import br.org.ong.service.VoluntarioService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/adm/voluntarios")
@PreAuthorize("hasRole('ADMIN')")
public class AdminVoluntarioController {
    private final VoluntarioService service;

    public AdminVoluntarioController(VoluntarioService service) {
        this.service = service;
    }

    @GetMapping
    public List<VoluntarioResponse> listar(@RequestParam(required = false) String status) {
        return service.listar(status).stream().map(VoluntarioResponse::from).toList();
    }

    @PostMapping
    public VoluntarioResponse criar(@AuthenticationPrincipal Jwt jwt,
                                    @Valid @RequestBody VoluntarioRequest request) {
        return VoluntarioResponse.from(service.inscrever(jwt.getSubject(), request.projetoId(), false,
                request.observacao()));
    }

    @PutMapping("/{id}")
    public VoluntarioResponse atualizar(@PathVariable String id,
                                        @Valid @RequestBody ObservacaoVoluntarioRequest request) {
        return VoluntarioResponse.from(service.atualizarObservacao(id, request));
    }

    @PutMapping("/{id}/aprovar")
    public VoluntarioResponse aprovar(@PathVariable String id, @AuthenticationPrincipal Jwt jwt) {
        return VoluntarioResponse.from(service.aprovar(id, jwt.getSubject()));
    }

    @PutMapping("/{id}/recusar")
    public VoluntarioResponse recusar(@PathVariable String id, @AuthenticationPrincipal Jwt jwt,
                                      @Valid @RequestBody RecusaRequest request) {
        return VoluntarioResponse.from(service.recusar(id, jwt.getSubject(), request.justificativaRecusa()));
    }

    @PutMapping("/{id}/encerrar")
    public VoluntarioResponse encerrar(@PathVariable String id) {
        return VoluntarioResponse.from(service.encerrarAdmin(id));
    }

    @DeleteMapping("/{id}")
    public void excluir(@PathVariable String id) {
        service.excluir(id);
    }
}
