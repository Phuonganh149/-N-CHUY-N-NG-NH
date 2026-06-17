package com.cvmanagement.dto.request.Company;

import com.cvmanagement.enums.CompanyLocation;
import com.cvmanagement.enums.CompanyStatus;

public class CompanyPatchRequest {
    private String name;
    private String industry;
    private String location;
    private String plan;
    private CompanyStatus status;

    private boolean nameProvided;
    private boolean industryProvided;
    private boolean locationProvided;
    private boolean planProvided;
    private boolean statusProvided;

    public void setName(String name) {
        this.name = name;
        nameProvided = true;
    }

    public void setIndustry(Object industry) {
        if (industry instanceof String) this.industry = industry.toString();
        else if (industry == null) this.industry = null;
        industryProvided = true;
    }

    public void setLocation(Object location) {
        if (location instanceof String) this.location = location.toString();
        else if (industry == null) location = null;
        locationProvided = true;
    }

    public void setPlan(String plan) {
        this.plan = plan;
        planProvided = true;
    }

    public void setStatus(CompanyStatus status) {
        this.status = status;
        statusProvided = true;
    }

    public String getName() {
        return name;
    }

    public String getIndustry() {
        return industry;
    }

    public CompanyLocation getLocation() {
        return CompanyLocation.valueOf(this.location);
    }

    public String getPlan() {
        return plan;
    }

    public CompanyStatus getStatus() {
        return status;
    }

    public boolean nameProvided() {
        return nameProvided;
    }

    public boolean industryProvided() {
        return industryProvided;
    }

    public boolean locationProvided() {
        return locationProvided;
    }

    public boolean planProvided() {
        return planProvided;
    }

    public boolean statusProvided() {
        return statusProvided;
    }
}
