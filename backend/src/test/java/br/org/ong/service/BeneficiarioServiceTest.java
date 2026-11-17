package br.org.ong.service;

import br.org.ong.dto.request.DesativarBeneficiarioRequest;
import br.org.ong.exception.NaoEncontradoException;
import br.org.ong.model.Beneficiario;
import br.org.ong.repository.BeneficiarioRepository;
import br.org.ong.repository.ProjetoRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/* As duas saidas de uma crianca sao coisas diferentes, e o painel mostra as
   duas lado a lado. Encerrar guarda a data e o motivo; excluir apaga. Trocar
   uma pela outra por engano no codigo custaria o historico de quem passou
   pela ONG, entao os testes prendem cada uma no seu lugar. */
class BeneficiarioServiceTest {
    private static final String ID = "000000000000000000000001";

    private static BeneficiarioService comRepositorio(BeneficiarioRepository repo) {
        return new BeneficiarioService(repo, mock(ProjetoRepository.class),
                mock(br.org.ong.repository.AtividadeRepository.class));
    }

    @Test void exclusaoPermanenteApagaOCadastro() {
        var repo = mock(BeneficiarioRepository.class);
        Beneficiario b = new Beneficiario();
        b.setId(ID);
        when(repo.findById(ID)).thenReturn(Optional.of(b));

        comRepositorio(repo).excluirPermanente(ID);

        verify(repo).delete(b);
    }

    @Test void exclusaoPermanenteDeCadastroInexistenteNaoApagaNada() {
        var repo = mock(BeneficiarioRepository.class);
        when(repo.findById(ID)).thenReturn(Optional.empty());
        var service = comRepositorio(repo);

        assertThrows(NaoEncontradoException.class, () -> service.excluirPermanente(ID));

        verify(repo, never()).delete(any());
    }

    /* Encerrar e o caminho de sempre: a crianca deixa de ser atendida, mas
       continua na lista, com a data e o motivo da saida. */
    @Test void encerrarGuardaDataEMotivoEmVezDeApagar() {
        var repo = mock(BeneficiarioRepository.class);
        Beneficiario b = new Beneficiario();
        b.setId(ID);
        b.setAtivo(true);
        when(repo.findById(ID)).thenReturn(Optional.of(b));
        when(repo.save(any())).thenAnswer(chamada -> chamada.getArgument(0));

        Beneficiario saiu = comRepositorio(repo)
                .desativar(ID, new DesativarBeneficiarioRequest("A familia mudou de cidade."));

        assertFalse(saiu.isAtivo());
        assertEquals("A familia mudou de cidade.", saiu.getMotivoSaida());
        assertNotNull(saiu.getDataSaida());
        verify(repo, never()).delete(any());
    }
}
