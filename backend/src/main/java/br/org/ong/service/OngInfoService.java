package br.org.ong.service;

import br.org.ong.dto.request.OngInfoRequest;
import br.org.ong.exception.NaoEncontradoException;
import br.org.ong.model.OngInfo;
import br.org.ong.repository.OngInfoRepository;
import org.springframework.stereotype.Service;

@Service
public class OngInfoService {
    private final OngInfoRepository repository;
    public OngInfoService(OngInfoRepository repository) { this.repository = repository; }
    public OngInfo publico() {
        OngInfo info = repository.findById("ong").orElseGet(() -> repository.save(padrao()));
        boolean legado = "contato@frutosdoamanha.org.br".equals(info.getEmail())
                || "+551300000000".equals(info.getTelefone())
                || "+5513900000000".equals(info.getWhatsapp());
        boolean alterado = false;
        if ("contato@frutosdoamanha.org.br".equals(info.getEmail())) {
            info.setEmail("ongfrutosdoamanha2011@gmail.com"); alterado = true;
        }
        if ("+551300000000".equals(info.getTelefone())) {
            info.setTelefone("+5513988585602"); alterado = true;
        }
        if ("+5513900000000".equals(info.getWhatsapp())) {
            info.setWhatsapp("+5513988585602"); alterado = true;
        }
        if (legado && (info.getChavePix() == null || info.getChavePix().isBlank())) {
            info.setChavePix("14538126000129"); alterado = true;
        }
        return alterado ? repository.save(info) : info;
    }
    public OngInfo atualizar(OngInfoRequest input) {
        OngInfo info = repository.findById("ong").orElseGet(this::padrao);
        info.setEmail(input.email()); info.setTelefone(input.telefone()); info.setWhatsapp(input.whatsapp());
        info.setInstagramUrl(input.instagramUrl()); info.setInstagramNome(input.instagramNome());
        info.setFacebookUrl(input.facebookUrl()); info.setFacebookNome(input.facebookNome());
        info.setEndereco(input.endereco()); info.setLocalidade(input.localidade()); info.setCep(input.cep());
        info.setHorarioSemana(input.horarioSemana()); info.setHorarioSabado(input.horarioSabado()); info.setHorarioDomingo(input.horarioDomingo());
        info.setMapaUrl(input.mapaUrl()); info.setMapaEmbedUrl(input.mapaEmbedUrl()); info.setChavePix(input.chavePix());
        return repository.save(info);
    }
    private OngInfo padrao() {
        OngInfo info = new OngInfo();
        info.setEmail("ongfrutosdoamanha2011@gmail.com"); info.setTelefone("+5513988585602"); info.setWhatsapp("+5513988585602");
        info.setInstagramUrl("https://instagram.com/ongfrutosdoamanha"); info.setInstagramNome("@ongfrutosdoamanha");
        info.setFacebookUrl("https://www.facebook.com/OngFrutosDoAmanha"); info.setFacebookNome("Projetos Sociais Ong Frutos do Amanhã");
        info.setEndereco("Rua Geralda Martins de Oliveira, 355"); info.setLocalidade("Vila Matias · São Vicente – SP"); info.setCep("11345-230");
        info.setHorarioSemana("9h às 17h"); info.setHorarioSabado("Somente em dias de evento"); info.setHorarioDomingo("Fechado");
        String query = "Rua+Geralda+Martins+de+Oliveira,+355+-+Vila+Matias,+São+Vicente+-+SP,+11345-230";
        info.setMapaUrl("https://www.google.com/maps/search/?api=1&query=" + query);
        info.setMapaEmbedUrl("https://www.google.com/maps?q=" + query + "&z=16&output=embed");
        info.setChavePix("14538126000129");
        return info;
    }
}
