package com.cvmanagement.mappers;

import com.cvmanagement.entities.Account;
import com.cvmanagement.entities.Candidate;
import com.cvmanagement.enums.AccountProvider;
import com.cvmanagement.enums.AccountRole;
import com.cvmanagement.enums.AccountStatus;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.UUID;

import static com.cvmanagement.enums.DBSchema.User.*;

public class mapUsers {
    public static Account mapAccount(ResultSet rs) throws SQLException {
        UUID userId = (UUID) rs.getObject(USER_ID.value());
        String displayCode = rs.getString(DISPLAY_CODE.value());
        String username = rs.getString(USERNAME.value());
        AccountRole role = AccountRole.valueOf(rs.getString(ROLE.value()));
        String full_name = rs.getString(FULLNAME.value());
        String email = rs.getString(EMAIL.value());
        String phone = rs.getString(PHONE.value());
        String address = rs.getString(ADDRESS.value());
        String bio = rs.getString(BIO.value());
        AccountStatus status = AccountStatus.valueOf(rs.getString(STATUS.value()));
        AccountProvider provider = AccountProvider.valueOf(rs.getString(PROVIDER.value()));
        String providerId = rs.getString(PROVIDER_ID.value());
        boolean twoFactorEnabled = rs.getBoolean(TWOFACTORENABLED.value());
        String avatarUrl = rs.getString(AVATAR_URL.value());
        Instant createdAt = rs.getTimestamp(CREATED_AT.value()).toInstant();
        Instant updatedAt = rs.getTimestamp(UPDATED_AT.value()).toInstant();
        return new Account(
                userId,
                displayCode,
                username,
                role,
                full_name,
                email,
                phone,
                address,
                bio,
                status,
                provider,
                providerId,
                twoFactorEnabled,
                avatarUrl,
                createdAt,
                updatedAt
        );
    }

    public static Candidate mapCandidate(ResultSet rs) throws SQLException {
        UUID userId = (UUID) rs.getObject(USER_ID.value());
        String displayCode = rs.getString(DISPLAY_CODE.value());
        String username = rs.getString(USERNAME.value());
        AccountRole role = AccountRole.valueOf(rs.getString(ROLE.value()));
        String full_name = rs.getString(FULLNAME.value());
        String email = rs.getString(EMAIL.value());
        String phone = rs.getString(PHONE.value());
        String address = rs.getString(ADDRESS.value());
        String bio = rs.getString(BIO.value());
        AccountStatus status = AccountStatus.valueOf(rs.getString(STATUS.value()));
        AccountProvider provider = AccountProvider.valueOf(rs.getString(PROVIDER.value()));
        String providerId = rs.getString(PROVIDER_ID.value());
        boolean twoFactorEnabled = rs.getBoolean(TWOFACTORENABLED.value());
        String avatarUrl = rs.getString(AVATAR_URL.value());
        Instant createdAt = rs.getTimestamp(CREATED_AT.value()).toInstant();
        Instant updatedAt = rs.getTimestamp(UPDATED_AT.value()).toInstant();
        return new Candidate(
                userId,
                displayCode,
                username,
                role,
                full_name,
                email,
                phone,
                address,
                bio,
                status,
                provider,
                providerId,
                twoFactorEnabled,
                avatarUrl,
                createdAt,
                updatedAt
        );
    }
}
