package com.chat_app.chat.configuration;

import com.chat_app.chat.service.UserPresenceService;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
public class WebSocketEventListener {

    private final UserPresenceService userPresenceService;

    public WebSocketEventListener(UserPresenceService userPresenceService) {
        this.userPresenceService = userPresenceService;
    }

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        SimpMessageHeaderAccessor headers = SimpMessageHeaderAccessor.wrap(event.getMessage());
        String username = headers.getUser() != null ? headers.getUser().getName() : null;
        if (username != null) {
            userPresenceService.userConnected(username);
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String username = headerAccessor.getUser() != null ? headerAccessor.getUser().getName() : null;
        if (username != null) {
            userPresenceService.userDisconnected(username);
        }
    }
}