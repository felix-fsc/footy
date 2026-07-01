package com.footy.backend.match;

import java.time.Instant;
import java.util.UUID;

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
        @Min(30) @Max(240) Integer durationMinutes,
        @Min(1) @Max(11) int maxPlayersPerTeam,
        @Min(0) @Max(10000) int pricePerPersonCents,
        @Size(max = 500) String coverImageUrl,
        UUID fieldId,
        @Valid CreateFieldRequest field) {
}
