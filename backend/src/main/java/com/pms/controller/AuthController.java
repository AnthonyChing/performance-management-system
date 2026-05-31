package com.pms.controller;

import com.pms.dto.auth.AuthResponseDTO;
import com.pms.dto.auth.GoogleAuthRequestDTO;
import com.pms.service.auth.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/google")
    public ResponseEntity<AuthResponseDTO> googleLogin(
            @Valid @RequestBody GoogleAuthRequestDTO request) {
        AuthResponseDTO authResponse = authService.authenticateWithGoogle(request.getIdToken());

        ResponseCookie cookie =
                ResponseCookie.from("jwt", authResponse.getAccessToken())
                        .httpOnly(true)
                        .secure(true) // Should be true in production (HTTPS)
                        .path("/")
                        .maxAge(authResponse.getExpiresIn() / 1000)
                        .sameSite("Strict")
                        .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(authResponse);
    }
}
