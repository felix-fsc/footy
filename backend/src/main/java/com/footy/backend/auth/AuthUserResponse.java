package com.footy.backend.auth;

import java.util.UUID;

public record AuthUserResponse(UUID id, String email, String displayName) {
}