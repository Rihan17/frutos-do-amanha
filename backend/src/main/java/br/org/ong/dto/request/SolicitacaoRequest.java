package br.org.ong.dto.request;
import jakarta.validation.Valid; import jakarta.validation.constraints.*; import java.time.LocalDate;
public record SolicitacaoRequest(@NotBlank String motivo,@NotNull @Valid SolicitanteRequest solicitante,@NotNull @Valid BeneficiarioPedidoRequest beneficiario,@NotNull @Valid ResponsavelRequest responsavel,@NotNull @Valid ConsentimentoRequest consentimento) {
 public record SolicitanteRequest(@NotBlank String nome,@NotBlank String telefone) {}
 public record BeneficiarioPedidoRequest(@NotBlank String nome,@NotNull LocalDate dataNascimento,@NotBlank String genero) {}
 /* O endereço é opcional: nem toda família sabe o CEP na hora, e barrar o
    pedido por causa disso seria pior do que receber o pedido sem endereço.
    Os nomes acompanham o que o ViaCEP devolve, que é quem preenche a maior
    parte deles no site. */
 public record ResponsavelRequest(@NotBlank String nome,@Email String email,@NotBlank String telefone,@NotBlank String parentesco,
        @Size(max=12) String cep,@Size(max=200) String endereco,@Size(max=20) String numero,
        @Size(max=80) String complemento,@Size(max=100) String bairro,@Size(max=100) String cidade,@Size(max=2) String uf) {}
 public record ConsentimentoRequest(@AssertTrue(message="O consentimento deve ser aceito") boolean aceito) {}
}
