package com.footy.backend.message;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateMessageRequest(
        @NotBlank
        @Size(max = 1000)
        String content) {
}
