package com.cvmanagement.dto.request.Candidate;

public record CandidateSignupRequest(
        String email,
        String password,
        String fullname
) {
}
