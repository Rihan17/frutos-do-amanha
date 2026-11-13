package br.org.ong.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import javax.imageio.ImageIO;
import org.springframework.stereotype.Service;

@Service
public class PixQrCodeService {
    private static final int SIZE = 320;

    public byte[] gerar(String chavePix) {
        String payload = criarPayload(chavePix);
        try {
            Map<EncodeHintType, Object> hints = new HashMap<>();
            hints.put(EncodeHintType.MARGIN, 2);
            hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M);
            BitMatrix matrix = new QRCodeWriter().encode(payload, BarcodeFormat.QR_CODE, SIZE, SIZE, hints);
            BufferedImage image = new BufferedImage(matrix.getWidth(), matrix.getHeight(), BufferedImage.TYPE_INT_RGB);
            for (int y = 0; y < matrix.getHeight(); y++) {
                for (int x = 0; x < matrix.getWidth(); x++) {
                    image.setRGB(x, y, matrix.get(x, y) ? Color.BLACK.getRGB() : Color.WHITE.getRGB());
                }
            }
            try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
                if (!ImageIO.write(image, "PNG", output)) throw new IOException("Codificador PNG indisponível");
                return output.toByteArray();
            }
        } catch (WriterException | IOException error) {
            throw new IllegalStateException("Não foi possível gerar o QR Code PIX.", error);
        }
    }

    private static String criarPayload(String chavePix) {
        String chave = normalizarChave(chavePix);
        String contaPix = campo("00", "BR.GOV.BCB.PIX") + campo("01", chave);
        String identificador = campo("05", "***");
        String payload = campo("00", "01") + campo("01", "11") + campo("26", contaPix)
                + campo("52", "0000") + campo("53", "986") + campo("58", "BR")
                + campo("59", "FRUTOS DO AMANHA") + campo("60", "SAO VICENTE")
                + campo("62", identificador) + "6304";
        return payload + calcularCrc16(payload);
    }

    private static String normalizarChave(String chavePix) {
        if (chavePix == null || chavePix.isBlank()) throw new IllegalArgumentException("A chave PIX da ONG não foi cadastrada.");
        String chave = chavePix.trim();
        if (chave.matches("[0-9./()+\\- ]+")) chave = chave.replaceAll("\\D", "");
        if (chave.getBytes(StandardCharsets.UTF_8).length > 99) throw new IllegalArgumentException("A chave PIX é longa demais para gerar o QR Code.");
        return chave;
    }

    private static String campo(String identificador, String valor) {
        int comprimento = valor.getBytes(StandardCharsets.UTF_8).length;
        if (comprimento > 99) throw new IllegalArgumentException("Campo PIX excede o tamanho permitido.");
        return identificador + String.format(Locale.ROOT, "%02d", comprimento) + valor;
    }

    private static String calcularCrc16(String payload) {
        int crc = 0xFFFF;
        for (byte value : payload.getBytes(StandardCharsets.UTF_8)) {
            crc ^= (value & 0xFF) << 8;
            for (int bit = 0; bit < 8; bit++) {
                crc = (crc & 0x8000) != 0 ? (crc << 1) ^ 0x1021 : crc << 1;
                crc &= 0xFFFF;
            }
        }
        return String.format(Locale.ROOT, "%04X", crc);
    }
}
