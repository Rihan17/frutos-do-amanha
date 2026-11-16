package br.org.ong.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/* Cadastro de responsavel feito pela equipe, no painel. Nome distinto do
   SolicitacaoRequest.ResponsavelRequest de proposito: aquele e o responsavel
   que vem dentro de um pedido de vaga, e os dois nao tem os mesmos campos. */
public record ResponsavelCadastroRequest(
        @NotBlank @Size(max = 160) String nome,
        @Size(max = 14) String cpf,
        @Email @Size(max = 160) String email,
        @NotBlank @Size(max = 30) String telefone,
        @Size(max = 40) String parentesco,
        @Size(max = 12) String cep,
        @Size(max = 200) String endereco,
        @Size(max = 20) String numero,
        @Size(max = 80) String complemento,
        @Size(max = 100) String bairro,
        @Size(max = 100) String cidade,
        @Size(max = 2) String uf,
        @Size(max = 1000) String observacao,
        Boolean ativo) {}
