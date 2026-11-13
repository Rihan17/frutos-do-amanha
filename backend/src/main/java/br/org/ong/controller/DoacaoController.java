package br.org.ong.controller;

import br.org.ong.dto.request.DoacaoRequest;
import br.org.ong.dto.request.DoacaoPublicaRequest;
import br.org.ong.dto.response.DoacaoResponse;
import br.org.ong.service.DoacaoService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/doacoes")
public class DoacaoController {
    private final DoacaoService doacoes;
    public DoacaoController(DoacaoService doacoes){this.doacoes=doacoes;}
    @PostMapping @PreAuthorize("hasRole('COMUM')") public DoacaoResponse criar(@AuthenticationPrincipal Jwt jwt,@Valid @RequestBody DoacaoRequest request){var checkout=doacoes.criarUnica(jwt.getSubject(),request);return DoacaoResponse.from(checkout.doacao(),checkout.checkoutUrl());}
    @PostMapping("/publico") public DoacaoResponse criarPublica(@Valid @RequestBody DoacaoPublicaRequest request){var checkout=doacoes.criarPublica(request);return DoacaoResponse.from(checkout.doacao(),checkout.checkoutUrl());}
    @GetMapping("/minhas") @PreAuthorize("hasRole('COMUM')") public List<DoacaoResponse> minhas(@AuthenticationPrincipal Jwt jwt){return doacoes.listarMinhas(jwt.getSubject()).stream().map(DoacaoResponse::from).toList();}
}
