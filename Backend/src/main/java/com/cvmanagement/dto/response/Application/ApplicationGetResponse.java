package com.cvmanagement.dto.response.Application;

import com.cvmanagement.entities.applications;
import com.cvmanagement.enums.ApplicationStatus;
import com.cvmanagement.enums.PipelineStage;

import java.time.Instant;
import java.util.UUID;

public class ApplicationGetResponse {
    private final int id;
    private final UUID userId;
    private final int jobId;
    private final int cvId;
    private final ApplicationStatus status;
    private final PipelineStage stage;
    private final String admin_note;
    private final Instant applied_at;
    private final Instant updated_at;

    public ApplicationGetResponse(applications app) {
        this.id = app.getId();
        this.userId = app.getUserId();
        this.jobId = app.getJobId();
        this.cvId = app.getCvId();
        this.status = app.getStatus();
        this.stage = app.getStage();
        this.admin_note = app.getAdminNote();
        this.applied_at = app.getAppliedAt();
        this.updated_at = app.getUpdatedAt();
    }

    public int getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public int getJobId() {
        return jobId;
    }

    public int getCvId() {
        return cvId;
    }

    public ApplicationStatus getStatus() {
        return status;
    }

    public PipelineStage getStage() {
        return stage;
    }

    public String getAdmin_note() {
        return admin_note;
    }

    public Instant getApplied_at() {
        return applied_at;
    }

    public Instant getUpdated_at() {
        return updated_at;
    }
}
