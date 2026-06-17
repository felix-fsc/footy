package com.footy.backend.auth;

import java.time.Instant;

public record AuthResponse(String accessToken, String tokenType, Instant expiresAt, AuthUserResponse user) {
}