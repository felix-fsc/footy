package com.footy.backend.domain.message;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageRepository extends JpaRepository<Message, UUID> {

    List<Message> findAllByMatchIdOrderBySentAtAsc(UUID matchId);
}
