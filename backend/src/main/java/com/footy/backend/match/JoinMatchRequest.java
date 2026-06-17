package com.footy.backend.match;

import com.footy.backend.domain.match.TeamSide;

import jakarta.validation.constraints.NotNull;

public record JoinMatchRequest(@NotNull TeamSide teamSide) {
}