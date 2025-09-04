package com.chat_app.chat.controller;

import com.chat_app.chat.entity.ChatMessage;
import com.chat_app.chat.entity.Users;
import com.chat_app.chat.model.LoginRequest;
import com.chat_app.chat.model.Message;
import com.chat_app.chat.model.UserDto;
import com.chat_app.chat.repository.ChatMessageRepository;
import com.chat_app.chat.repository.UserRepository;
import com.chat_app.chat.service.UserPresenceService;
import com.chat_app.chat.service.UserService;
import jakarta.servlet.http.HttpSession;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@AllArgsConstructor
@RequestMapping("/api/users")
public class ChatController {

    private final SimpMessagingTemplate simpMessagingTemplate;
    private final UserRepository userRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserPresenceService userPresenceService;

    @Autowired
    private UserService userService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest, HttpSession session) {
        Users user = userRepository.findByUsername(loginRequest.getUsername());
        if (user == null) {
            return ResponseEntity.status(404).body("User not found");
        }

        if (!user.getPassword().equals(loginRequest.getPassword())) {
            return ResponseEntity.status(401).body("Invalid password");
        }

        // Set session attribute
        session.setAttribute("user", user);

        return ResponseEntity.ok("Login successful");
    }

    @GetMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok("Logged out successfully");
    }

    @GetMapping("/search")
    public ResponseEntity<Users> findByUsername(@RequestParam String username) {
        Users user = userService.findByUsername(username);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
        return ResponseEntity.ok(user);
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody UserDto userDto) {
        Users user = new Users();
        user.setUsername(userDto.getUsername());
        user.setName(userDto.getName());
        user.setEmail(userDto.getEmail());
        user.setPassword(userDto.getPassword());
        userRepository.save(user);
        return ResponseEntity.ok("User created successfully");
    }

    // File upload endpoint
    @PostMapping("/upload")
    public ResponseEntity<String> handleFileUpload(@RequestParam("file") MultipartFile file) {
        try {
            // Create uploads directory if it doesn't exist
            Path uploadsDir = Paths.get("uploads");
            if (!Files.exists(uploadsDir)) {
                Files.createDirectories(uploadsDir);
            }

            // Generate unique filename
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Path filePath = uploadsDir.resolve(fileName);

            // Save file
            Files.write(filePath, file.getBytes());

            return ResponseEntity.ok(fileName);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to upload file: " + e.getMessage());
        }
    }

    // File retrieval endpoint
    @GetMapping("/files/{filename}")
    public ResponseEntity<byte[]> getFile(@PathVariable String filename) {
        try {
            Path filePath = Paths.get("uploads").resolve(filename);
            if (!Files.exists(filePath)) {
                return ResponseEntity.notFound().build();
            }

            byte[] fileContent = Files.readAllBytes(filePath);
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            return ResponseEntity.ok()
                    .header("Content-Type", contentType)
                    .body(fileContent);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @MessageMapping("/message")
    @SendTo("/chatroom/public")
    public Message receiveMessage(Message message) throws InterruptedException {
        // Save to the database (now stores filename instead of base64)
        chatMessageRepository.save(new ChatMessage(
                message.getSenderName(),
                message.getReceiverName(),
                message.getMessage(),
                message.getMedia(), // This is now the filename
                message.getMediaType(),
                message.getStatus(),
                System.currentTimeMillis()
        ));

        Thread.sleep(1000);
        return message;
    }

    @MessageMapping("/private-message")
    public void privateMessage(Message message) {
        String receiver = message.getReceiverName();
        simpMessagingTemplate.convertAndSendToUser(receiver, "/private", message);

        // Save private message to the database
        chatMessageRepository.save(new ChatMessage(
                message.getSenderName(),
                message.getReceiverName(),
                message.getMessage(),
                message.getMedia(), // This is now the filename
                message.getMediaType(),
                message.getStatus(),
                System.currentTimeMillis()
        ));
    }

    @GetMapping("/messages/history/{user1}/{user2}")
    public ResponseEntity<List<ChatMessage>> getChatHistory(
            @PathVariable String user1,
            @PathVariable String user2
    ) {
        List<ChatMessage> messages = chatMessageRepository.findChatHistoryBetweenUsers(user1, user2);
        return ResponseEntity.ok(messages);
    }

    // Add these endpoints for online users functionality
    @GetMapping("/online-users")
    public ResponseEntity<Set<String>> getOnlineUsers() {
        return ResponseEntity.ok(userPresenceService.getOnlineUsers());
    }

    @GetMapping("/users/{username}/status")
    public ResponseEntity<Boolean> isUserOnline(@PathVariable String username) {
        return ResponseEntity.ok(userPresenceService.isUserOnline(username));
    }
    @GetMapping("/messages/public")
    public ResponseEntity<List<ChatMessage>> getPublicMessages() {
        // Get messages where receiver is null (public messages)
        List<ChatMessage> publicMessages = chatMessageRepository.findByReceiverNameIsNull();
        return ResponseEntity.ok(publicMessages);
    }
}