package com.pms.service.auth.impl;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.pms.dto.auth.AuthResponseDTO;
import com.pms.entity.User;
import com.pms.entity.UserIdentity;
import com.pms.entity.enums.IdentityProvider;
import com.pms.exception.ApiException;
import com.pms.repository.UserIdentityRepository;
import com.pms.repository.UserRepository;
import com.pms.security.JwtUtil;
import com.pms.service.auth.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserIdentityRepository userIdentityRepository;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    @Value("${pms.jwt.expiration-ms}")
    private long expirationMs;

    @Value("${pms.google.client-id}")
    private String googleClientId;

    @Override
    @Transactional
    public AuthResponseDTO authenticateWithGoogle(String googleIdToken) {
        GoogleIdToken.Payload payload = verifyGoogleToken(googleIdToken);

        String subject = payload.getSubject();
        String email = payload.getEmail();

        UserIdentity identity = userIdentityRepository
                .findByProviderAndProviderSubject(IdentityProvider.GOOGLE, subject)
                .orElseGet(() -> autoLink(subject, email));

        UUID userId = identity.getUserId();
        List<String> roles = userRepository.findRoleNamesByUserId(userId);

        String token = jwtUtil.generateToken(userId, roles);

        return AuthResponseDTO.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .expiresIn(expirationMs / 1000)
                .userId(userId.toString())
                .roles(roles)
                .build();
    }

    private UserIdentity autoLink(String googleSubject, String googleEmail) {
        User user = userRepository.findByEmail(googleEmail)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.UNAUTHORIZED,
                        "ACCOUNT_NOT_FOUND",
                        "No PMS account found for email: " + googleEmail));

        UserIdentity identity = UserIdentity.builder()
                .id(UUID.randomUUID())
                .userId(user.getId())
                .provider(IdentityProvider.GOOGLE)
                .providerSubject(googleSubject)
                .providerEmail(googleEmail)
                .linkedAt(OffsetDateTime.now())
                .build();

        return userIdentityRepository.save(identity);
    }

    private GoogleIdToken.Payload verifyGoogleToken(String idTokenString) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_GOOGLE_TOKEN",
                        "Google ID token verification failed");
            }
            return idToken.getPayload();
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_GOOGLE_TOKEN",
                    "Google ID token verification failed");
        }
    }
}
