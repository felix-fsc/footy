package com.footy.backend.message;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/matches/{matchId}/messages")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @GetMapping
    List<MessageResponse> listMessages(@PathVariable UUID matchId) {
        return messageService.listMessages(matchId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    MessageResponse createMessage(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID matchId,
            @Valid @RequestBody CreateMessageRequest request) {
        return messageService.createMessage(UUID.fromString(jwt.getSubject()), matchId, request);
    }
}
