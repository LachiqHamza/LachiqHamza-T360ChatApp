package com.chat_app.chat.controller;

import com.chat_app.chat.entity.ChatGroup;
import com.chat_app.chat.service.GroupService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
public class GroupController {
    private final GroupService groupService;

    public GroupController(GroupService groupService) {
        this.groupService = groupService;
    }

    // Create group
    @PostMapping
    public ResponseEntity<ChatGroup> createGroup(@RequestParam String name) {
        return ResponseEntity.ok(groupService.createGroup(name));
    }

    // Get all groups
    @GetMapping
    public ResponseEntity<List<ChatGroup>> getGroups() {
        return ResponseEntity.ok(groupService.getAllGroups());
    }

    // Get group by ID
    @GetMapping("/{groupId}")
    public ResponseEntity<ChatGroup> getGroup(@PathVariable Long groupId) {
        return ResponseEntity.ok(groupService.getGroup(groupId));
    }

    // Add user to group
    @PostMapping("/{groupId}/addUser/{userId}")
    public ResponseEntity<ChatGroup> addUserToGroup(@PathVariable Long groupId,
                                                    @PathVariable Long userId) {
        return ResponseEntity.ok(groupService.addUserToGroup(groupId, userId));
    }

    // Remove user from group
    @DeleteMapping("/{groupId}/removeUser/{userId}")
    public ResponseEntity<ChatGroup> removeUserFromGroup(@PathVariable Long groupId,
                                                         @PathVariable Long userId) {
        return ResponseEntity.ok(groupService.removeUserFromGroup(groupId, userId));
    }

    // Delete group
    @DeleteMapping("/{groupId}")
    public ResponseEntity<?> deleteGroup(@PathVariable Long groupId) {
        groupService.deleteGroup(groupId);
        return ResponseEntity.ok().build();
    }
}