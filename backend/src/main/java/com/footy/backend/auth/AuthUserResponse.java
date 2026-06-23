package com.footy.backend.auth;

import java.util.UUID;

import com.footy.backend.domain.user.UserRole;

public record AuthUserResponse(UUID id, String email, String displayName, String username, UserRole role) {
}
