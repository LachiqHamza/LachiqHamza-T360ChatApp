package com.chat_app.chat.repository;

import com.chat_app.chat.entity.GroupMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GroupMessageRepository extends JpaRepository<GroupMessage, Long> {
    List<GroupMessage> findByGroupIdOrderByTimestampAsc(Long groupId);

    @Query("SELECT gm FROM GroupMessage gm WHERE gm.group.id = :groupId ORDER BY gm.timestamp ASC")
    List<GroupMessage> findGroupMessages(@Param("groupId") Long groupId);
}
