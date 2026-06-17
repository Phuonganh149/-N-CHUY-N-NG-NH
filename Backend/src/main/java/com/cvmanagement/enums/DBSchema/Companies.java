package com.cvmanagement.enums.DBSchema;

public enum Companies {
    COMPANY_ID("id"),
    NAME("name"),
    SLUG("slug"),
    INDUSTRY("industry"),
    LOCATION("location"),
    PLAN("plan"),
    STATUS("status"),
    CREATED_AT("created_at"),
    UPDATED_AT("updated_at"),
    VERIFIED_AT("verified_at"),
    REJECTED_REASON("rejected_reason");

    private final String value;

    Companies(String value) {
        this.value = value;
    }

    public String value() {
        return value;
    }
}
