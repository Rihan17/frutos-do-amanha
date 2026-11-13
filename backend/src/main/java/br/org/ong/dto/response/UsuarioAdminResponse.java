package br.org.ong.dto.response;
import br.org.ong.model.Usuario; import java.time.Instant;
public record UsuarioAdminResponse(String id,String nome,String email,String telefone,String tipo,String cargo,boolean ativo,Instant dataCadastro,boolean principal) {
 public static UsuarioAdminResponse from(Usuario u, String principalEmail){return new UsuarioAdminResponse(u.getId(),u.getNome(),u.getEmail(),u.getTelefone(),u.getTipo().name(),u.getCargo(),u.isAtivo(),u.getDataCadastro(),u.getEmail()!=null&&!principalEmail.isBlank()&&u.getEmail().equalsIgnoreCase(principalEmail));}
}
