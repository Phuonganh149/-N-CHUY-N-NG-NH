package com.cvmanagement.dto.request;

import com.cvmanagement.entities.Job;
import com.cvmanagement.enums.JobStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;

public class JobGetResponse {
    private final String title;
    private final String company;
    private final String location;
    private final String salaryText;
    private final BigDecimal salaryMin;
    private final BigDecimal salaryMax;
    private final String department;
    private final int quantity;
    private final String description;
    private final String tags;
    private final LocalDate deadline;
    private final boolean active;
    private final JobStatus status;
    private final LocalDate createdAt;
    private final LocalDate updatedAt;

    public JobGetResponse(Job job) {
        this.title = job.getTitle();
        this.company = job.getCompany();
        this.location = job.getLocation().toString();
        this.salaryText = job.getSalaryText();
        this.salaryMin = job.getSalaryMin();
        this.salaryMax = job.getSalaryMax();
        this.department = job.getDepartment();
        this.quantity = job.getQuantity();
        this.description = job.getDescription();
        this.tags = job.getTags();
        this.deadline = job.getDeadline().atZone(ZonedDateTime.now().getZone()).toLocalDate();
        this.active = job.isActive();
        this.status = job.getStatus();
        this.createdAt = job.getCreatedAt().atZone(ZonedDateTime.now().getZone()).toLocalDate();
        this.updatedAt = job.getUpdatedAt().atZone(ZonedDateTime.now().getZone()).toLocalDate();
    }

    public String getTitle() {
        return title;
    }

    public String getCompany() {
        return company;
    }

    public String getLocation() {
        return location;
    }

    public String getSalaryText() {
        return salaryText;
    }

    public BigDecimal getSalaryMin() {
        return salaryMin;
    }

    public BigDecimal getSalaryMax() {
        return salaryMax;
    }

    public String getDepartment() {
        return department;
    }

    public int getQuantity() {
        return quantity;
    }

    public String getDescription() {
        return description;
    }

    public String getTags() {
        return tags;
    }

    public LocalDate getDeadline() {
        return deadline;
    }

    public boolean isActive() {
        return active;
    }

    public JobStatus getStatus() {
        return status;
    }

    public LocalDate getCreatedAt() {
        return createdAt;
    }

    public LocalDate getUpdatedAt() {
        return updatedAt;
    }
}
