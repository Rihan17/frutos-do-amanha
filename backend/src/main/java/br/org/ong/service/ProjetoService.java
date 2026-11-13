package br.org.ong.service;

import br.org.ong.dto.request.ProjetoRequest;
import br.org.ong.dto.request.ProjetoUpdateRequest;
import br.org.ong.exception.NaoEncontradoException;
import br.org.ong.exception.RegraNegocioException;
import br.org.ong.model.Projeto;
import br.org.ong.repository.ProjetoRepository;
import java.text.Normalizer;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class ProjetoService {
    private final ProjetoRepository projetos;
    public ProjetoService(ProjetoRepository projetos) { this.projetos = projetos; }

    public List<Projeto> ativos() {
        List<Projeto> items = projetos.findByAtivoTrue();
        items.forEach(this::completarLegado);
        return items.stream().sorted(Comparator.comparingInt(Projeto::getOrdem).thenComparing(Projeto::getNome, String.CASE_INSENSITIVE_ORDER)).toList();
    }
    public List<Projeto> todos() {
        List<Projeto> items = projetos.findAll();
        items.forEach(this::completarLegado);
        return items.stream().sorted(Comparator.comparingInt(Projeto::getOrdem).thenComparing(Projeto::getNome, String.CASE_INSENSITIVE_ORDER)).toList();
    }
    public Projeto publico(String slug) {
        Projeto item = projetos.findBySlug(slug).orElseGet(() -> projetos.findById(slug).orElseThrow(() -> new NaoEncontradoException("Projeto não encontrado")));
        completarLegado(item);
        if (!item.isAtivo()) throw new NaoEncontradoException("Projeto não encontrado");
        return item;
    }
    public Projeto criar(ProjetoRequest request, String adminId) {
        Projeto item = new Projeto(); item.setAdminId(adminId);
        item.setNome(request.nome().trim()); item.setSlug(slug(request.nome()));
        aplicar(item, request.categoria(), request.ordem(), request.resumo(), request.descricao(), request.imagemUrl(), request.imagemAlt(), request.ativo());
        return projetos.save(item);
    }
    public Projeto atualizar(String id, ProjetoUpdateRequest request) {
        Projeto item = obter(id);
        if (request.nome() != null) {
            if (request.nome().isBlank()) throw new RegraNegocioException("Nome do projeto não pode ficar vazio");
            item.setNome(request.nome().trim());
            if (blank(item.getSlug())) item.setSlug(slug(request.nome()));
        }
        aplicar(item, request.categoria(), request.ordem(), request.resumo(), request.descricao(), request.imagemUrl(), request.imagemAlt(), request.ativo());
        return projetos.save(item);
    }
    public void desativar(String id) { Projeto item=obter(id); item.setAtivo(false); projetos.save(item); }
    private void aplicar(Projeto p, String categoria, Integer ordem, String resumo, String descricao, String imagemUrl, String imagemAlt, Boolean ativo) {
        if (categoria != null) p.setCategoria(categoria);
        if (ordem != null) p.setOrdem(ordem);
        if (resumo != null) p.setResumo(resumo);
        if (descricao != null) p.setDescricao(descricao);
        if (imagemUrl != null) p.setImagemUrl(imagemUrl);
        if (imagemAlt != null) p.setImagemAlt(imagemAlt);
        if (ativo != null) p.setAtivo(ativo);
    }
    private void completarLegado(Projeto p) {
        boolean changed = false;
        if (p.getSlug() == null || p.getSlug().isBlank()) { p.setSlug(slug(p.getNome())); changed = true; }
        String nome = p.getNome() == null ? "" : p.getNome().toLowerCase(Locale.ROOT);
        if (nome.contains("feirinha")) {
            if (blank(p.getCategoria())) { p.setCategoria("Segurança alimentar · mensal"); changed = true; }
            if (blank(p.getResumo())) { p.setResumo("Entrega de cestas, frutas e verduras para famílias em situação de vulnerabilidade."); changed = true; }
            if (blank(p.getImagemUrl())) { p.setImagemUrl("assets/img/feirinha-da-crianca.jpg"); p.setImagemAlt("Entrega de cesta de alimentos a uma família na sede da ONG"); changed = true; }
            if (p.getOrdem() == 0) { p.setOrdem(1); changed = true; }
        } else if (nome.contains("estudando")) {
            if (blank(p.getCategoria())) { p.setCategoria("Campanha de material escolar"); changed = true; }
            if (blank(p.getResumo())) { p.setResumo("Arrecadação de mochilas, cadernos e uniformes para o início do ano letivo."); changed = true; }
            if (blank(p.getImagemUrl())) { p.setImagemUrl("assets/img/estudando-para-o-amanha.jpg"); p.setImagemAlt("Crianças com os kits de material escolar"); changed = true; }
            if (p.getOrdem() == 0) { p.setOrdem(2); changed = true; }
        } else if (p.getOrdem() == 0) { p.setOrdem(99); changed = true; }
        if (changed) projetos.save(p);
    }
    private Projeto obter(String id) { return projetos.findById(id).orElseThrow(()->new NaoEncontradoException("Projeto não encontrado")); }
    private static boolean blank(String value) { return value == null || value.isBlank(); }
    private static String slug(String value) {
        return Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD).replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
    }
}
