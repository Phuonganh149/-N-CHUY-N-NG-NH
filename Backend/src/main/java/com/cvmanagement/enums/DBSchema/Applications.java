package com.cvmanagement.enums.DBSchema;

public enum Applications {
    APPLICATION_ID("id"),
    USER_ID("user_id"),
    JOB_ID("job_id"),
    CV_ID("cv_id"),
    STATUS("status"),
    PIPELINE_STAGE("pipeline_stage"),
    ADMIN_NOTE("admin_note"),
    APPLIED_AT("applied_at"),
    UPDATED_AT("updated_at");

    private final String value;

    Applications(String value) {
        this.value = value;
    }

    public String value() {
        return this.value;
    }
}


