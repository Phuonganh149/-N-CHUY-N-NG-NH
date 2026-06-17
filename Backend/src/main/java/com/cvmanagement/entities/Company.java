package com.cvmanagement.entities;

import com.cvmanagement.enums.CompanyLocation;
import com.cvmanagement.enums.CompanyStatus;

import java.time.Instant;

public class Company {
    private int id;
    private String name;
    private String slug;
    private String industry;
    private CompanyLocation location;
    private String plan;
    private CompanyStatus status;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant verifiedAt;
    private String rejectedReason;

    //Constructor tạo object giữa component
    public Company(int id, String name, String slug, String industry, CompanyLocation location, String plan, CompanyStatus status, Instant createdAt, Instant updatedAt, Instant verifiedAt, String rejectedReason) {
        this.id = id;
        this.name = name;
        this.slug = slug;
        this.industry = industry;
        this.location = location;
        this.plan = plan;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.verifiedAt = verifiedAt;
        this.rejectedReason = rejectedReason;
    }

    //Constructor khi tạo công ty mới
    public Company(String name, String industry, CompanyLocation location, String plan) {
        this.name = name;
        this.slug = this.name.toLowerCase().trim().replace(" ", "-");
        this.industry = industry;
        this.location = location;
        this.plan = plan;
        this.status = CompanyStatus.ACTIVE;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        this.verifiedAt = null;
        this.rejectedReason = null;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getIndustry() {
        return industry;
    }

    public void setIndustry(String industry) {
        this.industry = industry;
    }

    public CompanyLocation getLocation() {
        return location;
    }

    public void setLocation(CompanyLocation location) {
        this.location = location;
    }

    public String getPlan() {
        return plan;
    }

    public void setPlan(String plan) {
        this.plan = plan;
    }

    public CompanyStatus getStatus() {
        return status;
    }

    public void setStatus(CompanyStatus status) {
        this.status = status;
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

    public Instant getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(Instant verifiedAt) {
        this.verifiedAt = verifiedAt;
    }

    public String getRejectedReason() {
        return rejectedReason;
    }

    public void setRejectedReason(String rejectedReason) {
        this.rejectedReason = rejectedReason;
    }
}

