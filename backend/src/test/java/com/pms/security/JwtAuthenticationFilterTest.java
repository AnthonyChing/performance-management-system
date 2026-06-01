package com.pms.security;

import static org.junit.jupiter.api.Assertions.*;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

class JwtAuthenticationFilterTest {

    private FakeJwtUtil jwtUtil;
    private FakeFilterChain filterChain;
    private JwtAuthenticationFilter filter;

    static class FakeJwtUtil extends JwtUtil {
        Claims parsedClaims;
        List<String> rolesToReturn;
        JwtException parseException;
        List<String> parsedTokens = new ArrayList<>();

        public FakeJwtUtil() {
            super("dev-secret-key-that-is-at-least-32-bytes-long", 3600000);
        }

        @Override
        public Claims parseToken(String token) throws JwtException {
            parsedTokens.add(token);
            if (parseException != null) {
                throw parseException;
            }
            return parsedClaims;
        }

        @Override
        public List<String> getRoles(Claims claims) {
            return rolesToReturn;
        }
    }

    static class FakeFilterChain implements FilterChain {
        boolean wasCalled = false;

        @Override
        public void doFilter(jakarta.servlet.ServletRequest request, jakarta.servlet.ServletResponse response)
                throws IOException, ServletException {
            wasCalled = true;
        }
    }

    @BeforeEach
    void setUp() {
        jwtUtil = new FakeJwtUtil();
        filterChain = new FakeFilterChain();
        filter = new JwtAuthenticationFilter(jwtUtil);
        SecurityContextHolder.clearContext();
    }

    private Claims createClaims(String subject, List<String> roles) {
        return Jwts.claims()
                .subject(subject)
                .add("roles", roles)
                .build();
    }

    @Test
    void validBearerToken_setsAuthentication() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer valid.jwt.token");
        MockHttpServletResponse response = new MockHttpServletResponse();

        jwtUtil.parsedClaims = createClaims("00000000-0000-0000-0000-000000000001", List.of("employee"));
        jwtUtil.rolesToReturn = List.of("employee");

        filter.doFilterInternal(request, response, filterChain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(auth);
        assertEquals("00000000-0000-0000-0000-000000000001", auth.getPrincipal());
        assertTrue(
                auth.getAuthorities().stream()
                        .anyMatch(a -> a.getAuthority().equals("ROLE_EMPLOYEE")));
        assertTrue(filterChain.wasCalled);
    }

    @Test
    void validCookieToken_setsAuthentication() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new jakarta.servlet.http.Cookie("jwt", "cookie.jwt.token"));
        MockHttpServletResponse response = new MockHttpServletResponse();

        jwtUtil.parsedClaims = createClaims("00000000-0000-0000-0000-000000000002", List.of("hr"));
        jwtUtil.rolesToReturn = List.of("hr");

        filter.doFilterInternal(request, response, filterChain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(auth);
        assertTrue(
                auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_HR")));
        assertTrue(filterChain.wasCalled);
    }

    @Test
    void headerTakesPrecedenceOverCookie() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer header.jwt.token");
        request.setCookies(new jakarta.servlet.http.Cookie("jwt", "cookie.jwt.token"));
        MockHttpServletResponse response = new MockHttpServletResponse();

        jwtUtil.parsedClaims = createClaims("00000000-0000-0000-0000-000000000003", List.of("manager"));
        jwtUtil.rolesToReturn = List.of("manager");

        filter.doFilterInternal(request, response, filterChain);

        assertTrue(jwtUtil.parsedTokens.contains("header.jwt.token"));
        assertFalse(jwtUtil.parsedTokens.contains("cookie.jwt.token"));
        assertTrue(filterChain.wasCalled);
    }

    @Test
    void invalidToken_doesNotSetAuthentication() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer invalid.token");
        MockHttpServletResponse response = new MockHttpServletResponse();

        jwtUtil.parseException = new JwtException("bad token");

        filter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        assertTrue(filterChain.wasCalled);
    }

    @Test
    void noToken_doesNotSetAuthentication() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        assertTrue(jwtUtil.parsedTokens.isEmpty());
        assertTrue(filterChain.wasCalled);
    }

    @Test
    void noCookiesNull_doesNotSetAuthentication() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        assertTrue(filterChain.wasCalled);
    }

    @Test
    void cookieWithWrongName_doesNotSetAuthentication() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new jakarta.servlet.http.Cookie("session", "some.value"));
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        assertTrue(jwtUtil.parsedTokens.isEmpty());
        assertTrue(filterChain.wasCalled);
    }

    @Test
    void multipleRoles_allMappedToAuthorities() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer multi.role.token");
        MockHttpServletResponse response = new MockHttpServletResponse();

        jwtUtil.parsedClaims = createClaims("00000000-0000-0000-0000-000000000004", List.of("employee", "manager"));
        jwtUtil.rolesToReturn = List.of("employee", "manager");

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
    }
}
