package com.chat_app.chat.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
public class ChatGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @ManyToMany(fetch = FetchType.LAZY)
    @JsonIgnore // Prevent serialization of members to avoid lazy loading issues
    private List<Users> members = new ArrayList<>();

    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore // Prevent serialization of messages
    private List<GroupMessage> messages = new ArrayList<>();

    // getters & setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public List<Users> getMembers() { return members; }
    public void setMembers(List<Users> members) { this.members = members; }

    public List<GroupMessage> getMessages() { return messages; }
    public void setMessages(List<GroupMessage> messages) { this.messages = messages; }
}