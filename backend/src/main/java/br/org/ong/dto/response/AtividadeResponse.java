package br.org.ong.dto.response;

import br.org.ong.model.Atividade;
import java.time.Instant;
import java.util.List;

/* inscritos e vagasLivres não moram na atividade: são contados na hora, a
   partir das crianças. Guardá-los no documento daria duas versões do mesmo
   número, e a errada seria descoberta no dia em que a turma lotasse.

   vagasLivres é null quando a turma não tem teto (vagas = 0), e não zero:
   zero é turma cheia, e a tela precisa saber a diferença. */
public record AtividadeResponse(String id, String nome, List<String> dias, String horarioInicio,
        String horarioFim, String local, int vagas, String observacao, boolean ativa,
        Instant dataCadastro, long inscritos, Integer vagasLivres) {

    public static AtividadeResponse from(Atividade a, long inscritos) {
        Integer livres = a.getVagas() > 0 ? Math.max(0, a.getVagas() - (int) inscritos) : null;
        return new AtividadeResponse(a.getId(), a.getNome(), a.getDias(), a.getHorarioInicio(),
                a.getHorarioFim(), a.getLocal(), a.getVagas(), a.getObservacao(), a.isAtiva(),
                a.getDataCadastro(), inscritos, livres);
    }
}
