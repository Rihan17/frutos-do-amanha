package br.org.ong.service;

import br.org.ong.dto.request.ResponsavelCadastroRequest;
import br.org.ong.exception.NaoEncontradoException;
import br.org.ong.exception.RegraNegocioException;
import br.org.ong.model.Responsavel;
import br.org.ong.repository.ResponsavelRepository;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class ResponsavelService {
    private final ResponsavelRepository responsaveis;
    public ResponsavelService(ResponsavelRepository responsaveis) { this.responsaveis = responsaveis; }

    public List<Responsavel> todos() {
        return responsaveis.findAll().stream()
                .sorted(Comparator.comparing(Responsavel::getNome, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .toList();
    }

    public Responsavel obter(String id) {
        return responsaveis.findById(id).orElseThrow(() -> new NaoEncontradoException("Responsável não encontrado"));
    }

    public Responsavel criar(ResponsavelCadastroRequest req, String adminId) {
        Responsavel r = new Responsavel();
        r.setAdminId(adminId);
        aplicar(r, req);
        /* Dois cadastros da mesma pessoa viram duas linhas na tela e duas
           versões do mesmo endereço. O CPF é o que separa homônimos, então
           quando ele vem, é conferido. Sem CPF o cadastro passa: barrar por
           nome igual impediria duas pessoas chamadas Maria Silva. */
        if (r.getCpf() != null) {
            responsaveis.findByCpf(r.getCpf()).ifPresent(outro -> {
                throw new RegraNegocioException("Já existe um responsável cadastrado com esse CPF: " + outro.getNome());
            });
        }
        return responsaveis.save(r);
    }

    public Responsavel atualizar(String id, ResponsavelCadastroRequest req) {
        Responsavel r = obter(id);
        String cpfAntes = r.getCpf();
        aplicar(r, req);
        if (r.getCpf() != null && !r.getCpf().equals(cpfAntes)) {
            responsaveis.findByCpf(r.getCpf()).filter(outro -> !outro.getId().equals(id)).ifPresent(outro -> {
                throw new RegraNegocioException("Já existe um responsável cadastrado com esse CPF: " + outro.getNome());
            });
        }
        return responsaveis.save(r);
    }

    /* Desativar, e não apagar: o responsável pode estar ligado a uma criança
       em acompanhamento, e perder o contato dele no meio seria pior. */
    public void desativar(String id) {
        Responsavel r = obter(id);
        r.setAtivo(false);
        responsaveis.save(r);
    }

    private void aplicar(Responsavel r, ResponsavelCadastroRequest req) {
        r.setNome(req.nome().trim());
        r.setTelefone(req.telefone().trim());
        r.setCpf(soDigitos(req.cpf()));
        r.setEmail(limpo(req.email()));
        r.setParentesco(limpo(req.parentesco()));
        r.setCep(limpo(req.cep()));
        r.setEndereco(limpo(req.endereco()));
        r.setNumero(limpo(req.numero()));
        r.setComplemento(limpo(req.complemento()));
        r.setBairro(limpo(req.bairro()));
        r.setCidade(limpo(req.cidade()));
        String uf = limpo(req.uf());
        r.setUf(uf == null ? null : uf.toUpperCase(Locale.ROOT));
        r.setObservacao(limpo(req.observacao()));
        if (req.ativo() != null) r.setAtivo(req.ativo());
    }

    /* O CPF é guardado só com os números. A máscara é coisa da tela, e
       "111.444.777-35" e "11144477735" têm de ser o mesmo cadastro na hora
       de conferir repetido. */
    private static String soDigitos(String valor) {
        if (valor == null) return null;
        String d = valor.replaceAll("\\D", "");
        return d.isEmpty() ? null : d;
    }

    private static String limpo(String valor) {
        if (valor == null) return null;
        String v = valor.trim();
        return v.isEmpty() ? null : v;
    }
}
