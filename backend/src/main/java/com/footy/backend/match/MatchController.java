package com.footy.backend.match;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

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

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    MatchResponse createMatch(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CreateMatchRequest request) {
        return matchService.createMatch(UUID.fromString(jwt.getSubject()), request);
    }

    @GetMapping("/{id}")
    MatchResponse getMatch(@PathVariable UUID id) {
        return matchService.getMatch(id);
    }
}