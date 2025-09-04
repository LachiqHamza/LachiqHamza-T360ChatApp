package com.chat_app.chat.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "group_message")
public class GroupMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String senderName;
    private String message;
    private String media;
    private String mediaType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    @JsonIgnore // Prevent circular reference during serialization
    private ChatGroup group;

    private LocalDateTime timestamp;

    public GroupMessage(String senderName, String message, String media,
                        String mediaType, ChatGroup group) {
        this.senderName = senderName;
        this.message = message;
        this.media = media;
        this.mediaType = mediaType;
        this.group = group;
        this.timestamp = LocalDateTime.now();
    }
}