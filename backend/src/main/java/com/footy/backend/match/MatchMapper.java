package com.footy.backend.match;

import java.util.List;

import com.footy.backend.domain.field.Field;
import com.footy.backend.domain.match.Match;
import com.footy.backend.domain.match.MatchParticipation;
import com.footy.backend.domain.match.TeamSide;

final class MatchMapper {

    private MatchMapper() {
    }

    static MatchResponse toResponse(Match match) {
        return toResponse(match, List.of());
    }

    static MatchResponse toResponse(Match match, List<MatchParticipation> activeParticipations) {
        List<MatchPlayerResponse> teamA = activeParticipations.stream()
                .filter(participation -> participation.getTeamSide() == TeamSide.A)
                .map(MatchMapper::toPlayerResponse)
                .toList();
        List<MatchPlayerResponse> teamB = activeParticipations.stream()
                .filter(participation -> participation.getTeamSide() == TeamSide.B)
                .map(MatchMapper::toPlayerResponse)
                .toList();

        return new MatchResponse(
                match.getId(),
                match.getTitle(),
                match.getStartsAt(),
                match.getDurationMinutes(),
                match.getMaxPlayersPerTeam(),
                match.getPricePerPersonCents(),
                match.getCoverImageUrl(),
                match.getStatus(),
                new MatchCreatorResponse(
                        match.getCreatedBy().getId(),
                        match.getCreatedBy().getDisplayName(),
                        match.getCreatedBy().getUsername()),
                toFieldResponse(match.getField()),
                new MatchOccupancyResponse(teamA.size(), teamB.size(), match.getMaxPlayersPerTeam()),
                new MatchTeamsResponse(teamA, teamB));
    }

    private static MatchPlayerResponse toPlayerResponse(MatchParticipation participation) {
        return new MatchPlayerResponse(
                participation.getId(),
                participation.getUser().getId(),
                participation.getUser().getDisplayName(),
                participation.getUser().getUsername(),
                participation.getTeamSide(),
                participation.getJoinedAt());
    }

    private static FieldResponse toFieldResponse(Field field) {
        if (field == null) {
            return null;
        }
        return new FieldResponse(field.getId(), field.getName(), field.getAddress(), field.getCity(), field.getLatitude(), field.getLongitude());
    }
}
