package br.org.ong.dto.response;

import br.org.ong.model.Responsavel;
import java.time.Instant;

public record ResponsavelResponse(String id, String nome, String cpf, String email, String telefone,
        String parentesco, String cep, String endereco, String numero, String complemento,
        String bairro, String cidade, String uf, String observacao, boolean ativo, Instant dataCadastro) {
    public static ResponsavelResponse from(Responsavel r) {
        return new ResponsavelResponse(r.getId(), r.getNome(), r.getCpf(), r.getEmail(), r.getTelefone(),
                r.getParentesco(), r.getCep(), r.getEndereco(), r.getNumero(), r.getComplemento(),
                r.getBairro(), r.getCidade(), r.getUf(), r.getObservacao(), r.isAtivo(), r.getDataCadastro());
    }
}
