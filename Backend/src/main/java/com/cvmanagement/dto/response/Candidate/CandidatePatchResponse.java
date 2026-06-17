package com.cvmanagement.dto.response.Candidate;

import com.cvmanagement.entities.Candidate;
import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class CandidatePatchResponse {
    private final String full_name;
    private final String bio;
    private final String address;
    private final String username;
    private final String email;
    private final String phone;
    private final Boolean twoFactorEnabled;

    public CandidatePatchResponse(Candidate acc) {
        this.full_name = acc.getFullName();
        this.bio = acc.getBio();
        this.address = acc.getAddress();
        this.username = acc.getUsername();
        this.email = acc.getEmail();
        this.phone = acc.getPhone();
        this.twoFactorEnabled = acc.isTwoFactorEnabled();
    }

    public String getFull_name() {
        return full_name;
    }

    public String getBio() {
        return bio;
    }

    public String getAddress() {
        return address;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public String getPhone() {
        return phone;
    }

    public Boolean getTwoFactorEnabled() {
        return twoFactorEnabled;
    }
}
