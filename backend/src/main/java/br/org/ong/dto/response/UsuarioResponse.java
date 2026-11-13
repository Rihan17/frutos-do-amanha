package br.org.ong.dto.response;
import br.org.ong.model.Usuario; import java.time.Instant;
public record UsuarioResponse(String id,String nome,String email,String telefone,String cpfCnpj,String tipo,String cargo,boolean ativo,Instant dataCadastro) {
 public static UsuarioResponse from(Usuario u){return new UsuarioResponse(u.getId(),u.getNome(),u.getEmail(),u.getTelefone(),u.getCpfCnpj(),u.getTipo().name(),u.getCargo(),u.isAtivo(),u.getDataCadastro());}
}
