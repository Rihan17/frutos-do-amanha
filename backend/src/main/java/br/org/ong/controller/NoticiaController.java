package br.org.ong.controller;

import br.org.ong.dto.response.NoticiaResponse;
import br.org.ong.service.NoticiaService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/noticias")
public class NoticiaController {
    private final NoticiaService service;
    public NoticiaController(NoticiaService service) { this.service = service; }

    @GetMapping public List<NoticiaResponse> listar() {
        return service.publicadas().stream().map(NoticiaResponse::resumida).toList();
    }
    @GetMapping("/{slug}") public NoticiaResponse obter(@PathVariable String slug) {
        return NoticiaResponse.from(service.publica(slug));
    }
}
