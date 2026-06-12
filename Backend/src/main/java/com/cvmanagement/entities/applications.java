package com.cvmanagement.entities;

import com.cvmanagement.enums.ApplicationStatus;
import com.cvmanagement.enums.PipelineStage;

import java.time.Instant;
import java.util.UUID;

public class applications {
    private int id;
    private UUID userId;
    private int jobId;
    private int cvId;
    private ApplicationStatus status;
    private PipelineStage stage;
    private String adminNote;
    private Instant appliedAt;
    private Instant updatedAt;

    //Constructor tạo object trong system
    public applications(int id, UUID userId, int jobId, int cvId, ApplicationStatus status, PipelineStage stage, String adminNote, Instant appliedAt, Instant updatedAt) {
        this.id = id;
        this.userId = userId;
        this.jobId = jobId;
        this.cvId = cvId;
        this.status = status;
        this.stage = stage;
        this.adminNote = adminNote;
        this.appliedAt = appliedAt;
        this.updatedAt = updatedAt;
    }

    //Constructor khi tạo đơn ứng tuyển mới
    public applications(UUID userId, int jobId, int cvId) {
        this.userId = userId;
        this.jobId = jobId;
        this.cvId = cvId;
        this.status = ApplicationStatus.NEW_APPLIED;
        this.stage = PipelineStage.NEW;
        this.adminNote = null;
        this.appliedAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public int getJobId() {
        return jobId;
    }

    public void setJobId(int jobId) {
        this.jobId = jobId;
    }

    public int getCvId() {
        return cvId;
    }

    public void setCvId(int cvId) {
        this.cvId = cvId;
    }

    public ApplicationStatus getStatus() {
        return status;
    }

    public void setStatus(ApplicationStatus status) {
        this.status = status;
    }

    public PipelineStage getStage() {
        return stage;
    }

    public void setStage(PipelineStage stage) {
        this.stage = stage;
    }

    public String getAdminNote() {
        return adminNote;
    }

    public void setAdminNote(String adminNote) {
        this.adminNote = adminNote;
    }

    public Instant getAppliedAt() {
        return appliedAt;
    }

    public void setAppliedAt(Instant appliedAt) {
        this.appliedAt = appliedAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
