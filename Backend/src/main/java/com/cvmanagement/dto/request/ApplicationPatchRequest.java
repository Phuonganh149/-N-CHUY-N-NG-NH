package com.cvmanagement.dto.request;

import com.cvmanagement.enums.ApplicationStatus;
import com.cvmanagement.enums.PipelineStage;

public class ApplicationPatchRequest {
    private ApplicationStatus status;
    private PipelineStage stage;
    private String adminNote;

    private boolean statusProvided = false;
    private boolean stageProvided = false;
    private boolean adminNoteProvided = false;

    // Chỉ được khởi tạo application patch request khi có application_id
    public ApplicationPatchRequest() {
    }

    public void setStatus(ApplicationStatus status) {
        this.status = status;
        this.statusProvided = true;
    }

    public void setAdminNote(String adminNote) {
        this.adminNote = adminNote;
        this.adminNoteProvided = true;
    }

    public void setStage(PipelineStage stage) {
        this.stage = stage;
        this.stageProvided = true;
    }

    public boolean isStatusProvided() {
        return statusProvided;
    }

    public boolean isStageProvided() {
        return stageProvided;
    }

    public boolean isAdminNoteProvided() {
        return adminNoteProvided;
    }

    public String getAdminNote() {
        return adminNote;
    }

    public PipelineStage getStage() {
        return stage;
    }

    public ApplicationStatus getStatus() {
        return status;
    }
}
