package com.cvmanagement.entities;

import com.cvmanagement.enums.AccountProvider;
import com.cvmanagement.enums.AccountRole;
import com.cvmanagement.enums.AccountStatus;

import java.time.Instant;
import java.util.UUID;

public class Admin extends Account {
    //Constructor khi tạo object


    public Admin(UUID userId, String displayCode, String username, AccountRole role, String fullname, String email, String phone, String address, String bio, AccountStatus status, AccountProvider provider, String providerId, boolean twoFactorEnabled, String avatarUrl, Instant createdAt, Instant updatedAt) {
        super(userId, displayCode, username, role, fullname, email, phone, address, bio, status, provider, providerId, twoFactorEnabled, avatarUrl, createdAt, updatedAt);
    }

    //Constructor khi tạo tài khoản local
    public Admin(UUID userId, String displayCode, String fullname, String email, Instant createdAt, Instant updatedAt) {
        super(userId, displayCode, fullname, email, AccountRole.Admin, createdAt, updatedAt);
    }

    //Constructor khi tạo tài khoản với provider
    public Admin(String displayCode, String fullname, String email, AccountProvider provider, String providerId) {
        super(displayCode, fullname, email, AccountRole.Admin, provider, providerId);
    }
}
