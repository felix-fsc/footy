package com.footy.backend.match;

public record MatchOccupancyResponse(
        long teamAPlayers,
        long teamBPlayers,
        int maxPlayersPerTeam,
        long totalPlayers,
        long totalCapacity,
        long remainingTeamA,
        long remainingTeamB) {

    public MatchOccupancyResponse(long teamAPlayers, long teamBPlayers, int maxPlayersPerTeam) {
        this(
                teamAPlayers,
                teamBPlayers,
                maxPlayersPerTeam,
                teamAPlayers + teamBPlayers,
                (long) maxPlayersPerTeam * 2,
                Math.max(0, maxPlayersPerTeam - teamAPlayers),
                Math.max(0, maxPlayersPerTeam - teamBPlayers));
    }
}