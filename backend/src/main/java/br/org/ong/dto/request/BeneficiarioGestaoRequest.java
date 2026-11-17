package br.org.ong.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;

/* projetoIds e atividadeIds são listas diferentes de propósito: projeto é o
   que o site mostra ao público, atividade é a turma com dia, hora e vaga.
   Mandar uma não mexe na outra; mandar null em qualquer delas deixa a lista
   como está. */
public record BeneficiarioGestaoRequest(
        @Size(max = 20) List<@Pattern(regexp = "^[a-fA-F0-9]{24}$", message = "Informe um projeto válido") String> projetoIds,
        @Size(max = 20) List<@Pattern(regexp = "^[a-fA-F0-9]{24}$", message = "Informe uma atividade válida") String> atividadeIds,
        Boolean ativo,
        LocalDate dataSaida,
        @Size(max = 500) String motivoSaida) {}
