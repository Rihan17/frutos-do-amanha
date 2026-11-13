package br.org.ong.config;

import br.org.ong.model.Projeto;
import br.org.ong.repository.ProjetoRepository;
import java.util.List;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ProjetoSeedConfiguration {
    @Bean
    ApplicationRunner seedProjetos(ProjetoRepository repository) {
        return args -> {
            if (repository.count() > 0) return;
            Projeto feirinha = new Projeto();
            feirinha.setNome("Feirinha da Criança"); feirinha.setSlug("feirinha-da-crianca");
            feirinha.setCategoria("Segurança alimentar · mensal"); feirinha.setOrdem(1);
            feirinha.setResumo("Entrega de cestas, frutas e verduras para famílias em situação de vulnerabilidade.");
            feirinha.setDescricao("Cada família retira o que precisa na sede, com acolhimento e sem fila de espera.");
            feirinha.setImagemUrl("assets/img/feirinha-da-crianca.jpg");
            feirinha.setImagemAlt("Entrega de cesta de alimentos a uma família na sede da ONG");
            Projeto estudo = new Projeto();
            estudo.setNome("Estudando para o Amanhã"); estudo.setSlug("estudando-para-o-amanha");
            estudo.setCategoria("Campanha de material escolar"); estudo.setOrdem(2);
            estudo.setResumo("Arrecadação de mochilas, cadernos e uniformes para que nenhuma criança comece o ano letivo sem material.");
            estudo.setDescricao("A campanha abre no fim do ano e entrega os materiais escolares em janeiro.");
            estudo.setImagemUrl("assets/img/estudando-para-o-amanha.jpg");
            estudo.setImagemAlt("Crianças com os kits de material escolar da campanha");
            repository.saveAll(List.of(feirinha, estudo));
        };
    }
}
