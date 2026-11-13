package br.org.ong.controller;

import br.org.ong.model.OngInfo;
import br.org.ong.service.OngInfoService;
import br.org.ong.service.PixQrCodeService;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/publico/ong")
public class PublicoOngController {
    private final OngInfoService service;
    private final PixQrCodeService pixQrCodeService;
    public PublicoOngController(OngInfoService service, PixQrCodeService pixQrCodeService) {
        this.service = service;
        this.pixQrCodeService = pixQrCodeService;
    }
    @GetMapping public OngInfo obter() { return service.publico(); }

    @GetMapping(value = "/pix-qrcode", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> obterQrCodePix() {
        String chavePix = service.publico().getChavePix();
        if (chavePix == null || chavePix.isBlank()) return ResponseEntity.noContent().build();
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .cacheControl(CacheControl.noStore())
                .body(pixQrCodeService.gerar(chavePix));
    }
}
