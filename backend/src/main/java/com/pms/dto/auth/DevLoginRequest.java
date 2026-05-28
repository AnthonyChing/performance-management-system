package com.pms.dto.auth;

import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class DevLoginRequest {
    private UUID userId;
    private String email;
}
