package com.cvmanagement.entities;

import com.cvmanagement.enums.JobLocation;
import com.cvmanagement.enums.JobStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.StringJoiner;
import java.util.UUID;

public class Job {
    private int id;
    private UUID userId;
    private String title;
    private String company;
    private JobLocation location;
    private String salaryText;
    private BigDecimal salaryMin;
    private BigDecimal salaryMax;
    private String department;
    private int quantity;
    private String description;
    private String requirements;
    private ArrayList<String> tags = new ArrayList<>();
    private Instant deadline;
    private JobStatus status;
    private boolean active;
    private Instant createdAt;
    private Instant updatedAt;

    public Job(int id, UUID userId, String title, String company, JobLocation location, String salaryText, BigDecimal salaryMin, BigDecimal salaryMax, String department, int quantity, String description, String requirements, ArrayList<String> tags, Instant deadline, JobStatus status, boolean active, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.userId = userId;
        this.title = title;
        this.company = company;
        this.location = location;
        this.salaryText = salaryText;
        this.salaryMin = salaryMin;
        this.salaryMax = salaryMax;
        this.department = department;
        this.quantity = quantity;
        this.description = description;
        this.requirements = requirements;
        this.tags = tags;
        this.deadline = deadline;
        this.status = status;
        this.active = active;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Job() {

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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getCompany() {
        return company;
    }

    public void setCompany(String company) {
        this.company = company;
    }

    public JobLocation getLocation() {
        return location;
    }

    public void setLocation(JobLocation location) {
        this.location = location;
    }

    public String getSalaryText() {
        return salaryText;
    }

    public void setSalaryText(String salaryText) {
        this.salaryText = salaryText;
    }

    public BigDecimal getSalaryMin() {
        return salaryMin;
    }

    public void setSalaryMin(BigDecimal salaryMin) {
        this.salaryMin = salaryMin;
    }

    public BigDecimal getSalaryMax() {
        return salaryMax;
    }

    public void setSalaryMax(BigDecimal salaryMax) {
        this.salaryMax = salaryMax;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getRequirements() {
        return requirements;
    }

    public void setRequirements(String requirements) {
        this.requirements = requirements;
    }

    public String getTags() {
        StringJoiner result = new StringJoiner(", ");
        for (String elem : this.tags) {
            result.add(elem);
        }
        return result.toString();
    }

    public void setTags(ArrayList<String> tags) {
        this.tags = tags;
    }

    public Instant getDeadline() {
        return deadline;
    }

    public void setDeadline(Instant deadline) {
        this.deadline = deadline;
    }

    public JobStatus getStatus() {
        return status;
    }

    public void setStatus(JobStatus status) {
        this.status = status;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}

