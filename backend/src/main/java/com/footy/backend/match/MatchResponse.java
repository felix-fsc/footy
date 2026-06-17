package com.footy.backend.match;

import java.time.Instant;
import java.util.UUID;

import com.footy.backend.domain.match.MatchStatus;

public record MatchResponse(
        UUID id,
        String title,
        Instant startsAt,
        int maxPlayersPerTeam,
        MatchStatus status,
        MatchCreatorResponse createdBy,
        FieldResponse field,
        MatchOccupancyResponse occupancy) {
}
