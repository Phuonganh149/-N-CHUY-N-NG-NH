package com.cvmanagement.enums.DBSchema;

public enum User {
    USER_ID("id"),
    DISPLAY_CODE("display_code"),
    USERNAME("username"),
    ROLE("role"),
    FULLNAME("full_name"),
    EMAIL("email"),
    PHONE("phone"),
    ADDRESS("address"),
    BIO("bio"),
    STATUS("status"),
    PROVIDER("provider"),
    PROVIDER_ID("provider_id"),
    TWOFACTORENABLED("two_factor_enabled"),
    AVATAR_URL("avatar_url"),
    CREATED_AT("created_at"),
    UPDATED_AT("updated_at");

    public final String value;

    User(String value) {
        this.value = value;
    }

    public String value() {
        return this.value;
    }
}
