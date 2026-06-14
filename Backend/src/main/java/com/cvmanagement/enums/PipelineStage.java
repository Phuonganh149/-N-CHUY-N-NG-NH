package com.cvmanagement.enums;

public enum PipelineStage {
    NEW("Mới nộp"),
    SCREENING("Đang sàng lọc"),
    INTERVIEW("Phỏng vấn"),
    REVIEW("Đánh giá lại"),
    OFFER("Mời nhận việc"),
    HIRED("Nhận việc");
    public final String value;

    PipelineStage(String value) {
        this.value = value;
    }

    public String value() {
        return value;
    }
}
