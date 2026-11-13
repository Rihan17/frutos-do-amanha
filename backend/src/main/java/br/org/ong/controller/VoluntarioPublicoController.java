package br.org.ong.controller;

import br.org.ong.dto.request.VoluntarioPublicoRequest;
import br.org.ong.dto.response.VoluntarioResponse;
import br.org.ong.service.VoluntarioService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/voluntarios/publico")
public class VoluntarioPublicoController {
    private final VoluntarioService service;
    public VoluntarioPublicoController(VoluntarioService service) { this.service = service; }
    @PostMapping
    public VoluntarioResponse inscrever(@Valid @RequestBody VoluntarioPublicoRequest request) {
        return VoluntarioResponse.from(service.inscreverPublico(request));
    }
}
