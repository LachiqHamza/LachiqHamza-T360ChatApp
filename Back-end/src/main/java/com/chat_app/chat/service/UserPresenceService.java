package com.chat_app.chat.service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class UserPresenceService {
    private final Set<String> onlineUsers = ConcurrentHashMap.newKeySet();
    private final SimpMessagingTemplate messagingTemplate;

    public UserPresenceService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void userConnected(String username) {
        onlineUsers.add(username);
        broadcastOnlineUsers();
    }

    public void userDisconnected(String username) {
        onlineUsers.remove(username);
        broadcastOnlineUsers();
    }

    public Set<String> getOnlineUsers() {
        return new HashSet<>(onlineUsers);
    }

    public boolean isUserOnline(String username) {
        return onlineUsers.contains(username);
    }

    private void broadcastOnlineUsers() {
        messagingTemplate.convertAndSend("/topic/online-users", onlineUsers);
    }
}
