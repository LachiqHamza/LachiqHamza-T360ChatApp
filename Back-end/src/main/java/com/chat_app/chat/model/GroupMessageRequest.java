package com.chat_app.chat.model;

import lombok.Data;

@Data
public class GroupMessageRequest {
    private Long groupId;
    private String senderName;
    private String message;
    private String media;
    private String mediaType;
}