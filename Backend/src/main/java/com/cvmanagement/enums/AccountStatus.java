package com.cvmanagement.enums;

public enum AccountStatus {
    ACTIVE("active"),
    PENDING("pending"),
    DEACTIVE("deactive");

    private final String value;

    AccountStatus(String value) {
        this.value = value;
    }

    public String value() {
        return this.value;
    }
}
