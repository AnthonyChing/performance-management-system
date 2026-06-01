package com.pms.controller;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.pms.dto.auth.AuthResponseDTO;
import com.pms.exception.ApiException;
import com.pms.security.JwtUtil;
import com.pms.service.auth.AuthService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired MockMvc mockMvc;

    @MockBean AuthService authService;

    @org.springframework.boot.test.context.TestConfiguration
    static class TestConfig {
        @org.springframework.context.annotation.Bean
        public JwtUtil jwtUtil() {
            return new JwtUtil(
                    "my-super-secret-key-that-is-at-least-256-bits-long-for-hmac-sha-256",
                    3600000L);
        }
    }

    @Autowired JwtUtil jwtUtil;

    @Test
    void googleLogin_returnsAuthResponse() throws Exception {
        when(authService.authenticateWithGoogle("valid-token"))
                .thenReturn(
                        AuthResponseDTO.builder()
                                .accessToken("jwt-token")
                                .tokenType("Bearer")
                                .expiresIn(3600)
                                .userId("00000000-0000-0000-0000-0000000000c1")
                                .roles(List.of("employee"))
                                .build());

        mockMvc.perform(
                        post("/api/v1/auth/google")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"id_token\":\"valid-token\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.access_token").value("jwt-token"))
                .andExpect(jsonPath("$.token_type").value("Bearer"))
                .andExpect(jsonPath("$.expires_in").value(3600))
                .andExpect(jsonPath("$.user_id").value("00000000-0000-0000-0000-0000000000c1"))
                .andExpect(jsonPath("$.roles[0]").value("employee"));

        verify(authService).authenticateWithGoogle("valid-token");
    }

    @Test
    void googleLogin_withMissingToken_returns400() throws Exception {
        mockMvc.perform(
                        post("/api/v1/auth/google")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.error.details[0].field").value("idToken"));
    }

    @Test
    void googleLogin_withInvalidGoogleToken_returns401() throws Exception {
        when(authService.authenticateWithGoogle("invalid-token"))
                .thenThrow(
                        new ApiException(
                                HttpStatus.UNAUTHORIZED,
                                "INVALID_GOOGLE_TOKEN",
                                "Google ID token verification failed"));

        mockMvc.perform(
                        post("/api/v1/auth/google")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"id_token\":\"invalid-token\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("INVALID_GOOGLE_TOKEN"));
    }
}
