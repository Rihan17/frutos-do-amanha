package br.org.ong.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

/* Os dias vêm como códigos de três letras, e não como texto livre: a tela os
   marca em caixas, e deixar "terças" e "TERÇA" entrarem no banco tornaria
   impossível montar uma grade da semana depois.

   O horário é "HH:mm" porque é o formato que o <input type="time"> manda.

   vagas aceita 0, que quer dizer sem limite. O teto de 500 não é uma regra da
   ONG: é para um dedo escorregando no teclado não criar uma turma de 90 mil
   vagas. */
public record AtividadeRequest(
        @NotBlank @Size(max = 120) String nome,
        @Size(max = 7) List<@Pattern(regexp = "^(SEG|TER|QUA|QUI|SEX|SAB|DOM)$",
                message = "Dia inválido") String> dias,
        @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "Use o formato 14:00") String horarioInicio,
        @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "Use o formato 16:00") String horarioFim,
        @Size(max = 120) String local,
        @Min(0) @Max(500) Integer vagas,
        @Size(max = 500) String observacao,
        Boolean ativa) {}
