package com.footy.backend.domain.match;

import java.time.Instant;
import java.util.UUID;

import com.footy.backend.domain.user.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "match_participations", uniqueConstraints = @UniqueConstraint(columnNames = {"match_id", "user_id"}))
public class MatchParticipation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "match_id", nullable = false)
    private Match match;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TeamSide teamSide;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ParticipationStatus status = ParticipationStatus.ACTIVE;

    @Column(nullable = false)
    private Instant joinedAt = Instant.now();

    protected MatchParticipation() {
    }

    public MatchParticipation(Match match, User user, TeamSide teamSide) {
        this.match = match;
        this.user = user;
        this.teamSide = teamSide;
    }

    public UUID getId() {
        return id;
    }

    public Match getMatch() {
        return match;
    }

    public User getUser() {
        return user;
    }

    public TeamSide getTeamSide() {
        return teamSide;
    }

    public ParticipationStatus getStatus() {
        return status;
    }

    public Instant getJoinedAt() {
        return joinedAt;
    }
}