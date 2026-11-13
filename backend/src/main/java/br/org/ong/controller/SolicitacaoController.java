package br.org.ong.controller;

import br.org.ong.dto.request.SolicitacaoRequest;
import br.org.ong.dto.response.SolicitacaoResponse;
import br.org.ong.service.SolicitacaoService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/solicitacoes")
public class SolicitacaoController {
    private final SolicitacaoService solicitacoes;
    public SolicitacaoController(SolicitacaoService solicitacoes) { this.solicitacoes = solicitacoes; }

    @PostMapping
    public SolicitacaoResponse criar(@Valid @RequestBody SolicitacaoRequest request) {
        // TODO: adicionar limite de requisições por IP no formulário público.
        return SolicitacaoResponse.from(solicitacoes.criar(request));
    }
}
