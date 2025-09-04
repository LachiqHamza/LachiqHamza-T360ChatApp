package com.chat_app.chat.repository;


import com.chat_app.chat.entity.ChatGroup;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GroupRepository extends JpaRepository<ChatGroup, Long> {
}
