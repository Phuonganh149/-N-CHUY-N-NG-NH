package com.cvmanagement.entities;

import com.cvmanagement.enums.AccountRole;

import java.time.LocalDateTime;
import java.util.UUID;

public class Notification {
    private int id;
    private UUID userId;
    private AccountRole roleTarget;
    private String type;
    private String title;
    private String body;
    private int relatedApplicationId;
    private int relatedJobId;
    private boolean read;
    private LocalDateTime createdAt;

    //Constructor tạo object
    public Notification(int id, UUID userId, AccountRole roleTarget, String type, String title, String body, int relatedApplicationId, int relatedJobId, boolean read, LocalDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.roleTarget = roleTarget;
        this.type = type;
        this.title = title;
        this.body = body;
        this.relatedApplicationId = relatedApplicationId;
        this.relatedJobId = relatedJobId;
        this.read = read;
        this.createdAt = createdAt;
    }
}
