package br.org.ong.service;

import br.org.ong.dto.request.AtividadeRequest;
import br.org.ong.exception.RegraNegocioException;
import br.org.ong.model.Atividade;
import br.org.ong.model.Beneficiario;
import br.org.ong.repository.AtividadeRepository;
import br.org.ong.repository.BeneficiarioRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AtividadeServiceTest {
    private static final String TURMA = "000000000000000000000001";
    private AtividadeRepository atividades;
    private BeneficiarioRepository beneficiarios;
    private AtividadeService service;

    @BeforeEach void setup() {
        atividades = mock(AtividadeRepository.class);
        beneficiarios = mock(BeneficiarioRepository.class);
        when(atividades.save(any())).thenAnswer(c -> c.getArgument(0));
        when(beneficiarios.save(any())).thenAnswer(c -> c.getArgument(0));
        service = new AtividadeService(atividades, beneficiarios);
    }

    private static AtividadeRequest pedido(List<String> dias, String inicio, String fim, Integer vagas) {
        return new AtividadeRequest("Reforço escolar", dias, inicio, fim, "Sede", vagas, null, null);
    }

    /* A pessoa marca as caixas na ordem que quiser; a semana tem a sua. */
    @Test void osDiasSaemNaOrdemDaSemanaESemRepetir() {
        Atividade a = service.criar(pedido(List.of("SAB", "TER", "SEG", "TER"), "14:00", "16:00", 20));
        assertEquals(List.of("SEG", "TER", "SAB"), a.getDias());
    }

    @Test void horarioDeTerminoAntesDoInicioERecusado() {
        assertThrows(RegraNegocioException.class,
                () -> service.criar(pedido(List.of("SEG"), "16:00", "14:00", 10)));
        assertThrows(RegraNegocioException.class,
                () -> service.criar(pedido(List.of("SEG"), "14:00", "14:00", 10)));
    }

    /* Sem vagas informadas a turma fica sem teto, e não com teto zero: zero
       seria turma cheia desde o primeiro dia. */
    @Test void semVagasInformadasATurmaFicaSemTeto() {
        assertEquals(0, service.criar(pedido(List.of("SEG"), null, null, null)).getVagas());
    }

    /* Reduzir as vagas abaixo de quem já está dentro deixaria a turma com um
       número que não descreve nada. */
    @Test void naoReduzAsVagasAbaixoDeQuemJaEstaDentro() {
        Atividade a = new Atividade();
        a.setId(TURMA);
        a.setNome("Reforço escolar");
        when(atividades.findById(TURMA)).thenReturn(Optional.of(a));
        when(beneficiarios.countByAtividadeIdsContainingAndAtivoIsTrue(any())).thenReturn(8L);

        var erro = assertThrows(RegraNegocioException.class,
                () -> service.atualizar(TURMA, pedido(List.of("SEG"), "14:00", "16:00", 5)));

        assertTrue(erro.getMessage().contains("8"));
        verify(atividades, never()).save(any());
    }

    /* Apagar a turma sem limpar a ficha das crianças deixaria um id solto na
       lista delas: uma atividade fantasma na tela, sem nome nem horário, e
       impossível de tirar depois. */
    @Test void exclusaoPermanenteTiraATurmaDaFichaDeCadaCrianca() {
        ObjectId oid = new ObjectId(TURMA);
        ObjectId outra = new ObjectId("000000000000000000000002");
        Atividade a = new Atividade();
        a.setId(TURMA);
        when(atividades.findById(TURMA)).thenReturn(Optional.of(a));
        Beneficiario b = new Beneficiario();
        b.setId("000000000000000000000003");
        b.setAtividadeIds(new ArrayList<>(List.of(oid, outra)));
        when(beneficiarios.findByAtividadeIdsContaining(oid)).thenReturn(List.of(b));

        service.excluirPermanente(TURMA);

        assertEquals(List.of(outra), b.getAtividadeIds());
        verify(beneficiarios).save(b);
        verify(atividades).delete(a);
    }

    @Test void tirarCriancaQueNaoEstaNaTurmaAvisaEmVezDeFingirSucesso() {
        Atividade a = new Atividade();
        a.setId(TURMA);
        when(atividades.findById(TURMA)).thenReturn(Optional.of(a));
        Beneficiario b = new Beneficiario();
        b.setId("000000000000000000000003");
        when(beneficiarios.findById(b.getId())).thenReturn(Optional.of(b));

        assertThrows(RegraNegocioException.class, () -> service.removerCrianca(TURMA, b.getId()));

        verify(beneficiarios, never()).save(any());
    }
}
