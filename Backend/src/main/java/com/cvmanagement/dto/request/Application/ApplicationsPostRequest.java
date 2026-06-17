package com.cvmanagement.dto.request.Application;

import java.util.UUID;

public class ApplicationsPostRequest {
    private UUID applicateCandidateId;
    private int jobId;
    private String email;

    public UUID getApplicateCandidateId() {
        return applicateCandidateId;
    }

    public void setApplicateCandidateId(UUID applicateCandidateId) {
        this.applicateCandidateId = applicateCandidateId;
    }

    public int getJobId() {
        return jobId;
    }

    public void setJobId(int jobId) {
        this.jobId = jobId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
