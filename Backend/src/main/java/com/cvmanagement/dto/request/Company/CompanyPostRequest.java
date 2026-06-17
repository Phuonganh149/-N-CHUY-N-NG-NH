package com.cvmanagement.dto.request.Company;

public class CompanyPostRequest {
    String name;
    String industry;
    String location;
    String plan;

    public String getName() {
        return name;
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

    public void setName(String name) {
        this.name = name;
    }

    public void setIndustry(String industry) {
        this.industry = industry;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public void setPlan(String plan) {
        this.plan = plan;
    }
}
