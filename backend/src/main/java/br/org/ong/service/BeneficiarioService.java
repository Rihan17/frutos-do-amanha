package br.org.ong.service;

import br.org.ong.dto.request.BeneficiarioGestaoRequest;
import br.org.ong.dto.request.DesativarBeneficiarioRequest;
import br.org.ong.exception.NaoEncontradoException;
import br.org.ong.exception.RequisicaoInvalidaException;
import br.org.ong.exception.ValidarId;
import br.org.ong.exception.RegraNegocioException;
import br.org.ong.model.Atividade;
import br.org.ong.model.Beneficiario;
import br.org.ong.model.Projeto;
import br.org.ong.repository.AtividadeRepository;
import br.org.ong.repository.BeneficiarioRepository;
import br.org.ong.repository.ProjetoRepository;
import java.time.LocalDate;
import java.util.List;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

@Service
public class BeneficiarioService {
    private final BeneficiarioRepository beneficiarios;private final ProjetoRepository projetos;
    private final AtividadeRepository atividades;
    public BeneficiarioService(BeneficiarioRepository beneficiarios,ProjetoRepository projetos,AtividadeRepository atividades){this.beneficiarios=beneficiarios;this.projetos=projetos;this.atividades=atividades;}
    public List<Beneficiario> listar(){return beneficiarios.findAll();}
    public Beneficiario obter(String id){ValidarId.objectId(id);return beneficiarios.findById(id).orElseThrow(()->new NaoEncontradoException("Beneficiário não encontrado"));}
    public Beneficiario atualizar(String id,BeneficiarioGestaoRequest request){
        Beneficiario b=obter(id);
        if(request.projetoIds()!=null){List<ObjectId> ids=request.projetoIds().stream().map(this::projetoObjectId).toList();b.setProjetoIds(ids);}
        if(request.atividadeIds()!=null)b.setAtividadeIds(new java.util.ArrayList<>(atividadesPedidas(b,request.atividadeIds())));
        if(request.ativo()!=null){
            b.setAtivo(request.ativo());
            if(request.ativo()){b.setDataSaida(null);b.setMotivoSaida(null);}
            else {if(request.motivoSaida()==null||request.motivoSaida().isBlank())throw new RequisicaoInvalidaException("Motivo de saída obrigatório ao desativar",java.util.Map.of("motivoSaida","Informe o motivo da saída"));b.setDataSaida(request.dataSaida()==null?LocalDate.now(java.time.ZoneId.of("America/Sao_Paulo")):request.dataSaida());b.setMotivoSaida(request.motivoSaida().trim());}
        } else if(request.dataSaida()!=null||request.motivoSaida()!=null){
            if(b.isAtivo())throw new RequisicaoInvalidaException("Beneficiário ativo não pode ter data ou motivo de saída");
            if(request.dataSaida()!=null)b.setDataSaida(request.dataSaida());
            if(request.motivoSaida()!=null){if(request.motivoSaida().isBlank())throw new RequisicaoInvalidaException("Motivo de saída não pode ser vazio");b.setMotivoSaida(request.motivoSaida().trim());}
        }
        return beneficiarios.save(b);
    }
    public Beneficiario desativar(String id,DesativarBeneficiarioRequest request){return atualizar(id,new BeneficiarioGestaoRequest(null,null,false,LocalDate.now(java.time.ZoneId.of("America/Sao_Paulo")),request.motivoSaida()));}

    /* Apaga o cadastro de vez.

       O caminho de sempre é o desativar() aí em cima: ele guarda a data e o
       motivo da saída, porque a passagem de uma criança pela ONG faz parte
       do histórico e não pode sumir. Isto aqui é para o outro caso, o do
       registro que nunca devia existir: cadastro repetido, nome digitado
       errado, teste que sobrou. Não tem volta, e por isso o painel pergunta
       antes. */
    public void excluirPermanente(String id){beneficiarios.delete(obter(id));}
    /* As turmas pedidas para esta crianca, conferidas uma a uma.

       Duas coisas sao barradas aqui. Turma encerrada nao aceita inscricao
       nova: ela saiu da lista justamente para parar de receber gente. E
       turma cheia so e barrada para quem esta entrando agora - quem ja
       estava dentro continua, senao salvar a ficha de uma crianca de uma
       turma lotada daria erro sem ela ter mexido em nada.

       A contagem olha so criancas ativas: quem saiu da ONG nao segura vaga. */
    private List<ObjectId> atividadesPedidas(Beneficiario b,List<String> pedidas){
        List<ObjectId> jaEstava=b.getAtividadeIds();
        return pedidas.stream().distinct().map(id->{
            ValidarId.objectId(id);
            Atividade a=atividades.findById(id).orElseThrow(()->new NaoEncontradoException("Atividade nao encontrada"));
            ObjectId oid=new ObjectId(id);
            boolean entrando=jaEstava.stream().noneMatch(oid::equals);
            if(entrando&&!a.isAtiva())
                throw new RegraNegocioException("A atividade \""+a.getNome()+"\" esta encerrada e nao aceita inscricao");
            if(entrando&&a.getVagas()>0
                    &&beneficiarios.countByAtividadeIdsContainingAndAtivoIsTrue(oid)>=a.getVagas())
                throw new RegraNegocioException("A atividade \""+a.getNome()+"\" esta com as "
                        +a.getVagas()+" vagas preenchidas");
            return oid;
        }).toList();
    }

    private ObjectId projetoObjectId(String id){ValidarId.objectId(id);Projeto projeto=projetos.findById(id).orElseThrow(()->new NaoEncontradoException("Projeto não encontrado"));if(!projeto.isAtivo())throw new RequisicaoInvalidaException("Projeto inativo não pode ser associado ao beneficiário");return new ObjectId(id);}
}
