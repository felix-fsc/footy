package com.footy.backend.profile;

import com.footy.backend.domain.user.PlayerProfile;
import com.footy.backend.domain.user.User;

final class PlayerProfileMapper {

    private PlayerProfileMapper() {
    }

    static PlayerProfileResponse toResponse(User user, PlayerProfile profile) {
        return new PlayerProfileResponse(
                profile == null ? null : profile.getId(),
                user.getDisplayName(),
                user.getEmail(),
                profile == null ? null : profile.getFullName(),
                profile == null ? null : profile.getBio(),
                profile == null ? null : profile.getPreferredPosition(),
                profile == null ? null : profile.getCity());
    }
}