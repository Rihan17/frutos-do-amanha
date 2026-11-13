package br.org.ong.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class RoutesConfiguration implements WebMvcConfigurer {
    @Override public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/gestao").setViewName("forward:/gestao.html");
        registry.addRedirectViewController("/gestão", "/gestao");
    }
}
