package com.cvmanagement.enums;

public enum AccountRole {
    ADMIN("admin"),
    COMPANY("company"),
    CANDIDATE("candidate");

    private final String value;

    AccountRole(String value) {
        this.value = value;
    }

    public String value() {
        return this.value;
    }
}
