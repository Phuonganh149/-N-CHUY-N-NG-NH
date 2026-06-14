package com.cvmanagement.dto.request;

public record CandidateSignupRequest(
        String password,
        String email,
        String fullname
) {
}
