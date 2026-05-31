package com.pms.security;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import java.io.IOException;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock private JwtUtil jwtUtil;
    @Mock private FilterChain filterChain;
    @Mock private Claims claims;

    private JwtAuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        filter = new JwtAuthenticationFilter(jwtUtil);
        SecurityContextHolder.clearContext();
    }

    @Test
    void validBearerToken_setsAuthentication() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer valid.jwt.token");
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(jwtUtil.parseToken("valid.jwt.token")).thenReturn(claims);
        when(jwtUtil.getRoles(claims)).thenReturn(List.of("employee"));
        when(claims.getSubject()).thenReturn("00000000-0000-0000-0000-000000000001");

        filter.doFilterInternal(request, response, filterChain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(auth);
        assertEquals("00000000-0000-0000-0000-000000000001", auth.getPrincipal());
        assertTrue(auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_EMPLOYEE")));
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void validCookieToken_setsAuthentication() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new jakarta.servlet.http.Cookie("jwt", "cookie.jwt.token"));
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(jwtUtil.parseToken("cookie.jwt.token")).thenReturn(claims);
        when(jwtUtil.getRoles(claims)).thenReturn(List.of("hr"));
        when(claims.getSubject()).thenReturn("00000000-0000-0000-0000-000000000002");

        filter.doFilterInternal(request, response, filterChain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(auth);
        assertTrue(auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_HR")));
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void headerTakesPrecedenceOverCookie() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer header.jwt.token");
        request.setCookies(new jakarta.servlet.http.Cookie("jwt", "cookie.jwt.token"));
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(jwtUtil.parseToken("header.jwt.token")).thenReturn(claims);
        when(jwtUtil.getRoles(claims)).thenReturn(List.of("manager"));
        when(claims.getSubject()).thenReturn("00000000-0000-0000-0000-000000000003");

        filter.doFilterInternal(request, response, filterChain);

        verify(jwtUtil).parseToken("header.jwt.token");
        verify(jwtUtil, never()).parseToken("cookie.jwt.token");
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void invalidToken_doesNotSetAuthentication() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer invalid.token");
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(jwtUtil.parseToken("invalid.token")).thenThrow(new JwtException("bad token"));

        filter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void noToken_doesNotSetAuthentication() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(jwtUtil, never()).parseToken(any());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void noCookiesNull_doesNotSetAuthentication() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        // getCookies() returns null when no cookies are set — MockHttpServletRequest does this
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void cookieWithWrongName_doesNotSetAuthentication() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new jakarta.servlet.http.Cookie("session", "some.value"));
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(jwtUtil, never()).parseToken(any());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void multipleRoles_allMappedToAuthorities() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer multi.role.token");
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(jwtUtil.parseToken("multi.role.token")).thenReturn(claims);
        when(jwtUtil.getRoles(claims)).thenReturn(List.of("employee", "manager"));
        when(claims.getSubject()).thenReturn("00000000-0000-0000-0000-000000000004");

        filter.doFilterInternal(request, response, filterChain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(auth);
        assertEquals(2, auth.getAuthorities().size());
        assertTrue(auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_EMPLOYEE")));
        assertTrue(auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_MANAGER")));
    }
}
