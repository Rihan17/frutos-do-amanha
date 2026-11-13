package br.org.ong.dto.request;
import jakarta.validation.constraints.*;
public record AtualizarPerfilRequest(@NotBlank String nome,@NotBlank @Email String email,@NotBlank String telefone,String cpfCnpj) {}
