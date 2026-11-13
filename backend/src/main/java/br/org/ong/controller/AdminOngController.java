package br.org.ong.controller;

import br.org.ong.dto.request.OngInfoRequest;
import br.org.ong.model.OngInfo;
import br.org.ong.service.OngInfoService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/adm/ong")
@PreAuthorize("hasRole('ADMIN')")
public class AdminOngController {
    private final OngInfoService service;
    public AdminOngController(OngInfoService service) { this.service = service; }
    @GetMapping public OngInfo obter() { return service.publico(); }
    @PutMapping public OngInfo atualizar(@Valid @RequestBody OngInfoRequest request) { return service.atualizar(request); }
}
