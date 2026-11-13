package br.org.ong.controller;

import br.org.ong.dto.response.ProjetoResponse;
import br.org.ong.service.ProjetoService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/projetos")
public class ProjetoController {
    private final ProjetoService service;
    public ProjetoController(ProjetoService service) { this.service = service; }
    @GetMapping public List<ProjetoResponse> listar() { return service.ativos().stream().map(ProjetoResponse::from).toList(); }
    @GetMapping("/{slug}") public ProjetoResponse obter(@PathVariable String slug) { return ProjetoResponse.from(service.publico(slug)); }
}
