package br.org.ong.controller;

import br.org.ong.dto.request.AdminDoacaoRequest;
import br.org.ong.dto.response.DoacaoAdminResponse;
import br.org.ong.service.DoacaoService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/adm/doacoes")
@PreAuthorize("hasRole('ADMIN')")
public class AdminDoacaoController {
    private final DoacaoService service;
    public AdminDoacaoController(DoacaoService service) { this.service = service; }
    @GetMapping public List<DoacaoAdminResponse> listar() { return service.listarParaAdmin(); }
    @PostMapping public DoacaoAdminResponse registrar(@Valid @RequestBody AdminDoacaoRequest request) {
        return service.registrarManual(request);
    }
}
