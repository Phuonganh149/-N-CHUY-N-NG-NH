package com.cvmanagement.enums;

public enum CompanyLocation {
    HA_NOI("Hà Nội"),
    HO_CHI_MINH("Hồ Chí Minh"),
    DA_NANG("Đà Nẵng"),
    CAN_THO("Cần Thơ"),
    BINH_DUONG("Bình Dương");


    private final String value;

    CompanyLocation(String value) {
        this.value = value;
    }

    public String value() {
        return this.value;
    }
}
