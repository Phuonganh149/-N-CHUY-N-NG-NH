package com.cvmanagement.enums;

public enum AccountProvider {
    LOCAL("local"),
    GOOGLE("google"),
    FACEBOOK("facebook"),
    GITHUB("github");
    private final String value;

    AccountProvider(String value) {
        this.value = value;
    }

    public String value() {
        return this.value;
    }

    ;
}
