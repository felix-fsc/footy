package com.footy.backend.message;

import java.util.UUID;

public record MessageAuthorResponse(
        UUID id,
        String displayName) {
}
