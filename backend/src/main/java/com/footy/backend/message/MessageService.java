package com.footy.backend.message;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.footy.backend.domain.match.Match;
import com.footy.backend.domain.match.MatchParticipation;
import com.footy.backend.domain.match.MatchParticipationRepository;
import com.footy.backend.domain.match.MatchRepository;
import com.footy.backend.domain.match.ParticipationStatus;
import com.footy.backend.domain.message.Message;
import com.footy.backend.domain.message.MessageRepository;
import com.footy.backend.domain.user.User;
import com.footy.backend.domain.user.UserRepository;

@Service
public class MessageService {

    private final MessageRepository messageRepository;
    private final MatchRepository matchRepository;
    private final MatchParticipationRepository participationRepository;
    private final UserRepository userRepository;

    public MessageService(
            MessageRepository messageRepository,
            MatchRepository matchRepository,
            MatchParticipationRepository participationRepository,
            UserRepository userRepository) {
        this.messageRepository = messageRepository;
        this.matchRepository = matchRepository;
        this.participationRepository = participationRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> listMessages(UUID matchId) {
        getMatchOrNotFound(matchId);
        return messageRepository.findAllByMatchIdOrderBySentAtAsc(matchId).stream()
                .map(MessageMapper::toResponse)
                .toList();
    }

    @Transactional
    public MessageResponse createMessage(UUID currentUserId, UUID matchId, CreateMessageRequest request) {
        User author = getUserOrUnauthorized(currentUserId);
        Match match = getMatchOrNotFound(matchId);
        requireActiveParticipation(currentUserId, matchId);

        Message message = new Message(match, author, request.content().trim());
        return MessageMapper.toResponse(messageRepository.save(message));
    }

    private void requireActiveParticipation(UUID userId, UUID matchId) {
        MatchParticipation participation = participationRepository.findByMatchIdAndUserId(matchId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "User is not participating in this match"));

        if (participation.getStatus() != ParticipationStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User is not actively participating in this match");
        }
    }

    private User getUserOrUnauthorized(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
    }

    private Match getMatchOrNotFound(UUID id) {
        return matchRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Match not found"));
    }
}
