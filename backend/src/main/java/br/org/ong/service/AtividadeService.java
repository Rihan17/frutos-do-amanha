package br.org.ong.service;

import br.org.ong.dto.request.AtividadeRequest;
import br.org.ong.exception.NaoEncontradoException;
import br.org.ong.exception.RegraNegocioException;
import br.org.ong.exception.ValidarId;
import br.org.ong.model.Atividade;
import br.org.ong.model.Beneficiario;
import br.org.ong.repository.AtividadeRepository;
import br.org.ong.repository.BeneficiarioRepository;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

@Service
public class AtividadeService {
    /* A semana em ordem, para a tela não depender da ordem em que a pessoa
       clicou nas caixas. Quem marca sábado antes de terça espera ver
       "terça, sábado". */
    private static final List<String> SEMANA = List.of("SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM");

    private final AtividadeRepository atividades;
    private final BeneficiarioRepository beneficiarios;

    public AtividadeService(AtividadeRepository atividades, BeneficiarioRepository beneficiarios) {
        this.atividades = atividades;
        this.beneficiarios = beneficiarios;
    }

    public List<Atividade> todas() {
        return atividades.findAll().stream()
                .sorted(Comparator.comparing(Atividade::getNome,
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .toList();
    }

    public Atividade obter(String id) {
        ValidarId.objectId(id);
        return atividades.findById(id).orElseThrow(() -> new NaoEncontradoException("Atividade não encontrada"));
    }

    /* Quantas crianças ativas ocupam vaga nesta turma. */
    public long inscritos(String id) {
        return beneficiarios.countByAtividadeIdsContainingAndAtivoIsTrue(new ObjectId(id));
    }

    /* Quem está na turma, inclusive quem já saiu da ONG: a tela mostra os
       dois, porque saber que a vaga vagou é parte do trabalho. */
    public List<Beneficiario> criancas(String id) {
        obter(id);
        return beneficiarios.findByAtividadeIdsContaining(new ObjectId(id)).stream()
                .sorted(Comparator.comparing(Beneficiario::getNome,
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .toList();
    }

    public Atividade criar(AtividadeRequest req) {
        Atividade a = new Atividade();
        aplicar(a, req);
        return atividades.save(a);
    }

    public Atividade atualizar(String id, AtividadeRequest req) {
        Atividade a = obter(id);
        aplicar(a, req);
        /* Diminuir as vagas abaixo de quem já está dentro deixaria a turma
           com um número que não descreve nada. Tirar criança é escolha da
           equipe, feita uma a uma na tela da atividade. */
        if (a.getVagas() > 0) {
            long dentro = inscritos(id);
            if (dentro > a.getVagas()) {
                throw new RegraNegocioException("A turma já tem " + dentro
                        + (dentro == 1 ? " criança inscrita" : " crianças inscritas")
                        + ". Tire alguém antes de reduzir as vagas para " + a.getVagas() + ".");
            }
        }
        return atividades.save(a);
    }

    /* Encerrar: a turma sai da lista de quem aceita inscrição, mas continua
       guardada com as crianças que passaram por ela. */
    public void desativar(String id) {
        Atividade a = obter(id);
        a.setAtiva(false);
        atividades.save(a);
    }

    /* Apagar de vez. Antes de sumir com a turma, ela sai da ficha de cada
       criança: um id solto numa lista vira uma atividade fantasma na tela,
       sem nome e sem horário, impossível de tirar depois. */
    public void excluirPermanente(String id) {
        Atividade a = obter(id);
        ObjectId oid = new ObjectId(id);
        beneficiarios.findByAtividadeIdsContaining(oid).forEach(b -> {
            List<ObjectId> restantes = b.getAtividadeIds().stream()
                    .filter(x -> !oid.equals(x)).toList();
            b.setAtividadeIds(new java.util.ArrayList<>(restantes));
            beneficiarios.save(b);
        });
        atividades.delete(a);
    }

    /* Tirar uma criança da turma, pela tela da atividade. O caminho de lá
       (marcar e desmarcar na ficha da criança) continua valendo; este existe
       porque quem organiza uma turma pensa pela turma, não por criança. */
    public void removerCrianca(String atividadeId, String beneficiarioId) {
        obter(atividadeId);
        ValidarId.objectId(beneficiarioId);
        Beneficiario b = beneficiarios.findById(beneficiarioId)
                .orElseThrow(() -> new NaoEncontradoException("Criança não encontrada"));
        ObjectId oid = new ObjectId(atividadeId);
        if (b.getAtividadeIds().stream().noneMatch(oid::equals)) {
            throw new RegraNegocioException("Esta criança não está na atividade");
        }
        b.setAtividadeIds(new java.util.ArrayList<>(b.getAtividadeIds().stream()
                .filter(x -> !oid.equals(x)).toList()));
        beneficiarios.save(b);
    }

    private void aplicar(Atividade a, AtividadeRequest req) {
        a.setNome(req.nome().trim());
        a.setDias(ordenarDias(req.dias()));
        a.setHorarioInicio(limpo(req.horarioInicio()));
        a.setHorarioFim(limpo(req.horarioFim()));
        a.setLocal(limpo(req.local()));
        a.setVagas(req.vagas() == null ? 0 : req.vagas());
        a.setObservacao(limpo(req.observacao()));
        if (req.ativa() != null) a.setAtiva(req.ativa());
        if (a.getHorarioInicio() != null && a.getHorarioFim() != null
                && a.getHorarioFim().compareTo(a.getHorarioInicio()) <= 0) {
            throw new RegraNegocioException("O horário de término precisa ser depois do de início");
        }
    }

    private static List<String> ordenarDias(List<String> dias) {
        if (dias == null) return List.of();
        return dias.stream()
                .filter(d -> d != null && !d.isBlank())
                .map(d -> d.trim().toUpperCase(Locale.ROOT))
                .distinct()
                .filter(SEMANA::contains)
                .sorted(Comparator.comparingInt(SEMANA::indexOf))
                .toList();
    }

    private static String limpo(String valor) {
        if (valor == null) return null;
        String v = valor.trim();
        return v.isEmpty() ? null : v;
    }
}
