package com.footy.backend.match;

import java.time.Instant;
import java.util.UUID;

import com.footy.backend.domain.match.ParticipationStatus;
import com.footy.backend.domain.match.TeamSide;

public record MatchParticipationResponse(
        UUID id,
        UUID matchId,
        UUID userId,
        TeamSide teamSide,
        ParticipationStatus status,
        Instant joinedAt) {
}