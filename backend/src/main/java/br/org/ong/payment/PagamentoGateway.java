package br.org.ong.payment;
import br.org.ong.model.Doacao;
import br.org.ong.model.enums.StatusDoacao;
public interface PagamentoGateway { StatusDoacao iniciarPagamento(Doacao doacao); }
