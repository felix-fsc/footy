package com.footy.backend.profile;

import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/profile")
public class PlayerProfileController {

    private final PlayerProfileService profileService;

    public PlayerProfileController(PlayerProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping("/me")
    PlayerProfileResponse getMyProfile(@AuthenticationPrincipal Jwt jwt) {
        return profileService.getMyProfile(UUID.fromString(jwt.getSubject()));
    }

    @PutMapping("/me")
    PlayerProfileResponse updateMyProfile(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody UpdatePlayerProfileRequest request) {
        return profileService.updateMyProfile(UUID.fromString(jwt.getSubject()), request);
    }
}