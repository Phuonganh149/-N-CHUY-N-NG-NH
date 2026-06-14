package com.cvmanagement.dto.request;

public class SkillPatchRequest {
    private String name;
    private boolean nameProvided = false;

    public void setName(String name) {
        this.name = name;
        this.nameProvided = true;
    }

    public String getName() {
        return name;
    }

    public boolean isNameProvided() {
        return nameProvided;
    }
}
