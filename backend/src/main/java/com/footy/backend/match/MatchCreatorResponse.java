package com.footy.backend.match;

import java.util.UUID;

public record MatchCreatorResponse(UUID id, String displayName, String username) {
}
