package com.cvmanagement.entities;

import com.cvmanagement.enums.AccountProvider;
import com.cvmanagement.enums.AccountRole;
import com.cvmanagement.enums.AccountStatus;

import java.time.Instant;
import java.util.UUID;

public class Candidate extends Account {
    //Constructor dể tạo object
    public Candidate(
            UUID userId,
            String displayCode,
            String username,
            AccountRole role,
            String fullname,
            String email,
            String phone,
            String address,
            String bio,
            AccountStatus status,
            AccountProvider provider,
            String providerId,
            boolean twoFactorEnabled,
            String avatarUrl,
            Instant createdAt,
            Instant updatedAt) {
        super(userId, displayCode, username, role, fullname, email, phone, address, bio, status, provider, providerId, twoFactorEnabled, avatarUrl, createdAt, updatedAt);
    }

    //Constructor dùng khi tạo tài khoản candidate local
    public Candidate(
            UUID userId,
            String displayCode,
            String fullName, String email,
            Instant createdAt,
            Instant updatedAt) {
        super(userId, displayCode, fullName, email, AccountRole.Candidate, createdAt, updatedAt);
    }

    //Constructor dùng khi tạo tài khoản candidate bằng provider
    public Candidate(String displayCode, String fullName, String email, AccountProvider provider, String providerId) {
        super(displayCode, fullName, email, AccountRole.Candidate, provider, providerId);
    }
}
