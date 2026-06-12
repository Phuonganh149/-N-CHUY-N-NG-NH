package com.cvmanagement.enums;

public enum ApplicationStatus {
    NEW_APPLIED("Mới nộp"),
    SCREENING("Đang xem xét"),
    INTERVIEW("Phỏng vấn"),
    OFFERED("Đã offer"),
    DECLINED("Từ chối");

    public final String value;

    ApplicationStatus(String value) {
        this.value = value;
    }

    public String value() {
        return value;
    }
}
