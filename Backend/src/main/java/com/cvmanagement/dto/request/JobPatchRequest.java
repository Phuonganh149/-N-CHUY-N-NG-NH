package com.cvmanagement.dto.request;

import java.time.Instant;

public class JobPatchRequest {
    private String title;
    private Instant Deadline;
    private boolean titleProvided = false;
    private boolean deadlineProvided = false;

    public void setTitle(String title) {
        this.title = title;
        this.titleProvided = true;
    }

    public void setDeadline(Instant deadline) {
        Deadline = deadline;
        this.deadlineProvided = true;
    }

    public String getTitle() {
        return title;
    }

    public Instant getDeadline() {
        return Deadline;
    }

    public boolean isTitleProvided() {
        return titleProvided;
    }

    public boolean isDeadlineProvided() {
        return deadlineProvided;
    }
}
