package com.footy.backend.match;

import java.time.Instant;
import java.util.UUID;

import com.footy.backend.domain.match.TeamSide;

public record MatchPlayerResponse(
        UUID participationId,
        UUID userId,
        String displayName,
        TeamSide teamSide,
        Instant joinedAt) {
}
