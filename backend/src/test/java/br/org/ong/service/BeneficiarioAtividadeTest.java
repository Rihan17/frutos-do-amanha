package br.org.ong.service;

import br.org.ong.dto.request.BeneficiarioGestaoRequest;
import br.org.ong.exception.RegraNegocioException;
import br.org.ong.model.Atividade;
import br.org.ong.model.Beneficiario;
import br.org.ong.repository.AtividadeRepository;
import br.org.ong.repository.BeneficiarioRepository;
import br.org.ong.repository.ProjetoRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/* A regra de vagas, do lado de quem inscreve. Ela existe no servico e nao so
   na tela: a tela esconde a caixa de uma turma cheia, mas duas pessoas
   inscrevendo ao mesmo tempo veem telas carregadas antes da ultima vaga
   sumir. */
class BeneficiarioAtividadeTest {
    private static final String CRIANCA = "000000000000000000000003";
    private static final String TURMA = "000000000000000000000001";
    private AtividadeRepository atividades;
    private BeneficiarioRepository beneficiarios;
    private BeneficiarioService service;
    private Beneficiario crianca;

    @BeforeEach void setup() {
        atividades = mock(AtividadeRepository.class);
        beneficiarios = mock(BeneficiarioRepository.class);
        when(beneficiarios.save(any())).thenAnswer(c -> c.getArgument(0));
        crianca = new Beneficiario();
        crianca.setId(CRIANCA);
        when(beneficiarios.findById(CRIANCA)).thenReturn(Optional.of(crianca));
        service = new BeneficiarioService(beneficiarios, mock(ProjetoRepository.class), atividades);
    }

    private Atividade turma(int vagas, boolean ativa) {
        Atividade a = new Atividade();
        a.setId(TURMA);
        a.setNome("Reforço escolar");
        a.setVagas(vagas);
        a.setAtiva(ativa);
        when(atividades.findById(TURMA)).thenReturn(Optional.of(a));
        return a;
    }

    private static BeneficiarioGestaoRequest inscrever(String... ids) {
        return new BeneficiarioGestaoRequest(null, List.of(ids), null, null, null);
    }

    @Test void inscreveQuandoAindaHaVaga() {
        turma(10, true);
        when(beneficiarios.countByAtividadeIdsContainingAndAtivoIsTrue(any())).thenReturn(9L);

        Beneficiario salvo = service.atualizar(CRIANCA, inscrever(TURMA));

        assertEquals(List.of(new ObjectId(TURMA)), salvo.getAtividadeIds());
    }

    @Test void turmaCheiaRecusaQuemEstaEntrando() {
        turma(10, true);
        when(beneficiarios.countByAtividadeIdsContainingAndAtivoIsTrue(any())).thenReturn(10L);

        var erro = assertThrows(RegraNegocioException.class,
                () -> service.atualizar(CRIANCA, inscrever(TURMA)));

        assertTrue(erro.getMessage().contains("10 vagas"));
        verify(beneficiarios, never()).save(any());
    }

    /* Quem ja estava dentro continua: salvar a ficha de uma crianca de uma
       turma lotada nao pode dar erro sem ela ter mexido em nada. */
    @Test void turmaCheiaNaoExpulsaQuemJaEstavaDentro() {
        turma(10, true);
        crianca.setAtividadeIds(new ArrayList<>(List.of(new ObjectId(TURMA))));
        when(beneficiarios.countByAtividadeIdsContainingAndAtivoIsTrue(any())).thenReturn(10L);

        Beneficiario salvo = service.atualizar(CRIANCA, inscrever(TURMA));

        assertEquals(List.of(new ObjectId(TURMA)), salvo.getAtividadeIds());
    }

    /* Turma encerrada saiu da lista justamente para parar de receber gente. */
    @Test void turmaEncerradaNaoAceitaInscricaoNova() {
        turma(0, false);

        assertThrows(RegraNegocioException.class, () -> service.atualizar(CRIANCA, inscrever(TURMA)));

        verify(beneficiarios, never()).save(any());
    }

    /* Sem teto, a contagem nem precisa ser feita. */
    @Test void turmaSemTetoAceitaSempre() {
        turma(0, true);

        service.atualizar(CRIANCA, inscrever(TURMA));

        verify(beneficiarios, never()).countByAtividadeIdsContainingAndAtivoIsTrue(any());
    }

    /* Mandar a lista vazia tira a crianca de tudo, e isso nao pode esbarrar
       em nenhuma regra de vaga. */
    @Test void listaVaziaTiraDeTodasAsTurmas() {
        crianca.setAtividadeIds(new ArrayList<>(List.of(new ObjectId(TURMA))));

        Beneficiario salvo = service.atualizar(CRIANCA, inscrever());

        assertTrue(salvo.getAtividadeIds().isEmpty());
    }
}
