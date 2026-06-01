package com.pms.security;

import static org.junit.jupiter.api.Assertions.*;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import java.io.IOException;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

class JwtAuthenticationFilterTest {

    private JwtUtil jwtUtil;
    private JwtAuthenticationFilter filter;
    private boolean filterChainCalled;
    private final FilterChain filterChain = (req, res) -> filterChainCalled = true;

    @BeforeEach
    void setUp() {
        jwtUtil =
                new JwtUtil(
                        "my-super-secret-key-that-is-at-least-256-bits-long-for-hmac-sha-256",
                        3600000L);
        filter = new JwtAuthenticationFilter(jwtUtil);
        filterChainCalled = false;
        SecurityContextHolder.clearContext();
    }

    @Test
    void validBearerToken_setsAuthentication() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        UUID userId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        String token = jwtUtil.generateToken(userId, List.of("employee"));
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(auth);
        assertEquals("00000000-0000-0000-0000-000000000001", auth.getPrincipal());
        assertTrue(
                auth.getAuthorities().stream()
                        .anyMatch(a -> a.getAuthority().equals("ROLE_EMPLOYEE")));
        assertTrue(filterChainCalled);
    }

    @Test
    void validCookieToken_setsAuthentication() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        UUID userId = UUID.fromString("00000000-0000-0000-0000-000000000002");
        String token = jwtUtil.generateToken(userId, List.of("hr"));
        request.setCookies(new jakarta.servlet.http.Cookie("jwt", token));
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(auth);
        assertTrue(
                auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_HR")));
        assertTrue(filterChainCalled);
    }

    @Test
    void headerTakesPrecedenceOverCookie() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        UUID userIdHeader = UUID.fromString("00000000-0000-0000-0000-000000000003");
        String headerToken = jwtUtil.generateToken(userIdHeader, List.of("manager"));

        UUID userIdCookie = UUID.fromString("00000000-0000-0000-0000-000000000004");
        String cookieToken = jwtUtil.generateToken(userIdCookie, List.of("employee"));

        request.addHeader("Authorization", "Bearer " + headerToken);
        request.setCookies(new jakarta.servlet.http.Cookie("jwt", cookieToken));
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(auth);
        assertEquals(userIdHeader.toString(), auth.getPrincipal());
        assertTrue(
                auth.getAuthorities().stream()
                        .anyMatch(a -> a.getAuthority().equals("ROLE_MANAGER")));
        assertTrue(filterChainCalled);
    }

    @Test
    void invalidToken_doesNotSetAuthentication() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer invalid.token.here");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        assertTrue(filterChainCalled);
    }

    @Test
    void noToken_doesNotSetAuthentication() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        assertTrue(filterChainCalled);
    }

    @Test
    void noCookiesNull_doesNotSetAuthentication() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        assertTrue(filterChainCalled);
    }

    @Test
    void cookieWithWrongName_doesNotSetAuthentication() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new jakarta.servlet.http.Cookie("session", "some.value"));
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        assertTrue(filterChainCalled);
    }

    @Test
    void multipleRoles_allMappedToAuthorities() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        UUID userId = UUID.fromString("00000000-0000-0000-0000-000000000004");
        String token = jwtUtil.generateToken(userId, List.of("employee", "manager"));
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(auth);
        assertEquals(2, auth.getAuthorities().size());
        assertTrue(
                auth.getAuthorities().stream()
                        .anyMatch(a -> a.getAuthority().equals("ROLE_EMPLOYEE")));
        assertTrue(
                auth.getAuthorities().stream()
                        .anyMatch(a -> a.getAuthority().equals("ROLE_MANAGER")));
        assertTrue(filterChainCalled);
    }
}
