package com.footy.backend.domain.match;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MatchParticipationRepository extends JpaRepository<MatchParticipation, UUID> {

    long countByMatchIdAndTeamSideAndStatus(UUID matchId, TeamSide teamSide, ParticipationStatus status);

    Optional<MatchParticipation> findByMatchIdAndUserId(UUID matchId, UUID userId);

    @EntityGraph(attributePaths = {"user"})
    List<MatchParticipation> findAllByMatchIdAndStatusOrderByJoinedAtAsc(UUID matchId, ParticipationStatus status);

    @EntityGraph(attributePaths = {"match", "match.field", "match.createdBy"})
    List<MatchParticipation> findAllByUserIdAndStatusOrderByMatchStartsAtAsc(UUID userId, ParticipationStatus status);
}
