package br.org.ong.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record OngInfoRequest(
        @Email @Size(max=200) String email, @Size(max=40) String telefone, @Size(max=40) String whatsapp,
        @Size(max=300) String instagramUrl, @Size(max=100) String instagramNome,
        @Size(max=300) String facebookUrl, @Size(max=160) String facebookNome,
        @Size(max=200) String endereco, @Size(max=160) String localidade, @Size(max=30) String cep,
        @Size(max=100) String horarioSemana, @Size(max=100) String horarioSabado, @Size(max=100) String horarioDomingo,
        @Size(max=500) String mapaUrl, @Size(max=500) String mapaEmbedUrl, @Size(max=200) String chavePix) {}
