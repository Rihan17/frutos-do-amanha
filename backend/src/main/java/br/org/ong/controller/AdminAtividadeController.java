package br.org.ong.controller;

import br.org.ong.dto.request.AtividadeRequest;
import br.org.ong.dto.response.AtividadeResponse;
import br.org.ong.dto.response.BeneficiarioResponse;
import br.org.ong.model.Atividade;
import br.org.ong.service.AtividadeService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/* Turmas: dia, horário e vagas. Só o painel enxerga isto — o que o site
   mostra ao público são os projetos, que têm controlador próprio. */
@RestController
@RequestMapping("/adm/atividades")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAtividadeController {
    private final AtividadeService service;

    public AdminAtividadeController(AtividadeService service) { this.service = service; }

    @GetMapping public List<AtividadeResponse> listar() {
        return service.todas().stream().map(this::comContagem).toList();
    }

    @GetMapping("/{id}") public AtividadeResponse obter(@PathVariable String id) {
        return comContagem(service.obter(id));
    }

    @GetMapping("/{id}/criancas") public List<BeneficiarioResponse> criancas(@PathVariable String id) {
        return service.criancas(id).stream().map(BeneficiarioResponse::from).toList();
    }

    @PostMapping public AtividadeResponse criar(@Valid @RequestBody AtividadeRequest request) {
        return comContagem(service.criar(request));
    }

    @PutMapping("/{id}") public AtividadeResponse atualizar(@PathVariable String id,
            @Valid @RequestBody AtividadeRequest request) {
        return comContagem(service.atualizar(id, request));
    }

    /* Duas saídas, dois endereços, como nas outras telas. Este encerra: a
       turma para de aceitar inscrição e continua guardada. */
    @DeleteMapping("/{id}") public void desativar(@PathVariable String id) { service.desativar(id); }

    @DeleteMapping("/{id}/permanente") public void excluirPermanente(@PathVariable String id) {
        service.excluirPermanente(id);
    }

    @DeleteMapping("/{id}/criancas/{beneficiarioId}") public void removerCrianca(
            @PathVariable String id, @PathVariable String beneficiarioId) {
        service.removerCrianca(id, beneficiarioId);
    }

    private AtividadeResponse comContagem(Atividade a) {
        return AtividadeResponse.from(a, service.inscritos(a.getId()));
    }
}
