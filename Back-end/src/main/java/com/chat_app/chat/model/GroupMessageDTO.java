package com.chat_app.chat.model;

import com.chat_app.chat.entity.GroupMessage;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class GroupMessageDTO {
    private Long id;
    private String senderName;
    private String message;
    private String media;
    private String mediaType;
    private Long groupId;
    private String groupName;
    private LocalDateTime timestamp;

    public GroupMessageDTO(GroupMessage message) {
        this.id = message.getId();
        this.senderName = message.getSenderName();
        this.message = message.getMessage();
        this.media = message.getMedia();
        this.mediaType = message.getMediaType();
        this.groupId = message.getGroup().getId();
        this.groupName = message.getGroup().getName();
        this.timestamp = message.getTimestamp();
    }
}