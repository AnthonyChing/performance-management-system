package com.pms.controller;

import com.pms.dto.auth.AuthResponseDTO;
import com.pms.dto.auth.GoogleAuthRequestDTO;
import com.pms.service.auth.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
    public ResponseEntity<AuthResponseDTO> googleLogin(@Valid @RequestBody GoogleAuthRequestDTO request) {
        return ResponseEntity.ok(authService.authenticateWithGoogle(request.getIdToken()));
    }
}
