package com.cvmanagement.entities;

import java.time.LocalDateTime;
import java.util.UUID;

public class UserSkill {
    private int id;
    private UUID userId;
    private int skillId;
    private String level;
    private int yearsOfExperience;
    private LocalDateTime createdAt;

    //Constructor khi tạo object
    public UserSkill(int id, UUID userId, int skillId, String level, int yearsOfExperience, LocalDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.skillId = skillId;
        this.level = level;
        this.yearsOfExperience = yearsOfExperience;
        this.createdAt = createdAt;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public int getSkillId() {
        return skillId;
    }

    public void setSkillId(int skillId) {
        this.skillId = skillId;
    }

    public String getLevel() {
        return level;
    }

    public void setLevel(String level) {
        this.level = level;
    }

    public int getYearsOfExperience() {
        return yearsOfExperience;
    }

    public void setYearsOfExperience(int yearsOfExperience) {
        this.yearsOfExperience = yearsOfExperience;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
