package com.cvmanagement.entities;

import com.cvmanagement.enums.AccountProvider;
import com.cvmanagement.enums.AccountRole;
import com.cvmanagement.enums.AccountStatus;

import java.time.Instant;
import java.util.UUID;

public class HR extends Account {
    //Constructor khi tạo object


    public HR(UUID userId, String displayCode, String username, AccountRole role, String fullname, String email, String phone, String address, String bio, AccountStatus status, AccountProvider provider, String providerId, boolean twoFactorEnabled, String avatarUrl, Instant createdAt, Instant updatedAt) {
        super(userId, displayCode, username, role, fullname, email, phone, address, bio, status, provider, providerId, twoFactorEnabled, avatarUrl, createdAt, updatedAt);
    }

    //Constructor khi tạo tài khoản local
    public HR(UUID userId, String displayCode, String fullname, String email, Instant createdAt, Instant updatedAt) {
        super(userId, displayCode, fullname, email, AccountRole.COMPANY, createdAt, updatedAt);
    }

    //Constructor khi tạo tài khoản với provider

    public HR(String displayCode, String fullname, String email, AccountProvider provider, String providerId) {
        super(displayCode, fullname, email, AccountRole.COMPANY, provider, providerId);
    }
}
