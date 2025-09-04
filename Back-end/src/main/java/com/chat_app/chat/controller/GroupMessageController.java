package com.chat_app.chat.controller;


import com.chat_app.chat.model.GroupMessageDTO;
import com.chat_app.chat.model.GroupMessageRequest;
import com.chat_app.chat.service.GroupService;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
public class GroupMessageController {

    private final GroupService groupService;

    public GroupMessageController(GroupService groupService) {
        this.groupService = groupService;
    }

    @MessageMapping("/group-message")
    public void handleGroupMessage(GroupMessageRequest request) {
        groupService.sendGroupMessage(
                request.getGroupId(),
                request.getSenderName(),
                request.getMessage(),
                request.getMedia(),
                request.getMediaType()
        );
    }

    @GetMapping("/{groupId}/messages")
    public ResponseEntity<List<GroupMessageDTO>> getGroupMessages(@PathVariable Long groupId) {
        return ResponseEntity.ok(groupService.getGroupMessagesAsDTOs(groupId));
    }
}