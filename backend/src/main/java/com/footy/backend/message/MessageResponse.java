package com.footy.backend.message;

import java.time.Instant;
import java.util.UUID;

public record MessageResponse(
        UUID id,
        UUID matchId,
        MessageAuthorResponse author,
        String content,
        Instant sentAt) {
}
