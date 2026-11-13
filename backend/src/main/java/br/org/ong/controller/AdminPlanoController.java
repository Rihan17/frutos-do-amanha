package br.org.ong.controller;
import br.org.ong.dto.response.PlanoAdminResponse; import br.org.ong.service.PlanoService; import java.util.List; import org.springframework.security.access.prepost.PreAuthorize; import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/adm/planos") @PreAuthorize("hasRole('ADMIN')") public class AdminPlanoController {private final PlanoService service;public AdminPlanoController(PlanoService service){this.service=service;}@GetMapping public List<PlanoAdminResponse> listar(){return service.listarParaAdmin();}}
