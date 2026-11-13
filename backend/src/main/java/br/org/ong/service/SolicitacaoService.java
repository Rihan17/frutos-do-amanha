package br.org.ong.service;

import br.org.ong.dto.request.SolicitacaoRequest;
import br.org.ong.exception.NaoEncontradoException;
import br.org.ong.exception.RequisicaoInvalidaException;
import br.org.ong.exception.RegraNegocioException;
import br.org.ong.exception.ValidarId;
import br.org.ong.model.Beneficiario;
import br.org.ong.model.Solicitacao;
import br.org.ong.model.Usuario;
import br.org.ong.model.embedded.*;
import br.org.ong.model.enums.StatusSolicitacao;
import br.org.ong.model.enums.TipoUsuario;
import br.org.ong.repository.BeneficiarioRepository;
import br.org.ong.repository.SolicitacaoRepository;
import br.org.ong.repository.UsuarioRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import org.bson.types.ObjectId;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

@Service
public class SolicitacaoService {
    private final SolicitacaoRepository solicitacoes;
    private final BeneficiarioRepository beneficiarios;
    private final UsuarioRepository usuarios;
    private final MongoTemplate mongo;

    public SolicitacaoService(SolicitacaoRepository solicitacoes, BeneficiarioRepository beneficiarios,
                              UsuarioRepository usuarios, MongoTemplate mongo) {
        this.solicitacoes = solicitacoes;
        this.beneficiarios = beneficiarios;
        this.usuarios = usuarios;
        this.mongo = mongo;
    }

    public Solicitacao criar(SolicitacaoRequest request) {
        if (!request.consentimento().aceito()) {
            throw new RequisicaoInvalidaException("O consentimento do responsável é obrigatório",
                    java.util.Map.of("consentimento.aceito", "O consentimento deve ser aceito"));
        }
        Solicitacao solicitacao = new Solicitacao();
        solicitacao.setMotivo(request.motivo().trim());
        solicitacao.setSolicitante(new Solicitante(request.solicitante().nome().trim(), request.solicitante().telefone().trim()));
        solicitacao.setBeneficiario(new DadosBeneficiarioSolicitacao(
                request.beneficiario().nome().trim(), request.beneficiario().dataNascimento(), request.beneficiario().genero()));
        solicitacao.setResponsavel(new DadosResponsavel(request.responsavel().nome().trim(), request.responsavel().email(),
                request.responsavel().telefone().trim(), request.responsavel().parentesco().trim()));
        solicitacao.setConsentimento(new Consentimento(true, Instant.now()));
        solicitacao.setStatus(StatusSolicitacao.PENDENTE);
        solicitacao.setDataSolicitacao(Instant.now());
        return solicitacoes.save(solicitacao);
    }

    public List<Solicitacao> listar(String status) {
        if (status == null) return solicitacoes.findAll();
        final StatusSolicitacao filtro;
        try {
            filtro = StatusSolicitacao.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new RequisicaoInvalidaException("Status inválido. Valores aceitos: PENDENTE, APROVADA, RECUSADA",
                    java.util.Map.of("status", "Valores aceitos: PENDENTE, APROVADA, RECUSADA"));
        }
        return solicitacoes.findByStatus(filtro);
    }

    public Solicitacao obter(String id) {
        ValidarId.objectId(id);
        return solicitacoes.findById(id).orElseThrow(() -> new NaoEncontradoException("Solicitação não encontrada"));
    }

    public Solicitacao aprovar(String id, String adminId) {
        ValidarId.objectId(id);
        validarAdmin(adminId);
        Solicitacao atual = obter(id);
        if (atual.getStatus() == StatusSolicitacao.APROVADA) {
            if (beneficiarios.findBySolicitacaoOrigemId(id).isPresent()) return atual;
            throw new RegraNegocioException("Solicitação aprovada sem beneficiário associado");
        }
        if (atual.getStatus() != StatusSolicitacao.PENDENTE) {
            throw new RegraNegocioException("A solicitação não está pendente");
        }

        // O índice único e a criação prévia do beneficiário tornam a repetição segura sem transação.
        beneficiarios.findBySolicitacaoOrigemId(id).orElseGet(() -> criarBeneficiario(atual, id));
        Query condicional = Query.query(Criteria.where("id").is(id).and("status").is(StatusSolicitacao.PENDENTE));
        Update update = new Update().set("status", StatusSolicitacao.APROVADA)
                .set("analise", new Analise(adminId, Instant.now()));
        Solicitacao atualizada = mongo.findAndModify(condicional, update,
                FindAndModifyOptions.options().returnNew(true), Solicitacao.class);
        if (atualizada != null) return atualizada;

        Solicitacao concorrente = obter(id);
        if (concorrente.getStatus() == StatusSolicitacao.APROVADA
                && beneficiarios.findBySolicitacaoOrigemId(id).isPresent()) return concorrente;
        throw new RegraNegocioException("A solicitação deixou de estar pendente antes da aprovação");
    }

    private Beneficiario criarBeneficiario(Solicitacao solicitacao, String id) {
        DadosBeneficiarioSolicitacao pedido = solicitacao.getBeneficiario();
        Beneficiario beneficiario = new Beneficiario();
        beneficiario.setNome(pedido.nome());
        beneficiario.setDataNascimento(pedido.dataNascimento());
        beneficiario.setGenero(pedido.genero());
        beneficiario.setResponsavel(solicitacao.getResponsavel());
        beneficiario.setSolicitacaoOrigemId(id);
        beneficiario.setDataEntrada(LocalDate.now());
        beneficiario.setAtivo(true);
        beneficiario.setProjetoIds(List.of());
        try {
            return beneficiarios.save(beneficiario);
        } catch (DuplicateKeyException e) {
            return beneficiarios.findBySolicitacaoOrigemId(id)
                    .orElseThrow(() -> e);
        }
    }

    public Solicitacao recusar(String id, String adminId, String justificativa) {
        ValidarId.objectId(id);
        validarAdmin(adminId);
        if (justificativa == null || justificativa.isBlank()) {
            throw new RequisicaoInvalidaException("A justificativa da recusa é obrigatória",
                    java.util.Map.of("justificativaRecusa", "A justificativa da recusa é obrigatória"));
        }
        Query condicional = Query.query(Criteria.where("id").is(id).and("status").is(StatusSolicitacao.PENDENTE));
        Update update = new Update().set("status", StatusSolicitacao.RECUSADA)
                .set("justificativaRecusa", justificativa.trim())
                .set("analise", new Analise(adminId, Instant.now()));
        Solicitacao atualizada = mongo.findAndModify(condicional, update,
                FindAndModifyOptions.options().returnNew(true), Solicitacao.class);
        if (atualizada == null) {
            obter(id);
            throw new RegraNegocioException("A solicitação não está pendente");
        }
        return atualizada;
    }

    public void excluir(String id) {
        ValidarId.objectId(id);
        Query permitida = Query.query(Criteria.where("id").is(id)
                .and("status").in(StatusSolicitacao.PENDENTE, StatusSolicitacao.RECUSADA));
        if (mongo.remove(permitida, Solicitacao.class).getDeletedCount() == 0) {
            Solicitacao atual = obter(id);
            throw new RegraNegocioException(atual.getStatus() == StatusSolicitacao.APROVADA
                    ? "Solicitações aprovadas não podem ser excluídas" : "A solicitação não pode ser excluída");
        }
    }

    private Usuario validarAdmin(String id) {
        ValidarId.objectId(id);
        Usuario admin = usuarios.findById(id).orElseThrow(() -> new NaoEncontradoException("Administrador não encontrado"));
        if (!admin.isAtivo() || admin.getTipo() != TipoUsuario.ADMIN) {
            throw new RegraNegocioException("A análise exige um administrador ativo");
        }
        return admin;
    }
}
