package com.footy.backend.match;

import java.math.BigDecimal;
import java.util.UUID;

public record FieldResponse(UUID id, String name, String address, String city, BigDecimal latitude, BigDecimal longitude) {
}