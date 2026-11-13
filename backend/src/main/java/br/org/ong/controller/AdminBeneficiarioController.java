package br.org.ong.controller;

import br.org.ong.dto.request.BeneficiarioGestaoRequest;
import br.org.ong.dto.request.DesativarBeneficiarioRequest;
import br.org.ong.dto.response.BeneficiarioResponse;
import br.org.ong.service.BeneficiarioService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/adm/beneficiarios")
@PreAuthorize("hasRole('ADMIN')")
public class AdminBeneficiarioController {
    private final BeneficiarioService service;

    public AdminBeneficiarioController(BeneficiarioService service) {
        this.service = service;
    }

    @GetMapping
    public List<BeneficiarioResponse> listar() {
        return service.listar().stream().map(BeneficiarioResponse::from).toList();
    }

    @GetMapping("/{id}")
    public BeneficiarioResponse obter(@PathVariable String id) {
        return BeneficiarioResponse.from(service.obter(id));
    }

    @PutMapping("/{id}")
    public BeneficiarioResponse atualizar(@PathVariable String id,
                                          @Valid @RequestBody BeneficiarioGestaoRequest request) {
        return BeneficiarioResponse.from(service.atualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public BeneficiarioResponse desativar(@PathVariable String id,
                                          @Valid @RequestBody DesativarBeneficiarioRequest request) {
        return BeneficiarioResponse.from(service.desativar(id, request));
    }
}
