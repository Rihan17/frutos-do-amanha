package br.org.ong.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("ong_info")
public class OngInfo {
    @Id private String id = "ong";
    private String email;
    private String telefone;
    private String whatsapp;
    private String instagramUrl;
    private String instagramNome;
    private String facebookUrl;
    private String facebookNome;
    private String endereco;
    private String localidade;
    private String cep;
    private String horarioSemana;
    private String horarioSabado;
    private String horarioDomingo;
    private String mapaUrl;
    private String mapaEmbedUrl;
    private String chavePix;
    public String getId(){return id;} public void setId(String v){id=v;}
    public String getEmail(){return email;} public void setEmail(String v){email=v;}
    public String getTelefone(){return telefone;} public void setTelefone(String v){telefone=v;}
    public String getWhatsapp(){return whatsapp;} public void setWhatsapp(String v){whatsapp=v;}
    public String getInstagramUrl(){return instagramUrl;} public void setInstagramUrl(String v){instagramUrl=v;}
    public String getInstagramNome(){return instagramNome;} public void setInstagramNome(String v){instagramNome=v;}
    public String getFacebookUrl(){return facebookUrl;} public void setFacebookUrl(String v){facebookUrl=v;}
    public String getFacebookNome(){return facebookNome;} public void setFacebookNome(String v){facebookNome=v;}
    public String getEndereco(){return endereco;} public void setEndereco(String v){endereco=v;}
    public String getLocalidade(){return localidade;} public void setLocalidade(String v){localidade=v;}
    public String getCep(){return cep;} public void setCep(String v){cep=v;}
    public String getHorarioSemana(){return horarioSemana;} public void setHorarioSemana(String v){horarioSemana=v;}
    public String getHorarioSabado(){return horarioSabado;} public void setHorarioSabado(String v){horarioSabado=v;}
    public String getHorarioDomingo(){return horarioDomingo;} public void setHorarioDomingo(String v){horarioDomingo=v;}
    public String getMapaUrl(){return mapaUrl;} public void setMapaUrl(String v){mapaUrl=v;}
    public String getMapaEmbedUrl(){return mapaEmbedUrl;} public void setMapaEmbedUrl(String v){mapaEmbedUrl=v;}
    public String getChavePix(){return chavePix;} public void setChavePix(String v){chavePix=v;}
}
