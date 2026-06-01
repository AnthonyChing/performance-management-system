package com.pms.security.crypto;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.concurrent.atomic.AtomicReference;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class EncryptionUtil {

    private static final String ALGORITHM = "AES";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final AtomicReference<SecretKey> secretKeyRef = new AtomicReference<>();

    @Value("${pms.crypto.secret:default-insecure-secret-key-min-32-chars!}")
    public void setSecretKeyString(String secret) {
        String secretKeyString = secret;
        if (secretKeyString == null || secretKeyString.length() < 32) {
            log.warn("Crypto secret key is not set or is too short. Using default insecure key!");
            secretKeyString = "default-insecure-secret-key-min-32-chars!";
        }
        // Use first 32 bytes for AES-256
        byte[] keyBytes = new byte[32];
        byte[] providedBytes = secretKeyString.getBytes(StandardCharsets.UTF_8);
        System.arraycopy(providedBytes, 0, keyBytes, 0, Math.min(providedBytes.length, 32));
        secretKeyRef.set(new SecretKeySpec(keyBytes, ALGORITHM));
    }

    public static String encrypt(String plainText) {
        if (plainText == null) {
            return null;
        }

        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            SECURE_RANDOM.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKeyRef.get(), parameterSpec);

            byte[] cipherText = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

            ByteBuffer byteBuffer = ByteBuffer.allocate(4 + iv.length + cipherText.length);
            byteBuffer.putInt(iv.length);
            byteBuffer.put(iv);
            byteBuffer.put(cipherText);

            return Base64.getEncoder().encodeToString(byteBuffer.array());
        } catch (Exception e) {
            log.error("Error while encrypting data", e);
            throw new RuntimeException("Encryption failed", e);
        }
    }

    public static String decrypt(String encryptedText) {
        if (encryptedText == null || encryptedText.trim().isEmpty()) {
            return encryptedText;
        }

        try {
            byte[] decode = Base64.getDecoder().decode(encryptedText);
            ByteBuffer byteBuffer = ByteBuffer.wrap(decode);

            int ivLength = byteBuffer.getInt();
            if (ivLength != GCM_IV_LENGTH) {
                // Not encrypted by our GCM algorithm (could be plaintext or legacy)
                // Returning plaintext as fallback for unencrypted old data
                return new String(decode, StandardCharsets.UTF_8);
            }

            byte[] iv = new byte[ivLength];
            byteBuffer.get(iv);

            byte[] cipherText = new byte[byteBuffer.remaining()];
            byteBuffer.get(cipherText);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(
                    Cipher.DECRYPT_MODE,
                    secretKeyRef.get(),
                    new GCMParameterSpec(GCM_TAG_LENGTH, iv));

            byte[] plainText = cipher.doFinal(cipherText);
            return new String(plainText, StandardCharsets.UTF_8);

        } catch (IllegalArgumentException e) {
            // Not Base64, probably plaintext existing data in DB
            return encryptedText;
        } catch (Exception e) {
            // Decryption failed (e.g., wrong key, or actually plaintext that happens to be base64)
            // Fallback to original text for backward compatibility with unencrypted DB records
            log.warn("Error while decrypting data, falling back to original text", e);
            return encryptedText;
        }
    }
}
