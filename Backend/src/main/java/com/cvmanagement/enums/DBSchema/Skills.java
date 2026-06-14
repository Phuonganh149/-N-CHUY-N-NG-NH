package com.cvmanagement.enums.DBSchema;

public enum Skills {
    SKILL_ID("id"),
    SKILL_NAME("name"),
    CREATED_AT("created_at");

    private final String value;

    Skills(String value) {
        this.value = value;
    }

    public String value() {
        return this.value;
    }
}
