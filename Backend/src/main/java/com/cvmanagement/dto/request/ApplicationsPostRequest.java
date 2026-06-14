package com.cvmanagement.dto.request;

public record ApplicationsPostRequest(
        int jobId,
        String email
) {
}
