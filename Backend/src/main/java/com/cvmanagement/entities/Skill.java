package com.cvmanagement.entities;

import java.time.Instant;

public class Skill {
    private int id;
    private String name;
    private Instant createdAt;

    //Constructor khi tạo object
    public Skill(int id, String name, Instant createdAt) {
        this.id = id;
        this.name = name;
        this.createdAt = createdAt;
    }

    //Constuctor khi tạo skill mới
    public Skill(String name) {
        this.name = name;
        this.createdAt = Instant.now();
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
