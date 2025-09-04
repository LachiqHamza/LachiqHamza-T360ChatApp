package com.chat_app.chat.repository;

import com.chat_app.chat.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("SELECT cm FROM ChatMessage cm WHERE " +
            "(cm.senderName = :user1 AND cm.receiverName = :user2) OR " +
            "(cm.senderName = :user2 AND cm.receiverName = :user1) " +
            "ORDER BY cm.timestamp ASC")
    List<ChatMessage> findChatHistoryBetweenUsers(@Param("user1") String user1, @Param("user2") String user2);

    List<ChatMessage> findByReceiverNameOrSenderName(String receiverName, String senderName);

    // ADD THIS METHOD FOR PUBLIC MESSAGES
    List<ChatMessage> findByReceiverNameIsNull();
}