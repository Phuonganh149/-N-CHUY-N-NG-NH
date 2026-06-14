package com.cvmanagement.dto;

import com.cvmanagement.enums.AccountProvider;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public class SupabaseSignupResponse {

    private User user;

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class User {

        private UUID id;

        private String email;

        @JsonProperty("created_at")
        private Instant createdAt;

        @JsonProperty("updated_at")
        private Instant updatedAt;

        private List<Identity> identities;

        public AccountProvider getProvider() {
            if (identities != null && !identities.isEmpty()) {
                return identities.getFirst().getProvider();
            }
            return null;
        }

        public UUID getId() {
            return id;
        }

        public void setId(UUID id) {
            this.id = id;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
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

        public List<Identity> getIdentities() {
            return identities;
        }

        public void setIdentities(List<Identity> identities) {
            this.identities = identities;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Identity {

        private AccountProvider provider;

        public AccountProvider getProvider() {
            return provider;
        }

        public void setProvider(String provider) {
            this.provider = AccountProvider.valueOf(provider.replace(provider.charAt(0), Character.toUpperCase(provider.charAt(0))));
        }
    }
}
