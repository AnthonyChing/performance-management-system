package com.pms.service.auth;

import com.pms.dto.auth.AuthResponseDTO;

public interface AuthService {

    AuthResponseDTO authenticateWithGoogle(String googleIdToken);
}
