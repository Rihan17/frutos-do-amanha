package br.org.ong.service;

import br.org.ong.dto.request.ObservacaoVoluntarioRequest;
import br.org.ong.dto.request.VoluntarioPublicoRequest;
import br.org.ong.exception.NaoEncontradoException;
import br.org.ong.exception.RequisicaoInvalidaException;
import br.org.ong.exception.RegraNegocioException;
import br.org.ong.exception.ValidarId;
import br.org.ong.model.Projeto;
import br.org.ong.model.Usuario;
import br.org.ong.model.Voluntario;
import br.org.ong.model.embedded.Analise;
import br.org.ong.model.enums.StatusVoluntario;
import br.org.ong.model.enums.TipoUsuario;
import br.org.ong.repository.ProjetoRepository;
import br.org.ong.repository.UsuarioRepository;
import br.org.ong.repository.VoluntarioRepository;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

@Service
public class VoluntarioService {
    private final VoluntarioRepository voluntarios;private final ProjetoRepository projetos;private final UsuarioRepository usuarios;private final MongoTemplate mongo;
    public VoluntarioService(VoluntarioRepository voluntarios,ProjetoRepository projetos,UsuarioRepository usuarios,MongoTemplate mongo){this.voluntarios=voluntarios;this.projetos=projetos;this.usuarios=usuarios;this.mongo=mongo;}

    public Voluntario inscrever(String usuarioId,String projetoId,boolean comumObrigatorio){
        return inscrever(usuarioId, projetoId, comumObrigatorio, null);
    }

    public Voluntario inscrever(String usuarioId,String projetoId,boolean comumObrigatorio,String observacao){
        ValidarId.objectId(usuarioId);ValidarId.objectId(projetoId);
        Usuario usuario=usuarios.findById(usuarioId).orElseThrow(()->new NaoEncontradoException("Usuário não encontrado"));
        if(!usuario.isAtivo()||(comumObrigatorio&&usuario.getTipo()!=TipoUsuario.COMUM))throw new RegraNegocioException("A inscrição exige usuário comum ativo");
        Projeto projeto=projetos.findById(projetoId).orElseThrow(()->new NaoEncontradoException("Projeto não encontrado"));
        if(!projeto.isAtivo())throw new RegraNegocioException("Projeto inativo não aceita inscrições");
        Voluntario voluntario=voluntarios.findByUsuarioIdAndProjetoId(usuarioId,projetoId).orElse(null);
        if(voluntario==null){
            voluntario=new Voluntario();voluntario.setUsuarioId(usuarioId);voluntario.setProjetoId(projetoId);voluntario.setObservacao(observacao);
            try{return voluntarios.save(voluntario);}catch(DuplicateKeyException e){voluntario=voluntarios.findByUsuarioIdAndProjetoId(usuarioId,projetoId).orElseThrow(()->e);}
        }
        if(voluntario.getStatus()!=StatusVoluntario.RECUSADA&&voluntario.getStatus()!=StatusVoluntario.ENCERRADA)
            throw new RegraNegocioException("Já existe inscrição ativa para este projeto");
        voluntario.setStatus(StatusVoluntario.PENDENTE);voluntario.setDataInscricao(Instant.now());voluntario.setDataSaida(null);
        voluntario.setJustificativaRecusa(null);voluntario.setAnalise(null);voluntario.setObservacao(observacao);
        return voluntarios.save(voluntario);
    }

    public Voluntario inscreverPublico(VoluntarioPublicoRequest request) {
        String projetoId = request.projetoId() == null ? null : request.projetoId().trim();
        Projeto projeto = null;
        if (projetoId != null && !projetoId.isEmpty()) {
            ValidarId.objectId(projetoId);
            projeto = projetos.findById(projetoId).orElseThrow(() -> new NaoEncontradoException("Projeto não encontrado"));
            if (!projeto.isAtivo()) throw new RegraNegocioException("Projeto inativo não aceita inscrições");
        }
        Voluntario v = new Voluntario();
        v.setProjetoId(projeto == null ? null : projeto.getId());
        v.setNomeContato(request.nome().trim());
        v.setEmailContato(request.email().trim().toLowerCase(Locale.ROOT));
        v.setTelefoneContato(request.telefone().trim());
        v.setObservacao(request.observacao() == null ? null : request.observacao().trim());
        return voluntarios.save(v);
    }

    public List<Voluntario> minhas(String usuarioId){return voluntarios.findByUsuarioId(usuarioId);}
    public List<Voluntario> listar(String status){if(status==null)return voluntarios.findAll();try{return voluntarios.findByStatus(StatusVoluntario.valueOf(status.trim().toUpperCase(Locale.ROOT)));}catch(IllegalArgumentException e){throw new RequisicaoInvalidaException("Status inválido. Valores aceitos: PENDENTE, APROVADA, RECUSADA, ENCERRADA",java.util.Map.of("status","Valores aceitos: PENDENTE, APROVADA, RECUSADA, ENCERRADA"));}}
    public Voluntario encerrarMeu(String id,String usuarioId){Voluntario v=obter(id);if(!v.getUsuarioId().equals(usuarioId))throw new RegraNegocioException("Inscrição não pertence ao usuário autenticado");return encerrar(v);}
    public Voluntario encerrarAdmin(String id){return encerrar(obter(id));}
    private Voluntario encerrar(Voluntario v){
        if(v.getStatus()==StatusVoluntario.ENCERRADA)throw new RegraNegocioException("Inscrição já está encerrada");
        Query q=Query.query(Criteria.where("id").is(v.getId()).and("status").in(StatusVoluntario.PENDENTE,StatusVoluntario.APROVADA,StatusVoluntario.RECUSADA));
        Update u=new Update().set("status",StatusVoluntario.ENCERRADA).set("dataSaida",Instant.now());
        Voluntario encerrado=mongo.findAndModify(q,u,org.springframework.data.mongodb.core.FindAndModifyOptions.options().returnNew(true),Voluntario.class);
        if(encerrado==null)throw new RegraNegocioException("A inscrição mudou antes de ser encerrada");return encerrado;
    }
    public Voluntario atualizarObservacao(String id,ObservacaoVoluntarioRequest request){Voluntario v=obter(id);v.setObservacao(request.observacao());return voluntarios.save(v);}
    public Voluntario aprovar(String id,String adminId){return analisar(id,adminId,StatusVoluntario.APROVADA,null);}
    public Voluntario recusar(String id,String adminId,String justificativa){if(justificativa==null||justificativa.isBlank())throw new RequisicaoInvalidaException("A justificativa da recusa é obrigatória",java.util.Map.of("justificativaRecusa","A justificativa da recusa é obrigatória"));return analisar(id,adminId,StatusVoluntario.RECUSADA,justificativa.trim());}
    private Voluntario analisar(String id,String adminId,StatusVoluntario destino,String justificativa){
        ValidarId.objectId(adminId);Usuario admin=usuarios.findById(adminId).orElseThrow(()->new NaoEncontradoException("Administrador não encontrado"));
        if(!admin.isAtivo()||admin.getTipo()!=TipoUsuario.ADMIN)throw new RegraNegocioException("A análise exige um administrador ativo");
        Voluntario atual=obter(id);if(atual.getStatus()!=StatusVoluntario.PENDENTE)throw new RegraNegocioException("A inscrição não está pendente");
        Query q=Query.query(Criteria.where("id").is(id).and("status").is(StatusVoluntario.PENDENTE));
        Update u=new Update().set("status",destino).set("analise",new Analise(adminId,Instant.now()));if(justificativa!=null)u.set("justificativaRecusa",justificativa);
        Voluntario result=mongo.findAndModify(q,u,org.springframework.data.mongodb.core.FindAndModifyOptions.options().returnNew(true),Voluntario.class);
        if(result==null)throw new RegraNegocioException("A inscrição deixou de estar pendente antes da análise");return result;
    }
    public void excluir(String id){
        Voluntario v=obter(id);
        if(v.getStatus()!=StatusVoluntario.PENDENTE&&v.getStatus()!=StatusVoluntario.RECUSADA)throw new RegraNegocioException("Somente inscrições pendentes ou recusadas podem ser excluídas");
        Query q=Query.query(Criteria.where("id").is(id).and("status").in(StatusVoluntario.PENDENTE,StatusVoluntario.RECUSADA));
        if(mongo.remove(q,Voluntario.class).getDeletedCount()==0){obter(id);throw new RegraNegocioException("A inscrição mudou antes de ser excluída");}
    }
    private Voluntario obter(String id){ValidarId.objectId(id);return voluntarios.findById(id).orElseThrow(()->new NaoEncontradoException("Inscrição de voluntário não encontrada"));}
}
