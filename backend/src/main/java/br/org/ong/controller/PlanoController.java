package br.org.ong.controller;

import br.org.ong.dto.request.PlanoRequest;
import br.org.ong.dto.response.PlanoResponse;
import br.org.ong.service.PlanoService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/planos") @PreAuthorize("hasRole('COMUM')")
public class PlanoController {
    private final PlanoService planos;public PlanoController(PlanoService planos){this.planos=planos;}
    @PostMapping public PlanoResponse criar(@AuthenticationPrincipal Jwt jwt,@Valid @RequestBody PlanoRequest request){var checkout=planos.criar(jwt.getSubject(),request);return PlanoResponse.from(checkout.plano(),checkout.checkoutUrl());}
    @GetMapping("/meus") public List<PlanoResponse> meus(@AuthenticationPrincipal Jwt jwt){return planos.meus(jwt.getSubject()).stream().map(PlanoResponse::from).toList();}
    @PutMapping("/{id}/pausar") public PlanoResponse pausar(@PathVariable String id,@AuthenticationPrincipal Jwt jwt){return PlanoResponse.from(planos.pausar(id,jwt.getSubject()));}
    @PutMapping("/{id}/retomar") public PlanoResponse retomar(@PathVariable String id,@AuthenticationPrincipal Jwt jwt){return PlanoResponse.from(planos.retomar(id,jwt.getSubject()));}
    @PutMapping("/{id}/cancelar") public PlanoResponse cancelar(@PathVariable String id,@AuthenticationPrincipal Jwt jwt){return PlanoResponse.from(planos.cancelar(id,jwt.getSubject()));}
}
