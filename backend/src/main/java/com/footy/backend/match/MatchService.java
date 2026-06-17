package com.footy.backend.match;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.footy.backend.domain.field.Field;
import com.footy.backend.domain.field.FieldRepository;
import com.footy.backend.domain.match.Match;
import com.footy.backend.domain.match.MatchRepository;
import com.footy.backend.domain.user.User;
import com.footy.backend.domain.user.UserRepository;

@Service
public class MatchService {

    private final MatchRepository matchRepository;
    private final FieldRepository fieldRepository;
    private final UserRepository userRepository;

    public MatchService(MatchRepository matchRepository, FieldRepository fieldRepository, UserRepository userRepository) {
        this.matchRepository = matchRepository;
        this.fieldRepository = fieldRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<MatchResponse> listMatches() {
        return matchRepository.findAllByOrderByStartsAtAsc().stream()
                .map(MatchMapper::toResponse)
                .toList();
    }

    @Transactional
    public MatchResponse createMatch(UUID currentUserId, CreateMatchRequest request) {
        User creator = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));

        Field field = createField(request.field());
        Match match = new Match(request.title().trim(), field, request.startsAt(), request.maxPlayersPerTeam(), creator);

        return MatchMapper.toResponse(matchRepository.save(match));
    }

    @Transactional(readOnly = true)
    public MatchResponse getMatch(UUID id) {
        Match match = matchRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Match not found"));

        match.getCreatedBy().getDisplayName();
        if (match.getField() != null) {
            match.getField().getName();
        }

        return MatchMapper.toResponse(match);
    }

    private Field createField(CreateFieldRequest request) {
        if (request == null) {
            return null;
        }

        Field field = new Field(
                request.name().trim(),
                blankToNull(request.address()),
                blankToNull(request.city()),
                request.latitude(),
                request.longitude());
        return fieldRepository.save(field);
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}