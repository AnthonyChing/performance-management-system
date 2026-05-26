package com.pms.dto.auth;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuthResponseDTO {
    private String accessToken;
    private String tokenType;
    private long expiresIn;
    private String userId;
    private List<String> roles;
}
