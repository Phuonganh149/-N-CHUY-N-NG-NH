package com.cvmanagement.entities;

import com.cvmanagement.enums.AccountProvider;
import com.cvmanagement.enums.AccountRole;
import com.cvmanagement.enums.AccountStatus;

import java.time.Instant;
import java.util.UUID;

public class Account {
    private UUID userId;
    private String displayCode;
    private String username;
    private AccountRole role;
    private String fullname;
    private String email;
    private String phone;
    private String address;
    private String bio;
    private AccountStatus status;
    private AccountProvider provider;
    private String providerId;
    private boolean twoFactorEnabled;
    private String avatarUrl;
    private Instant createdAt;
    private Instant updatedAt;

    //Constructor when create object in program
    public Account(UUID userId, String displayCode, String username, AccountRole role, String fullname, String email, String phone, String address, String bio, AccountStatus status, AccountProvider provider, String providerId, boolean twoFactorEnabled, String avatarUrl, Instant createdAt, Instant updatedAt) {
        this.userId = userId;
        this.displayCode = displayCode;
        this.username = username;
        this.role = role;
        this.fullname = fullname;
        this.email = email;
        this.phone = phone;
        this.address = address;
        this.bio = bio;
        this.status = status;
        this.provider = provider;
        this.providerId = providerId;
        this.twoFactorEnabled = twoFactorEnabled;
        this.avatarUrl = avatarUrl;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    //Constructor khi tạo tài khoản bằng phương pháp local
    public Account(UUID userId, String displayCode, String fullname, String email, AccountRole role, Instant createdAt, Instant updatedAt) {
        this.userId = userId;
        this.displayCode = displayCode;
        this.fullname = fullname;
        this.email = email;
        this.role = role;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.status = AccountStatus.ACTIVE;
        this.provider = AccountProvider.LOCAL;
        this.twoFactorEnabled = false;
        this.phone = null;
        this.address = null;
        this.providerId = null;
        this.bio = null;
        this.avatarUrl = null;
        this.username = null;
    }

    //Constructor khi tạo tài khoản bằng provider
    public Account(String displayCode, String fullname, String email, AccountRole role, AccountProvider provider, String providerId) {
        this.displayCode = displayCode;
        this.fullname = fullname;
        this.email = email;
        this.role = role;
        this.status = AccountStatus.ACTIVE;
        this.provider = provider;
        this.providerId = providerId;
        this.twoFactorEnabled = false;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        this.avatarUrl = null;
        this.phone = null;
        this.username = null;
        this.address = null;
        this.bio = null;
    }

    public UUID getUserid() {
        return userId;
    }

    public void setUserid(UUID userId) {
        this.userId = userId;
    }

    public String getDisplayCode() {
        return displayCode;
    }

    public void setDisplayCode(String displayCode) {
        this.displayCode = displayCode;
    }

    public AccountRole getRole() {
        return role;
    }

    public void setRole(AccountRole role) {
        this.role = role;
    }

    public String getFullName() {
        return this.fullname;
    }

    public void setFullName(String fullName) {
        this.fullname = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public AccountStatus getStatus() {
        return status;
    }

    public void setStatus(AccountStatus status) {
        this.status = status;
    }

    public AccountProvider getProvider() {
        return provider;
    }

    public void setProvider(AccountProvider provider) {
        this.provider = provider;
    }

    public String getProviderId() {
        return providerId;
    }

    public void setProviderId(String providerId) {
        this.providerId = providerId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getFullname() {
        return fullname;
    }

    public void setFullname(String fullname) {
        this.fullname = fullname;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public boolean isTwoFactorEnabled() {
        return twoFactorEnabled;
    }

    public void setTwoFactorEnabled(boolean twoFactorEnabled) {
        this.twoFactorEnabled = twoFactorEnabled;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }
}
