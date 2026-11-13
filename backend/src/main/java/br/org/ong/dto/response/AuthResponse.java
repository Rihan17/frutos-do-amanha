package br.org.ong.dto.response;
public record AuthResponse(String token,String tipoToken,long expiraEmSegundos,UsuarioResponse usuario) {}
