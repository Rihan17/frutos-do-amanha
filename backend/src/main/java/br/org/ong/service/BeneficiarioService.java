package br.org.ong.service;

import br.org.ong.dto.request.BeneficiarioGestaoRequest;
import br.org.ong.dto.request.DesativarBeneficiarioRequest;
import br.org.ong.exception.NaoEncontradoException;
import br.org.ong.exception.RequisicaoInvalidaException;
import br.org.ong.exception.ValidarId;
import br.org.ong.model.Beneficiario;
import br.org.ong.model.Projeto;
import br.org.ong.repository.BeneficiarioRepository;
import br.org.ong.repository.ProjetoRepository;
import java.time.LocalDate;
import java.util.List;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

@Service
public class BeneficiarioService {
    private final BeneficiarioRepository beneficiarios;private final ProjetoRepository projetos;
    public BeneficiarioService(BeneficiarioRepository beneficiarios,ProjetoRepository projetos){this.beneficiarios=beneficiarios;this.projetos=projetos;}
    public List<Beneficiario> listar(){return beneficiarios.findAll();}
    public Beneficiario obter(String id){ValidarId.objectId(id);return beneficiarios.findById(id).orElseThrow(()->new NaoEncontradoException("Beneficiário não encontrado"));}
    public Beneficiario atualizar(String id,BeneficiarioGestaoRequest request){
        Beneficiario b=obter(id);
        if(request.projetoIds()!=null){List<ObjectId> ids=request.projetoIds().stream().map(this::projetoObjectId).toList();b.setProjetoIds(ids);}
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
    public Beneficiario desativar(String id,DesativarBeneficiarioRequest request){return atualizar(id,new BeneficiarioGestaoRequest(null,false,LocalDate.now(java.time.ZoneId.of("America/Sao_Paulo")),request.motivoSaida()));}
    private ObjectId projetoObjectId(String id){ValidarId.objectId(id);Projeto projeto=projetos.findById(id).orElseThrow(()->new NaoEncontradoException("Projeto não encontrado"));if(!projeto.isAtivo())throw new RequisicaoInvalidaException("Projeto inativo não pode ser associado ao beneficiário");return new ObjectId(id);}
}
