package br.org.ong.service;

import br.org.ong.dto.request.ResponsavelCadastroRequest;
import br.org.ong.exception.NaoEncontradoException;
import br.org.ong.exception.RegraNegocioException;
import br.org.ong.model.Responsavel;
import br.org.ong.repository.ResponsavelRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class ResponsavelServiceTest {
    private static final String ADMIN = "000000000000000000000001";
    private ResponsavelRepository repo;
    private ResponsavelService service;

    @BeforeEach void setup() {
        repo = mock(ResponsavelRepository.class);
        when(repo.findByCpf(anyString())).thenReturn(Optional.empty());
        when(repo.save(any())).thenAnswer(c -> c.getArgument(0));
        service = new ResponsavelService(repo);
    }

    private static ResponsavelCadastroRequest pedido(String nome, String cpf) {
        return new ResponsavelCadastroRequest(nome, cpf, "f@example.org", "13999990000", "Mãe",
                "11345-230", "Rua Geralda Martins de Oliveira", "355", "  ",
                "Vila Matias", "São Vicente", "sp", null, null);
    }

    @Test void cadastroGuardaEnderecoENormaliza() {
        Responsavel r = service.criar(pedido("Fernanda Oliveira", "111.444.777-35"), ADMIN);
        assertEquals("Fernanda Oliveira", r.getNome());
        assertEquals("11144477735", r.getCpf(), "o CPF é guardado só com números");
        assertEquals("SP", r.getUf(), "a UF fica em maiúsculas");
        assertNull(r.getComplemento(), "campo só com espaços vira null");
        assertEquals("Vila Matias", r.getBairro());
        assertTrue(r.isAtivo(), "nasce ativo");
        assertEquals(ADMIN, r.getAdminId());
    }

    /* A mascara da tela nao pode criar dois cadastros da mesma pessoa:
       "111.444.777-35" e "11144477735" tem de bater um com o outro. */
    @Test void cpfRepetidoEBarradoMesmoComMascaraDiferente() {
        Responsavel existente = new Responsavel();
        existente.setId("000000000000000000000009");
        existente.setNome("Fernanda Oliveira");
        existente.setCpf("11144477735");
        when(repo.findByCpf("11144477735")).thenReturn(Optional.of(existente));

        RegraNegocioException erro = assertThrows(RegraNegocioException.class,
                () -> service.criar(pedido("Fernanda O.", "111.444.777-35"), ADMIN));
        assertTrue(erro.getMessage().contains("Fernanda Oliveira"),
                "o recado diz de quem é o cadastro que já existe");
        verify(repo, never()).save(any());
    }

    /* Sem CPF nao da para saber se e a mesma pessoa: duas Marias Silva
       diferentes existem, e barrar por nome impediria a segunda. */
    @Test void semCpfOCadastroPassa() {
        assertNotNull(service.criar(pedido("Maria Silva", null), ADMIN));
        assertNotNull(service.criar(pedido("Maria Silva", "   "), ADMIN));
        verify(repo, times(2)).save(any());
    }

    @Test void desativarNaoApaga() {
        Responsavel r = new Responsavel();
        r.setId("000000000000000000000005");
        r.setNome("Fernanda");
        when(repo.findById(r.getId())).thenReturn(Optional.of(r));
        service.desativar(r.getId());
        assertFalse(r.isAtivo());
        verify(repo).save(r);
        verify(repo, never()).delete(any());
    }

    @Test void atualizarSemMudarOCpfNaoAcusaRepeticao() {
        Responsavel r = new Responsavel();
        r.setId("000000000000000000000006");
        r.setCpf("11144477735");
        when(repo.findById(r.getId())).thenReturn(Optional.of(r));
        when(repo.findByCpf("11144477735")).thenReturn(Optional.of(r));
        Responsavel salvo = service.atualizar(r.getId(), pedido("Fernanda Oliveira", "111.444.777-35"));
        assertEquals("Fernanda Oliveira", salvo.getNome());
    }

    @Test void obterInexistenteDa404() {
        when(repo.findById("000000000000000000000007")).thenReturn(Optional.empty());
        assertThrows(NaoEncontradoException.class, () -> service.obter("000000000000000000000007"));
    }
}
