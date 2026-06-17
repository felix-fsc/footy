package com.footy.backend.match;

import java.util.List;

public record MatchTeamsResponse(
        List<MatchPlayerResponse> teamA,
        List<MatchPlayerResponse> teamB) {
}
