package com.cvmanagement.dto;

import java.util.UUID;

public class user {
    private UUID id;
    private String email;

    public UUID getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
