package com.pms.controller;

import com.pms.dto.auth.AuthResponseDTO;
import com.pms.dto.auth.DevLoginRequest;
import com.pms.entity.User;
import com.pms.exception.ApiException;
import com.pms.repository.UserRepository;
import com.pms.security.JwtUtil;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@Profile("dev")
@RequiredArgsConstructor
public class DevLoginController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    @Value("${pms.jwt.expiration-ms}")
    private long expirationMs;

    @PostMapping("/dev-login")
    public ResponseEntity<AuthResponseDTO> devLogin(@RequestBody DevLoginRequest req) {
        if (req.getUserId() == null && req.getEmail() == null) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "user_id or email is required.");
        }

        Optional<User> userOpt =
                req.getUserId() != null
                        ? userRepository.findById(req.getUserId())
                        : userRepository.findByEmail(req.getEmail());

        User user =
                userOpt.orElseThrow(
                        () ->
                                new ApiException(
                                        HttpStatus.NOT_FOUND,
                                        "ACCOUNT_NOT_FOUND",
                                        "No user found for the given user_id or email."));

        List<String> roles = userRepository.findRoleNamesByUserId(user.getId());
        String token = jwtUtil.generateToken(user.getId(), roles);

        ResponseCookie cookie =
                ResponseCookie.from("jwt", token)
                        .httpOnly(true)
                        .secure(true) // Set to true to match production/Google config
                        .path("/")
                        .maxAge(expirationMs / 1000)
                        .sameSite("Strict")
                        .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(AuthResponseDTO.builder()
                        .accessToken(token)
                        .tokenType("Bearer")
                        .expiresIn(expirationMs / 1000)
                        .userId(user.getId().toString())
                        .roles(roles)
                        .build());
    }
}
