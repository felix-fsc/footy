package com.footy.backend.match;

import java.time.Instant;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateMatchRequest(
        @NotBlank @Size(max = 120) String title,
        @NotNull @Future Instant startsAt,
        @Min(1) @Max(11) int maxPlayersPerTeam,
        @Valid CreateFieldRequest field) {
}