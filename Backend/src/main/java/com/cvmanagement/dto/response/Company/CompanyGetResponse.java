package com.cvmanagement.dto.response.Company;

import com.cvmanagement.entities.Company;
import com.cvmanagement.enums.CompanyStatus;

import java.time.Instant;

public class CompanyGetResponse {
    private final int id;
    private final String name;
    private final String slug;
    private final String industry;
    private final String location;
    private final String plan;
    private final CompanyStatus status;
    private final Instant created_at;
    private final Instant updated_at;
    private final Instant verified_at;
    private final String rejected_reason;

    public CompanyGetResponse(Company company) {
        this.id = company.getId();
        this.name = company.getName();
        this.slug = company.getSlug();
        this.industry = company.getIndustry();
        this.location = company.getLocation();
        this.plan = company.getPlan();
        this.status = company.getStatus();
        this.created_at = company.getCreatedAt();
        this.updated_at = company.getUpdatedAt();
        this.verified_at = company.getVerifiedAt();
        this.rejected_reason = company.getRejectedReason();
    }

    public int getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getSlug() {
        return slug;
    }

    public String getIndustry() {
        return industry;
    }

    public String getLocation() {
        return location;
    }

    public String getPlan() {
        return plan;
    }

    public CompanyStatus getStatus() {
        return status;
    }

    public Instant getCreated_at() {
        return created_at;
    }

    public Instant getUpdated_at() {
        return updated_at;
    }

    public Instant getVerified_at() {
        return verified_at;
    }

    public String getRejected_reason() {
        return rejected_reason;
    }
}
