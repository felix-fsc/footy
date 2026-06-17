package com.footy.backend.match;

import com.footy.backend.domain.field.Field;
import com.footy.backend.domain.match.Match;

final class MatchMapper {

    private MatchMapper() {
    }

    static MatchResponse toResponse(Match match) {
        return toResponse(match, 0, 0);
    }

    static MatchResponse toResponse(Match match, long teamAPlayers, long teamBPlayers) {
        return new MatchResponse(
                match.getId(),
                match.getTitle(),
                match.getStartsAt(),
                match.getMaxPlayersPerTeam(),
                match.getStatus(),
                new MatchCreatorResponse(match.getCreatedBy().getId(), match.getCreatedBy().getDisplayName()),
                toFieldResponse(match.getField()),
                new MatchOccupancyResponse(teamAPlayers, teamBPlayers, match.getMaxPlayersPerTeam()));
    }

    private static FieldResponse toFieldResponse(Field field) {
        if (field == null) {
            return null;
        }
        return new FieldResponse(field.getId(), field.getName(), field.getAddress(), field.getCity(), field.getLatitude(), field.getLongitude());
    }
}
