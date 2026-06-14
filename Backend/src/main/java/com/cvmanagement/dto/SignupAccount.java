package com.cvmanagement.dto;

import com.cvmanagement.enums.AccountProvider;

import java.time.Instant;
import java.util.UUID;

public record SignupAccount(
        UUID userId,
        AccountProvider provider,
        String fullname,
        String email,
        Instant createdAt,
        Instant updatedAt) {
}
