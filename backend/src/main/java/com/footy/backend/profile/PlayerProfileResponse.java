package com.footy.backend.profile;

import java.util.UUID;

import com.footy.backend.domain.user.PlayerPosition;

public record PlayerProfileResponse(
        UUID id,
        String displayName,
        String email,
        String fullName,
        String bio,
        PlayerPosition preferredPosition,
        String city) {
}