package br.org.ong.payment;
import br.org.ong.model.Doacao; import br.org.ong.model.enums.StatusDoacao; import org.springframework.stereotype.Component;
@Component public class StubPagamentoGateway implements PagamentoGateway { @Override public StatusDoacao iniciarPagamento(Doacao doacao){return StatusDoacao.PENDENTE;} }
