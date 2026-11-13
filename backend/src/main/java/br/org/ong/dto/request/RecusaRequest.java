package br.org.ong.dto.request;
import jakarta.validation.constraints.NotBlank;
public record RecusaRequest(@NotBlank(message="A justificativa da recusa é obrigatória") String justificativaRecusa) {}
