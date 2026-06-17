package com.footy.backend.domain.user;

import java.util.UUID;

import com.footy.backend.domain.common.AuditableEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "player_profiles")
public class PlayerProfile extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(length = 120)
    private String fullName;

    @Column(length = 500)
    private String bio;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private PlayerPosition preferredPosition;

    @Column(length = 80)
    private String city;

    protected PlayerProfile() {
    }

    public PlayerProfile(String fullName, PlayerPosition preferredPosition, String city) {
        this.fullName = fullName;
        this.preferredPosition = preferredPosition;
        this.city = city;
    }

    public void update(String fullName, String bio, PlayerPosition preferredPosition, String city) {
        this.fullName = fullName;
        this.bio = bio;
        this.preferredPosition = preferredPosition;
        this.city = city;
    }

    public UUID getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    void setUser(User user) {
        this.user = user;
    }

    public String getFullName() {
        return fullName;
    }

    public String getBio() {
        return bio;
    }

    public PlayerPosition getPreferredPosition() {
        return preferredPosition;
    }

    public String getCity() {
        return city;
    }
}