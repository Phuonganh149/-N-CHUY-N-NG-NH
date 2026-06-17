package com.cvmanagement.dto.response.Candidate;

import com.cvmanagement.entities.Candidate;
import com.cvmanagement.enums.AccountRole;
import com.cvmanagement.enums.AccountStatus;

import java.util.UUID;


public class CandidateGetResponse {
    private final UUID userId;
    private final String displayCode;
    private final AccountRole role;
    private final String fullname;
    private final String email;
    private final String phone;
    private final AccountStatus status;

    public CandidateGetResponse(Candidate candidate) {
        this.userId = candidate.getUserId();
        this.displayCode = candidate.getDisplayCode();
        this.role = candidate.getRole();
        this.fullname = candidate.getFullname();
        this.email = candidate.getEmail();
        this.phone = candidate.getPhone();
        this.status = candidate.getStatus();
    }

    public UUID getUserId() {
        return userId;
    }

    public String getDisplayCode() {
        return displayCode;
    }

    public AccountRole getRole() {
        return role;
    }

    public String getFullname() {
        return fullname;
    }

    public String getEmail() {
        return email;
    }

    public String getPhone() {
        return phone;
    }

    public AccountStatus getStatus() {
        return status;
    }
}
