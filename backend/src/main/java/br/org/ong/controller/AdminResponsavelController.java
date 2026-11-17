package br.org.ong.controller;

import br.org.ong.dto.request.ResponsavelCadastroRequest;
import br.org.ong.dto.response.ResponsavelResponse;
import br.org.ong.service.ResponsavelService;
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

/* Responsáveis cadastrados pela equipe. Os que vieram de uma solicitação
   aprovada continuam dentro do beneficiário, e o painel junta as duas
   origens na mesma lista. */
@RestController
@RequestMapping("/adm/responsaveis")
@PreAuthorize("hasRole('ADMIN')")
public class AdminResponsavelController {
    private final ResponsavelService service;
    public AdminResponsavelController(ResponsavelService service) { this.service = service; }

    @GetMapping public List<ResponsavelResponse> listar() {
        return service.todos().stream().map(ResponsavelResponse::from).toList();
    }
    @GetMapping("/{id}") public ResponsavelResponse obter(@PathVariable String id) {
        return ResponsavelResponse.from(service.obter(id));
    }
    @PostMapping public ResponsavelResponse criar(@AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ResponsavelCadastroRequest request) {
        return ResponsavelResponse.from(service.criar(request, jwt.getSubject()));
    }
    @PutMapping("/{id}") public ResponsavelResponse atualizar(@PathVariable String id,
            @Valid @RequestBody ResponsavelCadastroRequest request) {
        return ResponsavelResponse.from(service.atualizar(id, request));
    }
    @DeleteMapping("/{id}") public void desativar(@PathVariable String id) { service.desativar(id); }

    /* Duas saídas, dois endereços. O DELETE de cima encerra: o cadastro sai
       da lista ativa e continua guardado. Este apaga, e por isso tem caminho
       próprio — ninguém cai nele por engano. */
    @DeleteMapping("/{id}/permanente") public void excluirPermanente(@PathVariable String id) {
        service.excluirPermanente(id);
    }
}
