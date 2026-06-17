package com.footy.backend.profile;

import com.footy.backend.domain.user.PlayerPosition;

import jakarta.validation.constraints.Size;

public record UpdatePlayerProfileRequest(
        @Size(max = 120) String fullName,
        @Size(max = 500) String bio,
        PlayerPosition preferredPosition,
        @Size(max = 80) String city) {
}