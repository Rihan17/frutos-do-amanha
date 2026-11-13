package br.org.ong.dto.request;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.*;
@JsonIgnoreProperties(ignoreUnknown = true)
public record CadastroRequest(@NotBlank String nome,@NotBlank @Email String email,@NotBlank String telefone,String cpfCnpj,@NotBlank @Size(min=8,message="A senha deve ter no mínimo 8 caracteres") String senha) {}
