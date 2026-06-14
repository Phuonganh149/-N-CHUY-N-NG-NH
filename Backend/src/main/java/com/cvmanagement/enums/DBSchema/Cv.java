package com.cvmanagement.enums.DBSchema;

public enum Cv {
    ID("id"),
    USER_ID("user_id"),
    STORAGE_PATH("storage_path"),
    FILE_URL("file_url"),
    FILE_NAME("file_name"),
    MIME_TYPE("mime_type"),
    FILE_SIZE("file_size"),
    UPLOADED_AT("uploaded_at"),
    IS_PRIMARY("is_primary"),
    AI_ANALYSIS("ai_analysis"),
    CREATED_AT("created_at"),
    UPDATED_AT("updated_at");

    public final String value;

    Cv(String value) {
        this.value = value;
    }

    public String value() {
        return this.value;
    }
}
