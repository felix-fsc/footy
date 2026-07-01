package com.footy.backend.match;

import java.time.Instant;
import java.util.UUID;

import com.footy.backend.domain.match.MatchStatus;

public record MatchResponse(
        UUID id,
        String title,
        Instant startsAt,
        int durationMinutes,
        int maxPlayersPerTeam,
        int pricePerPersonCents,
        String coverImageUrl,
        MatchStatus status,
        MatchCreatorResponse createdBy,
        FieldResponse field,
        MatchOccupancyResponse occupancy,
        MatchTeamsResponse teams) {
}
