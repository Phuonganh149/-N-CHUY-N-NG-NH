package com.cvmanagement.dto.request;

import com.cvmanagement.dto.dto;
import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class CandidatePatchRequest extends dto {
    private String email;
    private String full_name;
    private String username;
    private String bio;
    private String avatarUrl;
    private String address;
    private String phone;
    private Boolean twoFactorEnabled;

    public boolean emailProvided;
    public boolean full_nameProvided;
    public boolean usernameProvided;
    public boolean bioProvided;
    public boolean avatarUrlProvided;
    public boolean addressProvided;
    public boolean phoneProvided;
    public boolean twoFactorEnabledProvided;

    public void setEmail(Object input) {
        if (input == null) email = null;
        else email = input.toString();
        emailProvided = true;
    }

    public void setFull_name(Object input) {
        if (input == null) full_name = null;
        else full_name = input.toString();
        full_nameProvided = true;
    }

    public void setUsername(Object input) {
        if (input == null) username = null;
        else username = input.toString();
        usernameProvided = true;
    }

    public void setBio(Object input) {
        if (input == null) bio = null;
        else bio = input.toString();
        bioProvided = true;
    }

    public void setAvatarUrl(Object input) {
        if (input == null) avatarUrl = null;
        else avatarUrl = input.toString();
        avatarUrlProvided = true;
    }

    public void setAddress(Object input) {
        if (input == null) address = null;
        else address = input.toString();
        addressProvided = true;
    }

    public void setPhone(Object input) {
        if (input == null) phone = null;
        else phone = input.toString();
        phoneProvided = true;
    }

    public void setTwoFactorEnabled(Object input) {
        if (input == null) twoFactorEnabled = null;
        else if (input instanceof Boolean b) twoFactorEnabled = b;
        else twoFactorEnabled = Boolean.parseBoolean(input.toString());
        twoFactorEnabledProvided = true;
    }

    public String getFull_name() {
        return full_name;
    }

    public String getEmail() {
        return email;
    }

    public String getUsername() {
        return username;
    }

    public String getBio() {
        return bio;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public String getAddress() {
        return address;
    }

    public String getPhone() {
        return phone;
    }

    public Boolean getTwoFactorEnabled() {
        return twoFactorEnabled;
    }
}
