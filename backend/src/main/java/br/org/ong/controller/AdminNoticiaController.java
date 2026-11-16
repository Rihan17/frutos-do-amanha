package br.org.ong.controller;

import br.org.ong.dto.request.NoticiaRequest;
import br.org.ong.dto.request.NoticiaUpdateRequest;
import br.org.ong.dto.response.NoticiaResponse;
import br.org.ong.service.NoticiaService;
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
@RequestMapping("/adm/noticias")
@PreAuthorize("hasRole('ADMIN')")
public class AdminNoticiaController {
    private final NoticiaService service;
    public AdminNoticiaController(NoticiaService service) { this.service = service; }

    /* A listagem sai sem o texto e sem a foto; quem vai editar busca o
       registro inteiro em /adm/noticias/{id}. */
    @GetMapping public List<NoticiaResponse> listar() {
        return service.todas().stream().map(NoticiaResponse::paraTabela).toList();
    }
    @GetMapping("/{id}") public NoticiaResponse obter(@PathVariable String id) {
        return NoticiaResponse.from(service.obter(id));
    }
    @PostMapping public NoticiaResponse criar(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody NoticiaRequest request) {
        return NoticiaResponse.from(service.criar(request, jwt.getSubject()));
    }
    @PutMapping("/{id}") public NoticiaResponse atualizar(@PathVariable String id, @Valid @RequestBody NoticiaUpdateRequest request) {
        return NoticiaResponse.from(service.atualizar(id, request));
    }
    @DeleteMapping("/{id}") public void excluir(@PathVariable String id) { service.excluir(id); }
}
