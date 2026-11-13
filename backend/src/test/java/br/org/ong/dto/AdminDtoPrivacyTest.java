package br.org.ong.dto;

import br.org.ong.dto.request.CadastroRequest;
import br.org.ong.dto.response.UsuarioAdminResponse;
import br.org.ong.model.enums.TipoUsuario;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class AdminDtoPrivacyTest {
    @Test void dtoDoAdminNaoDeclaraCamposSensiveis(){
        var names=java.util.Arrays.stream(UsuarioAdminResponse.class.getRecordComponents()).map(java.lang.reflect.RecordComponent::getName).toList();
        assertFalse(names.contains("cpfCnpj"));assertFalse(names.contains("senhaHash"));
    }
    @Test void cadastroIgnoraTentativaDeEnviarTipoAdmin() throws Exception {
        CadastroRequest request=new ObjectMapper().readValue("{\"nome\":\"X\",\"email\":\"x@x.org\",\"telefone\":\"1\",\"senha\":\"senha-boa\",\"tipo\":\"ADMIN\"}",CadastroRequest.class);
        assertEquals("senha-boa",request.senha());assertEquals(5, CadastroRequest.class.getRecordComponents().length);
    }
}
