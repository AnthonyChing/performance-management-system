package com.pms.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String token = null;

        // 1. Try to get token from Authorization header
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            token = header.substring(7);
        }

        // 2. If not in header, try to get from HttpOnly cookie
        if (token == null && request.getCookies() != null) {
            token =
                    Arrays.stream(request.getCookies())
                            .filter(c -> "jwt".equals(c.getName()))
                            .findFirst()
                            .map(Cookie::getValue)
                            .orElse(null);
        }

        if (token == null) {
            chain.doFilter(request, response);
            return;
        }

        try {
            Claims claims = jwtUtil.parseToken(token);
            List<String> roles = jwtUtil.getRoles(claims);

            // DB stores lowercase ("employee"), Spring Security expects "ROLE_EMPLOYEE"
            List<SimpleGrantedAuthority> authorities =
                    roles.stream()
                            .map(r -> new SimpleGrantedAuthority("ROLE_" + r.toUpperCase()))
                            .toList();

            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(claims.getSubject(), null, authorities);
            SecurityContextHolder.getContext().setAuthentication(auth);
        } catch (JwtException ignored) {
            // Invalid token — leave SecurityContext empty; SecurityConfig will reject the request
        }

        chain.doFilter(request, response);
    }
}
