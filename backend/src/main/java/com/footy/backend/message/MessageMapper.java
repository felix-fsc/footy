package com.footy.backend.message;

import com.footy.backend.domain.message.Message;

final class MessageMapper {

    private MessageMapper() {
    }

    static MessageResponse toResponse(Message message) {
        return new MessageResponse(
                message.getId(),
                message.getMatch().getId(),
                new MessageAuthorResponse(
                        message.getAuthor().getId(),
                        message.getAuthor().getDisplayName()),
                message.getContent(),
                message.getSentAt());
    }
}
