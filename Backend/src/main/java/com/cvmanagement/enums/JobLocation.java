package com.cvmanagement.enums;

public enum JobLocation {
    HA_NOI("Hà Nội"),
    HO_CHI_MINH("Hồ Chí Minh"),
    DA_NANG("Đà Nẵng");

    public final String value;

    JobLocation(String value) {
        this.value = value;
    }

    public String value() {
        return this.value;
    }
}
