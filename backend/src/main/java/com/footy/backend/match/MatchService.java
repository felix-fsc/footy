package com.footy.backend.match;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.footy.backend.domain.field.Field;
import com.footy.backend.domain.field.FieldRepository;
import com.footy.backend.domain.match.Match;
import com.footy.backend.domain.match.MatchParticipation;
import com.footy.backend.domain.match.MatchParticipationRepository;
import com.footy.backend.domain.match.MatchRepository;
import com.footy.backend.domain.match.MatchStatus;
import com.footy.backend.domain.match.ParticipationStatus;
import com.footy.backend.domain.match.TeamSide;
import com.footy.backend.domain.user.User;
import com.footy.backend.domain.user.UserRepository;

@Service
public class MatchService {

    private final MatchRepository matchRepository;
    private final MatchParticipationRepository participationRepository;
    private final FieldRepository fieldRepository;
    private final UserRepository userRepository;

    public MatchService(
            MatchRepository matchRepository,
            MatchParticipationRepository participationRepository,
            FieldRepository fieldRepository,
            UserRepository userRepository) {
        this.matchRepository = matchRepository;
        this.participationRepository = participationRepository;
        this.fieldRepository = fieldRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<MatchResponse> listMatches() {
        return matchRepository.findAllByStatusInOrderByStartsAtAsc(List.of(MatchStatus.OPEN, MatchStatus.FULL)).stream()
                .map(this::toResponseWithOccupancy)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MatchResponse> listMyMatches(UUID currentUserId) {
        getUserOrUnauthorized(currentUserId);

        Map<UUID, Match> matches = new LinkedHashMap<>();
        matchRepository.findAllByCreatedByIdOrderByStartsAtAsc(currentUserId)
                .forEach(match -> matches.put(match.getId(), match));
        participationRepository.findAllByUserIdAndStatusOrderByMatchStartsAtAsc(currentUserId, ParticipationStatus.ACTIVE)
                .forEach(participation -> matches.putIfAbsent(participation.getMatch().getId(), participation.getMatch()));

        return matches.values().stream()
                .sorted(Comparator.comparing(Match::getStartsAt))
                .map(this::toResponseWithOccupancy)
                .toList();
    }

    @Transactional
    public MatchResponse createMatch(UUID currentUserId, CreateMatchRequest request) {
        User creator = getUserOrUnauthorized(currentUserId);

        Field field = createField(request.field());
        Match match = new Match(
                request.title().trim(),
                field,
                request.startsAt(),
                request.maxPlayersPerTeam(),
                request.pricePerPersonCents(),
                blankToNull(request.coverImageUrl()),
                creator);

        return toResponseWithOccupancy(matchRepository.save(match));
    }

    @Transactional(readOnly = true)
    public MatchResponse getMatch(UUID id) {
        Match match = getMatchOrNotFound(id);
        initializeMatchResponseRelations(match);
        return toResponseWithOccupancy(match);
    }

    @Transactional
    public MatchParticipationResponse joinMatch(UUID currentUserId, UUID matchId, JoinMatchRequest request) {
        User user = getUserOrUnauthorized(currentUserId);
        Match match = getMatchOrNotFound(matchId);

        if (match.getStatus() != MatchStatus.OPEN) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Match is not open");
        }

        long activePlayersInTeam = countActivePlayers(matchId, request.teamSide());
        if (activePlayersInTeam >= match.getMaxPlayersPerTeam()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Team is full");
        }

        MatchParticipation participation = participationRepository.findByMatchIdAndUserId(matchId, currentUserId)
                .map(existingParticipation -> rejoin(existingParticipation, request))
                .orElseGet(() -> new MatchParticipation(match, user, request.teamSide()));

        MatchParticipation savedParticipation = participationRepository.save(participation);
        updateOpenOrFullStatus(match);
        return MatchParticipationMapper.toResponse(savedParticipation);
    }

    @Transactional
    public MatchResponse cancelMatch(UUID currentUserId, UUID matchId) {
        Match match = getMatchOrNotFound(matchId);

        if (!match.getCreatedBy().getId().equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the match creator can cancel this match");
        }

        if (match.getStatus() != MatchStatus.OPEN && match.getStatus() != MatchStatus.FULL) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only open or full matches can be cancelled");
        }

        match.cancel();
        return toResponseWithOccupancy(match);
    }
    @Transactional
    public void leaveMatch(UUID currentUserId, UUID matchId) {
        MatchParticipation participation = participationRepository.findByMatchIdAndUserId(matchId, currentUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Participation not found"));

        if (participation.getStatus() != ParticipationStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User is not currently participating in this match");
        }

        participation.leave();
        updateOpenOrFullStatus(participation.getMatch());
    }

    private MatchResponse toResponseWithOccupancy(Match match) {
        List<MatchParticipation> activeParticipations = participationRepository.findAllByMatchIdAndStatusOrderByJoinedAtAsc(
                match.getId(),
                ParticipationStatus.ACTIVE);
        return MatchMapper.toResponse(match, activeParticipations);
    }

    private long countActivePlayers(UUID matchId, TeamSide teamSide) {
        return participationRepository.countByMatchIdAndTeamSideAndStatus(
                matchId,
                teamSide,
                ParticipationStatus.ACTIVE);
    }

    private void updateOpenOrFullStatus(Match match) {
        if (match.getStatus() != MatchStatus.OPEN && match.getStatus() != MatchStatus.FULL) {
            return;
        }

        long teamAPlayers = countActivePlayers(match.getId(), TeamSide.A);
        long teamBPlayers = countActivePlayers(match.getId(), TeamSide.B);
        boolean full = teamAPlayers >= match.getMaxPlayersPerTeam() && teamBPlayers >= match.getMaxPlayersPerTeam();
        if (full) {
            match.markFull();
            return;
        }
        match.reopen();
    }

    private MatchParticipation rejoin(MatchParticipation participation, JoinMatchRequest request) {
        if (participation.getStatus() == ParticipationStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User is already participating in this match");
        }
        participation.rejoin(request.teamSide());
        return participation;
    }

    private User getUserOrUnauthorized(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
    }

    private Match getMatchOrNotFound(UUID id) {
        return matchRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Match not found"));
    }

    private void initializeMatchResponseRelations(Match match) {
        match.getCreatedBy().getDisplayName();
        if (match.getField() != null) {
            match.getField().getName();
        }
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
