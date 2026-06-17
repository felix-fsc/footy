package com.footy.backend.match;

import com.footy.backend.domain.match.MatchParticipation;

final class MatchParticipationMapper {

    private MatchParticipationMapper() {
    }

    static MatchParticipationResponse toResponse(MatchParticipation participation) {
        return new MatchParticipationResponse(
                participation.getId(),
                participation.getMatch().getId(),
                participation.getUser().getId(),
                participation.getTeamSide(),
                participation.getStatus(),
                participation.getJoinedAt());
    }
}