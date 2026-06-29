package com.footy.backend.match;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/matches")
public class MatchController {

    private final MatchService matchService;

    public MatchController(MatchService matchService) {
        this.matchService = matchService;
    }

    @GetMapping
    List<MatchResponse> listMatches() {
        return matchService.listMatches();
    }


    @GetMapping("/me")
    List<MatchResponse> listMyMatches(@AuthenticationPrincipal Jwt jwt) {
        return matchService.listMyMatches(UUID.fromString(jwt.getSubject()));
    }
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    MatchResponse createMatch(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CreateMatchRequest request) {
        return matchService.createMatch(UUID.fromString(jwt.getSubject()), request);
    }

    @PutMapping("/{id}")
    MatchResponse updateMatch(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @Valid @RequestBody CreateMatchRequest request) {
        return matchService.updateMatch(UUID.fromString(jwt.getSubject()), id, request);
    }

    @GetMapping("/{id}")
    MatchResponse getMatch(@PathVariable UUID id) {
        return matchService.getMatch(id);
    }

    @PostMapping("/{id}/join")
    MatchParticipationResponse joinMatch(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @Valid @RequestBody JoinMatchRequest request) {
        return matchService.joinMatch(UUID.fromString(jwt.getSubject()), id, request);
    }

    @PatchMapping("/{id}/cancel")
    MatchResponse cancelMatch(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return matchService.cancelMatch(UUID.fromString(jwt.getSubject()), id);
    }

    @DeleteMapping("/{id}/leave")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void leaveMatch(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        matchService.leaveMatch(UUID.fromString(jwt.getSubject()), id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteMatch(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        matchService.deleteMatch(UUID.fromString(jwt.getSubject()), id);
    }

    @DeleteMapping("/{id}/players/{userId}")
    MatchResponse removePlayer(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @PathVariable UUID userId) {
        return matchService.removePlayerFromMatch(UUID.fromString(jwt.getSubject()), id, userId);
    }
}
