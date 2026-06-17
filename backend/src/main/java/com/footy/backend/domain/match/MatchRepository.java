package com.footy.backend.domain.match;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MatchRepository extends JpaRepository<Match, UUID> {

    @EntityGraph(attributePaths = {"field", "createdBy"})
    List<Match> findAllByOrderByStartsAtAsc();

    @EntityGraph(attributePaths = {"field", "createdBy"})
    List<Match> findAllByCreatedByIdOrderByStartsAtAsc(UUID createdById);
}