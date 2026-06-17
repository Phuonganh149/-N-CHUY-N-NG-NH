package com.cvmanagement.enums.DBSchema;

public enum SubscriptionPlans {
    SUBSCRIPTION_ID("id"),
    NAME("name"),
    PRICE("price"),
    POST_LIMIT("post_limit"),
    DURATION_DAYS("duration_days"),
    FEATURES("features"),
    ACTIVE("active"),
    CREATED_AT("created_at"),
    UPDATED_AT("updated_at");
    private final String value;

    SubscriptionPlans(String value) {
        this.value = value;
    }

    public String value() {
        return this.value;
    }
}
