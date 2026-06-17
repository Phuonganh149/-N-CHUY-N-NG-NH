package com.cvmanagement.enums.DBSchema;

public enum Jobs {
    JOB_ID("id"),
    CREATED_BY("created_by"),
    TITLE("title"),
    COMPANY("company"),
    LOCATION("location"),
    SALARY_TEXT("salary_text"),
    SALARY_MIN("salary_min"),
    SALARY_MAX("salary_max"),
    DEPARTMENT("department"),
    QUANTITY("quantity"),
    DESCRIPTION("description"),
    REQUIREMENS("requirements"),
    TAGS("tags"),
    DEADLINE("deadline"),
    STATUS("status"),
    ACTIVE("active"),
    CREATED_AT("created_at"),
    UPDATED_AT("updated_at");

    private final String value;

    Jobs(String value) {
        this.value = value;
    }

    public String value() {
        return this.value;
    }
}
