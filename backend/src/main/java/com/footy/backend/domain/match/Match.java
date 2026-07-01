package com.footy.backend.domain.match;

import java.time.Instant;
import java.util.UUID;

import com.footy.backend.domain.common.AuditableEntity;
import com.footy.backend.domain.field.Field;
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

@Entity
@Table(name = "football_matches")
public class Match extends AuditableEntity {
    public static final int DEFAULT_DURATION_MINUTES = 90;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 120)
    private String title;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "field_id")
    private Field field;

    @Column(nullable = false)
    private Instant startsAt;

    @Column(nullable = false, columnDefinition = "integer default 90")
    private int durationMinutes = DEFAULT_DURATION_MINUTES;

    @Column(nullable = false)
    private int maxPlayersPerTeam;

    @Column(nullable = false, columnDefinition = "integer default 0")
    private int pricePerPersonCents;

    @Column(length = 500)
    private String coverImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private MatchStatus status = MatchStatus.OPEN;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdBy;

    protected Match() {
    }

    public Match(String title, Field field, Instant startsAt, Integer durationMinutes, int maxPlayersPerTeam, int pricePerPersonCents, String coverImageUrl, User createdBy) {
        this.title = title;
        this.field = field;
        this.startsAt = startsAt;
        this.durationMinutes = normalizeDurationMinutes(durationMinutes);
        this.maxPlayersPerTeam = maxPlayersPerTeam;
        this.pricePerPersonCents = pricePerPersonCents;
        this.coverImageUrl = coverImageUrl;
        this.createdBy = createdBy;
    }

    public void updateDetails(String title, Field field, Instant startsAt, Integer durationMinutes, int maxPlayersPerTeam, int pricePerPersonCents, String coverImageUrl) {
        this.title = title;
        this.field = field;
        this.startsAt = startsAt;
        this.durationMinutes = normalizeDurationMinutes(durationMinutes);
        this.maxPlayersPerTeam = maxPlayersPerTeam;
        this.pricePerPersonCents = pricePerPersonCents;
        this.coverImageUrl = coverImageUrl;
    }

    public UUID getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public Field getField() {
        return field;
    }

    public Instant getStartsAt() {
        return startsAt;
    }

    public int getDurationMinutes() {
        return durationMinutes;
    }

    public int getMaxPlayersPerTeam() {
        return maxPlayersPerTeam;
    }

    public int getPricePerPersonCents() {
        return pricePerPersonCents;
    }

    public void setPricePerPersonCents(int pricePerPersonCents) {
        this.pricePerPersonCents = pricePerPersonCents;
    }

    public String getCoverImageUrl() {
        return coverImageUrl;
    }

    public void setCoverImageUrl(String coverImageUrl) {
        this.coverImageUrl = coverImageUrl;
    }

    public MatchStatus getStatus() {
        return status;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public void cancel() {
        this.status = MatchStatus.CANCELLED;
    }

    public void markFull() {
        this.status = MatchStatus.FULL;
    }

    public void reopen() {
        this.status = MatchStatus.OPEN;
    }

    private int normalizeDurationMinutes(Integer value) {
        return value == null ? DEFAULT_DURATION_MINUTES : value;
    }
}
