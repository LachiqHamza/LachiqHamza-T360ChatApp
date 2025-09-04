package com.chat_app.chat.service;


import com.chat_app.chat.entity.ChatGroup;
import com.chat_app.chat.entity.GroupMessage;
import com.chat_app.chat.entity.Users;
import com.chat_app.chat.model.GroupMessageDTO;
import com.chat_app.chat.repository.GroupMessageRepository;
import com.chat_app.chat.repository.GroupRepository;
import com.chat_app.chat.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class GroupService {

    private final GroupRepository groupRepository;
    private final UserRepository userRepository;
    private final GroupMessageRepository groupMessageRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public GroupService(GroupRepository groupRepository,
                        UserRepository userRepository,
                        GroupMessageRepository groupMessageRepository,
                        SimpMessagingTemplate messagingTemplate) {
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
        this.groupMessageRepository = groupMessageRepository;
        this.messagingTemplate = messagingTemplate;
    }

    // Create a new group
    @Transactional
    public ChatGroup createGroup(String name) {
        ChatGroup group = new ChatGroup();
        group.setName(name);
        group.setMembers(new ArrayList<>()); // Initialize members list
        return groupRepository.save(group);
    }

    // Get all groups
    @Transactional(readOnly = true)
    public List<ChatGroup> getAllGroups() {
        List<ChatGroup> groups = groupRepository.findAll();
        // Ensure each group has members initialized
        groups.forEach(group -> {
            if (group.getMembers() == null) {
                group.setMembers(new ArrayList<>());
            }
        });
        return groups;
    }

    // Add user to group
    @Transactional
    public ChatGroup addUserToGroup(Long groupId, Long userId) {
        ChatGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new EntityNotFoundException("Group not found"));
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        if (group.getMembers() == null) {
            group.setMembers(new ArrayList<>());
        }

        // Check if user is already in the group
        boolean userExists = group.getMembers().stream()
                .anyMatch(member -> member.getId().equals(userId));

        if (!userExists) {
            group.getMembers().add(user);
        }

        return groupRepository.save(group);
    }

    // Remove user from group
    @Transactional
    public ChatGroup removeUserFromGroup(Long groupId, Long userId) {
        ChatGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new EntityNotFoundException("Group not found"));
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        if (group.getMembers() != null) {
            group.getMembers().removeIf(member -> member.getId().equals(userId));
        }

        return groupRepository.save(group);
    }

    // Delete group
    @Transactional
    public void deleteGroup(Long groupId) {
        // First delete all messages in the group
        List<GroupMessage> messages = groupMessageRepository.findByGroupIdOrderByTimestampAsc(groupId);
        groupMessageRepository.deleteAll(messages);

        // Then delete the group
        ChatGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new EntityNotFoundException("Group not found"));
        groupRepository.delete(group);
    }

    // Get group by ID
    @Transactional(readOnly = true)
    public ChatGroup getGroup(Long groupId) {
        ChatGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new EntityNotFoundException("Group not found"));

        // Ensure members are initialized
        if (group.getMembers() == null) {
            group.setMembers(new ArrayList<>());
        }

        return group;
    }

    // Send group message
    @Transactional
    public GroupMessageDTO sendGroupMessage(Long groupId, String senderName, String message,
                                            String media, String mediaType) {
        ChatGroup group = getGroup(groupId);
        GroupMessage groupMessage = new GroupMessage();
        groupMessage.setSenderName(senderName);
        groupMessage.setMessage(message);
        groupMessage.setMedia(media);
        groupMessage.setMediaType(mediaType);
        groupMessage.setGroup(group);
        groupMessage.setTimestamp(LocalDateTime.now());

        GroupMessage savedMessage = groupMessageRepository.save(groupMessage);

        // Convert to DTO to avoid lazy loading issues
        GroupMessageDTO messageDTO = new GroupMessageDTO(savedMessage);

        // Broadcast message to group
        messagingTemplate.convertAndSend("/topic/group/" + groupId, messageDTO);

        return messageDTO;
    }

    // Get group messages
    @Transactional(readOnly = true)
    public List<GroupMessage> getGroupMessages(Long groupId) {
        return groupMessageRepository.findByGroupIdOrderByTimestampAsc(groupId);
    }

    // Get group messages as DTOs
    @Transactional(readOnly = true)
    public List<GroupMessageDTO> getGroupMessagesAsDTOs(Long groupId) {
        List<GroupMessage> messages = groupMessageRepository.findByGroupIdOrderByTimestampAsc(groupId);
        return messages.stream()
                .map(GroupMessageDTO::new)
                .toList();
    }
}