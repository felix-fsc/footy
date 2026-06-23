package com.footy.backend.profile;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.footy.backend.domain.user.PlayerProfile;
import com.footy.backend.domain.user.PlayerProfileRepository;
import com.footy.backend.domain.user.User;
import com.footy.backend.domain.user.UserRepository;

@Service
public class PlayerProfileService {

    private final UserRepository userRepository;
    private final PlayerProfileRepository profileRepository;

    public PlayerProfileService(UserRepository userRepository, PlayerProfileRepository profileRepository) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
    }

    @Transactional(readOnly = true)
    public PlayerProfileResponse getMyProfile(UUID currentUserId) {
        User user = getUserOrUnauthorized(currentUserId);
        PlayerProfile profile = profileRepository.findByUserId(currentUserId).orElse(null);
        return PlayerProfileMapper.toResponse(user, profile);
    }

    @Transactional(readOnly = true)
    public PlayerProfileResponse getPublicProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        PlayerProfile profile = profileRepository.findByUserId(userId).orElse(null);
        return PlayerProfileMapper.toResponse(user, profile);
    }

    @Transactional
    public PlayerProfileResponse updateMyProfile(UUID currentUserId, UpdatePlayerProfileRequest request) {
        User user = getUserOrUnauthorized(currentUserId);
        PlayerProfile profile = profileRepository.findByUserId(currentUserId)
                .orElseGet(() -> {
                    PlayerProfile created = new PlayerProfile(null, null, null);
                    user.setPlayerProfile(created);
                    return created;
                });

        updateUsername(user, request.username());

        profile.update(
                blankToNull(request.fullName()),
                blankToNull(request.bio()),
                request.preferredPosition(),
                blankToNull(request.city()));

        return PlayerProfileMapper.toResponse(user, profileRepository.save(profile));
    }

    private User getUserOrUnauthorized(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private void updateUsername(User user, String requestedUsername) {
        if (requestedUsername == null || requestedUsername.isBlank()) {
            return;
        }
        String username = normalizeUsername(requestedUsername);
        if (username.length() < 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username must have at least 3 characters");
        }
        if (userRepository.existsByUsernameIgnoreCaseAndIdNot(username, user.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
        }
        user.setUsername(username);
    }

    private String normalizeUsername(String value) {
        return value.trim()
                .toLowerCase()
                .replaceAll("[^a-z0-9_]+", "_")
                .replaceAll("_+", "_")
                .replaceAll("^_|_$", "");
    }
}
