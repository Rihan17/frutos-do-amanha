package br.org.ong.dto.request;
import jakarta.validation.Valid; import jakarta.validation.constraints.*; import java.time.LocalDate;
public record SolicitacaoRequest(@NotBlank String motivo,@NotNull @Valid SolicitanteRequest solicitante,@NotNull @Valid BeneficiarioPedidoRequest beneficiario,@NotNull @Valid ResponsavelRequest responsavel,@NotNull @Valid ConsentimentoRequest consentimento) {
 public record SolicitanteRequest(@NotBlank String nome,@NotBlank String telefone) {}
 public record BeneficiarioPedidoRequest(@NotBlank String nome,@NotNull LocalDate dataNascimento,@NotBlank String genero) {}
 public record ResponsavelRequest(@NotBlank String nome,@Email String email,@NotBlank String telefone,@NotBlank String parentesco) {}
 public record ConsentimentoRequest(@AssertTrue(message="O consentimento deve ser aceito") boolean aceito) {}
}
